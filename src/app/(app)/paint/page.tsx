'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Grid3X3, ZoomIn, ZoomOut, RotateCcw,
  RotateCw, Eye, EyeOff, Send, HelpCircle, Search, Sparkles, UserCheck, Upload,
  Shield, User
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
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { GridSize } from '@/lib/types';
import { PAINT_SHORTCUT_HELP } from '@/lib/paint-shortcuts';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useI18n } from '@/components/i18n/locale-provider';
import type { TranslationKey } from '@/lib/i18n/translations';

const shortcutLabelKeys: Record<string, TranslationKey> = {
  Pencil: 'paint.tool.pencil', Eraser: 'paint.tool.eraser', Fill: 'paint.tool.fill',
  Line: 'paint.tool.line', Rectangle: 'paint.tool.rectangle', Circle: 'paint.tool.circle',
  Picker: 'paint.tool.picker', 'Move / Pan': 'paint.tool.move', Undo: 'paint.undo', Redo: 'paint.redo',
  'Toggle grid': 'paint.shortcutGrid', 'Toggle preview': 'paint.shortcutPreview',
  'Zoom in / out': 'paint.shortcutZoom', 'Open shortcuts': 'paint.shortcutOpen',
};

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


export default function PaintPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { t } = useI18n();

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
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [currentProfile, setCurrentProfile] = useState<SenderProfile | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [matchingUsers, setMatchingUsers] = useState<RecipientProfile[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientProfile | null>(null);
  const [caption, setCaption] = useState('');
  const [publishTitle, setPublishTitle] = useState('');
  const [sendAnonymously, setSendAnonymously] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  usePaintKeyboardShortcuts({
    disabled: showSendModal || showPublishModal || showHelp,
    onHelp: () => setShowHelp(true),
    onEscape: () => {
      setShowHelp(false);
      setShowSendModal(false);
      setShowPublishModal(false);
    },
  });

  // Initialize canvas on mount
  useEffect(() => {
    initializeCanvas(16);
    
    // Fetch auth user
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, display_name')
          .eq('id', data.user.id)
          .single();
        setCurrentProfile(profileData ?? null);
      } else {
        toast.error(t('paint.signInRequired'));
        router.replace('/login');
      }
    });

    return () => {
      resetState();
    };
  }, [initializeCanvas, resetState, router, supabase, t]);

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

  const handleSendPixel = async () => {
    if (!selectedRecipient) {
      toast.error(t('paint.selectRecipient'));
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

      const senderName = currentProfile?.username ?? 'creator';
      const captionText = caption.trim() || (
        sendAnonymously
          ? t('paint.defaultAnonymousCaption')
          : t('paint.defaultSignedCaption', { username: senderName })
      );

      const { error } = await supabase.from('artworks').insert({
        user_id: currentUser.id,
        receiver_id: selectedRecipient.id,
        title: sendAnonymously ? t('paint.defaultAnonymousTitle') : t('paint.defaultSignedTitle', { username: senderName }),
        caption: captionText,
        grid_size: gridSize,
        pixel_data: compositePixels,
        layers: layers,
        visibility: sendAnonymously ? 'anonymous' : 'private',
        is_anonymous: sendAnonymously
      });

      if (error) throw error;

      toast.success(sendAnonymously ? t('paint.deliveredAnonymous') : t('paint.deliveredSigned'));
      setShowSendModal(false);
      
      // Route to confirmation screen
      router.push(`/confirm?mode=${sendAnonymously ? 'anonymous' : 'signed'}`);
    } catch {
      toast.error(t('paint.sendFailed'));
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
      toast.error(t('paint.titleRequired'));
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
      toast.success(t('paint.published'));
      router.push('/home');
    } catch {
      toast.error(t('paint.publishFailed'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[100dvh] select-none flex-col overflow-hidden bg-bg p-2 text-text sm:p-3">
      {/* Top Navigation Bar */}
      <header className="z-20 flex min-h-16 items-center justify-between gap-2 rounded-[24px] bg-card/90 px-2 shadow-[0_16px_42px_rgba(44,40,58,.1)] backdrop-blur-xl sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link href="/home" aria-label={t('common.backFeed')} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text-muted transition-colors hover:bg-card-hover hover:text-text">
            <ArrowLeft className="rtl-flip h-5 w-5" />
          </Link>
          <Logo size="sm" showText={false} className="hidden sm:flex" />
          <div className="hidden sm:block h-5 w-px bg-border" />
          
          {/* Grid Size Dropdown */}
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-semibold text-text-muted xl:inline">{t('paint.grid')}:</span>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value) as GridSize)}
              aria-label={t('paint.gridSize')}
                className="h-10 max-w-[112px] rounded-full bg-surface px-2 text-xs font-semibold transition-colors hover:bg-card-hover focus:outline-none sm:px-3"
            >
              <option value="8">8×8 ({t('paint.easy')})</option>
              <option value="16">16×16 ({t('paint.normal')})</option>
              <option value="32">32×32 ({t('paint.hard')})</option>
              <option value="64">64×64 ({t('paint.expert')})</option>
              <option value="128">128×128 ({t('paint.master')})</option>
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
              title={`${t('paint.undo')} (Ctrl+Z)`}
              className="p-1.5 hover:bg-card-hover rounded disabled:opacity-30 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title={`${t('paint.redo')} (Ctrl+Shift+Z)`}
              className="p-1.5 hover:bg-card-hover rounded disabled:opacity-30 transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1 border border-border rounded-lg bg-card/40 p-0.5">
            <button
              onClick={() => setZoom(zoom - 20)}
              aria-label={t('paint.zoomOut')}
              className="p-1.5 hover:bg-card-hover rounded transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono w-12 text-center text-text-muted">{zoom}%</span>
            <button
              onClick={() => setZoom(zoom + 20)}
              aria-label={t('paint.zoomIn')}
              className="p-1.5 hover:bg-card-hover rounded transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Toggles */}
          <div className="hidden sm:flex items-center gap-1 border border-border rounded-xl bg-card/40 p-0.5">
            <button
              onClick={toggleGrid}
              title={`${t('paint.toggleGrid')} (G)`}
              className={`p-1.5 rounded transition-colors ${showGrid ? 'bg-primary/20 text-primary' : 'hover:bg-card-hover text-text-muted'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={togglePreview}
              title={t('paint.togglePreview')}
              className={`p-1.5 rounded transition-colors ${showPreview ? 'bg-primary/20 text-primary' : 'hover:bg-card-hover text-text-muted'}`}
            >
              {showPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={() => setShowHelp(true)}
            aria-label={t('paint.openHelp')}
            className="hidden md:flex h-10 w-10 items-center justify-center hover:bg-card-hover rounded-xl border border-border/70 text-text-muted hover:text-text transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Send Action */}
          <button
            onClick={() => setShowPublishModal(true)}
            aria-label={t('paint.publishTitle')}
            className="flex h-10 w-10 items-center justify-center gap-2 rounded-xl border border-border bg-card text-xs font-semibold text-text transition-colors hover:border-primary/40 hover:bg-card-hover md:w-auto md:px-3"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{t('paint.publish')}</span>
          </button>
          <AnimatedButton
            variant="primary"
            onClick={() => setShowSendModal(true)}
            className="h-10 px-3 sm:px-4 text-xs font-semibold glow-primary"
          >
            <Send className="rtl-flip h-3.5 w-3.5 me-1.5" />
            <span className="hidden sm:inline">{t('paint.send')}</span>
            <span className="sm:hidden">{t('paint.send')}</span>
          </AnimatedButton>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="relative mt-3 flex flex-1 gap-3 overflow-hidden">
        {/* Left Side: Tools & Palettes */}
        <aside className="z-10 hidden w-[260px] flex-col gap-3 overflow-y-auto rounded-[28px] bg-sidebar p-3 shadow-[0_16px_42px_rgba(44,40,58,.08)] hide-scrollbar lg:flex">
          <ToolPanel />
          <ColorPalette />
        </aside>

        {/* Center: Interactive Canvas */}
        <main id="main-content" className="relative flex h-full flex-1 items-center justify-center overflow-hidden rounded-[28px] bg-bg-deep">
          <PaintCanvas />
        </main>

        {/* Right Side: Layers & Live Preview */}
        <aside className="z-10 hidden w-[286px] flex-col gap-3 overflow-y-auto rounded-[28px] bg-sidebar p-3 shadow-[0_16px_42px_rgba(44,40,58,.08)] hide-scrollbar lg:flex">
          <PreviewPanel />
          <LayerPanel />
          <ActionsPanel />
        </aside>
      </div>

      {/* Bottom bar for Mobile views (containing basic tools and colors) */}
      <div className="z-20 space-y-2 bg-bg/92 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
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
              className="surface-panel relative w-full max-w-md rounded-[28px] p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="paint-help-title"
            >
              <h3 id="paint-help-title" className="mb-4 text-lg font-semibold text-text">{t('paint.shortcuts')}</h3>
              <ul className="grid gap-2 text-sm font-medium text-text-muted sm:grid-cols-2">
                {PAINT_SHORTCUT_HELP.map((item) => (
                  <li key={`${item.label}-${item.shortcut}`} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-surface/70 px-3 py-2">
                    <span>{t(shortcutLabelKeys[item.label] ?? 'paint.shortcuts')}</span>
                    <kbd className="rounded-lg border border-border bg-bg px-2 py-1 font-mono text-[11px] text-text">{item.shortcut}</kbd>
                  </li>
                ))}
              </ul>
              <button onClick={() => setShowHelp(false)} className="w-full mt-6 py-2.5 bg-card hover:bg-card-hover border border-border rounded-xl font-semibold text-sm transition-all">
                {t('paint.closeHelp')}
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
              className="surface-panel relative w-full max-w-md rounded-[28px] p-5 shadow-2xl sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="send-pixel-title"
            >
              <h3 id="send-pixel-title" className="mb-2 flex items-center gap-2 text-lg font-semibold text-text">
                <Sparkles className="w-5 h-5" />
                {t('paint.sendTitle')}
              </h3>
              <p className="text-xs text-text-muted mb-4">
                {t('paint.sendDescription')}
              </p>

              <div className="space-y-4">
                {/* Search Recipient */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-text/80">{t('paint.recipient')}</label>
                  <div className="relative">
                    <Search className="absolute start-3 top-3 h-4 w-4 text-text-muted" />
                    <input
                      type="text"
                      placeholder={t('paint.searchUsers')}
                      value={recipientSearch}
                      onChange={(e) => {
                        setRecipientSearch(e.target.value);
                        setSelectedRecipient(null);
                        if (e.target.value.trim().length < 2) setMatchingUsers([]);
                      }}
                      className="w-full ps-9 pe-4 py-2 bg-surface border border-border rounded-xl text-sm focus:border-primary/80 focus:outline-none transition-colors"
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
                          className="w-full px-4 py-2.5 text-start text-sm hover:bg-card-hover transition-colors flex items-center gap-2.5"
                        >
                          <PixelAvatar username={user.username} src={user.avatar_url} size="xs" showBadge={false} />
                          <div>
                            <p className="font-semibold text-text text-xs">{user.display_name}</p>
                            <p className="rtl-isolate text-[10px] text-text-muted">@{user.username}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedRecipient && (
                    <div className="mt-2 flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 text-xs text-primary font-medium">
                      <UserCheck className="w-4 h-4 flex-shrink-0" />
                      <span>{t('paint.sendingTo', { username: selectedRecipient.username })}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setSendAnonymously(true)}
                    className={`rounded-2xl border p-3 text-start transition-all ${
                      sendAnonymously
                        ? 'border-primary bg-primary/12 text-text shadow-glow'
                        : 'border-border bg-surface text-text-muted hover:text-text'
                    }`}
                  >
                    <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Shield className="h-3.5 w-3.5" />
                    </span>
                    <strong className="block text-xs text-text">{t('common.anonymous')}</strong>
                    <span className="mt-1 block text-[11px] leading-4 text-text-muted">{t('paint.anonymousDescription')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendAnonymously(false)}
                    className={`rounded-2xl border p-3 text-start transition-all ${
                      !sendAnonymously
                        ? 'border-cyan bg-cyan/10 text-text shadow-[0_0_24px_rgba(34,211,238,.12)]'
                        : 'border-border bg-surface text-text-muted hover:text-text'
                    }`}
                  >
                    <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-cyan/15 text-cyan">
                      <User className="h-3.5 w-3.5" />
                    </span>
                    <strong className="block text-xs text-text">{t('common.signed')}</strong>
                    <span className="mt-1 block text-[11px] leading-4 text-text-muted">{t('paint.signedDescription')}</span>
                  </button>
                </div>

                {/* Caption */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-text/80">{t('paint.optionalCaption')}</label>
                  <textarea
                    placeholder={t('paint.captionPlaceholder')}
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
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSendPixel}
                  disabled={!selectedRecipient || isSending}
                  className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(0,94,254,0.22)] transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  {isSending ? t('paint.sending') : sendAnonymously ? t('paint.sendAnonymous') : t('paint.sendSigned')}
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
              className="surface-panel w-full max-w-md rounded-[28px] p-5 sm:p-6"
            >
              <h3 id="publish-title" className="flex items-center gap-2 text-lg font-semibold text-text">
                <Upload className="h-5 w-5 text-primary" />
                {t('paint.publishTitle')}
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                {t('paint.publishDescription')}
              </p>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-text">{t('paint.title')}</span>
                  <input
                    value={publishTitle}
                    onChange={(event) => setPublishTitle(event.target.value)}
                    maxLength={80}
                    placeholder={t('paint.titlePlaceholder')}
                    className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-text">{t('paint.caption')}</span>
                  <textarea
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder={t('paint.publishCaptionPlaceholder')}
                    className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </label>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowPublishModal(false)} disabled={isSending} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-text hover:bg-card-hover">
                  {t('common.cancel')}
                </button>
                <button onClick={() => void handlePublish()} disabled={isSending || !publishTitle.trim()} className="flex-[1.5] rounded-xl bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {isSending ? t('paint.publishing') : t('paint.publishFeed')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
