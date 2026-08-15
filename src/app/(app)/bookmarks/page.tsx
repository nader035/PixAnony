import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Bookmark, Eye, Heart } from '@/components/ui/icons';
import { PixelArtRenderer } from '@/components/ui/pixel-art-renderer';
import { PageFrame, PageHeader } from '@/components/ui/page-layout';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatNumber } from '@/lib/utils';
import { getServerI18n } from '@/lib/i18n/server';

export default async function BookmarksPage() {
  const { t, locale } = await getServerI18n();
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=%2Fbookmarks');

  const { data } = await supabase
    .from('bookmarks')
    .select('id, artwork:artworks(id, title, pixel_data, grid_size, likes_count, views_count, profile:profiles!artworks_user_id_fkey(username))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const items = (data ?? []).flatMap((item) => {
    const artwork = Array.isArray(item.artwork) ? item.artwork[0] : item.artwork;
    return artwork ? [artwork] : [];
  });

  return (
    <PageFrame width="wide">
      <PageHeader
        eyebrow={t('bookmarks.eyebrow')}
        title={t('bookmarks.title')}
        description={t('bookmarks.description')}
      />
      {items.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {items.map((artwork, index) => {
            const profile = Array.isArray(artwork.profile) ? artwork.profile[0] : artwork.profile;
            return (
              <Link key={artwork.id} href={`/art/${artwork.id}`} style={{ background: ['var(--powder)', 'var(--butter)', 'var(--blush)', 'var(--lilac)', 'var(--mint)'][index % 5] }} className="interactive-surface overflow-hidden rounded-[28px] shadow-[0_10px_30px_rgba(44,40,58,.06)]">
                <div className="m-3 aspect-square overflow-hidden rounded-[20px] bg-card p-3">
                  <PixelArtRenderer pixels={Array.isArray(artwork.pixel_data) ? artwork.pixel_data as string[] : []} gridSize={artwork.grid_size} className="h-full w-full" />
                </div>
                <div className="flex items-center gap-3 px-4 pb-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold text-text">{artwork.title || t('common.untitled')}</h2>
                    <p className="rtl-isolate truncate text-xs text-text-muted">@{profile?.username || t('common.creator')}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-text-muted">
                    <span className="flex items-center gap-1" aria-label={t('common.views', { count: artwork.views_count ?? 0 })}><Eye size={12} />{formatNumber(artwork.views_count ?? 0, locale)}</span>
                    <span className="flex items-center gap-1" aria-label={t('common.likes', { count: artwork.likes_count ?? 0 })}><Heart size={12} />{formatNumber(artwork.likes_count ?? 0, locale)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 text-center">
          <Bookmark size={30} className="mb-4 text-primary" />
          <h2 className="text-lg font-semibold text-text">{t('bookmarks.emptyTitle')}</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">{t('bookmarks.emptyDescription')}</p>
          <Link href="/home" className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">{t('bookmarks.browse')}</Link>
        </div>
      )}
    </PageFrame>
  );
}
