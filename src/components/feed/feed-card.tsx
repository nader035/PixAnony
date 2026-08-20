'use client';

import { useState, useCallback, useEffect, useMemo, useRef, memo } from 'react';
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
import { ArtworkShareSheet } from '@/components/feed/artwork-share-sheet';
import { ReportArtworkDialog } from '@/components/feed/report-artwork-dialog';
import { formatNumber, formatTimeAgo, cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { Artwork } from '@/lib/types';
import { useI18n } from '@/components/i18n/locale-provider';

interface FeedCardProps {
  artwork: Artwork & { profile?: { username: string; display_name: string; avatar_url: string | null; is_verified: boolean; is_pro: boolean } };
  className?: string;
  repostContext?: {
    displayName: string;
    username: string;
    createdAt: string;
  };
  showArtwork?: boolean;
}

const VIEWER_TOKEN_KEY = 'pixanony:artwork-viewer';

function getAnonymousViewerToken() {
  try {
    const current = window.localStorage.getItem(VIEWER_TOKEN_KEY);
    if (current) return current;
    const token = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(VIEWER_TOKEN_KEY, token);
    return token;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
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

function FeedCardInner({ artwork, className, repostContext, showArtwork = true }: FeedCardProps) {
  const supabase = useMemo(() => createClient(), []);
  const { t, locale } = useI18n();
  const cardRef = useRef<HTMLElement>(null);
  const [liked, setLiked] = useState(artwork.liked_by_user ?? false);
  const [likesCount, setLikesCount] = useState(artwork.likes_count);
  const [reposted, setReposted] = useState(artwork.reposted_by_user ?? false);
  const [repostsCount, setRepostsCount] = useState(artwork.reposts_count);
  const [viewsCount, setViewsCount] = useState(artwork.views_count);
  const [bookmarked, setBookmarked] = useState(artwork.bookmarked_by_user ?? false);
  const [showBurst, setShowBurst] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

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

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    let recorded = false;
    let viewTimer: number | undefined;

    const recordView = async () => {
      if (recorded) return;
      recorded = true;
      const { data, error } = await supabase.rpc('record_artwork_view', {
        target_artwork_id: artwork.id,
        anonymous_viewer_token: getAnonymousViewerToken(),
      });
      if (!error && typeof data === 'number') setViewsCount(data);
    };

    const beginView = () => {
      if (recorded || viewTimer !== undefined) return;
      viewTimer = window.setTimeout(() => void recordView(), 800);
    };
    const cancelView = () => {
      if (viewTimer === undefined) return;
      window.clearTimeout(viewTimer);
      viewTimer = undefined;
    };

    if (!('IntersectionObserver' in window)) {
      beginView();
      return cancelView;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.45) beginView();
      else cancelView();
    }, { threshold: [0.45] });
    observer.observe(element);

    return () => {
      cancelView();
      observer.disconnect();
    };
  }, [artwork.id, supabase]);

  const toggleRelation = useCallback(async (
    table: 'likes' | 'reposts' | 'bookmarks',
    active: boolean
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t('feed.signInInteract'));
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
  }, [artwork.id, supabase, t]);

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

  const displayName = isAnonymous ? t('feed.anonymousArtist') : profile?.display_name || t('common.creator');
  const username = isAnonymous ? 'anonymous' : profile?.username || 'unknown';
  const cardTones = ['var(--powder)', 'var(--butter)', 'var(--blush)', 'var(--lilac)', 'var(--mint)'];
  const cardTone = cardTones[artwork.id.charCodeAt(0) % cardTones.length];

  return (
    <motion.article
      ref={cardRef}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: cardTone }}
      className={cn(
        'content-auto overflow-hidden rounded-[28px] shadow-[0_12px_34px_rgba(44,40,58,0.06)]',
        'transition-[box-shadow,transform] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]',
        'hover:-translate-y-0.5 hover:shadow-float',
        className
      )}
    >
      {/* ===== REPOST CONTEXT ===== */}
      {repostContext && (
        <div className="flex items-center gap-2 border-b border-border/40 bg-green/[0.04] px-4 py-2.5 text-xs font-semibold text-text-muted sm:px-5">
          <Repeat2 size={13} className="text-green" />
          <Link href={`/profile/${repostContext.username}`} className="truncate text-text transition-colors hover:text-primary">
            {t('feed.reposted', { name: repostContext.displayName })}
          </Link>
          <span className="text-text-muted/50">·</span>
          <time className="shrink-0">{formatTimeAgo(repostContext.createdAt, locale)}</time>
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2.5 sm:px-5 sm:pt-5">
        <Link href={isAnonymous ? `/art/${artwork.id}` : `/profile/${username}`} className="shrink-0">
          {isAnonymous ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card">
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
              href={isAnonymous ? `/art/${artwork.id}` : `/profile/${username}`}
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
                  {t('common.anonymous')}
                </>
              ) : artwork.visibility === 'private' ? (
                <>
                  <Lock size={9} />
                  {t('common.private')}
                </>
              ) : (
                <>
                  <Globe size={9} />
                  {t('common.public')}
                </>
              )}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-text-muted">
            {!isAnonymous && <span className="rtl-isolate truncate">@{username}</span>}
            <span className="text-text-muted/50">·</span>
            <time className="shrink-0">{formatTimeAgo(artwork.created_at, locale)}</time>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-xl text-text-muted hover:text-text hover:bg-card-hover transition-colors shrink-0"
          aria-label="Report artwork"
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
      {showArtwork && pixelData.length > 0 && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <Link
            href={`/art/${artwork.id}`}
            className={cn(
              'relative block overflow-hidden rounded-[20px] cursor-pointer',
              'bg-card',
              'shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]',
              'transition-shadow duration-300',
              'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_32px_rgba(58,42,92,0.1)]'
            )}
            style={{ aspectRatio: `${artwork.grid_width} / ${artwork.grid_height}` }}
            aria-label={artwork.title || t('common.untitled')}
          >
            {/* Inner ring overlay */}
            <div className="pointer-events-none absolute inset-0 z-10 rounded-xl ring-1 ring-inset ring-white/45 sm:rounded-2xl" />
            <PixelArtRenderer
              pixels={pixelData}
              gridSize={artwork.grid_size}
              gridWidth={artwork.grid_width}
              gridHeight={artwork.grid_height}
              className="absolute inset-0 h-full w-full !rounded-none"
            />
          </Link>
        </div>
      )}

      {/* ===== INTERACTION BAR ===== */}
      <div className="grid grid-cols-6 items-center gap-0.5 px-3 pb-3 sm:px-4 sm:pb-4">
        {/* Like */}
        <button
          onClick={() => void handleLike()}
          className="group relative flex min-h-10 min-w-0 items-center justify-center gap-1 rounded-xl px-1 transition-colors duration-150 hover:bg-red/8 motion-reduce:transition-none"
          aria-label={liked ? t('feed.unlike') : t('feed.like')}
          aria-pressed={liked}
        >
          <div className="relative shrink-0">
            <AnimatePresence>
              {showBurst && <HeartBurstParticles />}
            </AnimatePresence>
            <motion.div
              animate={liked ? { scale: [1, 1.3, 0.95, 1] } : { scale: 1 }}
              transition={{ duration: 0.18 }}
            >
              <Heart
                size={17}
                className={cn(
                  'transition-colors duration-150 motion-reduce:transition-none',
                  liked ? 'fill-red text-red' : 'text-text-muted group-hover:text-red'
                )}
              />
            </motion.div>
          </div>
          <span
            className={cn(
              'min-w-0 truncate text-[11px] font-semibold tabular-nums transition-colors duration-150 motion-reduce:transition-none',
              liked ? 'text-red' : 'text-text-muted'
            )}
          >
            {formatNumber(likesCount, locale)}
          </span>
        </button>

        {/* Comment */}
        <Link
          href={`/art/${artwork.id}`}
          className="group flex min-h-10 min-w-0 items-center justify-center gap-1 rounded-xl px-1 transition-colors duration-150 hover:bg-cyan/8 motion-reduce:transition-none"
          aria-label={t('comments.viewCount', { count: formatNumber(artwork.comments_count, locale) })}
        >
          <MessageCircle
            size={17}
            className="shrink-0 text-text-muted transition-colors duration-150 group-hover:text-cyan motion-reduce:transition-none"
          />
          <span className="min-w-0 truncate text-[11px] font-semibold tabular-nums text-text-muted">
            {formatNumber(artwork.comments_count, locale)}
          </span>
        </Link>

        {/* Repost */}
        <button
          onClick={() => void handleRepost()}
          className="group flex min-h-10 min-w-0 items-center justify-center gap-1 rounded-xl px-1 transition-colors duration-150 hover:bg-green/8 motion-reduce:transition-none"
          aria-label={reposted ? t('feed.undoRepost') : t('feed.repost')}
          aria-pressed={reposted}
        >
          <motion.div
            className="shrink-0"
            animate={reposted ? { rotate: [0, -15, 15, 0] } : {}}
            transition={{ duration: 0.18 }}
          >
            <Repeat2
              size={17}
              className={cn(
                'transition-colors duration-150 motion-reduce:transition-none',
                reposted ? 'text-green' : 'text-text-muted group-hover:text-green'
              )}
            />
          </motion.div>
          <span
            className={cn(
              'min-w-0 truncate text-[11px] font-semibold tabular-nums transition-colors duration-150 motion-reduce:transition-none',
              reposted ? 'text-green' : 'text-text-muted'
            )}
          >
            {formatNumber(repostsCount, locale)}
          </span>
        </button>

        {/* Views */}
        <div
          className="flex min-h-10 min-w-0 items-center justify-center gap-1 px-1 text-text-muted/70"
          aria-label={t('common.views', { count: formatNumber(viewsCount, locale) })}
        >
          <Eye size={15} className="shrink-0" />
          <span className="min-w-0 truncate text-[10px] font-medium tabular-nums">{formatNumber(viewsCount, locale)}</span>
        </div>

        {/* Bookmark */}
        <button
          onClick={() => void handleBookmark()}
          className="group flex min-h-10 min-w-0 items-center justify-center rounded-xl px-1 transition-colors duration-150 hover:bg-primary/8 motion-reduce:transition-none"
          aria-label={bookmarked ? t('feed.removeBookmark') : t('feed.bookmark')}
          aria-pressed={bookmarked}
        >
          <motion.div
            animate={bookmarked ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.18 }}
          >
            <Bookmark
              size={17}
              className={cn(
                'transition-colors duration-150 motion-reduce:transition-none',
                bookmarked
                  ? 'fill-primary text-primary'
                  : 'text-text-muted group-hover:text-primary'
              )}
            />
          </motion.div>
        </button>

        {/* Share */}
        <button
          onClick={() => setShareOpen(true)}
          className="group flex min-h-10 min-w-0 items-center justify-center rounded-xl px-1 transition-colors duration-150 hover:bg-cyan/8 motion-reduce:transition-none"
          aria-label={t('feed.shareArtwork')}
          aria-haspopup="dialog"
        >
          <Share2
            size={17}
            className="text-text-muted transition-colors duration-150 group-hover:text-cyan motion-reduce:transition-none"
          />
        </button>
      </div>
      <ArtworkShareSheet
        artwork={artwork}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
      <ReportArtworkDialog
        artworkId={artwork.id}
        ownerId={artwork.user_id}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </motion.article>
  );
}

export const FeedCard = memo(FeedCardInner);
