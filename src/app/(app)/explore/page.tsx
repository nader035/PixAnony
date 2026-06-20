import Link from 'next/link';
import { Heart, Search, Sparkles, TrendingUp } from '@/components/ui/icons';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PixelArtRenderer } from '@/components/ui/pixel-art-renderer';
import { PageFrame, PageHeader } from '@/components/ui/page-layout';
import { formatNumber, cn } from '@/lib/utils';

const filters = ['all', 'trending', 'new', 'popular'] as const;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q = '', filter = 'all' } = await searchParams;
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('artworks')
    .select('id, title, pixel_data, grid_size, likes_count, created_at, profile:profiles!artworks_user_id_fkey(username)')
    .eq('visibility', 'public')
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
        eyebrow="Discover"
        title="Explore pixel art"
        description="Browse public work from real creators. Search is focused on artwork titles."
      />

      <form className="surface-panel mb-4 flex items-center gap-2 rounded-2xl p-2 sm:gap-3">
        <Search size={18} className="ml-2 text-text-muted" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search artwork titles"
          className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
        />
        <input type="hidden" name="filter" value={filter} />
        <button className="h-10 shrink-0 rounded-xl bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-glow">Search</button>
      </form>

      <nav className="mb-6 flex gap-2 overflow-x-auto pb-1" aria-label="Explore filters">
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
            {item}
          </Link>
        ))}
      </nav>

      {data?.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {data.map((artwork, index) => {
            const profile = Array.isArray(artwork.profile) ? artwork.profile[0] : artwork.profile;
            const pixels = Array.isArray(artwork.pixel_data) ? artwork.pixel_data as string[] : [];
            return (
              <Link
                key={artwork.id}
                href={`/art/${artwork.id}`}
                className="group surface-panel interactive-surface overflow-hidden rounded-2xl"
              >
                <div className="relative aspect-square bg-surface p-3 sm:p-4">
                  <PixelArtRenderer pixels={pixels} gridSize={artwork.grid_size} className="h-full w-full" />
                  {index < 3 && filter === 'trending' && (
                    <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-pink/25 bg-bg/80 px-2 py-1 text-[10px] font-semibold text-pink backdrop-blur">
                      <TrendingUp size={11} />
                      Trending
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold text-text">{artwork.title || 'Untitled pixel art'}</h2>
                    <p className="truncate text-xs text-text-muted">@{profile?.username || 'creator'}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Heart size={13} />
                    {formatNumber(artwork.likes_count ?? 0)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="surface-panel flex min-h-[360px] flex-col items-center justify-center rounded-3xl px-6 text-center">
          <Sparkles size={30} className="mb-4 text-primary" />
          <h2 className="text-lg font-semibold text-text">Nothing to explore yet</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">
            Try another search, or publish the first public artwork.
          </p>
          <Link href="/paint" className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">Open editor</Link>
        </div>
      )}
    </PageFrame>
  );
}
