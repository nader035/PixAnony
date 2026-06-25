import Link from 'next/link';
import { Compass, Clock, Palette, TrendingUp, Users } from '@/components/ui/icons';
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
    <div className="page-enter w-full max-w-[760px] px-4 pb-10 sm:px-5 xl:px-6">
      <header className="sticky top-16 z-30 -mx-4 border-b border-border/70 bg-bg/88 px-4 pt-5 backdrop-blur-2xl sm:-mx-5 sm:px-5 lg:top-0 xl:-mx-6 xl:px-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Community feed</p>
            <h1 className="text-2xl font-bold tracking-[-0.04em] text-text">Fresh pixel art</h1>
          </div>
          <Link href="/paint" className="hidden rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-glow sm:block">
            Create artwork
          </Link>
        </div>
        <nav className="flex overflow-x-auto" aria-label="Feed filters">
          {tabs.map(({ label, value, icon: Icon }) => (
            <Link
              key={value}
              href={`/home?tab=${value}`}
              className={cn(
                'relative flex min-h-12 min-w-24 flex-1 items-center justify-center gap-2 px-3 text-sm font-medium transition-colors',
                tab === value ? 'text-text' : 'text-text-muted hover:text-text'
              )}
            >
              <Icon size={15} className="hidden sm:block" />
              {label}
              {tab === value && <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-primary" />}
            </Link>
          ))}
        </nav>
      </header>

      {artworks.length ? (
        <div className="space-y-4 py-5">
          {artworks.map((artwork) => <FeedCard key={artwork.id} artwork={artwork} />)}
        </div>
      ) : (
        <div className="surface-panel mt-6 flex min-h-[360px] flex-col items-center justify-center rounded-3xl px-6 text-center">
          <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Palette size={28} />
          </span>
          <h2 className="text-xl font-semibold text-text">
            {tab === 'following' ? 'Your following feed is quiet' : 'The canvas is waiting'}
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">
            {tab === 'following'
              ? 'Follow creators from Explore to build a personal feed.'
              : 'No public artwork has been published yet. Be the first creator on the wall.'}
          </p>
          <Link href={tab === 'following' ? '/explore' : '/paint'} className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">
            {tab === 'following' ? 'Discover creators' : 'Create first artwork'}
          </Link>
        </div>
      )}
    </div>
  );
}
