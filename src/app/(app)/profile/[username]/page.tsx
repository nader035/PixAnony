import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, Calendar, Crown, LinkIcon, MapPin, Palette, Repeat2 } from '@/components/ui/icons';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { FeedCard } from '@/components/feed/feed-card';
import { AnonymousInboxCard } from '@/components/profile/anonymous-inbox-card';
import { ProfileActions } from '@/components/profile/profile-actions';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { normalizeArtwork } from '@/lib/supabase/data';
import { formatNumber } from '@/lib/utils';
import type { Artwork } from '@/lib/types';

type TimelineItem = {
  kind: 'artwork' | 'repost';
  eventAt: string;
  artwork: Artwork;
};

type RepostRow = {
  created_at?: string | null;
  artwork?: Record<string, unknown> | Record<string, unknown>[] | null;
};

function firstJoinedRow(value: RepostRow['artwork']): Record<string, unknown> | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();
  const [{ data: { user } }, { data: profile }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('profile_stats').select('*').eq('username', username).single(),
  ]);
  if (!profile?.id || !profile.username) notFound();

  const ownProfile = user?.id === profile.id;
  const [{ data: artworks }, { data: repostRows }, { data: follow }, receivedCountResult] = await Promise.all([
    supabase
      .from('artworks')
      .select('*, profile:profiles!artworks_user_id_fkey(*)')
      .eq('user_id', profile.id)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false }),
    supabase
      .from('reposts')
      .select('created_at, artwork:artworks!inner(*, profile:profiles!artworks_user_id_fkey(*))')
      .eq('user_id', profile.id)
      .eq('artwork.visibility', 'public')
      .order('created_at', { ascending: false }),
    user && user.id !== profile.id
      ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
    ownProfile
      ? supabase.from('artworks').select('id', { count: 'exact', head: true }).eq('receiver_id', profile.id)
      : Promise.resolve({ count: 0 }),
  ]);

  const website = profile.website?.startsWith('http') ? profile.website : profile.website ? `https://${profile.website}` : null;
  const originalItems: TimelineItem[] = (artworks ?? []).map((row) => ({
    kind: 'artwork',
    eventAt: String(row.created_at),
    artwork: normalizeArtwork(row),
  }));
  const repostItems: TimelineItem[] = ((repostRows ?? []) as RepostRow[]).flatMap((row) => {
    const artwork = firstJoinedRow(row.artwork);
    if (!artwork) return [];
    return [{
      kind: 'repost' as const,
      eventAt: String(row.created_at ?? artwork.created_at ?? ''),
      artwork: normalizeArtwork(artwork),
    }];
  });
  let timeline = [...originalItems, ...repostItems].sort(
    (a, b) => new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime(),
  );

  if (user && timeline.length) {
    const ids = [...new Set(timeline.map((item) => item.artwork.id))];
    const [{ data: likes }, { data: reposts }, { data: bookmarks }] = await Promise.all([
      supabase.from('likes').select('artwork_id').eq('user_id', user.id).in('artwork_id', ids),
      supabase.from('reposts').select('artwork_id').eq('user_id', user.id).in('artwork_id', ids),
      supabase.from('bookmarks').select('artwork_id').eq('user_id', user.id).in('artwork_id', ids),
    ]);
    const liked = new Set(likes?.map((item) => item.artwork_id));
    const reposted = new Set(reposts?.map((item) => item.artwork_id));
    const bookmarked = new Set(bookmarks?.map((item) => item.artwork_id));
    timeline = timeline.map((item) => ({
      ...item,
      artwork: {
        ...item.artwork,
        liked_by_user: liked.has(item.artwork.id),
        reposted_by_user: reposted.has(item.artwork.id),
        bookmarked_by_user: bookmarked.has(item.artwork.id),
      },
    }));
  }

  return (
    <div className="page-enter w-full max-w-[880px] overflow-hidden pb-10 sm:px-5 xl:px-6">
      <div className="relative h-44 overflow-hidden bg-[radial-gradient(circle_at_75%_15%,rgba(236,72,153,.16),transparent_26%),radial-gradient(circle_at_24%_72%,rgba(34,211,238,.12),transparent_30%),linear-gradient(135deg,rgba(124,58,237,.18),rgba(255,255,255,.82))] sm:mt-5 sm:h-56 sm:rounded-3xl sm:border sm:border-border">
        <div className="absolute inset-0 dot-grid opacity-35" />
        {profile.banner_url && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${profile.banner_url}")` }} />}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg to-transparent" />
      </div>

      <section className="relative z-10 -mt-14 px-4 sm:px-7">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div className="rounded-full ring-[5px] ring-bg">
            <PixelAvatar username={profile.username} src={profile.avatar_url} size="xl" />
          </div>
          <ProfileActions
            profileId={profile.id}
            username={profile.username}
            viewerId={user?.id ?? null}
            initiallyFollowing={Boolean(follow)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold text-text">{profile.display_name}</h1>
          {profile.is_verified && <BadgeCheck size={20} className="text-primary" />}
          {profile.is_pro && <span className="flex items-center gap-1 rounded-full border border-yellow/25 bg-yellow/10 px-2 py-1 text-[10px] font-bold text-yellow"><Crown size={11} /> PRO</span>}
        </div>
        <p className="mt-1 text-sm text-text-muted">@{profile.username}</p>
        {profile.bio && <p className="mt-4 max-w-2xl text-[15px] leading-6 text-text/90">{profile.bio}</p>}

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-text-muted">
          {profile.location && <span className="flex items-center gap-1.5"><MapPin size={15} />{profile.location}</span>}
          {website && <a href={website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline"><LinkIcon size={15} />{profile.website}</a>}
          {profile.created_at && <span className="flex items-center gap-1.5"><Calendar size={15} />Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>}
        </div>

        <AnonymousInboxCard
          username={profile.username}
          displayName={profile.display_name || profile.username}
          ownProfile={ownProfile}
          receivedCount={receivedCountResult.count ?? 0}
        />

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card/60 p-2 sm:grid-cols-4">
          {[
            ['Paints', profile.paints_count],
            ['Followers', profile.followers_count],
            ['Following', profile.following_count],
            ['Likes', profile.likes_count],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex min-h-16 flex-col items-center justify-center rounded-xl">
              <strong className="text-sm text-text">{formatNumber(Number(value ?? 0))}</strong>
              <span className="mt-1 text-[11px] text-text-muted">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-sm font-semibold text-text">Profile activity</h2>
          {ownProfile && <Link href={`/profile/${profile.username}/received`} className="text-xs font-semibold text-primary">Received privately</Link>}
        </div>
      </section>

      {timeline.length ? (
        <div className="space-y-4 p-3 sm:p-6">
          {timeline.map((item) => (
            <FeedCard
              key={`${item.kind}-${item.eventAt}-${item.artwork.id}`}
              artwork={item.artwork}
              repostContext={
                item.kind === 'repost'
                  ? {
                      displayName: profile.display_name || profile.username,
                      username: profile.username,
                      createdAt: item.eventAt,
                    }
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className="mx-4 mt-5 flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border text-center sm:mx-7">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {ownProfile ? <Palette size={26} /> : <Repeat2 size={24} />}
          </div>
          <h2 className="font-semibold text-text">No public activity yet</h2>
          <p className="mt-2 max-w-xs text-sm leading-6 text-text-muted">
            {ownProfile ? 'Publish or repost artwork to start your profile timeline.' : 'This creator has not published or reposted anything yet.'}
          </p>
          {ownProfile && <Link href="/paint" className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">Create artwork</Link>}
        </div>
      )}
    </div>
  );
}
