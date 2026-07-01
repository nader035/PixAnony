'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share2,
  Bookmark,
  Eye,
  MoreHorizontal,
  BadgeCheck,
  Lock,
  Globe,
  EyeOff,
} from '@/components/ui/icons';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { PixelArtRenderer } from '@/components/ui/pixel-art-renderer';
import { formatNumber, formatTimeAgo, cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Artwork } from '@/lib/types';

interface FeedCardProps {
  artwork: Artwork & { profile?: { username: string; display_name: string; avatar_url: string | null; is_verified: boolean; is_pro: boolean } };
  className?: string;
  repostContext?: {
    displayName: string;
    username: string;
    createdAt: string;
  };
}

// Heart burst particles for like animation
function HeartBurstParticles() {
  const particles = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2;
    const distance = 24 + (i % 3) * 5;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      scale: 0.55 + (i % 2) * 0.25,
      delay: i * 0.012,
    };
  });

  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute pointer-events-none"
          initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [1, 1, 0],
            x: p.x,
            y: p.y,
            scale: [0, p.scale, 0],
          }}
          transition={{ duration: 0.6, delay: p.delay, ease: 'easeOut' }}
        >
          <Heart size={8} className="text-red fill-red" />
        </motion.div>
      ))}
    </>
  );
}

function FeedCardInner({ artwork, className, repostContext }: FeedCardProps) {
  const supabase = useMemo(() => createClient(), []);
  const [liked, setLiked] = useState(artwork.liked_by_user ?? false);
  const [likesCount, setLikesCount] = useState(artwork.likes_count);
  const [reposted, setReposted] = useState(artwork.reposted_by_user ?? false);
  const [repostsCount, setRepostsCount] = useState(artwork.reposts_count);
  const [bookmarked, setBookmarked] = useState(artwork.bookmarked_by_user ?? false);
  const [showBurst, setShowBurst] = useState(false);

  const profile = artwork.profile;
  const isAnonymous = artwork.is_anonymous;
  const pixelData: string[] = (() => {
    if (Array.isArray(artwork.pixel_data)) return artwork.pixel_data;
    try {
      return JSON.parse(artwork.pixel_data);
    } catch {
      return [];
    }
  })();

  const toggleRelation = useCallback(async (
    table: 'likes' | 'reposts' | 'bookmarks',
    active: boolean
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Sign in to interact with artwork.');
      return false;
    }
    const query = active
      ? supabase.from(table).delete().eq('user_id', user.id).eq('artwork_id', artwork.id)
      : supabase.from(table).insert({ user_id: user.id, artwork_id: artwork.id });
    const { error } = await query;
    if (error) {
      toast.error(error.message);
      return false;
    }
    return true;
  }, [artwork.id, supabase]);

  const handleLike = useCallback(async () => {
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => Math.max(0, next ? c + 1 : c - 1));
    const saved = await toggleRelation('likes', liked);
    if (!saved) {
      setLiked(liked);
      setLikesCount((c) => Math.max(0, next ? c - 1 : c + 1));
      return;
    }
    if (next) {
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 700);
    }
  }, [liked, toggleRelation]);

  const handleRepost = useCallback(async () => {
    const next = !reposted;
    setReposted(next);
    setRepostsCount((c) => Math.max(0, next ? c + 1 : c - 1));
    if (!(await toggleRelation('reposts', reposted))) {
      setReposted(reposted);
      setRepostsCount((c) => Math.max(0, next ? c - 1 : c + 1));
    }
  }, [reposted, toggleRelation]);

  const handleBookmark = useCallback(async () => {
    const next = !bookmarked;
    setBookmarked(next);
    if (!(await toggleRelation('bookmarks', bookmarked))) {
      setBookmarked(bookmarked);
    }
  }, [bookmarked, toggleRelation]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/art/${artwork.id}`;
    if (navigator.share) {
      await navigator.share({ title: artwork.title || 'PixAnony artwork', url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Artwork link copied.');
    }
  }, [artwork.id, artwork.title]);

  const displayName = isAnonymous ? 'Anonymous' : profile?.display_name || 'Unknown';
  const username = isAnonymous ? 'anonymous' : profile?.username || 'unknown';

  return (
    <motion.article
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'content-auto overflow-hidden rounded-2xl sm:rounded-[24px]',
        'surface-panel',
        'transition-[border-color,box-shadow,transform] duration-300 ease-out',
        'hover:border-primary/20 hover:shadow-float',
        className
      )}
    >
      {/* ===== REPOST CONTEXT ===== */}
      {repostContext && (
        <div className="flex items-center gap-2 border-b border-border/40 bg-green/[0.04] px-4 py-2.5 text-xs font-semibold text-text-muted sm:px-5">
          <Repeat2 size={13} className="text-green" />
          <Link href={`/profile/${repostContext.username}`} className="truncate text-text transition-colors hover:text-primary">
            Reposted by {repostContext.displayName}
          </Link>
          <span className="text-text-muted/50">·</span>
          <time className="shrink-0">{formatTimeAgo(repostContext.createdAt)}</time>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2.5 sm:px-5 sm:pt-5">
        <Link href={isAnonymous ? '#' : `/profile/${username}`} className="shrink-0">
          {isAnonymous ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/14 to-pink/14">
              <EyeOff size={17} className="text-primary" />
            </div>
          ) : (
            <PixelAvatar
              src={profile?.avatar_url}
              username={username}
              size="md"
              isVerified={profile?.is_verified}
              isPro={profile?.is_pro}
            />
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={isAnonymous ? '#' : `/profile/${username}`}
              className="truncate text-[15px] font-semibold text-text transition-colors hover:text-primary"
            >
              {displayName}
            </Link>
            {!isAnonymous && profile?.is_verified && (
              <BadgeCheck size={15} className="text-primary flex-shrink-0" />
            )}
            {/* Privacy badge */}
            <span
              className={cn(
                'inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase leading-tight',
                isAnonymous
                  ? 'bg-primary/12 text-primary ring-1 ring-primary/20'
                  : artwork.visibility === 'private'
                    ? 'bg-yellow/12 text-yellow ring-1 ring-yellow/20'
                    : 'bg-green/12 text-green ring-1 ring-green/20'
              )}
            >
              {isAnonymous ? (
                <>
                  <EyeOff size={9} />
                  Anon
                </>
              ) : artwork.visibility === 'private' ? (
                <>
                  <Lock size={9} />
                  Private
                </>
              ) : (
                <>
                  <Globe size={9} />
                  Public
                </>
              )}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-text-muted">
            {!isAnonymous && <span className="truncate">@{username}</span>}
            <span className="text-text-muted/50">·</span>
            <time className="shrink-0">{formatTimeAgo(artwork.created_at)}</time>
          </div>
        </div>

        <button
          className="flex items-center justify-center w-9 h-9 rounded-xl text-text-muted hover:text-text hover:bg-card-hover transition-colors shrink-0"
          aria-label="More post options"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* ===== CAPTION ===== */}
      {artwork.caption && (
        <p className="px-4 pb-3 text-[15px] text-text/90 leading-relaxed whitespace-pre-wrap sm:px-5">
          {artwork.caption}
        </p>
      )}

      {/* ===== ARTWORK ===== */}
      {pixelData.length > 0 && (
        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
          <div
            className={cn(
              'relative aspect-[16/10] overflow-hidden rounded-xl sm:rounded-2xl cursor-pointer',
              'border border-border/70 bg-surface',
              'shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]',
              'transition-shadow duration-300',
              'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_32px_rgba(58,42,92,0.1)]'
            )}
            onDoubleClick={() => void handleLike()}
          >
            {/* Inner ring overlay */}
            <div className="pointer-events-none absolute inset-0 z-10 rounded-xl ring-1 ring-inset ring-white/45 sm:rounded-2xl" />
            <PixelArtRenderer
              pixels={pixelData}
              gridSize={artwork.grid_size}
              className="absolute inset-0 h-full w-full !rounded-none"
            />
          </div>
        </div>
      )}

      {/* ===== INTERACTION BAR ===== */}
      <div className="flex items-center justify-between border-t border-border/40 px-2 py-2 sm:px-3 sm:py-2.5">
        <div className="flex min-w-0 items-center gap-0">
          {/* Like */}
          <button
            onClick={() => void handleLike()}
            className="relative group flex min-h-10 items-center gap-1.5 px-2.5 sm:px-3 rounded-xl hover:bg-red/8 transition-colors"
            aria-label={liked ? 'Unlike artwork' : 'Like artwork'}
            aria-pressed={liked}
          >
            <div className="relative">
              <AnimatePresence>
                {showBurst && <HeartBurstParticles />}
              </AnimatePresence>
              <motion.div
                animate={liked ? { scale: [1, 1.3, 0.95, 1] } : { scale: 1 }}
                transition={{ duration: 0.35 }}
              >
                <Heart
                  size={18}
                  className={cn(
                    'transition-colors duration-200',
                    liked ? 'text-red fill-red' : 'text-text-muted group-hover:text-red'
                  )}
                />
              </motion.div>
            </div>
            <span
              className={cn(
                'text-xs font-semibold tabular-nums transition-colors duration-200',
                liked ? 'text-red' : 'text-text-muted'
              )}
            >
              {formatNumber(likesCount)}
            </span>
          </button>

          {/* Comment */}
          <Link
            href={`/art/${artwork.id}`}
            className="group flex min-h-10 items-center gap-1.5 px-2.5 sm:px-3 rounded-xl hover:bg-cyan/8 transition-colors"
            aria-label={`View ${artwork.comments_count} comments`}
          >
            <MessageCircle
              size={18}
              className="text-text-muted group-hover:text-cyan transition-colors duration-200"
            />
            <span className="text-xs font-semibold tabular-nums text-text-muted">
              {formatNumber(artwork.comments_count)}
            </span>
          </Link>

          {/* Repost */}
          <button
            onClick={() => void handleRepost()}
            className="group flex min-h-10 items-center gap-1.5 px-2.5 sm:px-3 rounded-xl hover:bg-green/8 transition-colors"
            aria-label={reposted ? 'Undo repost' : 'Repost artwork'}
            aria-pressed={reposted}
          >
            <motion.div
              animate={reposted ? { rotate: [0, -15, 15, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Repeat2
                size={18}
                className={cn(
                  'transition-colors duration-200',
                  reposted ? 'text-green' : 'text-text-muted group-hover:text-green'
                )}
              />
            </motion.div>
            <span
              className={cn(
                'text-xs font-semibold tabular-nums transition-colors duration-200',
                reposted ? 'text-green' : 'text-text-muted'
              )}
            >
              {formatNumber(repostsCount)}
            </span>
          </button>

          {/* Views */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-text-muted/70">
            <Eye size={15} />
            <span className="text-[11px] font-medium tabular-nums">{formatNumber(artwork.views_count)}</span>
          </div>
        </div>

        <div className="flex items-center gap-0">
          {/* Bookmark */}
          <button
            onClick={() => void handleBookmark()}
            className="group flex items-center justify-center w-10 h-10 rounded-xl hover:bg-primary/8 transition-colors"
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark artwork'}
            aria-pressed={bookmarked}
          >
            <motion.div
              animate={bookmarked ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.25 }}
            >
              <Bookmark
                size={18}
                className={cn(
                  'transition-colors duration-200',
                  bookmarked
                    ? 'text-primary fill-primary'
                    : 'text-text-muted group-hover:text-primary'
                )}
              />
            </motion.div>
          </button>

          {/* Share */}
          <button
            onClick={() => void handleShare()}
            className="group flex items-center justify-center w-10 h-10 rounded-xl hover:bg-cyan/8 transition-colors"
            aria-label="Share artwork"
          >
            <Share2
              size={16}
              className="text-text-muted group-hover:text-cyan transition-colors duration-200"
            />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export const FeedCard = memo(FeedCardInner);
