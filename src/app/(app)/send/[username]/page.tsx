'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  clearSendDraft,
  getSendDraftContentSignature,
  hasMeaningfulSendDraft,
  hasSendDraft,
  loadSendDraft,
  normalizeSendDraftRecipient,
  saveSendDraft,
  SEND_DRAFT_VERSION,
  type SendDraft,
} from '@/lib/send-draft-storage';

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

let inMemorySendDraft: SendDraft | null = null;


export default function SendToUserPage() {
  const router = useRouter();
  const params = useParams();
  const rawUsername = params.username as string;
  // Decode the URL encoded username (e.g. %40alex -> alex)
  const username = decodeURIComponent(rawUsername).replace('@', '');
  
  const supabase = useMemo(() => createClient(), []);

  // Store
  const {
    color,
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
    activeLayerId,
    recentColors,
    activePalette,
    symmetryMode,
    clearCanvas,
    initializeCanvas,
    restoreSnapshot,
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
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const draftReadyRef = useRef(false);
  const lastSavedDraftSignatureRef = useRef<string | null>(null);
  const discardedDraftSignatureRef = useRef<string | null>(null);

  usePaintKeyboardShortcuts({
    disabled: showSendModal,
    onEscape: () => setShowSendModal(false),
  });

  const compositeArtwork = useCallback(() => {
    const compositePixels = Array(gridSize * gridSize).fill('transparent');
    for (const layer of layers) {
      if (!layer.visible) continue;
      for (let i = 0; i < layer.pixels.length; i++) {
        const pixelColor = layer.pixels[i];
        if (pixelColor && pixelColor !== 'transparent') compositePixels[i] = pixelColor;
      }
    }
    return compositePixels;
  }, [gridSize, layers]);

  const buildCurrentDraft = useCallback((): SendDraft => ({
    version: SEND_DRAFT_VERSION,
    recipientUsername: normalizeSendDraftRecipient(username),
    canvas: {
      gridSize,
      pixelData: compositeArtwork(),
      layers,
      activeLayerId,
      color,
      recentColors,
      activePalette,
      symmetryMode,
      showGrid,
      showPreview,
    },
    caption,
    sendMode: sendAnonymously ? 'anonymous' : 'signed',
    timestamp: Date.now(),
  }), [
    activeLayerId,
    activePalette,
    caption,
    color,
    compositeArtwork,
    gridSize,
    layers,
    recentColors,
    sendAnonymously,
    showGrid,
    showPreview,
    symmetryMode,
    username,
  ]);

  const buildCurrentDraftRef = useRef(buildCurrentDraft);
  useEffect(() => {
    buildCurrentDraftRef.current = buildCurrentDraft;
  }, [buildCurrentDraft]);

  const persistDraft = useCallback((draft: SendDraft, notice: string | null = 'Draft saved') => {
    const meaningfulDraft = hasMeaningfulSendDraft(draft);
    const recipientKey = draft.recipientUsername;
    const draftSignature = getSendDraftContentSignature(draft);

    if (discardedDraftSignatureRef.current === draftSignature) return null;
    if (discardedDraftSignatureRef.current && discardedDraftSignatureRef.current !== draftSignature) {
      discardedDraftSignatureRef.current = null;
    }
    if (!meaningfulDraft && !hasSendDraft(recipientKey)) {
      inMemorySendDraft = null;
      lastSavedDraftSignatureRef.current = null;
      return null;
    }

    const savedDraft = saveSendDraft(recipientKey, draft);
    if (!savedDraft) return null;

    inMemorySendDraft = savedDraft;
    discardedDraftSignatureRef.current = null;
    lastSavedDraftSignatureRef.current = getSendDraftContentSignature(savedDraft);
    if (notice) setDraftNotice(notice);
    return savedDraft;
  }, []);

  const persistCurrentDraft = useCallback((notice: string | null = 'Draft saved') => {
    return persistDraft(buildCurrentDraftRef.current(), notice);
  }, [persistDraft]);

  const persistCurrentDraftRef = useRef(persistCurrentDraft);
  useEffect(() => {
    persistCurrentDraftRef.current = persistCurrentDraft;
  }, [persistCurrentDraft]);

  // Restore a recipient-specific send draft before autosave is enabled.
  useEffect(() => {
    let active = true;
    draftReadyRef.current = false;
    discardedDraftSignatureRef.current = null;

    queueMicrotask(() => {
      if (!active) return;

      const normalizedRecipient = normalizeSendDraftRecipient(username);
      const memoryDraft = inMemorySendDraft?.recipientUsername === normalizedRecipient
        ? inMemorySendDraft
        : null;
      const draft = memoryDraft ?? loadSendDraft(username);

      if (draft) {
        restoreSnapshot({
          gridSize: draft.canvas.gridSize,
          layers: draft.canvas.layers,
          activeLayerId: draft.canvas.activeLayerId,
          color: draft.canvas.color,
          recentColors: draft.canvas.recentColors,
          activePalette: draft.canvas.activePalette,
          symmetryMode: draft.canvas.symmetryMode,
          showGrid: draft.canvas.showGrid,
          showPreview: draft.canvas.showPreview,
        });
        setCaption(draft.caption);
        setSendAnonymously(draft.sendMode !== 'signed');
        setDraftNotice('Restored your drawing');
        lastSavedDraftSignatureRef.current = getSendDraftContentSignature(draft);
        inMemorySendDraft = draft;
      } else {
        initializeCanvas(16);
        setCaption('');
        setSendAnonymously(true);
        setDraftNotice(null);
        lastSavedDraftSignatureRef.current = null;
      }

      draftReadyRef.current = true;
    });

    return () => {
      active = false;
    };
  }, [initializeCanvas, restoreSnapshot, username]);

  // Autosave every meaningful change after restore/default initialization.
  useEffect(() => {
    if (!draftReadyRef.current) return;

    const draft = buildCurrentDraft();
    const meaningfulDraft = hasMeaningfulSendDraft(draft);
    const draftSignature = getSendDraftContentSignature(draft);

    if (discardedDraftSignatureRef.current === draftSignature) return;
    if (discardedDraftSignatureRef.current && discardedDraftSignatureRef.current !== draftSignature) {
      discardedDraftSignatureRef.current = null;
    }
    if (!meaningfulDraft && !hasSendDraft(username)) {
      inMemorySendDraft = null;
      lastSavedDraftSignatureRef.current = null;
      return;
    }

    if (draftSignature === lastSavedDraftSignatureRef.current) return;

    const timer = window.setTimeout(() => {
      persistDraft(draft, 'Draft saved');
    }, 300);

    return () => window.clearTimeout(timer);
  }, [buildCurrentDraft, persistDraft, username]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (draftReadyRef.current) persistCurrentDraftRef.current(null);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (draftReadyRef.current) persistCurrentDraftRef.current(null);
    };
  }, []);

  // Fetch auth user without blocking the public recipient link.
  useEffect(() => {
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
  }, [supabase]);

  // Fetch recipient profile
  useEffect(() => {
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
  }, [router, supabase, username]);

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

  const handleRequireAuth = useCallback(() => {
    persistDraft(buildCurrentDraft(), 'Continue after login');
    toast.success('Draft saved. Continue after login.');
    setShowSendModal(false);
    router.push(loginHref);
  }, [buildCurrentDraft, loginHref, persistDraft, router]);

  const handleClearSendDraft = useCallback(() => {
    const draft = buildCurrentDraft();
    if (hasMeaningfulSendDraft(draft) && !window.confirm('Clear this unsent drawing and remove the saved draft?')) {
      return;
    }

    discardedDraftSignatureRef.current = getSendDraftContentSignature(draft);
    inMemorySendDraft = null;
    lastSavedDraftSignatureRef.current = null;
    clearSendDraft(username);
    clearCanvas();
    setCaption('');
    setSendAnonymously(true);
    setDraftNotice('Draft cleared');
    toast.success('Draft cleared.');
  }, [buildCurrentDraft, clearCanvas, username]);

  const handleSendPixel = async () => {
    if (!recipient) return;
    if (!currentUser) {
      handleRequireAuth();
      return;
    }

    try {
      setIsSending(true);

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
        pixel_data: compositeArtwork(),
        layers: layers,
        visibility: sendAnonymously ? 'anonymous' : 'private',
        is_anonymous: sendAnonymously
      });

      if (error) throw error;

      toast.success(sendAnonymously ? 'Anonymous pixel art delivered.' : 'Signed private pixel art delivered.');
      setShowSendModal(false);
      clearSendDraft(username);
      inMemorySendDraft = null;
      lastSavedDraftSignatureRef.current = null;
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
        <p className="text-xs font-semibold text-text-muted">Loading canvas for @{username}...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-bg text-text select-none">
      {/* Top Navigation Bar */}
      <header className="z-20 flex min-h-16 items-center justify-between gap-2 border-b border-border/80 bg-bg/88 px-2 shadow-[0_16px_42px_rgba(58,42,92,.08)] backdrop-blur-xl sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link href={`/profile/${username}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 text-text-muted transition-colors hover:bg-card-hover hover:text-text">
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
          {draftNotice && (
            <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-2xl border border-green/20 bg-bg/82 px-3 py-2 text-xs font-semibold text-green shadow-float backdrop-blur-xl">
              {draftNotice}
            </div>
          )}
          <PaintCanvas />
        </main>

        <aside className="z-10 hidden w-[286px] flex-col gap-3 overflow-y-auto border-l border-border/80 bg-sidebar/70 p-3 hide-scrollbar lg:flex">
          <PreviewPanel />
          <LayerPanel />
          <ActionsPanel onClearCanvas={handleClearSendDraft} />
        </aside>
      </div>

      {/* Mobile bar */}
      <div className="z-20 space-y-2 border-t border-border/80 bg-bg/92 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <ToolPanel compact />
          </div>
          <ActionsPanel compact onClearCanvas={handleClearSendDraft} />
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
              <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-text">
                <Sparkles className="w-5 h-5" />
                Deliver pixel art
              </h3>
              <p className="text-xs text-text-muted mb-4">
                Send this drawing to <strong>@{recipient?.display_name || recipient?.username}</strong>. You choose whether your profile is shown.
              </p>

              <div className="space-y-4">
                {/* Display recipient metadata card */}
                <div className="rounded-2xl border border-border bg-surface/78 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <PixelAvatar username={recipient?.username || 'recipient'} src={recipient?.avatar_url} size="md" showBadge={false} />
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-text">{recipient?.display_name || recipient?.username}</h4>
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
                </div>

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
                    <strong className="text-yellow">Continue after login:</strong> PixAnony will keep this drawing, caption, and delivery choice while you sign in.
                  </div>
                )}

                {/* Message */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-text/80">Optional caption</label>
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
                  onClick={() => currentUser ? void handleSendPixel() : handleRequireAuth()}
                  disabled={isSending}
                  className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(124,58,237,0.22)] transition-all hover:brightness-105 active:scale-[0.98]"
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
