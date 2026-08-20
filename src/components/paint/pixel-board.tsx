'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Grid3X3, ZoomIn, ZoomOut, RotateCcw,
  RotateCw, Eye, EyeOff, Send, HelpCircle, Search, Sparkles, UserCheck, Upload,
  Shield, User, Lock
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
import { CanvasPresetSelect } from '@/components/paint/canvas-preset-select';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Logo } from '@/components/ui/logo';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { PAINT_SHORTCUT_HELP } from '@/lib/paint-shortcuts';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useI18n } from '@/components/i18n/locale-provider';
import type { TranslationKey } from '@/lib/i18n/translations';
import { convertImageFileToPixels, createChallengeEntryLayers } from '@/lib/pixel-art';
import { createEmptyPixelArray, generateId } from '@/lib/utils';
import type { GridSize, PixelLayer } from '@/lib/types';

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

export type PixelBoardMode = 'standard' | 'challenge-entry' | 'challenge-template';

export type PixelBoardChallenge = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  gridWidth: number;
  gridHeight: number;
  templateArtworkId: string | null;
  templatePixels: string[];
  templateLayers: PixelLayer[];
  templateLocked: boolean;
};

export type PixelBoardProps = {
  isAdmin: boolean;
  mode?: PixelBoardMode;
  challenge?: PixelBoardChallenge | null;
};

function pixelLayersFromPixels(pixels: string[], width: number, height: number): PixelLayer[] {
  return [
    {
      id: generateId(),
      name: 'Background',
      visible: true,
      opacity: 1,
      locked: true,
      pixels: createEmptyPixelArray(width, height),
    },
    {
      id: generateId(),
      name: 'Converted image',
      visible: true,
      opacity: 1,
      locked: false,
      pixels,
    },
  ];
}

export function PixelBoard({ isAdmin, mode = 'standard', challenge = null }: PixelBoardProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { t } = useI18n();

  // Store
  const {
    gridWidth,
    gridHeight,
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
    restoreSnapshot,
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
  const [publishTitle, setPublishTitle] = useState(mode === 'challenge-entry' ? challenge?.title ?? '' : '');
  const [sendAnonymously, setSendAnonymously] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAdminTools, setShowAdminTools] = useState(false);
  const [showChallengeSubmit, setShowChallengeSubmit] = useState(false);
  const [templateLocked, setTemplateLocked] = useState(challenge?.templateLocked ?? false);
  const [adminTitle, setAdminTitle] = useState('');
  const [adminCaption, setAdminCaption] = useState('');
  const [savedAdminArtworkId, setSavedAdminArtworkId] = useState<string | null>(null);
  const [adminAudience, setAdminAudience] = useState<'user' | 'everyone'>('user');
  const [adminIdentity, setAdminIdentity] = useState<'admin' | 'anonymous'>('admin');
  const [adminRecipientSearch, setAdminRecipientSearch] = useState('');
  const [adminRecipients, setAdminRecipients] = useState<RecipientProfile[]>([]);
  const [adminRecipient, setAdminRecipient] = useState<RecipientProfile | null>(null);
  const [conversionBusy, setConversionBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isChallengeEntry = mode === 'challenge-entry';
  const isChallengeTemplate = mode === 'challenge-template';
  const contextualBackHref = isChallengeEntry && challenge
    ? `/challenges/${challenge.slug}`
    : isChallengeTemplate
      ? '/dashboard/challenges'
      : '/home';
  const contextualTitle = challenge
    ? isChallengeEntry
      ? t('challenges.entryFor', { title: challenge.title })
      : t('dashboard.challengeTemplateFor', { title: challenge.title })
    : null;
  const contextualDescription = challenge
    ? challenge.description || (isChallengeEntry
      ? t('challenges.entryDescription')
      : t('dashboard.challengeTemplateDescription'))
    : null;

  usePaintKeyboardShortcuts({
    disabled: showSendModal || showPublishModal || showHelp || showAdminTools || showChallengeSubmit,
    onHelp: () => setShowHelp(true),
    onEscape: () => {
      setShowHelp(false);
      setShowSendModal(false);
      setShowPublishModal(false);
      setShowAdminTools(false);
      setShowChallengeSubmit(false);
    },
  });

  // Initialize the single board from either a blank canvas or the selected challenge.
  useEffect(() => {
    if (!challenge || mode === 'standard') {
      initializeCanvas(16);
    } else {
      const expectedLength = challenge.gridWidth * challenge.gridHeight;
      let initialLayers = challenge.templateLayers.filter(
        (layer) => layer.pixels.length === expectedLength,
      );

      if (isChallengeEntry) {
        initialLayers = createChallengeEntryLayers(
          challenge.templatePixels,
          challenge.gridWidth,
          challenge.gridHeight,
          challenge.templateLocked,
        );
      } else if (!initialLayers.length) {
        initialLayers = pixelLayersFromPixels(
          challenge.templatePixels.length === expectedLength
            ? challenge.templatePixels
            : createEmptyPixelArray(challenge.gridWidth, challenge.gridHeight),
          challenge.gridWidth,
          challenge.gridHeight,
        );
      }

      restoreSnapshot({
        gridSize: challenge.gridWidth as GridSize,
        gridWidth: challenge.gridWidth,
        gridHeight: challenge.gridHeight,
        layers: initialLayers,
        activeLayerId: initialLayers.find((layer) => !layer.locked)?.id,
      });
    }

    return () => resetState();
  }, [challenge, initializeCanvas, isChallengeEntry, mode, resetState, restoreSnapshot]);

  // Fetch the authenticated profile used by the board's existing publish/send flows.
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
      } else {
        toast.error(t('paint.signInRequired'));
        router.replace('/login');
      }
    });
  }, [router, supabase, t]);

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

  useEffect(() => {
    if (!isAdmin || !showAdminTools || adminAudience !== 'user' || adminRecipientSearch.trim().length < 2) {
      return;
    }

    const timer = window.setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `%${adminRecipientSearch.trim()}%`)
        .limit(6);
      setAdminRecipients((data as RecipientProfile[] | null) ?? []);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [adminAudience, adminRecipientSearch, isAdmin, showAdminTools, supabase]);

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
      const compositePixels = Array(gridWidth * gridHeight).fill('transparent');

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
        grid_size: gridWidth,
        grid_width: gridWidth,
        grid_height: gridHeight,
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
    const compositePixels = Array(gridWidth * gridHeight).fill('transparent');
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
        grid_size: gridWidth,
        grid_width: gridWidth,
        grid_height: gridHeight,
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

  const convertImage = async (file: File) => {
    if (!isAdmin) return;
    setConversionBusy(true);
    try {
      const pixels = await convertImageFileToPixels(file, gridWidth, gridHeight);
      const nextLayers = pixelLayersFromPixels(pixels, gridWidth, gridHeight);
      restoreSnapshot({
        gridSize: gridWidth as GridSize,
        gridWidth,
        gridHeight,
        layers: nextLayers,
        activeLayerId: nextLayers[1].id,
      });
      toast.success(t('dashboard.imageConverted'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.actionFailed'));
    } finally {
      setConversionBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveChallengeTemplate = async () => {
    if (!isAdmin || !challenge || !isChallengeTemplate) return;
    setIsSending(true);
    try {
      const { error } = await supabase.rpc('save_challenge_template', {
        target_challenge_id: challenge.id,
        template_grid_width: gridWidth,
        template_grid_height: gridHeight,
        template_pixel_data: compositeArtwork(),
        template_layers: layers,
        lock_template: templateLocked,
      });
      if (error) throw error;
      toast.success(t('dashboard.challengeTemplateSaved'));
      router.push('/dashboard/challenges');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.actionFailed'));
    } finally {
      setIsSending(false);
    }
  };

  const submitChallengeEntry = async () => {
    if (!challenge || !isChallengeEntry) return;
    if (!publishTitle.trim()) {
      toast.error(t('paint.titleRequired'));
      return;
    }
    setIsSending(true);
    try {
      const { data, error } = await supabase.rpc('submit_challenge_entry', {
        target_challenge_id: challenge.id,
        entry_title: publishTitle.trim(),
        entry_caption: caption.trim() || null,
        entry_grid_width: gridWidth,
        entry_grid_height: gridHeight,
        entry_pixel_data: compositeArtwork(),
        entry_layers: layers,
      });
      if (error) throw error;
      toast.success(t('challenges.submissionSaved'));
      router.push(`/art/${data}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.actionFailed'));
    } finally {
      setIsSending(false);
    }
  };

  const persistAdminArtwork = async (showSuccess: boolean) => {
    if (!isAdmin) throw new Error(t('common.actionFailed'));
    if (!adminTitle.trim()) {
      toast.error(t('paint.titleRequired'));
      return null;
    }
    const { data, error } = await supabase.rpc('save_admin_pixel_art', {
      target_artwork_id: savedAdminArtworkId,
      artwork_title: adminTitle.trim(),
      artwork_caption: adminCaption.trim() || null,
      artwork_grid_width: gridWidth,
      artwork_grid_height: gridHeight,
      artwork_pixel_data: compositeArtwork(),
      artwork_layers: layers,
    });
    if (error) throw error;
    const artworkId = String(data);
    setSavedAdminArtworkId(artworkId);
    if (showSuccess) toast.success(t('dashboard.adminArtworkSaved'));
    return artworkId;
  };

  const saveAdminArtwork = async () => {
    setIsSending(true);
    try {
      await persistAdminArtwork(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.actionFailed'));
    } finally {
      setIsSending(false);
    }
  };

  const deliverAdminArtwork = async () => {
    if (adminAudience === 'user' && !adminRecipient) {
      toast.error(t('paint.selectRecipient'));
      return;
    }
    setIsSending(true);
    try {
      // Saving immediately before delivery ensures the sent copy matches the canvas on screen.
      const sourceArtworkId = await persistAdminArtwork(false);
      if (!sourceArtworkId) return;
      const { data, error } = await supabase.rpc('deliver_admin_pixel_art', {
        source_artwork_id: sourceArtworkId,
        delivery_audience: adminAudience,
        delivery_target_user_id: adminAudience === 'user' ? adminRecipient?.id : null,
        delivery_identity: adminIdentity,
      });
      if (error) throw error;
      toast.success(t('dashboard.deliverySent'));
      router.push(`/art/${data}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.actionFailed'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[100dvh] select-none flex-col overflow-hidden bg-bg p-2 text-text sm:p-3">
      {/* Top Navigation Bar */}
      <header className="z-20 flex min-h-16 items-center justify-between gap-2 rounded-[24px] bg-card/90 px-2 shadow-[0_16px_42px_rgba(44,40,58,.1)] backdrop-blur-xl sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link href={contextualBackHref} aria-label={t('common.backFeed')} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text-muted transition-colors hover:bg-card-hover hover:text-text">
            <ArrowLeft className="rtl-flip h-5 w-5" />
          </Link>
          <Logo size="sm" showText={false} className="hidden sm:flex" />
          <div className="hidden sm:block h-5 w-px bg-border" />

          {/* Grid Size Dropdown */}
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-semibold text-text-muted xl:inline">{t('paint.grid')}:</span>
            <CanvasPresetSelect
              disabled={isChallengeEntry}
              includeExtended={isAdmin || isChallengeEntry || isChallengeTemplate}
            />
          </div>
          {contextualTitle && (
            <div className="hidden min-w-0 border-s border-border ps-3 xl:block">
              <p className="max-w-64 truncate text-[11px] font-bold text-primary">{contextualTitle}</p>
              <p className="max-w-64 truncate text-[10px] text-text-muted">{contextualDescription}</p>
            </div>
          )}
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

          {mode === 'standard' && isAdmin && (
            <button
              type="button"
              onClick={() => setShowAdminTools(true)}
              className="flex h-10 w-10 items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/10 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 md:w-auto md:px-3"
            >
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{t('dashboard.adminBoardTools')}</span>
            </button>
          )}

          {isChallengeTemplate && isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setTemplateLocked((value) => !value)}
                title={t('dashboard.lockTemplateDescription')}
                className={`flex h-10 w-10 items-center justify-center gap-2 rounded-xl border text-xs font-semibold transition-colors md:w-auto md:px-3 ${templateLocked ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-card text-text-muted hover:text-text'}`}
              >
                <Lock className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{t('dashboard.lockTemplate')}</span>
              </button>
              <button
                type="button"
                disabled={conversionBusy}
                onClick={() => fileInputRef.current?.click()}
                className="flex h-10 w-10 items-center justify-center gap-2 rounded-xl border border-border bg-card text-xs font-semibold text-text transition-colors hover:border-primary/40 hover:bg-card-hover disabled:opacity-50 md:w-auto md:px-3"
              >
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{conversionBusy ? t('dashboard.convertingImage') : t('dashboard.uploadImage')}</span>
              </button>
              <AnimatedButton
                variant="primary"
                onClick={() => void saveChallengeTemplate()}
                disabled={isSending}
                className="h-10 px-3 text-xs font-semibold glow-primary sm:px-4"
              >
                <Sparkles className="me-1.5 h-3.5 w-3.5" />
                {t('common.save')}
              </AnimatedButton>
            </>
          )}

          {isChallengeEntry && (
            <AnimatedButton
              variant="primary"
              onClick={() => setShowChallengeSubmit(true)}
              className="h-10 px-3 text-xs font-semibold glow-primary sm:px-4"
            >
              <Sparkles className="me-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('challenges.submitEntry')}</span>
              <span className="sm:hidden">{t('paint.send')}</span>
            </AnimatedButton>
          )}

          {mode === 'standard' && (
            <>
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
                className="h-10 px-3 text-xs font-semibold glow-primary sm:px-4"
              >
                <Send className="rtl-flip me-1.5 h-3.5 w-3.5" />
                {t('paint.send')}
              </AnimatedButton>
            </>
          )}
        </div>
      </header>

      {isAdmin && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void convertImage(file);
          }}
        />
      )}

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

      <AnimatePresence>
        {showChallengeSubmit && isChallengeEntry && challenge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="challenge-submit-title"
              className="surface-panel w-full max-w-md rounded-[28px] p-5 sm:p-6"
            >
              <h3 id="challenge-submit-title" className="flex items-center gap-2 text-lg font-semibold text-text">
                <Sparkles className="h-5 w-5 text-primary" />
                {t('challenges.submitEntry')}
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-muted">{t('challenges.entryFor', { title: challenge.title })}</p>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-text">{t('paint.title')}</span>
                  <input
                    value={publishTitle}
                    onChange={(event) => setPublishTitle(event.target.value)}
                    maxLength={120}
                    className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-text">{t('paint.caption')}</span>
                  <textarea
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    maxLength={2000}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </label>
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setShowChallengeSubmit(false)} disabled={isSending} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-text hover:bg-card-hover">
                  {t('common.cancel')}
                </button>
                <button type="button" onClick={() => void submitChallengeEntry()} disabled={isSending || !publishTitle.trim()} className="flex-[1.5] rounded-xl bg-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {isSending ? t('paint.sending') : t('challenges.submitEntry')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdminTools && isAdmin && mode === 'standard' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-board-tools-title"
              className="surface-panel max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-[28px] p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 id="admin-board-tools-title" className="flex items-center gap-2 text-lg font-semibold text-text">
                    <Shield className="h-5 w-5 text-primary" />
                    {t('dashboard.adminBoardTools')}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{t('dashboard.adminBoardToolsDescription')}</p>
                </div>
                <button type="button" onClick={() => setShowAdminTools(false)} className="shrink-0 rounded-full border border-border px-3 py-2 text-xs font-bold text-text-muted hover:text-text">
                  {t('common.close')}
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold text-text">{t('paint.title')}</span>
                  <input
                    value={adminTitle}
                    onChange={(event) => setAdminTitle(event.target.value)}
                    maxLength={120}
                    placeholder={t('paint.titlePlaceholder')}
                    className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold text-text">{t('paint.optionalCaption')}</span>
                  <textarea
                    value={adminCaption}
                    onChange={(event) => setAdminCaption(event.target.value)}
                    maxLength={2000}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </label>

                <button
                  type="button"
                  disabled={conversionBusy}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-xs font-bold text-text transition-colors hover:border-primary/40 disabled:opacity-50"
                >
                  <Upload size={15} />
                  {conversionBusy ? t('dashboard.convertingImage') : t('dashboard.uploadImage')}
                </button>
                <button
                  type="button"
                  disabled={isSending || !adminTitle.trim()}
                  onClick={() => void saveAdminArtwork()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-white disabled:opacity-50"
                >
                  <Sparkles size={15} />{t('common.save')}
                </button>
              </div>

              <div className="mt-6 rounded-[22px] border border-primary/15 bg-surface/70 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-text"><Send size={15} className="text-primary" />{t('dashboard.delivery')}</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <select value={adminAudience} onChange={(event) => setAdminAudience(event.target.value as typeof adminAudience)} className="h-11 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-text outline-none">
                    <option value="user">{t('dashboard.specificUser')}</option>
                    <option value="everyone">{t('dashboard.everyone')}</option>
                  </select>
                  <select value={adminIdentity} onChange={(event) => setAdminIdentity(event.target.value as typeof adminIdentity)} className="h-11 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-text outline-none">
                    <option value="admin">{t('dashboard.fromPixAnony')}</option>
                    <option value="anonymous">{t('common.anonymous')}</option>
                  </select>
                </div>

                {adminAudience === 'user' && (
                  <div className="relative mt-3">
                    <Search size={14} className="absolute start-3 top-3.5 text-text-muted" />
                    <input
                      value={adminRecipient ? `@${adminRecipient.username}` : adminRecipientSearch}
                      onChange={(event) => {
                        setAdminRecipient(null);
                        setAdminRecipientSearch(event.target.value.replace(/^@/, ''));
                      }}
                      placeholder={t('paint.searchUsers')}
                      className="h-11 w-full rounded-xl border border-border bg-card ps-9 pe-3 text-xs text-text outline-none focus:border-primary"
                    />
                    {!adminRecipient && adminRecipients.length > 0 && (
                      <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-float">
                        {adminRecipients.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setAdminRecipient(item);
                              setAdminRecipients([]);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-start hover:bg-surface"
                          >
                            <PixelAvatar username={item.username} src={item.avatar_url} size="xs" />
                            <span className="min-w-0"><strong className="block truncate text-xs text-text">{item.display_name || item.username}</strong><span className="rtl-isolate block truncate text-[10px] text-text-muted">@{item.username}</span></span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-4 text-text-muted"><Lock size={12} className="mt-0.5 shrink-0" />{t('dashboard.deliverySecurity')}</p>
                <button
                  type="button"
                  onClick={() => void deliverAdminArtwork()}
                  disabled={isSending || !adminTitle.trim() || (adminAudience === 'user' && !adminRecipient)}
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-text text-xs font-bold text-card disabled:opacity-40"
                >
                  <Send size={14} />{t('dashboard.sendArtwork')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
