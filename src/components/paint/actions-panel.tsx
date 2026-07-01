'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Undo2, Redo2, Trash2, FlipHorizontal, FlipVertical,
  Download, Copy, Image as ImageIcon
} from '@/components/ui/icons';
import { usePaintStore } from '@/stores/paint-store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ActionsPanelProps {
  compact?: boolean;
  onClearCanvas?: () => void;
}

export default function ActionsPanel({ compact = false, onClearCanvas }: ActionsPanelProps) {
  const {
    undo, redo, clearCanvas, flipHorizontal, flipVertical,
    symmetryMode, setSymmetryMode,
    historyIndex, history,
    layers, gridSize,
  } = usePaintStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const handleClearCanvas = onClearCanvas ?? clearCanvas;

  // ===== EXPORT PNG =====
  const exportPNG = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = gridSize;
    canvas.height = gridSize;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Composite all visible layers
    for (const layer of layers) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity;
      for (let i = 0; i < layer.pixels.length; i++) {
        const pixel = layer.pixels[i];
        if (pixel === 'transparent') continue;
        const x = i % gridSize;
        const y = Math.floor(i / gridSize);
        ctx.fillStyle = pixel;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pixanony-${gridSize}x${gridSize}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PNG downloaded!');
    }, 'image/png');
  }, [layers, gridSize]);

  // ===== EXPORT SVG =====
  const exportSVG = useCallback(() => {
    let rects = '';
    for (const layer of layers) {
      if (!layer.visible) continue;
      for (let i = 0; i < layer.pixels.length; i++) {
        const pixel = layer.pixels[i];
        if (pixel === 'transparent') continue;
        const x = i % gridSize;
        const y = Math.floor(i / gridSize);
        const opacity = layer.opacity < 1 ? ` opacity="${layer.opacity}"` : '';
        rects += `  <rect x="${x}" y="${y}" width="1" height="1" fill="${pixel}"${opacity}/>\n`;
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gridSize} ${gridSize}" shape-rendering="crispEdges">\n${rects}</svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixanony-${gridSize}x${gridSize}-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('SVG downloaded!');
  }, [layers, gridSize]);

  // ===== COPY TO CLIPBOARD =====
  const copyImage = useCallback(async () => {
    const canvas = document.createElement('canvas');
    // Export at higher resolution for clipboard
    const scale = Math.max(1, Math.floor(512 / gridSize));
    canvas.width = gridSize * scale;
    canvas.height = gridSize * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    for (const layer of layers) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity;
      for (let i = 0; i < layer.pixels.length; i++) {
        const pixel = layer.pixels[i];
        if (pixel === 'transparent') continue;
        const x = (i % gridSize) * scale;
        const y = Math.floor(i / gridSize) * scale;
        ctx.fillStyle = pixel;
        ctx.fillRect(x, y, scale, scale);
      }
    }

    try {
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/png')
      );
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      toast.success('Image copied to clipboard!');
    } catch {
      toast.error('Failed to copy image');
    }
  }, [layers, gridSize]);

  // ===== SYMMETRY OPTIONS =====
  const symmetryOptions: { mode: typeof symmetryMode; label: string }[] = [
    { mode: 'off', label: 'Off' },
    { mode: 'horizontal', label: 'H' },
    { mode: 'vertical', label: 'V' },
    { mode: 'both', label: 'Both' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className={cn(
        'editor-panel border border-border/80 bg-surface/95',
        compact ? 'flex gap-1 rounded-2xl p-1.5' : 'flex flex-col gap-3 rounded-2xl p-3'
      )}
    >
      {/* Header */}
      <div className={cn('text-[10px] font-semibold text-text-muted uppercase tracking-wider', compact && 'hidden')}>
        Actions
      </div>

      {/* Undo / Redo */}
      <div className="flex gap-1.5">
        <button
          onClick={undo}
          disabled={!canUndo}
          aria-label="Undo"
          className={`flex-1 flex items-center justify-center gap-1.5 ${compact ? 'h-10 w-10 px-0' : 'px-2 py-1.5'} text-[10px] font-medium
                     rounded-xl border transition-colors
                     ${canUndo
                       ? 'bg-card border-border text-text-muted hover:text-text hover:bg-card-hover'
                       : 'bg-card/50 border-border/50 text-text-muted/30 cursor-not-allowed'
                     }`}
        >
          <Undo2 size={14} /> <span className={compact ? 'sr-only' : ''}>Undo</span>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          aria-label="Redo"
          className={`flex-1 flex items-center justify-center gap-1.5 ${compact ? 'h-10 w-10 px-0' : 'px-2 py-1.5'} text-[10px] font-medium
                     rounded-xl border transition-colors
                     ${canRedo
                       ? 'bg-card border-border text-text-muted hover:text-text hover:bg-card-hover'
                       : 'bg-card/50 border-border/50 text-text-muted/30 cursor-not-allowed'
                     }`}
        >
          <Redo2 size={14} /> <span className={compact ? 'sr-only' : ''}>Redo</span>
        </button>
      </div>

      {/* Transform */}
      <div className={cn('flex gap-1.5', compact && 'hidden')}>
        <button
          onClick={flipHorizontal}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium
                     bg-card border border-border rounded-xl text-text-muted
                     hover:text-text hover:bg-card-hover transition-colors"
          title="Flip Horizontal"
        >
          <FlipHorizontal size={12} /> Flip X
        </button>
        <button
          onClick={flipVertical}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium
                     bg-card border border-border rounded-xl text-text-muted
                     hover:text-text hover:bg-card-hover transition-colors"
          title="Flip Vertical"
        >
          <FlipVertical size={12} /> Flip Y
        </button>
      </div>

      {/* Clear */}
      <button
        onClick={handleClearCanvas}
        className={cn(
          'flex items-center justify-center gap-1.5 rounded-xl border border-red/20 bg-red/10 px-2 py-1.5 text-[10px] font-medium text-red transition-colors hover:bg-red/20',
          compact && 'hidden'
        )}
      >
        <Trash2 size={12} /> Clear Board
      </button>

      {/* Symmetry */}
      <div className={compact ? 'hidden' : ''}>
        <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
          Symmetry
        </div>
        <div className="flex gap-1">
          {symmetryOptions.map(opt => (
            <button
              key={opt.mode}
              onClick={() => setSymmetryMode(opt.mode)}
              className={`flex-1 rounded-xl border px-1.5 py-1 text-[9px] font-medium transition-all
                ${symmetryMode === opt.mode
                  ? 'bg-primary/20 border-primary/30 text-primary'
                  : 'bg-card border-border text-text-muted hover:text-text hover:bg-card-hover'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Export */}
      <div className={compact ? 'hidden' : ''}>
        <div className="text-[9px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
          Export
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={exportPNG}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-medium
                       bg-card border border-border rounded-xl text-text-muted
                       hover:text-text hover:bg-card-hover transition-colors"
          >
            <Download size={11} /> Download PNG
          </button>
          <button
            onClick={exportSVG}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-medium
                       bg-card border border-border rounded-xl text-text-muted
                       hover:text-text hover:bg-card-hover transition-colors"
          >
            <ImageIcon size={11} /> Download SVG
          </button>
          <button
            onClick={copyImage}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-medium
                       bg-card border border-border rounded-xl text-text-muted
                       hover:text-text hover:bg-card-hover transition-colors"
          >
            <Copy size={11} /> Copy Image
          </button>
        </div>
      </div>
    </motion.div>
  );
}
