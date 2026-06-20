'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Grid3X3, ZoomIn, ZoomOut, RotateCcw,
  RotateCw, Eye, EyeOff, Send, HelpCircle, Search, Sparkles, UserCheck, Upload
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
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { GridSize } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

interface RecipientProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}


export default function PaintPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Store
  const {
    gridSize,
    setGridSize,
    zoom,
    setZoom,
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [matchingUsers, setMatchingUsers] = useState<RecipientProfile[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientProfile | null>(null);
  const [caption, setCaption] = useState('');
  const [publishTitle, setPublishTitle] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Initialize canvas on mount
  useEffect(() => {
    initializeCanvas(16);
    
    // Fetch auth user
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
      } else {
        toast.error('Sign in to create and send artwork.');
        router.replace('/login');
      }
    });

    return () => {
      resetState();
    };
  }, [initializeCanvas, resetState, router, supabase]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        redo();
      }
      // Toggle Grid: G
      if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        toggleGrid();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, toggleGrid]);

  // Recipient search
  useEffect(() => {
    if (recipientSearch.trim().length < 2) {
      return;
    }

    const searchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `%${recipientSearch}%`)
        .limit(5);

      if (!error && data) {
        setMatchingUsers(data);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [recipientSearch, supabase]);

  const handleSendAnonymousPixel = async () => {
    if (!selectedRecipient) {
      toast.error('Please select a recipient first.');
      return;
    }
    if (!currentUser) {
      router.push('/login');
      return;
    }

    try {
      setIsSending(true);

      // Compositing layers into flat pixel array for saving
      // In a senior architecture, we save the layers JSON and flat pixel array
      const compositePixels = Array(gridSize * gridSize).fill('transparent');
      
      // Merge all visible layers bottom up
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
        receiver_id: selectedRecipient.id,
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
      
      // Route to confirmation screen
      router.push('/confirm');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send pixel art message.');
    } finally {
      setIsSending(false);
    }
  };

  const compositeArtwork = () => {
    const compositePixels = Array(gridSize * gridSize).fill('transparent');
    for (const layer of layers) {
      if (!layer.visible) continue;
      for (let i = 0; i < layer.pixels.length; i++) {
        const pixelColor = layer.pixels[i];
        if (pixelColor && pixelColor !== 'transparent') compositePixels[i] = pixelColor;
      }
    }
    return compositePixels;
  };

  const handlePublish = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (!publishTitle.trim()) {
      toast.error('Add a title before publishing.');
      return;
    }
    try {
      setIsSending(true);
      const { error } = await supabase.from('artworks').insert({
        user_id: currentUser.id,
        receiver_id: null,
        title: publishTitle.trim(),
        caption: caption.trim() || null,
        grid_size: gridSize,
        pixel_data: compositeArtwork(),
        layers,
        visibility: 'public',
        is_anonymous: false,
      });
      if (error) throw error;
      toast.success('Artwork published to the feed.');
      router.push('/home');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish artwork.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-bg overflow-hidden select-none text-text">
      {/* Top Navigation Bar */}
      <header className="min-h-16 border-b border-border/80 bg-bg/88 backdrop-blur-xl px-2 sm:px-4 flex items-center justify-between gap-2 z-20">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link href="/home" aria-label="Back to feed" className="flex h-10 w-10 items-center justify-center hover:bg-card-hover rounded-xl border border-border/70 text-text-muted hover:text-text transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Logo size="sm" showText={false} className="hidden sm:flex" />
          <div className="hidden sm:block h-5 w-px bg-border" />
          
          {/* Grid Size Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted font-pixel hidden xl:inline">Grid:</span>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value) as GridSize)}
              aria-label="Canvas grid size"
              className="h-10 max-w-[112px] bg-card hover:bg-card-hover border border-border px-2 sm:px-3 rounded-xl text-xs font-semibold focus:outline-none transition-colors"
            >
              <option value="8">8x8 (Easy)</option>
              <option value="16">16x16 (Normal)</option>
              <option value="32">32x32 (Hard)</option>
              <option value="64">64x64 (Expert)</option>
              <option value="128">128x128 (Master)</option>
            </select>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Undo/Redo */}
          <div className="hidden items-center gap-0.5 rounded-xl border border-border bg-card/40 p-0.5 md:flex">
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

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1 border border-border rounded-lg bg-card/40 p-0.5">
            <button
              onClick={() => setZoom(zoom - 20)}
              className="p-1.5 hover:bg-card-hover rounded transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono w-12 text-center text-text-muted">{zoom}%</span>
            <button
              onClick={() => setZoom(zoom + 20)}
              className="p-1.5 hover:bg-card-hover rounded transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Toggles */}
          <div className="hidden sm:flex items-center gap-1 border border-border rounded-xl bg-card/40 p-0.5">
            <button
              onClick={toggleGrid}
              title="Toggle Grid Lines (G)"
              className={`p-1.5 rounded transition-colors ${showGrid ? 'bg-primary/20 text-primary' : 'hover:bg-card-hover text-text-muted'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={togglePreview}
              title="Toggle Live Preview"
              className={`p-1.5 rounded transition-colors ${showPreview ? 'bg-primary/20 text-primary' : 'hover:bg-card-hover text-text-muted'}`}
            >
              {showPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={() => setShowHelp(true)}
            aria-label="Open editor help"
            className="hidden md:flex h-10 w-10 items-center justify-center hover:bg-card-hover rounded-xl border border-border/70 text-text-muted hover:text-text transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Send Action */}
          <button
            onClick={() => setShowPublishModal(true)}
            aria-label="Publish artwork"
            className="flex h-10 w-10 items-center justify-center gap-2 rounded-xl border border-border bg-card text-xs font-semibold text-text transition-colors hover:border-primary/40 hover:bg-card-hover md:w-auto md:px-3"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Publish</span>
          </button>
          <AnimatedButton
            variant="primary"
            onClick={() => setShowSendModal(true)}
            className="h-10 px-3 sm:px-4 text-xs font-semibold glow-primary"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Send Anonymous</span>
            <span className="sm:hidden">Send</span>
          </AnimatedButton>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Tools & Palettes */}
        <aside className="w-[248px] border-r border-border bg-sidebar/40 flex flex-col p-3 gap-3 overflow-y-auto hide-scrollbar z-10 hidden lg:flex">
          <ToolPanel />
          <ColorPalette />
        </aside>

        {/* Center: Interactive Canvas */}
        <main className="flex-1 relative flex items-center justify-center overflow-hidden h-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.06),transparent_36%),var(--surface)]">
          <PaintCanvas />
        </main>

        {/* Right Side: Layers & Live Preview */}
        <aside className="w-[260px] border-l border-border bg-sidebar/40 flex flex-col p-3 gap-3 overflow-y-auto hide-scrollbar z-10 hidden lg:flex">
          <PreviewPanel />
          <LayerPanel />
          <ActionsPanel />
        </aside>
      </div>

      {/* Bottom bar for Mobile views (containing basic tools and colors) */}
      <div className="lg:hidden border-t border-border/80 bg-bg/92 backdrop-blur-xl px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-20 space-y-2">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1"><ToolPanel compact /></div>
          <ActionsPanel compact />
        </div>
        <ColorPalette compact />
      </div>

      {/* HELPER DRAWER MODAL */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="presentation">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="surface-panel max-w-md w-full rounded-2xl p-6 shadow-2xl relative"
              role="dialog"
              aria-modal="true"
              aria-labelledby="paint-help-title"
            >
              <h3 id="paint-help-title" className="font-pixel text-lg text-primary mb-4">Keyboard Shortcuts</h3>
              <ul className="space-y-2.5 text-sm font-medium text-text-muted">
                <li className="flex justify-between border-b border-border/40 pb-1.5"><span>Pencil Tool</span> <kbd className="bg-surface px-1.5 py-0.5 rounded border border-border font-mono text-xs">1</kbd></li>
                <li className="flex justify-between border-b border-border/40 pb-1.5"><span>Eraser Tool</span> <kbd className="bg-surface px-1.5 py-0.5 rounded border border-border font-mono text-xs">2</kbd></li>
                <li className="flex justify-between border-b border-border/40 pb-1.5"><span>Fill Bucket</span> <kbd className="bg-surface px-1.5 py-0.5 rounded border border-border font-mono text-xs">3</kbd></li>
                <li className="flex justify-between border-b border-border/40 pb-1.5"><span>Symmetry Toggle</span> <kbd className="bg-surface px-1.5 py-0.5 rounded border border-border font-mono text-xs">S</kbd></li>
                <li className="flex justify-between border-b border-border/40 pb-1.5"><span>Undo Action</span> <kbd className="bg-surface px-1.5 py-0.5 rounded border border-border font-mono text-xs">Ctrl + Z</kbd></li>
                <li className="flex justify-between border-b border-border/40 pb-1.5"><span>Redo Action</span> <kbd className="bg-surface px-1.5 py-0.5 rounded border border-border font-mono text-xs">Ctrl + Y</kbd></li>
                <li className="flex justify-between border-b border-border/40 pb-1.5"><span>Toggle Grid</span> <kbd className="bg-surface px-1.5 py-0.5 rounded border border-border font-mono text-xs">G</kbd></li>
              </ul>
              <button onClick={() => setShowHelp(false)} className="w-full mt-6 py-2.5 bg-card hover:bg-card-hover border border-border rounded-xl font-semibold text-sm transition-all">
                Dismiss Help
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ANONYMOUS SEND MODAL */}
      <AnimatePresence>
        {showSendModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="presentation">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="surface-panel max-w-md w-full rounded-2xl p-5 sm:p-6 shadow-2xl relative"
              role="dialog"
              aria-modal="true"
              aria-labelledby="send-pixel-title"
            >
              <h3 id="send-pixel-title" className="font-pixel text-lg text-primary mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Send Anonymously
              </h3>
              <p className="text-xs text-text-muted mb-4">
                Your drawing will appear in their private inbox, but your identity will be hidden.
              </p>

              <div className="space-y-4">
                {/* Search Recipient */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-text/80 uppercase tracking-wider">Recipient Username</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={recipientSearch}
                      onChange={(e) => {
                        setRecipientSearch(e.target.value);
                        setSelectedRecipient(null);
                        if (e.target.value.trim().length < 2) setMatchingUsers([]);
                      }}
                      className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-xl text-sm focus:border-primary/80 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Dropdown list for matching users */}
                  {matchingUsers.length > 0 && !selectedRecipient && (
                    <div className="mt-1 bg-surface border border-border rounded-xl overflow-hidden shadow-lg z-30 relative divide-y divide-border/50">
                      {matchingUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedRecipient(user);
                            setRecipientSearch(`@${user.username}`);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-card-hover transition-colors flex items-center gap-2.5"
                        >
                          <PixelAvatar username={user.username} src={user.avatar_url} size="xs" showBadge={false} />
                          <div>
                            <p className="font-semibold text-text text-xs">{user.display_name}</p>
                            <p className="text-[10px] text-text-muted">@{user.username}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedRecipient && (
                    <div className="mt-2 flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 text-xs text-primary font-medium">
                      <UserCheck className="w-4 h-4 flex-shrink-0" />
                      <span>Sending to <strong>@{selectedRecipient.username}</strong></span>
                    </div>
                  )}
                </div>

                {/* Caption */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-text/80 uppercase tracking-wider">Optional Caption</label>
                  <textarea
                    placeholder="Add a short caption to the drawing..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:border-primary/80 focus:outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
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
                  disabled={!selectedRecipient || isSending}
                  className="flex-[2] py-2.5 bg-gradient-primary text-white rounded-xl text-sm font-semibold shadow-glow hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isSending ? 'Sending...' : 'Confirm & Send'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPublishModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="publish-title"
              className="surface-panel w-full max-w-md rounded-2xl p-5 sm:p-6"
            >
              <h3 id="publish-title" className="flex items-center gap-2 text-lg font-semibold text-text">
                <Upload className="h-5 w-5 text-primary" />
                Publish artwork
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                Add this drawing to your public profile and the community feed.
              </p>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-text">Title</span>
                  <input
                    value={publishTitle}
                    onChange={(event) => setPublishTitle(event.target.value)}
                    maxLength={80}
                    placeholder="Name your artwork"
                    className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-text">Caption</span>
                  <textarea
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Share a little context"
                    className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </label>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowPublishModal(false)} disabled={isSending} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-text hover:bg-card-hover">
                  Cancel
                </button>
                <button onClick={() => void handlePublish()} disabled={isSending || !publishTitle.trim()} className="flex-[1.5] rounded-xl bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {isSending ? 'Publishing...' : 'Publish to feed'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
