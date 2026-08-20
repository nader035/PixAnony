import type { Metadata } from 'next';
import Link from 'next/link';
import { Eye, Heart, Search, Sparkles, TrendingUp } from '@/components/ui/icons';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PixelArtRenderer } from '@/components/ui/pixel-art-renderer';
import { PageFrame, PageHeader } from '@/components/ui/page-layout';
import { formatNumber, cn } from '@/lib/utils';
import { createPublicPageMetadata } from '@/lib/seo';
import { getServerI18n } from '@/lib/i18n/server';
import { MasonryGrid, MasonryItem } from '@/components/ui/masonry-grid';

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return createPublicPageMetadata({
    title: t('seo.exploreTitle'),
    description: t('seo.exploreDescription'),
    path: '/explore',
    locale,
  });
}

const filters = ['all', 'trending', 'new', 'popular'] as const;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q = '', filter = 'all' } = await searchParams;
  const { t, locale } = await getServerI18n();
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('artworks')
    .select('id, title, pixel_data, grid_size, grid_width, grid_height, likes_count, views_count, created_at, profile:profiles!artworks_user_id_fkey(username)')
    .eq('visibility', 'public')
    .in('artwork_kind', ['standard', 'challenge_submission', 'admin_delivery'])
    .limit(48);

  if (q.trim()) query = query.ilike('title', `%${q.trim()}%`);
  if (filter === 'popular' || filter === 'trending') {
    query = query.order('likes_count', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }
  const { data } = await query;

  return (
    <PageFrame width="wide">
      <PageHeader
        eyebrow={t('explore.eyebrow')}
        title={t('explore.title')}
        description={t('explore.description')}
      />

      <form className="surface-panel mb-4 flex items-center gap-2 rounded-2xl p-2 sm:gap-3">
        <Search size={18} className="ms-2 text-text-muted" />
        <input
          name="q"
          defaultValue={q}
          placeholder={t('explore.searchPlaceholder')}
          className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
        />
        <input type="hidden" name="filter" value={filter} />
        <button className="h-10 shrink-0 rounded-xl bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-glow">{t('common.search')}</button>
      </form>

      <nav className="mb-6 flex gap-2 overflow-x-auto pb-1" aria-label={t('explore.filters')}>
        {filters.map((item) => (
          <Link
            key={item}
            href={`/explore?filter=${item}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
            className={cn(
              'rounded-full border px-4 py-2 text-xs font-semibold capitalize transition-colors',
              filter === item
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-card text-text-muted hover:text-text'
            )}
          >
            {item === 'all'
              ? t('explore.all')
              : item === 'trending'
                ? t('explore.trending')
                : item === 'popular'
                  ? t('explore.popular')
                  : t('explore.recent')}
          </Link>
        ))}
      </nav>

      {data?.length ? (
        <MasonryGrid>
          {data.map((artwork, index) => {
            const profile = Array.isArray(artwork.profile) ? artwork.profile[0] : artwork.profile;
            const pixels = Array.isArray(artwork.pixel_data) ? artwork.pixel_data as string[] : [];
            return (
              <MasonryItem key={artwork.id}>
              <Link
                href={`/art/${artwork.id}`}
                style={{ background: ['var(--powder)', 'var(--butter)', 'var(--blush)', 'var(--lilac)', 'var(--mint)'][index % 5] }}
                className="group interactive-surface overflow-hidden rounded-[28px] shadow-[0_10px_30px_rgba(44,40,58,.06)]"
              >
                <div className="relative m-3 overflow-hidden rounded-[20px] bg-card p-3 sm:m-4 sm:p-4" style={{ aspectRatio: `${artwork.grid_width} / ${artwork.grid_height}` }}>
                  <PixelArtRenderer pixels={pixels} gridSize={artwork.grid_size} gridWidth={artwork.grid_width} gridHeight={artwork.grid_height} className="h-full w-full" />
                  {index < 3 && filter === 'trending' && (
                    <span className="absolute start-3 top-3 flex items-center gap-1 rounded-full border border-pink/25 bg-bg/80 px-2 py-1 text-[10px] font-semibold text-pink backdrop-blur">
                      <TrendingUp size={11} />
                      {t('explore.trending')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 px-4 pb-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold text-text">{artwork.title || t('common.untitled')}</h2>
                    <p className="rtl-isolate truncate text-xs text-text-muted">@{profile?.username || t('common.creator')}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5 text-xs text-text-muted">
                    <span className="flex items-center gap-1" aria-label={t('common.views', { count: artwork.views_count ?? 0 })}><Eye size={13} />{formatNumber(artwork.views_count ?? 0, locale)}</span>
                    <span className="flex items-center gap-1" aria-label={t('common.likes', { count: artwork.likes_count ?? 0 })}><Heart size={13} />{formatNumber(artwork.likes_count ?? 0, locale)}</span>
                  </div>
                </div>
              </Link>
              </MasonryItem>
            );
          })}
        </MasonryGrid>
      ) : (
        <div className="surface-panel flex min-h-[360px] flex-col items-center justify-center rounded-3xl px-6 text-center">
          <Sparkles size={30} className="mb-4 text-primary" />
          <h2 className="text-lg font-semibold text-text">{t('explore.emptyTitle')}</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">
            {t('explore.emptyDescription')}
          </p>
          <Link href="/paint" className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">{t('explore.openEditor')}</Link>
        </div>
      )}
    </PageFrame>
  );
}
