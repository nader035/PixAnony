import Link from 'next/link';
import { Compass, Clock, Palette, TrendingUp, Users, Sparkles } from '@/components/ui/icons';
import { FeedCard } from '@/components/feed/feed-card';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { normalizeArtwork } from '@/lib/supabase/data';
import type { Artwork } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getServerI18n } from '@/lib/i18n/server';

const tabs = [
  { labelKey: 'feed.forYou', value: 'for-you', icon: Compass },
  { labelKey: 'feed.following', value: 'following', icon: Users },
  { labelKey: 'feed.trending', value: 'trending', icon: TrendingUp },
  { labelKey: 'feed.recent', value: 'recent', icon: Clock },
] as const;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'for-you' } = await searchParams;
  const { t } = await getServerI18n();
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let shouldQuery = true;
  let query = supabase
    .from('artworks')
    .select('*, profile:profiles!artworks_user_id_fkey(*)')
    .eq('visibility', 'public')
    .limit(30);

  if (tab === 'trending') {
    query = query.order('likes_count', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  if (tab === 'following') {
    if (!user) {
      shouldQuery = false;
    } else {
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      const followedIds = following?.map((item) => item.following_id) ?? [];
      if (followedIds.length) {
        query = query.in('user_id', followedIds);
      } else {
        shouldQuery = false;
      }
    }
  }

  const { data, error } = shouldQuery ? await query : { data: [], error: null };
  let artworks = error ? [] : (data ?? []).map((row) => normalizeArtwork(row));

  if (user && artworks.length) {
    const ids = artworks.map((artwork) => artwork.id);
    const [{ data: likes }, { data: reposts }, { data: bookmarks }] = await Promise.all([
      supabase.from('likes').select('artwork_id').eq('user_id', user.id).in('artwork_id', ids),
      supabase.from('reposts').select('artwork_id').eq('user_id', user.id).in('artwork_id', ids),
      supabase.from('bookmarks').select('artwork_id').eq('user_id', user.id).in('artwork_id', ids),
    ]);
    const liked = new Set(likes?.map((item) => item.artwork_id));
    const reposted = new Set(reposts?.map((item) => item.artwork_id));
    const bookmarked = new Set(bookmarks?.map((item) => item.artwork_id));
    artworks = artworks.map((artwork: Artwork) => ({
      ...artwork,
      liked_by_user: liked.has(artwork.id),
      reposted_by_user: reposted.has(artwork.id),
      bookmarked_by_user: bookmarked.has(artwork.id),
    }));
  }

  return (
    <div className="page-enter mx-auto w-full max-w-[780px] px-4 pb-16 sm:px-8">
      {/* ===== HEADER ===== */}
      <header className="sticky top-16 z-30 -mx-4 bg-card/90 px-4 pt-8 backdrop-blur-2xl sm:-mx-8 sm:px-8 lg:top-0">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-pink">
              <Sparkles size={12} />
              {t('feed.eyebrow')}
            </p>
            <h1 className="text-3xl font-bold text-text sm:text-4xl">
              {t('feed.title')}
            </h1>
          </div>
          <Link
            href="/paint"
            className={cn(
              'hidden items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-bg shadow-[0_14px_32px_rgba(44,40,58,0.16)] sm:flex',
              'bg-primary',
              'transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]'
            )}
          >
            <Palette size={14} />
            {t('feed.createArtwork')}
          </Link>
        </div>

        {/* ===== TAB NAV ===== */}
        <nav className="flex overflow-x-auto hide-scrollbar" aria-label={t('feed.filters')}>
          {tabs.map(({ labelKey, value, icon: Icon }) => (
            <Link
              key={value}
              href={`/home?tab=${value}`}
              className={cn(
                'relative flex min-h-[48px] min-w-[90px] flex-1 items-center justify-center gap-2 rounded-t-2xl px-3 text-sm font-semibold transition-colors',
                tab === value
                  ? 'text-text'
                  : 'text-text-muted hover:text-text'
              )}
            >
              <Icon
                size={15}
                className={cn(
                  'hidden transition-colors sm:block',
                  tab === value ? 'text-primary' : ''
                )}
              />
              {t(labelKey)}
              {tab === value && (
                <span className="absolute inset-x-5 bottom-0 h-1 rounded-full bg-pink" />
              )}
            </Link>
          ))}
        </nav>
      </header>

      <Link href="/paint" className="mt-6 flex items-center gap-3 rounded-[24px] bg-[var(--blush)] p-4 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-card"><Palette size={18} /></span>
        <span className="min-w-0 flex-1 text-sm font-semibold text-text-muted">{t('feed.prompt')}</span>
        <span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-bg">{t('nav.create')}</span>
      </Link>

      {/* ===== FEED / EMPTY STATE ===== */}
      {artworks.length ? (
        <div className="space-y-5 py-6">
          {artworks.map((artwork, i) => (
            <div
              key={artwork.id}
              className="animate-slide-up"
              style={{ animationDelay: `${Math.min(i * 50, 300)}ms`, animationFillMode: 'both' }}
            >
              <FeedCard artwork={artwork} />
            </div>
          ))}
        </div>
      ) : (
        <div className="surface-panel mt-8 flex min-h-[420px] flex-col items-center justify-center rounded-3xl px-6 py-12 text-center animate-fade-in">
          {/* Large decorative icon */}
          <div className="relative mb-6">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-[0_18px_42px_rgba(0,94,254,0.2)]">
              <Palette size={36} className="text-white" />
            </span>
            {/* Decorative dot */}
            <span className="absolute -end-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink text-[10px] text-white">
              <Sparkles size={10} />
            </span>
          </div>

          <h2 className="text-[22px] font-semibold text-text sm:text-2xl">
            {tab === 'following' ? t('feed.followingEmptyTitle') : t('feed.publicEmptyTitle')}
          </h2>
          <p className="mt-3 max-w-sm text-[15px] leading-7 text-text-muted">
            {tab === 'following'
              ? t('feed.followingEmptyDescription')
              : t('feed.publicEmptyDescription')}
          </p>
          <Link
            href={tab === 'following' ? '/explore' : '/paint'}
            className={cn(
              'mt-8 rounded-full px-6 py-3.5 text-sm font-semibold text-white',
              'bg-primary shadow-[0_14px_32px_rgba(0,94,254,0.2)]',
              'transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]'
            )}
          >
            {tab === 'following' ? t('feed.discoverCreators') : t('feed.createFirst')}
          </Link>
        </div>
      )}
    </div>
  );
}
