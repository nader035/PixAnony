import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, Calendar, Crown, Heart, LinkIcon, MapPin, Palette } from '@/components/ui/icons';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { PixelArtRenderer } from '@/components/ui/pixel-art-renderer';
import { ProfileActions } from '@/components/profile/profile-actions';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatNumber } from '@/lib/utils';

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

  const [{ data: artworks }, { data: follow }] = await Promise.all([
    supabase
      .from('artworks')
      .select('id, title, pixel_data, grid_size, likes_count')
      .eq('user_id', profile.id)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false }),
    user && user.id !== profile.id
      ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const ownProfile = user?.id === profile.id;
  const website = profile.website?.startsWith('http') ? profile.website : profile.website ? `https://${profile.website}` : null;

  return (
    <div className="page-enter mx-auto w-full max-w-[880px] overflow-hidden pb-10 sm:px-5">
      <div className="relative h-44 overflow-hidden bg-[radial-gradient(circle_at_75%_15%,rgba(244,63,143,.34),transparent_26%),radial-gradient(circle_at_24%_72%,rgba(34,211,238,.18),transparent_30%),linear-gradient(135deg,rgba(139,92,246,.42),rgba(7,11,19,.72))] sm:mt-5 sm:h-56 sm:rounded-3xl sm:border sm:border-border">
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
          <h1 className="text-2xl font-bold tracking-[-0.04em] text-text">{profile.display_name}</h1>
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
          <h2 className="text-sm font-semibold text-text">Published artwork</h2>
          {ownProfile && <Link href={`/@${profile.username}/received`} className="text-xs font-semibold text-primary">Received privately</Link>}
        </div>
      </section>

      {artworks?.length ? (
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 sm:gap-4 sm:p-6">
          {artworks.map((artwork) => (
            <Link key={artwork.id} href={`/art/${artwork.id}`} className="group surface-panel interactive-surface overflow-hidden rounded-2xl">
              <div className="aspect-square bg-surface p-3">
                <PixelArtRenderer
                  pixels={Array.isArray(artwork.pixel_data) ? artwork.pixel_data as string[] : []}
                  gridSize={artwork.grid_size}
                  className="h-full w-full"
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="truncate text-xs font-semibold text-text">{artwork.title || 'Untitled'}</span>
                <span className="flex items-center gap-1 text-[11px] text-text-muted"><Heart size={11} />{formatNumber(artwork.likes_count ?? 0)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mx-4 mt-5 flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-border text-center sm:mx-7">
          <Palette size={28} className="mb-4 text-primary" />
          <h2 className="font-semibold text-text">No public artwork yet</h2>
          <p className="mt-2 max-w-xs text-sm leading-6 text-text-muted">
            {ownProfile ? 'Publish from the editor to start your gallery.' : 'This creator has not published anything yet.'}
          </p>
          {ownProfile && <Link href="/paint" className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">Create artwork</Link>}
        </div>
      )}
    </div>
  );
}
