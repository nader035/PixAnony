'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Grid3X3, RotateCcw,
  RotateCw, Eye, EyeOff, Send, Sparkles, User, Loader2,
  Check, Copy, Lock, LogIn, Shield
} from '@/components/ui/icons';
import { usePaintStore } from '@/stores/paint-store';
import { usePaintKeyboardShortcuts } from '@/hooks/use-paint-keyboard-shortcuts';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Panels
import PaintCanvas from '@/components/paint/paint-canvas';
import ToolPanel from '@/components/paint/tool-panel';
import ColorPalette from '@/components/paint/color-palette';
import LayerPanel from '@/components/paint/layer-panel';
import PreviewPanel from '@/components/paint/preview-panel';
import ActionsPanel from '@/components/paint/actions-panel';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Logo } from '@/components/ui/logo';
import { GridSize } from '@/lib/types';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { BorderGlow } from '@/components/react-bits/border-glow';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface RecipientProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface SenderProfile {
  username: string;
  display_name: string | null;
}


export default function SendToUserPage() {
  const router = useRouter();
  const params = useParams();
  const rawUsername = params.username as string;
  // Decode the URL encoded username (e.g. %40alex -> alex)
  const username = decodeURIComponent(rawUsername).replace('@', '');
  
  const supabase = useMemo(() => createClient(), []);

  // Store
  const {
    gridSize,
    setGridSize,
    showGrid,
    toggleGrid,
    showPreview,
    togglePreview,
    undo,
    redo,
    historyIndex,
    history,
    resetState,
    initializeCanvas,
    layers
  } = usePaintStore();

  // UI state
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [currentProfile, setCurrentProfile] = useState<SenderProfile | null>(null);
  const [recipient, setRecipient] = useState<RecipientProfile | null>(null);
  const [loadingRecipient, setLoadingRecipient] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [sendAnonymously, setSendAnonymously] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  usePaintKeyboardShortcuts({
    disabled: showSendModal,
    onEscape: () => setShowSendModal(false),
  });

  // Initialize canvas on mount & Fetch recipient
  useEffect(() => {
    initializeCanvas(16);
    
    // Fetch auth user without blocking the public recipient link.
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, display_name')
          .eq('id', data.user.id)
          .single();
        setCurrentProfile(profileData ?? null);
      }
    });

    // Fetch recipient profile
    const fetchRecipient = async () => {
      try {
        setLoadingRecipient(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('username', username)
          .single();

        if (error || !data) {
          toast.error(`User @${username} not found.`);
          router.push('/home');
          return;
        }
        setRecipient(data);
      } catch {
        toast.error('Failed to load recipient details.');
        router.push('/home');
      } finally {
        setLoadingRecipient(false);
      }
    };

    fetchRecipient();

    return () => {
      resetState();
    };
  }, [initializeCanvas, resetState, router, supabase, username]);

  const loginHref = `/login?next=${encodeURIComponent(`/send/${username}`)}`;
  const shareUrl = typeof window === 'undefined'
    ? `/send/${username}`
    : `${window.location.origin}/send/${username}`;

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopiedShareLink(true);
    toast.success('Send link copied.');
    window.setTimeout(() => setCopiedShareLink(false), 1600);
  };

  const handleSendPixel = async () => {
    if (!recipient) return;
    if (!currentUser) {
      toast.error('Sign in to deliver your pixel art.');
      router.push(loginHref);
      return;
    }

    try {
      setIsSending(true);

      const compositePixels = Array(gridSize * gridSize).fill('transparent');
      for (const layer of layers) {
        if (!layer.visible) continue;
        for (let i = 0; i < layer.pixels.length; i++) {
          const pixelColor = layer.pixels[i];
          if (pixelColor && pixelColor !== 'transparent') {
            compositePixels[i] = pixelColor;
          }
        }
      }

      const senderName = currentProfile?.username ?? 'creator';
      const captionText = caption.trim() || (
        sendAnonymously
          ? 'A surprise pixel gift!'
          : `A signed pixel gift from @${senderName}.`
      );

      const { error } = await supabase.from('artworks').insert({
        user_id: currentUser.id,
        receiver_id: recipient.id,
        title: sendAnonymously ? 'Anonymous Pixel Message' : `Pixel message from @${senderName}`,
        caption: captionText,
        grid_size: gridSize,
        pixel_data: compositePixels,
        layers: layers,
        visibility: sendAnonymously ? 'anonymous' : 'private',
        is_anonymous: sendAnonymously
      });

      if (error) throw error;

      toast.success(sendAnonymously ? 'Anonymous pixel art delivered.' : 'Signed private pixel art delivered.');
      setShowSendModal(false);
      router.push(`/confirm?mode=${sendAnonymously ? 'anonymous' : 'signed'}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send pixel art.');
    } finally {
      setIsSending(false);
    }
  };

  if (loadingRecipient) {
    return (
      <div className="flex min-h-[100svh] w-full flex-col items-center justify-center gap-4 bg-bg text-text">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="font-pixel text-xs text-text-muted">Loading canvas for @{username}...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-bg text-text select-none">
      {/* Top Navigation Bar */}
      <header className="z-20 flex min-h-16 items-center justify-between gap-2 border-b border-border/80 bg-bg/88 px-2 shadow-[0_16px_42px_rgba(0,0,0,.18)] backdrop-blur-xl sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link href={`/@${username}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 text-text-muted transition-colors hover:bg-card-hover hover:text-text">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Logo size="sm" showText={false} className="hidden sm:flex" />
          
          <div className="hidden md:block h-5 w-px bg-border" />
          
          {/* Target User Info */}
          <div className="flex min-w-0 max-w-[132px] items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-2.5 py-2 sm:max-w-none sm:px-3">
            <User className="w-3.5 h-3.5 text-primary" />
            <span className="truncate text-xs font-semibold text-text-muted">
              To: <strong className="text-primary">@{recipient?.username}</strong>
            </span>
          </div>

          <div className="hidden sm:block h-5 w-px bg-border" />
          
          {/* Grid Size Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value) as GridSize)}
              aria-label="Canvas grid size"
              className="h-10 max-w-[78px] rounded-xl border border-border bg-card px-2 text-xs font-semibold transition-colors hover:bg-card-hover focus:outline-none sm:max-w-none sm:px-3"
            >
              <option value="8">8x8</option>
              <option value="16">16x16</option>
              <option value="32">32x32</option>
              <option value="64">64x64</option>
            </select>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Undo/Redo */}
          <div className="hidden items-center gap-0.5 rounded-xl border border-border bg-card/40 p-0.5 sm:flex">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
              className="p-1.5 hover:bg-card-hover rounded disabled:opacity-30 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Shift+Z)"
              className="p-1.5 hover:bg-card-hover rounded disabled:opacity-30 transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Toggles */}
          <div className="hidden items-center gap-1 rounded-xl border border-border bg-card/40 p-0.5 md:flex">
            <button
              onClick={toggleGrid}
              className={`p-1.5 rounded transition-colors ${showGrid ? 'bg-primary/20 text-primary' : 'hover:bg-card-hover text-text-muted'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={togglePreview}
              className={`p-1.5 rounded transition-colors ${showPreview ? 'bg-primary/20 text-primary' : 'hover:bg-card-hover text-text-muted'}`}
            >
              {showPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          {/* Send Action */}
          <AnimatedButton
            variant="primary"
            onClick={() => setShowSendModal(true)}
            className="h-10 px-3 text-xs font-semibold glow-primary sm:px-4"
          >
            {currentUser ? <Send className="w-3.5 h-3.5 mr-1.5" /> : <LogIn className="w-3.5 h-3.5 mr-1.5" />}
            <span className="hidden md:inline">{currentUser ? `Send to @${recipient?.username}` : 'Sign in to send'}</span>
            <span className="md:hidden">{currentUser ? 'Send' : 'Sign in'}</span>
          </AnimatedButton>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="relative flex flex-1 overflow-hidden">
        <aside className="z-10 hidden w-[260px] flex-col gap-3 overflow-y-auto border-r border-border/80 bg-sidebar/70 p-3 hide-scrollbar lg:flex">
          <ToolPanel />
          <ColorPalette />
        </aside>

        <main className="relative flex h-full flex-1 items-center justify-center overflow-hidden bg-bg">
          {!currentUser && (
            <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 mx-auto max-w-xl rounded-2xl border border-primary/20 bg-bg/82 px-4 py-3 text-xs leading-5 text-text-muted shadow-float backdrop-blur-xl">
              <strong className="text-text">You can draw first.</strong> Sign in when you are ready to deliver it to @{recipient?.username}.
            </div>
          )}
          <PaintCanvas />
        </main>

        <aside className="z-10 hidden w-[286px] flex-col gap-3 overflow-y-auto border-l border-border/80 bg-sidebar/70 p-3 hide-scrollbar lg:flex">
          <PreviewPanel />
          <LayerPanel />
          <ActionsPanel />
        </aside>
      </div>

      {/* Mobile bar */}
      <div className="z-20 space-y-2 border-t border-border/80 bg-bg/92 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <ToolPanel compact />
          </div>
          <ActionsPanel compact />
        </div>
        <ColorPalette compact />
      </div>

      {/* SEND DIALOG */}
      <AnimatePresence>
        {showSendModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border max-w-md w-full rounded-2xl p-6 shadow-2xl relative"
            >
              <h3 className="font-pixel text-lg text-primary mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Deliver pixel art
              </h3>
              <p className="text-xs text-text-muted mb-4">
                Send this drawing to <strong>@{recipient?.display_name || recipient?.username}</strong>. You choose whether your profile is shown.
              </p>

              <div className="space-y-4">
                {/* Display recipient metadata card */}
                <BorderGlow animated className="rounded-2xl" borderRadius={16} glowRadius={24} fillOpacity={0.24}>
                  <div className="flex items-center justify-between gap-3 bg-surface/78 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <PixelAvatar username={recipient?.username || 'recipient'} src={recipient?.avatar_url} size="md" showBadge={false} />
                      <div className="min-w-0">
                        <h4 className="truncate font-semibold text-sm text-text">{recipient?.display_name || recipient?.username}</h4>
                        <p className="text-xs text-text-muted">@{recipient?.username}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyShareLink()}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-bg/70 text-text-muted hover:text-text"
                      aria-label="Copy recipient send link"
                    >
                      {copiedShareLink ? <Check className="h-3.5 w-3.5 text-green" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </BorderGlow>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setSendAnonymously(true)}
                    className={`rounded-2xl border p-3 text-left transition-all ${
                      sendAnonymously
                        ? 'border-primary bg-primary/12 text-text shadow-glow'
                        : 'border-border bg-surface text-text-muted hover:text-text'
                    }`}
                  >
                    <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Shield className="h-3.5 w-3.5" />
                    </span>
                    <strong className="block text-xs text-text">Anonymous</strong>
                    <span className="mt-1 block text-[11px] leading-4 text-text-muted">Hide your profile from the recipient.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendAnonymously(false)}
                    className={`rounded-2xl border p-3 text-left transition-all ${
                      !sendAnonymously
                        ? 'border-cyan bg-cyan/10 text-text shadow-[0_0_24px_rgba(34,211,238,.12)]'
                        : 'border-border bg-surface text-text-muted hover:text-text'
                    }`}
                  >
                    <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-cyan/15 text-cyan">
                      <User className="h-3.5 w-3.5" />
                    </span>
                    <strong className="block text-xs text-text">Signed</strong>
                    <span className="mt-1 block text-[11px] leading-4 text-text-muted">Show your profile privately with the art.</span>
                  </button>
                </div>

                {!currentUser && (
                  <div className="rounded-2xl border border-yellow/20 bg-yellow/10 p-3 text-xs leading-5 text-text-muted">
                    <strong className="text-yellow">Sign-in required:</strong> PixAnony requires an account before delivery so private sends stay rate-limitable and abuse-resistant.
                  </div>
                )}

                {/* Message */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-text/80 uppercase tracking-wider">Optional Caption</label>
                  <textarea
                    placeholder="Add a short caption to the artwork..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:border-primary/80 focus:outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSendModal(false)}
                  disabled={isSending}
                  className="flex-1 py-2.5 bg-surface hover:bg-card-hover border border-border rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => currentUser ? void handleSendPixel() : router.push(loginHref)}
                  disabled={isSending}
                  className="flex-[2] py-2.5 bg-gradient-primary text-white rounded-xl text-sm font-semibold shadow-glow hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isSending ? 'Sending...' : currentUser ? (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      {sendAnonymously ? 'Send anonymous' : 'Send signed'}
                    </>
                  ) : (
                    <>
                      <LogIn className="h-3.5 w-3.5" />
                      Sign in to deliver
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
