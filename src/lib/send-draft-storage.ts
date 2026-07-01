import type { GridSize, PixelLayer } from '@/lib/types';

const SEND_DRAFT_KEY_PREFIX = 'pixanony:send-draft:';
export const SEND_DRAFT_VERSION = 1;

export type SendMode = 'anonymous' | 'signed';

export interface SendDraftCanvasState {
  gridSize: GridSize;
  pixelData: string[];
  layers: PixelLayer[];
  activeLayerId: string;
  color: string;
  recentColors: string[];
  activePalette: string;
  symmetryMode: 'off' | 'horizontal' | 'vertical' | 'both';
  showGrid: boolean;
  showPreview: boolean;
}

export interface SendDraft {
  version: number;
  recipientUsername: string;
  canvas: SendDraftCanvasState;
  caption: string;
  sendMode: SendMode;
  timestamp: number;
}

export type SendDraftInput = Omit<SendDraft, 'timestamp' | 'version'> & {
  timestamp?: number;
  version?: number;
};

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function normalizeSendDraftRecipient(recipientUsername: string) {
  return decodeURIComponent(recipientUsername).replace(/^@/, '').trim().toLowerCase();
}

export function getSendDraftKey(recipientUsername: string) {
  return `${SEND_DRAFT_KEY_PREFIX}${normalizeSendDraftRecipient(recipientUsername)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isGridSize(value: unknown): value is GridSize {
  return value === 8 || value === 16 || value === 32 || value === 64 || value === 128;
}

function isSymmetryMode(value: unknown): value is SendDraftCanvasState['symmetryMode'] {
  return value === 'off' || value === 'horizontal' || value === 'vertical' || value === 'both';
}

function sanitizePixels(value: unknown, expectedLength: number) {
  if (!Array.isArray(value) || value.length !== expectedLength) return null;
  return value.map((pixel) => (typeof pixel === 'string' && pixel ? pixel : 'transparent'));
}

function createDraftLayerId() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function sanitizeLayers(value: unknown, gridSize: GridSize) {
  if (!Array.isArray(value)) return null;

  const expectedLength = gridSize * gridSize;
  const layers = value
    .map((layer): PixelLayer | null => {
      if (!isRecord(layer)) return null;

      const pixels = sanitizePixels(layer.pixels, expectedLength);
      if (!pixels) return null;

      return {
        id: typeof layer.id === 'string' && layer.id ? layer.id : createDraftLayerId(),
        name: typeof layer.name === 'string' && layer.name ? layer.name : 'Layer',
        visible: typeof layer.visible === 'boolean' ? layer.visible : true,
        opacity: typeof layer.opacity === 'number' ? Math.max(0, Math.min(1, layer.opacity)) : 1,
        locked: typeof layer.locked === 'boolean' ? layer.locked : false,
        pixels,
      };
    })
    .filter((layer): layer is PixelLayer => Boolean(layer));

  return layers.length > 0 ? layers : null;
}

function compositePixelData(layers: PixelLayer[], gridSize: GridSize) {
  const pixels = Array(gridSize * gridSize).fill('transparent');
  for (const layer of layers) {
    if (!layer.visible) continue;
    for (let i = 0; i < layer.pixels.length; i++) {
      const pixelColor = layer.pixels[i];
      if (pixelColor && pixelColor !== 'transparent') pixels[i] = pixelColor;
    }
  }
  return pixels;
}

function sanitizeDraft(value: unknown, recipientUsername: string): SendDraft | null {
  if (!isRecord(value)) return null;

  const canvas = value.canvas;
  if (!isRecord(canvas)) return null;

  const normalizedRecipient = normalizeSendDraftRecipient(recipientUsername);
  const storedRecipient = typeof value.recipientUsername === 'string'
    ? normalizeSendDraftRecipient(value.recipientUsername)
    : normalizedRecipient;

  if (storedRecipient !== normalizedRecipient) return null;

  const gridSize = canvas.gridSize;
  if (!isGridSize(gridSize)) return null;

  const layers = sanitizeLayers(canvas.layers, gridSize);
  if (!layers) return null;

  const expectedLength = gridSize * gridSize;
  const storedPixelData = sanitizePixels(canvas.pixelData, expectedLength);
  const activeLayerId = typeof canvas.activeLayerId === 'string'
    && layers.some((layer) => layer.id === canvas.activeLayerId)
    ? canvas.activeLayerId
    : layers.find((layer) => !layer.locked)?.id ?? layers[0].id;

  const color = typeof canvas.color === 'string' && canvas.color
    ? canvas.color
    : '#8B5CF6';
  const recentColors = Array.isArray(canvas.recentColors)
    ? canvas.recentColors.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : [];

  const sendMode = value.sendMode === 'signed' ? 'signed' : 'anonymous';

  return {
    version: typeof value.version === 'number' ? value.version : SEND_DRAFT_VERSION,
    recipientUsername: normalizedRecipient,
    canvas: {
      gridSize,
      pixelData: storedPixelData ?? compositePixelData(layers, gridSize),
      layers,
      activeLayerId,
      color,
      recentColors: recentColors.length ? recentColors : [color],
      activePalette: typeof canvas.activePalette === 'string' ? canvas.activePalette : 'Neon',
      symmetryMode: isSymmetryMode(canvas.symmetryMode) ? canvas.symmetryMode : 'off',
      showGrid: typeof canvas.showGrid === 'boolean' ? canvas.showGrid : true,
      showPreview: typeof canvas.showPreview === 'boolean' ? canvas.showPreview : true,
    },
    caption: typeof value.caption === 'string' ? value.caption : '',
    sendMode,
    timestamp: typeof value.timestamp === 'number' ? value.timestamp : Date.now(),
  };
}

export function saveSendDraft(recipientUsername: string, draft: SendDraftInput) {
  if (!canUseLocalStorage()) return null;

  const normalizedRecipient = normalizeSendDraftRecipient(recipientUsername);
  const savedDraft: SendDraft = {
    ...draft,
    version: SEND_DRAFT_VERSION,
    recipientUsername: normalizedRecipient,
    timestamp: draft.timestamp ?? Date.now(),
  };

  try {
    window.localStorage.setItem(getSendDraftKey(normalizedRecipient), JSON.stringify(savedDraft));
    return savedDraft;
  } catch {
    return null;
  }
}

export function loadSendDraft(recipientUsername: string) {
  if (!canUseLocalStorage()) return null;

  const key = getSendDraftKey(recipientUsername);
  try {
    const rawDraft = window.localStorage.getItem(key);
    if (!rawDraft) return null;

    const draft = sanitizeDraft(JSON.parse(rawDraft), recipientUsername);
    if (!draft) {
      window.localStorage.removeItem(key);
      return null;
    }

    return draft;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function clearSendDraft(recipientUsername: string) {
  if (!canUseLocalStorage()) return;

  try {
    window.localStorage.removeItem(getSendDraftKey(recipientUsername));
  } catch {
    // Ignore storage failures; clearing is best-effort client state cleanup.
  }
}

export function hasSendDraft(recipientUsername: string) {
  return loadSendDraft(recipientUsername) !== null;
}

export function sendDraftHasArtwork(draft: SendDraft) {
  return draft.canvas.layers.some((layer) =>
    layer.pixels.some((pixel) => pixel && pixel !== 'transparent')
  );
}

export function hasMeaningfulSendDraft(draft: SendDraft) {
  return sendDraftHasArtwork(draft) || draft.caption.trim().length > 0 || draft.sendMode === 'signed';
}

export function getSendDraftContentSignature(draft: SendDraft) {
  return JSON.stringify({
    recipientUsername: draft.recipientUsername,
    canvas: draft.canvas,
    caption: draft.caption,
    sendMode: draft.sendMode,
    version: SEND_DRAFT_VERSION,
  });
}
