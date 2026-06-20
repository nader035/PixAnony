'use client';

import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface PixelArtRendererProps {
  pixels: string[];
  gridSize: number;
  width?: number;
  height?: number;
  className?: string;
  showCheckerboard?: boolean;
}

export function PixelArtRenderer({
  pixels,
  gridSize,
  width,
  height,
  className,
  showCheckerboard = true,
}: PixelArtRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use provided dimensions or fall back to element size
    const displayWidth = width || canvas.clientWidth || 256;
    const displayHeight = height || canvas.clientHeight || 256;

    // Set canvas resolution (use 2x for retina)
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    // Disable smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false;

    const cellWidth = displayWidth / gridSize;
    const cellHeight = displayHeight / gridSize;

    // Clear canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Draw checkerboard background
    if (showCheckerboard) {
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          ctx.fillStyle = (x + y) % 2 === 0
            ? 'rgba(128, 128, 128, 0.08)'
            : 'rgba(128, 128, 128, 0.04)';
          ctx.fillRect(
            Math.floor(x * cellWidth),
            Math.floor(y * cellHeight),
            Math.ceil(cellWidth),
            Math.ceil(cellHeight)
          );
        }
      }
    }

    // Draw pixels
    for (let i = 0; i < pixels.length; i++) {
      const color = pixels[i];
      if (color === 'transparent' || !color) continue;

      const x = i % gridSize;
      const y = Math.floor(i / gridSize);

      ctx.fillStyle = color;
      ctx.fillRect(
        Math.floor(x * cellWidth),
        Math.floor(y * cellHeight),
        Math.ceil(cellWidth),
        Math.ceil(cellHeight)
      );
    }
  }, [pixels, gridSize, width, height, showCheckerboard]);

  useEffect(() => {
    render();
  }, [render]);

  // Re-render on resize if no explicit dimensions
  useEffect(() => {
    if (width && height) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      render();
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [width, height, render]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        'pixel-art rounded-lg',
        !width && !height && 'w-full aspect-square',
        className
      )}
      style={{
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
        imageRendering: 'pixelated',
      }}
    />
  );
}
