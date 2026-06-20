'use client';

import { create } from 'zustand';
import type { PaintTool, GridSize, PixelLayer } from '@/lib/types';
import { generateId, createEmptyPixelArray } from '@/lib/utils';

// ===== CONSTANTS =====
const MAX_HISTORY = 50;
const MAX_RECENT_COLORS = 12;
const DEFAULT_GRID_SIZE: GridSize = 16;
const DEFAULT_COLOR = '#8B5CF6';
const DEFAULT_ZOOM = 100;

// ===== STORE TYPES =====
export interface PaintStoreState {
  // Tool & Drawing
  tool: PaintTool;
  color: string;
  gridSize: GridSize;

  // Viewport
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  showPreview: boolean;

  // Layers
  layers: PixelLayer[];
  activeLayerId: string;

  // History (stores snapshots of layers)
  history: PixelLayer[][];
  historyIndex: number;

  // Colors
  recentColors: string[];
  activePalette: string;

  // Symmetry
  symmetryMode: 'off' | 'horizontal' | 'vertical' | 'both';

  // Drawing state (transient, not in history)
  isDrawing: boolean;
  drawStart: { x: number; y: number } | null;
}

export interface PaintStoreActions {
  // Tool
  setTool: (tool: PaintTool) => void;
  setColor: (color: string) => void;

  // Grid
  setGridSize: (size: GridSize) => void;

  // Viewport
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  togglePreview: () => void;

  // Drawing
  setPixel: (layerId: string, index: number, color: string) => void;
  setPixels: (layerId: string, indices: number[], color: string) => void;
  setLayerPixels: (layerId: string, pixels: string[]) => void;

  // Layers
  addLayer: () => void;
  removeLayer: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  renameLayer: (layerId: string, name: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  setActiveLayer: (layerId: string) => void;

  // History
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  // Transform
  clearCanvas: () => void;
  flipHorizontal: () => void;
  flipVertical: () => void;

  // Symmetry
  setSymmetryMode: (mode: 'off' | 'horizontal' | 'vertical' | 'both') => void;

  // Colors
  addRecentColor: (color: string) => void;
  setActivePalette: (palette: string) => void;

  // State
  resetState: () => void;
  initializeCanvas: (gridSize?: GridSize) => void;

  // Drawing state
  setIsDrawing: (drawing: boolean) => void;
  setDrawStart: (point: { x: number; y: number } | null) => void;
}

export type PaintStore = PaintStoreState & PaintStoreActions;

// ===== HELPERS =====
function createDefaultLayer(gridSize: number, name: string, locked = false): PixelLayer {
  return {
    id: generateId(),
    name,
    visible: true,
    opacity: 1,
    locked,
    pixels: createEmptyPixelArray(gridSize),
  };
}

function cloneLayers(layers: PixelLayer[]): PixelLayer[] {
  return layers.map(l => ({
    ...l,
    pixels: [...l.pixels],
  }));
}

function createInitialLayers(gridSize: number): PixelLayer[] {
  const bg = createDefaultLayer(gridSize, 'Background', true);
  const layer1 = createDefaultLayer(gridSize, 'Layer 1');
  return [bg, layer1];
}

// ===== STORE =====
export const usePaintStore = create<PaintStore>((set, get) => {
  const initialLayers = createInitialLayers(DEFAULT_GRID_SIZE);

  return {
    // ===== STATE =====
    tool: 'pencil',
    color: DEFAULT_COLOR,
    gridSize: DEFAULT_GRID_SIZE,
    zoom: DEFAULT_ZOOM,
    panX: 0,
    panY: 0,
    showGrid: true,
    showPreview: true,
    layers: initialLayers,
    activeLayerId: initialLayers[1].id,
    history: [cloneLayers(initialLayers)],
    historyIndex: 0,
    recentColors: [DEFAULT_COLOR],
    activePalette: 'Neon',
    symmetryMode: 'off',
    isDrawing: false,
    drawStart: null,

    // ===== TOOL =====
    setTool: (tool) => set({ tool }),

    setColor: (color) => {
      set({ color });
      get().addRecentColor(color);
    },

    // ===== GRID =====
    setGridSize: (gridSize) => {
      const layers = createInitialLayers(gridSize);
      set({
        gridSize,
        layers,
        activeLayerId: layers[1].id,
        history: [cloneLayers(layers)],
        historyIndex: 0,
        zoom: gridSize <= 16 ? 100 : gridSize <= 32 ? 100 : 100,
        panX: 0,
        panY: 0,
      });
    },

    // ===== VIEWPORT =====
    setZoom: (zoom) => {
      const clamped = Math.max(50, Math.min(3200, zoom));
      set({ zoom: clamped });
    },

    setPan: (x, y) => set({ panX: x, panY: y }),

    toggleGrid: () => set(s => ({ showGrid: !s.showGrid })),

    togglePreview: () => set(s => ({ showPreview: !s.showPreview })),

    // ===== DRAWING =====
    setPixel: (layerId, index, color) => {
      set(state => {
        const layers = state.layers.map(l => {
          if (l.id !== layerId) return l;
          const pixels = [...l.pixels];
          if (index >= 0 && index < pixels.length) {
            pixels[index] = color;
          }
          return { ...l, pixels };
        });
        return { layers };
      });
    },

    setPixels: (layerId, indices, color) => {
      set(state => {
        const layers = state.layers.map(l => {
          if (l.id !== layerId) return l;
          const pixels = [...l.pixels];
          for (const idx of indices) {
            if (idx >= 0 && idx < pixels.length) {
              pixels[idx] = color;
            }
          }
          return { ...l, pixels };
        });
        return { layers };
      });
    },

    setLayerPixels: (layerId, pixels) => {
      set(state => ({
        layers: state.layers.map(l =>
          l.id === layerId ? { ...l, pixels: [...pixels] } : l
        ),
      }));
    },

    // ===== LAYERS =====
    addLayer: () => {
      const { gridSize, layers } = get();
      const layerNum = layers.filter(l => !l.locked).length + 1;
      const newLayer = createDefaultLayer(gridSize, `Layer ${layerNum}`);
      set({
        layers: [...layers, newLayer],
        activeLayerId: newLayer.id,
      });
      get().pushHistory();
    },

    removeLayer: (layerId) => {
      const { layers } = get();
      const layer = layers.find(l => l.id === layerId);
      if (!layer || layer.locked) return;
      if (layers.filter(l => !l.locked).length <= 1) return;

      const newLayers = layers.filter(l => l.id !== layerId);
      const { activeLayerId } = get();
      const newActiveId = activeLayerId === layerId
        ? (newLayers.find(l => !l.locked)?.id ?? newLayers[0].id)
        : activeLayerId;

      set({ layers: newLayers, activeLayerId: newActiveId });
      get().pushHistory();
    },

    toggleLayerVisibility: (layerId) => {
      set(state => ({
        layers: state.layers.map(l =>
          l.id === layerId ? { ...l, visible: !l.visible } : l
        ),
      }));
    },

    setLayerOpacity: (layerId, opacity) => {
      set(state => ({
        layers: state.layers.map(l =>
          l.id === layerId ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) } : l
        ),
      }));
    },

    renameLayer: (layerId, name) => {
      set(state => ({
        layers: state.layers.map(l =>
          l.id === layerId ? { ...l, name } : l
        ),
      }));
    },

    reorderLayers: (fromIndex, toIndex) => {
      set(state => {
        const layers = [...state.layers];
        const [moved] = layers.splice(fromIndex, 1);
        layers.splice(toIndex, 0, moved);
        return { layers };
      });
    },

    setActiveLayer: (layerId) => set({ activeLayerId: layerId }),

    // ===== HISTORY =====
    undo: () => {
      const { historyIndex, history } = get();
      if (historyIndex <= 0) return;
      const newIndex = historyIndex - 1;
      const snapshot = cloneLayers(history[newIndex]);
      const activeLayer = snapshot.find(l => l.id === get().activeLayerId)
        ?? snapshot.find(l => !l.locked)
        ?? snapshot[0];
      set({
        historyIndex: newIndex,
        layers: snapshot,
        activeLayerId: activeLayer.id,
      });
    },

    redo: () => {
      const { historyIndex, history } = get();
      if (historyIndex >= history.length - 1) return;
      const newIndex = historyIndex + 1;
      const snapshot = cloneLayers(history[newIndex]);
      const activeLayer = snapshot.find(l => l.id === get().activeLayerId)
        ?? snapshot.find(l => !l.locked)
        ?? snapshot[0];
      set({
        historyIndex: newIndex,
        layers: snapshot,
        activeLayerId: activeLayer.id,
      });
    },

    pushHistory: () => {
      const { layers, history, historyIndex } = get();
      // Truncate any future history after current index
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(cloneLayers(layers));
      // Cap at MAX_HISTORY
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    },

    // ===== TRANSFORMS =====
    clearCanvas: () => {
      const { layers, gridSize } = get();
      set({
        layers: layers.map(l =>
          l.locked
            ? l
            : { ...l, pixels: createEmptyPixelArray(gridSize) }
        ),
      });
      get().pushHistory();
    },

    flipHorizontal: () => {
      const { layers, gridSize } = get();
      set({
        layers: layers.map(l => {
          const newPixels = [...l.pixels];
          for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < Math.floor(gridSize / 2); x++) {
              const left = y * gridSize + x;
              const right = y * gridSize + (gridSize - 1 - x);
              [newPixels[left], newPixels[right]] = [newPixels[right], newPixels[left]];
            }
          }
          return { ...l, pixels: newPixels };
        }),
      });
      get().pushHistory();
    },

    flipVertical: () => {
      const { layers, gridSize } = get();
      set({
        layers: layers.map(l => {
          const newPixels = [...l.pixels];
          for (let y = 0; y < Math.floor(gridSize / 2); y++) {
            for (let x = 0; x < gridSize; x++) {
              const top = y * gridSize + x;
              const bottom = (gridSize - 1 - y) * gridSize + x;
              [newPixels[top], newPixels[bottom]] = [newPixels[bottom], newPixels[top]];
            }
          }
          return { ...l, pixels: newPixels };
        }),
      });
      get().pushHistory();
    },

    // ===== SYMMETRY =====
    setSymmetryMode: (mode) => set({ symmetryMode: mode }),

    // ===== COLORS =====
    addRecentColor: (color) => {
      if (color === 'transparent') return;
      set(state => {
        const filtered = state.recentColors.filter(c => c !== color);
        return {
          recentColors: [color, ...filtered].slice(0, MAX_RECENT_COLORS),
        };
      });
    },

    setActivePalette: (palette) => set({ activePalette: palette }),

    // ===== RESET =====
    resetState: () => {
      const layers = createInitialLayers(DEFAULT_GRID_SIZE);
      set({
        tool: 'pencil',
        color: DEFAULT_COLOR,
        gridSize: DEFAULT_GRID_SIZE,
        zoom: DEFAULT_ZOOM,
        panX: 0,
        panY: 0,
        showGrid: true,
        showPreview: true,
        layers,
        activeLayerId: layers[1].id,
        history: [cloneLayers(layers)],
        historyIndex: 0,
        recentColors: [DEFAULT_COLOR],
        activePalette: 'Neon',
        symmetryMode: 'off',
        isDrawing: false,
        drawStart: null,
      });
    },

    initializeCanvas: (gridSize) => {
      const size = gridSize ?? get().gridSize;
      const layers = createInitialLayers(size);
      set({
        gridSize: size,
        layers,
        activeLayerId: layers[1].id,
        history: [cloneLayers(layers)],
        historyIndex: 0,
        panX: 0,
        panY: 0,
      });
    },

    // ===== DRAWING STATE =====
    setIsDrawing: (drawing) => set({ isDrawing: drawing }),
    setDrawStart: (point) => set({ drawStart: point }),
  };
});
