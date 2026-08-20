'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PixelArtRendererProps {
  pixels: string[];
  gridSize: number;
  gridWidth?: number;
  gridHeight?: number;
  width?: number;
  height?: number;
  className?: string;
  canvasClassName?: string;
  showCheckerboard?: boolean;
  ariaLabel?: string;
}

export function PixelArtRenderer({
  pixels,
  gridSize,
  gridWidth,
  gridHeight,
  width,
  height,
  className,
  canvasClassName,
  showCheckerboard = true,
  ariaLabel = 'Pixel artwork',
}: PixelArtRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const columns = Math.max(1, Math.floor(gridWidth ?? gridSize));
  const rows = Math.max(1, Math.floor(gridHeight ?? gridSize));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // The backing canvas always matches the source grid exactly. CSS scales the
    // complete bitmap with object-fit: contain, so rows and columns can never be
    // resized independently by a rectangular card or preview frame.
    canvas.width = columns;
    canvas.height = rows;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, columns, rows);

    if (showCheckerboard) {
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < columns; x += 1) {
          ctx.fillStyle = (x + y) % 2 === 0
            ? 'rgba(128, 128, 128, 0.08)'
            : 'rgba(128, 128, 128, 0.04)';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    const pixelCount = Math.min(pixels.length, columns * rows);
    for (let i = 0; i < pixelCount; i += 1) {
      const color = pixels[i];
      if (color === 'transparent' || !color) continue;

      const x = i % columns;
      const y = Math.floor(i / columns);

      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }, [columns, pixels, rows, showCheckerboard]);

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-lg',
        !width && !height && 'w-full',
        className
      )}
      style={{
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
        aspectRatio: !width && !height ? `${columns} / ${rows}` : undefined,
      }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ariaLabel}
        className={cn('pixel-art h-full w-full object-contain', canvasClassName)}
        style={{
          objectFit: 'contain',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
}
