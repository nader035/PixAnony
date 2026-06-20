import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Bookmark, Heart } from '@/components/ui/icons';
import { PixelArtRenderer } from '@/components/ui/pixel-art-renderer';
import { PageFrame, PageHeader } from '@/components/ui/page-layout';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatNumber } from '@/lib/utils';

export default async function BookmarksPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('bookmarks')
    .select('id, artwork:artworks(id, title, pixel_data, grid_size, likes_count, profile:profiles!artworks_user_id_fkey(username))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const items = (data ?? []).flatMap((item) => {
    const artwork = Array.isArray(item.artwork) ? item.artwork[0] : item.artwork;
    return artwork ? [artwork] : [];
  });

  return (
    <PageFrame width="wide">
      <PageHeader
        eyebrow="Saved collection"
        title="Bookmarks"
        description="Artwork you saved for another look."
      />
      {items.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {items.map((artwork) => {
            const profile = Array.isArray(artwork.profile) ? artwork.profile[0] : artwork.profile;
            return (
              <Link key={artwork.id} href={`/art/${artwork.id}`} className="surface-panel interactive-surface overflow-hidden rounded-2xl">
                <div className="aspect-square bg-surface p-3">
                  <PixelArtRenderer pixels={Array.isArray(artwork.pixel_data) ? artwork.pixel_data as string[] : []} gridSize={artwork.grid_size} className="h-full w-full" />
                </div>
                <div className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold text-text">{artwork.title || 'Untitled'}</h2>
                    <p className="truncate text-xs text-text-muted">@{profile?.username || 'creator'}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-text-muted"><Heart size={12} />{formatNumber(artwork.likes_count ?? 0)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 text-center">
          <Bookmark size={30} className="mb-4 text-primary" />
          <h2 className="text-lg font-semibold text-text">No bookmarks yet</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">Save artwork from the feed and it will stay organized here.</p>
          <Link href="/home" className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">Browse feed</Link>
        </div>
      )}
    </PageFrame>
  );
}
