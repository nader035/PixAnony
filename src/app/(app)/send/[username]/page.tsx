'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Grid3X3, RotateCcw,
  RotateCw, Eye, EyeOff, Send, Sparkles, User, Loader2
} from '@/components/ui/icons';
import { usePaintStore } from '@/stores/paint-store';
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
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface RecipientProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
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
  const [recipient, setRecipient] = useState<RecipientProfile | null>(null);
  const [loadingRecipient, setLoadingRecipient] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Initialize canvas on mount & Fetch recipient
  useEffect(() => {
    initializeCanvas(16);
    
    // Fetch auth user
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
      } else {
        toast.error('Sign in to send artwork.');
        router.replace('/login');
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

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        redo();
      }
      if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        toggleGrid();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, toggleGrid]);

  const handleSendAnonymousPixel = async () => {
    if (!recipient) return;
    if (!currentUser) {
      router.push('/login');
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

      const { error } = await supabase.from('artworks').insert({
        user_id: currentUser.id,
        receiver_id: recipient.id,
        title: 'Anonymous Pixel Message',
        caption: caption.trim() || 'A surprise pixel gift! 🎁',
        grid_size: gridSize,
        pixel_data: compositePixels,
        layers: layers,
        visibility: 'anonymous',
        is_anonymous: true
      });

      if (error) throw error;

      toast.success('Your pixel art is sent successfully!');
      setShowSendModal(false);
      router.push('/confirm');
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
      <header className="z-20 flex min-h-16 items-center justify-between gap-2 border-b border-border/80 bg-bg/88 px-2 backdrop-blur-xl sm:px-4">
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
            <Send className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden md:inline">Send to @{recipient?.username}</span>
            <span className="md:hidden">Send</span>
          </AnimatedButton>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        <aside className="z-10 hidden w-[248px] flex-col gap-3 overflow-y-auto border-r border-border bg-sidebar/40 p-3 lg:flex">
          <ToolPanel />
          <ColorPalette />
        </aside>

        <main className="relative flex h-full flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.06),transparent_36%),var(--surface)]">
          <PaintCanvas />
        </main>

        <aside className="z-10 hidden w-[260px] flex-col gap-3 overflow-y-auto border-l border-border bg-sidebar/40 p-3 lg:flex">
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
                Send Anonymously
              </h3>
              <p className="text-xs text-text-muted mb-4">
                Your drawing will be sent to <strong>@{recipient?.display_name || recipient?.username}</strong> anonymously.
              </p>

              <div className="space-y-4">
                {/* Display recipient metadata card */}
                <div className="flex items-center gap-3 bg-surface border border-border p-3 rounded-xl">
                  <PixelAvatar username={recipient?.username || 'recipient'} src={recipient?.avatar_url} size="md" showBadge={false} />
                  <div>
                    <h4 className="font-semibold text-sm text-text">{recipient?.display_name}</h4>
                    <p className="text-xs text-text-muted">@{recipient?.username}</p>
                  </div>
                </div>

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
                  onClick={handleSendAnonymousPixel}
                  disabled={isSending}
                  className="flex-[2] py-2.5 bg-gradient-primary text-white rounded-xl text-sm font-semibold shadow-glow hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isSending ? 'Sending...' : 'Confirm & Send'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
