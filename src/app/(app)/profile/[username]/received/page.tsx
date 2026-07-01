import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { BadgeCheck, Inbox, LockKeyhole, Sparkles } from '@/components/ui/icons';
import { PixelArtRenderer } from '@/components/ui/pixel-art-renderer';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { PageFrame, PageHeader } from '@/components/ui/page-layout';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatTimeAgo } from '@/lib/utils';

export default async function ReceivedPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/profile/${username}/received`)}`);

  const { data: profile } = await supabase.from('profiles').select('id, username').eq('id', user.id).single();
  if (!profile || profile.username !== username) notFound();

  const { data: artworks } = await supabase
    .from('artworks')
    .select('id, title, caption, pixel_data, grid_size, created_at, is_anonymous, profile:profiles!artworks_user_id_fkey(username, display_name, avatar_url, is_verified)')
    .eq('receiver_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <PageFrame width="wide">
      <PageHeader
        eyebrow="Private collection"
        title="Received artwork"
        description="Pixel art sent directly to you. Anonymous deliveries stay hidden, signed deliveries show the sender profile."
        actions={<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary"><Inbox size={21} /></span>}
      />

      {artworks?.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artworks.map((artwork, index) => (
            <Link key={artwork.id} href={`/art/${artwork.id}`} className="group surface-panel interactive-surface overflow-hidden rounded-2xl">
              <div className="relative aspect-square bg-surface p-4">
                <PixelArtRenderer
                  pixels={Array.isArray(artwork.pixel_data) ? artwork.pixel_data as string[] : []}
                  gridSize={artwork.grid_size}
                  className="h-full w-full"
                />
                {index === 0 && (
                  <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-primary/25 bg-bg/80 px-2 py-1 text-[10px] font-semibold text-primary backdrop-blur">
                    <Sparkles size={11} />
                    Latest
                  </span>
                )}
              </div>
              <div className="p-4">
                <h2 className="truncate text-sm font-semibold text-text">{artwork.title || 'Anonymous artwork'}</h2>
                {artwork.caption && <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-muted">{artwork.caption}</p>}
                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-text-muted">
                  {artwork.is_anonymous ? (
                    <span className="flex items-center gap-1"><LockKeyhole size={12} />Anonymous</span>
                  ) : (() => {
                    const profile = Array.isArray(artwork.profile) ? artwork.profile[0] : artwork.profile;
                    return (
                      <span className="flex min-w-0 items-center gap-2">
                        <PixelAvatar username={profile?.username || 'sender'} src={profile?.avatar_url ?? null} size="xs" showBadge={false} />
                        <span className="min-w-0 truncate">
                          {profile?.display_name || profile?.username || 'Signed sender'}
                        </span>
                        {profile?.is_verified && <BadgeCheck size={11} className="shrink-0 text-primary" />}
                      </span>
                    );
                  })()}
                  <span>{formatTimeAgo(artwork.created_at ?? new Date().toISOString())}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 text-center">
          <Inbox size={30} className="mb-4 text-primary" />
          <h2 className="text-lg font-semibold text-text">Your private inbox is empty</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">
            Share your profile link so other creators can send anonymous or signed pixel art.
          </p>
          <Link href={`/profile/${username}`} className="mt-6 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-text">Back to profile</Link>
        </div>
      )}
    </PageFrame>
  );
}
