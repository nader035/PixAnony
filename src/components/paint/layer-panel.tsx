'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Eye, EyeOff, Plus, Trash2, Lock,
  ChevronUp, ChevronDown,
} from '@/components/ui/icons';
import { usePaintStore } from '@/stores/paint-store';

export default function LayerPanel() {
  const {
    layers, activeLayerId,
    setActiveLayer, addLayer, removeLayer,
    toggleLayerVisibility, setLayerOpacity,
    renameLayer, reorderLayers,
  } = usePaintStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleStartRename = useCallback((layerId: string, currentName: string) => {
    setEditingId(layerId);
    setEditName(currentName);
  }, []);

  const handleFinishRename = useCallback(() => {
    if (editingId && editName.trim()) {
      renameLayer(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  }, [editingId, editName, renameLayer]);

  const handleDelete = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || layer.locked) return;

    // Check if layer has any non-transparent pixels
    const hasContent = layer.pixels.some(p => p !== 'transparent');
    if (hasContent) {
      setConfirmDeleteId(layerId);
    } else {
      removeLayer(layerId);
    }
  }, [layers, removeLayer]);

  const confirmDelete = useCallback(() => {
    if (confirmDeleteId) {
      removeLayer(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  }, [confirmDeleteId, removeLayer]);

  const handleMoveUp = useCallback((index: number) => {
    if (index < layers.length - 1) {
      reorderLayers(index, index + 1);
    }
  }, [layers.length, reorderLayers]);

  const handleMoveDown = useCallback((index: number) => {
    if (index > 0) {
      reorderLayers(index, index - 1);
    }
  }, [reorderLayers]);

  // Count non-transparent pixels for layer thumbnail preview
  const getLayerPixelCount = (pixels: string[]): number => {
    return pixels.filter(p => p !== 'transparent').length;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="editor-panel flex flex-col gap-2 rounded-2xl border border-border/80 bg-surface/95 p-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase text-text-muted">
          Layers
        </span>
        <button
          onClick={addLayer}
          className="rounded-lg p-1 text-text-muted transition-colors hover:bg-card-hover hover:text-primary"
          title="Add Layer"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Layer List (top = front) */}
      <div className="flex flex-col gap-1 max-h-[280px] overflow-y-auto hide-scrollbar">
        {[...layers].reverse().map((layer, reversedIndex) => {
          const index = layers.length - 1 - reversedIndex;
          const isActive = layer.id === activeLayerId;
          const pixelCount = getLayerPixelCount(layer.pixels);

          return (
            <motion.div
              key={layer.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={`
                flex cursor-pointer items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs transition-all
                ${isActive
                  ? 'border border-primary/35 bg-primary/15'
                  : 'border border-border/45 bg-card/50 hover:border-primary/25 hover:bg-card-hover'
                }
              `}
              onClick={() => setActiveLayer(layer.id)}
            >
              {/* Reorder grip */}
              <div className="flex flex-col gap-0">
                <button
                  onClick={(e) => { e.stopPropagation(); handleMoveUp(index); }}
                  className="p-0 hover:text-primary text-text-muted/40 transition-colors"
                  disabled={index >= layers.length - 1}
                >
                  <ChevronUp size={10} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleMoveDown(index); }}
                  className="p-0 hover:text-primary text-text-muted/40 transition-colors"
                  disabled={index <= 0}
                >
                  <ChevronDown size={10} />
                </button>
              </div>

              {/* Visibility */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerVisibility(layer.id);
                }}
                className={`p-0.5 rounded transition-colors ${
                  layer.visible
                    ? 'text-text-muted hover:text-text'
                    : 'text-text-muted/30 hover:text-text-muted'
                }`}
              >
                {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>

              {/* Name / Rename */}
              <div className="flex-1 min-w-0">
                {editingId === layer.id ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleFinishRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename();
                      if (e.key === 'Escape') { setEditingId(null); setEditName(''); }
                    }}
                    className="w-full rounded-lg border border-primary bg-card px-1 py-0.5 text-[11px]
                               text-text focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className={`block truncate text-[11px] font-medium ${
                      isActive ? 'text-text' : 'text-text-muted'
                    }`}
                    onDoubleClick={() => handleStartRename(layer.id, layer.name)}
                  >
                    {layer.name}
                  </span>
                )}
                {!editingId && (
                  <span className="text-[9px] text-text-muted/60">
                    {pixelCount > 0 ? `${pixelCount} px` : 'empty'}
                  </span>
                )}
              </div>

              {/* Opacity */}
              <div className="flex items-center gap-1 w-14 flex-shrink-0">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(layer.opacity * 100)}
                  onChange={(e) => {
                    e.stopPropagation();
                    setLayerOpacity(layer.id, Number(e.target.value) / 100);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-1 accent-primary cursor-pointer"
                  title={`Opacity: ${Math.round(layer.opacity * 100)}%`}
                />
              </div>

              {/* Lock / Delete */}
              {layer.locked ? (
                <Lock size={11} className="text-text-muted/40 flex-shrink-0" />
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(layer.id);
                  }}
                  className="p-0.5 rounded text-text-muted/40 hover:text-red transition-colors flex-shrink-0"
                  title="Delete Layer"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Confirm Delete Dialog */}
      {confirmDeleteId && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-red/30 bg-card p-2"
        >
          <p className="text-[10px] text-text-muted mb-2">
            This layer has content. Delete anyway?
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={confirmDelete}
              className="flex-1 px-2 py-1 text-[10px] font-medium bg-red/20 text-red
                         rounded-lg hover:bg-red/30 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="flex-1 px-2 py-1 text-[10px] font-medium bg-card-hover text-text-muted
                         rounded-lg hover:text-text transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
