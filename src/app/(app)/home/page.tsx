import Link from 'next/link';
import { Compass, Clock, Palette, TrendingUp, Users, Sparkles } from '@/components/ui/icons';
import { FeedCard } from '@/components/feed/feed-card';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { normalizeArtwork } from '@/lib/supabase/data';
import type { Artwork } from '@/lib/types';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'For You', value: 'for-you', icon: Compass },
  { label: 'Following', value: 'following', icon: Users },
  { label: 'Trending', value: 'trending', icon: TrendingUp },
  { label: 'Recent', value: 'recent', icon: Clock },
] as const;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'for-you' } = await searchParams;
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
    <div className="page-enter w-full max-w-[760px] px-4 pb-12 sm:px-5 xl:px-6">
      {/* ===== HEADER ===== */}
      <header className="sticky top-16 z-30 -mx-4 border-b border-border/50 bg-bg/90 px-4 pt-6 backdrop-blur-2xl sm:-mx-5 sm:px-5 lg:top-0 xl:-mx-6 xl:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase text-primary">
              <Sparkles size={12} />
              Community feed
            </p>
            <h1 className="text-[26px] font-semibold text-text sm:text-3xl">
              Fresh pixel art
            </h1>
          </div>
          <Link
            href="/paint"
            className={cn(
              'hidden items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_14px_32px_rgba(124,58,237,0.2)] sm:flex',
              'bg-primary',
              'transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]'
            )}
          >
            <Palette size={14} />
            Create artwork
          </Link>
        </div>

        {/* ===== TAB NAV ===== */}
        <nav className="flex overflow-x-auto hide-scrollbar" aria-label="Feed filters">
          {tabs.map(({ label, value, icon: Icon }) => (
            <Link
              key={value}
              href={`/home?tab=${value}`}
              className={cn(
                'relative flex min-h-[44px] min-w-[90px] flex-1 items-center justify-center gap-2 px-3 text-[13px] font-semibold transition-colors',
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
              {label}
              {tab === value && (
                <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </nav>
      </header>

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
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-[0_18px_42px_rgba(124,58,237,0.2)]">
              <Palette size={36} className="text-white" />
            </span>
            {/* Decorative dot */}
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink text-[10px] text-white">
              <Sparkles size={10} />
            </span>
          </div>

          <h2 className="text-[22px] font-semibold text-text sm:text-2xl">
            {tab === 'following' ? 'Your following feed is quiet' : 'The canvas is waiting'}
          </h2>
          <p className="mt-3 max-w-sm text-[15px] leading-7 text-text-muted">
            {tab === 'following'
              ? 'Follow creators from Explore to build a personal feed full of inspiration.'
              : 'No public artwork has been published yet. Be the first creator to put pixels on the wall.'}
          </p>
          <Link
            href={tab === 'following' ? '/explore' : '/paint'}
            className={cn(
              'mt-8 rounded-full px-6 py-3.5 text-sm font-semibold text-white',
              'bg-primary shadow-[0_14px_32px_rgba(124,58,237,0.2)]',
              'transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]'
            )}
          >
            {tab === 'following' ? 'Discover creators' : 'Create first artwork'}
          </Link>
        </div>
      )}
    </div>
  );
}
