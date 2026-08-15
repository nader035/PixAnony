'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Globe, Image as ImageIcon, LinkIcon, Loader2, Lock, Share2, X, XSocial } from '@/components/ui/icons';
import { PixelArtRenderer } from '@/components/ui/pixel-art-renderer';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { cn } from '@/lib/utils';
import { createArtworkShareImage, downloadArtworkShareImage } from '@/lib/artwork-share-image';
import { toast } from 'sonner';
import type { Artwork } from '@/lib/types';

type ShareArtwork = Artwork & {
  profile?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
    is_pro: boolean;
  };
};

interface ArtworkShareSheetProps {
  artwork: ShareArtwork;
  open: boolean;
  onClose: () => void;
}

export function ArtworkShareSheet({ artwork, open, onClose }: ArtworkShareSheetProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const isPrivate = artwork.visibility === 'private';
  const isAnonymous = artwork.is_anonymous;
  const displayName = isAnonymous ? 'Anonymous artist' : artwork.profile?.display_name || 'PixAnony artist';
  const username = isAnonymous ? 'anonymous' : artwork.profile?.username || 'pixanony';
  const shareUrl = typeof window === 'undefined'
    ? `/art/${artwork.id}`
    : `${window.location.origin}/art/${artwork.id}`;

  const pixels = useMemo(() => {
    if (Array.isArray(artwork.pixel_data)) return artwork.pixel_data;
    try {
      return JSON.parse(artwork.pixel_data) as string[];
    } catch {
      return [];
    }
  }, [artwork.pixel_data]);

  const shareText = useMemo(() => {
    const subject = artwork.title || artwork.caption?.trim() || 'A new artwork';
    return `${subject.slice(0, 120)} — shared by ${displayName} on PixAnony`;
  }, [artwork.caption, artwork.title, displayName]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 120);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [artwork.id, onClose, open]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Artwork link copied.');
      onClose();
    } catch {
      toast.error('Could not copy the link. Please try again.');
    }
  };

  const shareAnywhere = async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({
        title: artwork.title || 'Artwork on PixAnony',
        text: shareText,
        url: shareUrl,
      });
      onClose();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('Could not open the share menu.');
    }
  };

  const shareImage = async () => {
    try {
      setImageBusy(true);
      const file = await createArtworkShareImage({
        pixels,
        gridSize: artwork.grid_size,
        title: artwork.title || 'Artwork on PixAnony',
        caption: artwork.caption,
        displayName,
        username,
        isAnonymous,
      });
      const shareData = {
        files: [file],
        title: artwork.title || 'Artwork on PixAnony',
        text: `Created by ${displayName} on PixAnony`,
      };

      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        onClose();
        return;
      }

      downloadArtworkShareImage(file);
      toast.success('Branded artwork image downloaded.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error(error instanceof Error ? error.message : 'Could not create the share image.');
    } finally {
      setImageBusy(false);
    }
  };

  const xIntentUrl = `https://x.com/intent/post?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-text/30 p-3 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`share-title-${artwork.id}`}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[30px] bg-card p-4 shadow-float sm:p-5"
          >
            <div className="mb-4 flex items-start justify-between gap-4 px-1">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Pass it on</p>
                <h2 id={`share-title-${artwork.id}`} className="mt-1 text-2xl font-bold text-text">Share this artwork</h2>
                <p className="mt-1 text-sm text-text-muted">Choose a ready-to-post image or share the link.</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg text-text-muted transition-colors hover:bg-card-hover hover:text-text"
                aria-label="Close share dialog"
              >
                <X size={17} />
              </button>
            </div>

            <div className="overflow-hidden rounded-[24px] bg-[var(--powder)] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,.5)] sm:p-4">
              <div className="flex items-center gap-3">
                {isAnonymous ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-primary"><Lock size={16} /></div>
                ) : (
                  <PixelAvatar src={artwork.profile?.avatar_url} username={username} size="md" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-text">{displayName}</p>
                  <p className="truncate text-xs text-text-muted">{isAnonymous ? 'Identity protected' : `@${username}`}</p>
                </div>
                <span className="rounded-full bg-card/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">PixAnony</span>
              </div>
              {pixels.length > 0 && (
                <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-[18px] bg-card">
                  <PixelArtRenderer pixels={pixels} gridSize={artwork.grid_size} className="absolute inset-0 h-full w-full !rounded-none" />
                </div>
              )}
              <div className="px-1 pb-1 pt-3">
                <p className="line-clamp-2 text-sm font-semibold leading-5 text-text">
                  {artwork.title || artwork.caption || 'A fresh artwork from the PixAnony community.'}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-text-muted">
                  {isPrivate ? <Lock size={12} /> : <Globe size={12} />}
                  {isPrivate ? 'Only people with access can open this link' : 'Public artwork · ready to share'}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-[22px] bg-[var(--blush)] p-3 sm:p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-card text-pink shadow-card">
                <ImageIcon size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-text">Share a branded image</p>
                <p className="mt-0.5 text-xs leading-5 text-text-muted">A polished 4:5 PNG with your art and the PixAnony name.</p>
              </div>
              <button
                type="button"
                onClick={() => void shareImage()}
                disabled={imageBusy || pixels.length === 0}
                className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-text px-4 text-xs font-bold text-card transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
              >
                {imageBusy ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                <span className="hidden sm:inline">Share image</span>
                <span className="sm:hidden">Image</span>
              </button>
            </div>

            <div className="my-4 flex items-center gap-3 px-1">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted">Or share link only</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className={cn('grid gap-2', isPrivate ? 'grid-cols-2' : 'grid-cols-3')}>
              {!isPrivate && (
                <a
                  href={xIntentUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={onClose}
                  className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-[20px] bg-text px-3 text-center text-sm font-bold text-card transition-transform hover:-translate-y-0.5"
                >
                  <XSocial size={20} />
                  Share on X
                </a>
              )}
              <button
                type="button"
                onClick={() => void shareAnywhere()}
                className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-[20px] bg-[var(--lilac)] px-3 text-center text-sm font-bold text-text transition-transform hover:-translate-y-0.5"
              >
                <Share2 size={20} />
                Share anywhere
              </button>
              <button
                type="button"
                onClick={() => void copyLink()}
                className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-[20px] bg-[var(--mint)] px-3 text-center text-sm font-bold text-text transition-transform hover:-translate-y-0.5"
              >
                <Copy size={20} />
                Copy link
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-bg px-3 py-2.5 text-xs text-text-muted">
              <LinkIcon size={14} className="shrink-0" />
              <span className="truncate">{shareUrl}</span>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
