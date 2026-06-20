'use client';

import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2 } from '@/components/ui/icons';
import { usePaintStore } from '@/stores/paint-store';
import { useState } from 'react';

export default function PreviewPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { layers, gridSize, showPreview } = usePaintStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ===== RENDER PREVIEW =====
  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to exact grid resolution
    canvas.width = gridSize;
    canvas.height = gridSize;
    ctx.clearRect(0, 0, gridSize, gridSize);
    ctx.imageSmoothingEnabled = false;

    // Draw checkerboard at pixel level
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#2a2a3e' : '#1e1e30';
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Composite layers
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

    ctx.globalAlpha = 1;
  }, [layers, gridSize]);

  // Re-render when layers change
  useEffect(() => {
    if (!showPreview) return;
    const frame = requestAnimationFrame(renderPreview);
    return () => cancelAnimationFrame(frame);
  }, [renderPreview, showPreview]);

  if (!showPreview) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="flex flex-col gap-2 p-3 bg-surface rounded-xl border border-border"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
          Preview
        </span>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1 rounded-md hover:bg-card-hover text-text-muted hover:text-text transition-colors"
          title={isFullscreen ? 'Minimize' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>
      </div>

      {/* Preview Canvas */}
      <div
        className={`
          relative mx-auto border border-border rounded-lg overflow-hidden bg-card
          ${isFullscreen ? 'w-full aspect-square' : 'w-full max-w-[140px] aspect-square'}
        `}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full pixel-art"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Info */}
      <div className="text-center text-[9px] text-text-muted/60 font-mono">
        {gridSize}×{gridSize} px
      </div>
    </motion.div>
  );
}
