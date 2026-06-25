'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { usePaintStore } from '@/stores/paint-store';
import { floodFill, drawLine, drawRectangle, drawCircle } from '@/lib/utils';
import { PAINT_TOOL_SHORTCUTS } from '@/lib/paint-shortcuts';

// ===== CONSTANTS =====
const CHECKER_LIGHT = '#2a2a3e';
const CHECKER_DARK = '#1e1e30';
const GRID_COLOR = 'rgba(255, 255, 255, 0.12)';
const GRID_COLOR_MAJOR = 'rgba(255, 255, 255, 0.25)';

export default function PaintCanvas() {
  // ===== REFS =====
  const containerRef = useRef<HTMLDivElement>(null);
  const checkerCanvasRef = useRef<HTMLCanvasElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const interactionCanvasRef = useRef<HTMLCanvasElement>(null);

  // Offscreen compositing
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  // Drawing state refs (to avoid stale closures)
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastPixelRef = useRef<{ x: number; y: number } | null>(null);
  const preDrawPixelsRef = useRef<string[] | null>(null);
  const animFrameRef = useRef<number>(0);

  // Container size
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 600 });

  // ===== STORE =====
  const {
    tool, color, gridSize, zoom, panX, panY, showGrid,
    layers, activeLayerId, symmetryMode,
    setPixels, setLayerPixels, setColor,
    setPan, pushHistory,
    setIsDrawing, setDrawStart, setTool,
  } = usePaintStore();

  // ===== COMPUTED =====
  const zoomFactor = zoom / 100;
  const cellSize = canvasSize.width / gridSize;
  const activeToolLabel = PAINT_TOOL_SHORTCUTS.find((item) => item.tool === tool)?.label ?? tool;

  // ===== ACTIVE LAYER =====
  const activeLayer = layers.find(l => l.id === activeLayerId);

  // ===== RESIZE OBSERVER =====
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const size = Math.floor(Math.min(width, height));
        setCanvasSize({ width: size, height: size });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ===== OFFSCREEN CANVAS =====
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = gridSize;
    canvas.height = gridSize;
    offscreenRef.current = canvas;
  }, [gridSize]);

  // ===== DRAW CHECKERBOARD =====
  const drawCheckerboard = useCallback(() => {
    const canvas = checkerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    const cSize = cellSize;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? CHECKER_LIGHT : CHECKER_DARK;
        ctx.fillRect(x * cSize, y * cSize, cSize, cSize);
      }
    }
  }, [canvasSize.width, canvasSize.height, gridSize, cellSize]);

  // ===== DRAW GRID =====
  const drawGrid = useCallback(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showGrid) return;

    const cSize = cellSize;

    // Draw grid lines
    for (let i = 0; i <= gridSize; i++) {
      const isMajor = i % 8 === 0 && gridSize >= 16;
      ctx.strokeStyle = isMajor ? GRID_COLOR_MAJOR : GRID_COLOR;
      ctx.lineWidth = isMajor ? 1 : 0.5;

      // Vertical
      ctx.beginPath();
      ctx.moveTo(i * cSize, 0);
      ctx.lineTo(i * cSize, gridSize * cSize);
      ctx.stroke();

      // Horizontal
      ctx.beginPath();
      ctx.moveTo(0, i * cSize);
      ctx.lineTo(gridSize * cSize, i * cSize);
      ctx.stroke();
    }
  }, [canvasSize.width, canvasSize.height, gridSize, cellSize, showGrid]);

  // ===== COMPOSITE & DRAW MAIN CANVAS =====
  const drawMain = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Disable anti-aliasing
    ctx.imageSmoothingEnabled = false;

    const cSize = cellSize;

    // Draw layers from bottom to top
    for (const layer of layers) {
      if (!layer.visible) continue;

      ctx.globalAlpha = layer.opacity;
      for (let i = 0; i < layer.pixels.length; i++) {
        const pixel = layer.pixels[i];
        if (pixel === 'transparent') continue;
        const x = (i % gridSize) * cSize;
        const y = Math.floor(i / gridSize) * cSize;
        ctx.fillStyle = pixel;
        ctx.fillRect(x, y, cSize, cSize);
      }
    }

    ctx.globalAlpha = 1;
  }, [canvasSize.width, canvasSize.height, gridSize, cellSize, layers]);

  // ===== DRAW INTERACTION OVERLAY =====
  const drawInteraction = useCallback((hoverX?: number, hoverY?: number, previewIndices?: number[]) => {
    const canvas = interactionCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cSize = cellSize;

    // Draw preview for shape tools
    if (previewIndices && previewIndices.length > 0) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = tool === 'eraser' ? 'rgba(255,255,255,0.3)' : color;
      for (const idx of previewIndices) {
        const px = (idx % gridSize) * cSize;
        const py = Math.floor(idx / gridSize) * cSize;
        ctx.fillRect(px, py, cSize, cSize);
      }
      ctx.globalAlpha = 1;
    }

    // Draw hover cursor
    if (hoverX !== undefined && hoverY !== undefined && hoverX >= 0 && hoverX < gridSize && hoverY >= 0 && hoverY < gridSize) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hoverX * cSize + 0.5, hoverY * cSize + 0.5, cSize - 1, cSize - 1);
    }
  }, [canvasSize.width, canvasSize.height, gridSize, cellSize, tool, color]);

  // ===== RENDER ALL =====
  const renderAll = useCallback(() => {
    drawCheckerboard();
    drawMain();
    drawGrid();
  }, [drawCheckerboard, drawMain, drawGrid]);

  // Re-render when dependencies change
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(renderAll);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [renderAll]);

  // ===== COORDINATE TRANSFORM =====
  const screenToGrid = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = interactionCanvasRef.current;
    if (!canvas) return { x: -1, y: -1 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;

    const cSize = cellSize;
    const gx = Math.floor(canvasX / cSize);
    const gy = Math.floor(canvasY / cSize);

    return { x: gx, y: gy };
  }, [cellSize]);

  // ===== SYMMETRY HELPER =====
  const getSymmetryIndices = useCallback((x: number, y: number): number[] => {
    const indices: number[] = [];
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return indices;

    indices.push(y * gridSize + x);

    if (symmetryMode === 'horizontal' || symmetryMode === 'both') {
      const mx = gridSize - 1 - x;
      if (mx >= 0 && mx < gridSize) indices.push(y * gridSize + mx);
    }
    if (symmetryMode === 'vertical' || symmetryMode === 'both') {
      const my = gridSize - 1 - y;
      if (my >= 0 && my < gridSize) indices.push(my * gridSize + x);
    }
    if (symmetryMode === 'both') {
      const mx = gridSize - 1 - x;
      const my = gridSize - 1 - y;
      if (mx >= 0 && mx < gridSize && my >= 0 && my < gridSize) {
        indices.push(my * gridSize + mx);
      }
    }
    return [...new Set(indices)];
  }, [gridSize, symmetryMode]);

  // ===== PAN STATE =====
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // ===== MOUSE HANDLERS =====
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = screenToGrid(e.clientX, e.clientY);

    // Right-click = eraser shortcut
    const activeTool = e.button === 2 ? 'eraser' : tool;

    if (activeTool === 'move') {
      const canvas = interactionCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      panStartRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        panX: panX,
        panY: panY,
      };
      isDrawingRef.current = true;
      setIsDrawing(true);
      return;
    }

    if (!activeLayer || activeLayer.locked) return;
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;

    isDrawingRef.current = true;
    setIsDrawing(true);
    drawStartRef.current = { x, y };
    setDrawStart({ x, y });
    lastPixelRef.current = { x, y };

    if (activeTool === 'pencil' || activeTool === 'eraser') {
      const drawColor = activeTool === 'eraser' ? 'transparent' : color;
      const indices = getSymmetryIndices(x, y);
      setPixels(activeLayerId, indices, drawColor);
    } else if (activeTool === 'fill') {
      const idx = y * gridSize + x;
      const drawColor = color;
      const newPixels = floodFill(activeLayer.pixels, gridSize, idx, drawColor);
      setLayerPixels(activeLayerId, newPixels);
      pushHistory();
      isDrawingRef.current = false;
      setIsDrawing(false);
    } else if (activeTool === 'picker') {
      const idx = y * gridSize + x;
      // Read color from composite (check layers top to bottom)
      let pickedColor: string | null = null;
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        if (!layer.visible) continue;
        const px = layer.pixels[idx];
        if (px && px !== 'transparent') {
          pickedColor = px;
          break;
        }
      }
      if (pickedColor) {
        setColor(pickedColor);
        setTool('pencil');
      }
      isDrawingRef.current = false;
      setIsDrawing(false);
    } else if (activeTool === 'line' || activeTool === 'rectangle' || activeTool === 'circle') {
      // Store pre-draw state for preview
      preDrawPixelsRef.current = [...activeLayer.pixels];
    }
  }, [
    tool, color, gridSize, activeLayer, activeLayerId, layers,
    panX, panY,
    screenToGrid, getSymmetryIndices,
    setPixels, setLayerPixels, setColor, setTool,
    pushHistory, setIsDrawing, setDrawStart,
  ]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = screenToGrid(e.clientX, e.clientY);

    const activeTool = e.buttons === 2 ? 'eraser' : tool;

    // Pan
    if (activeTool === 'move' && isDrawingRef.current && panStartRef.current) {
      const canvas = interactionCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dx = (e.clientX - rect.left) - panStartRef.current.x;
      const dy = (e.clientY - rect.top) - panStartRef.current.y;
      setPan(panStartRef.current.panX + dx, panStartRef.current.panY + dy);
      return;
    }

    // Shape preview
    if (isDrawingRef.current && drawStartRef.current && (activeTool === 'line' || activeTool === 'rectangle' || activeTool === 'circle')) {
      let previewIndices: number[] = [];
      const sx = drawStartRef.current.x;
      const sy = drawStartRef.current.y;

      if (activeTool === 'line') {
        previewIndices = drawLine(sx, sy, x, y, gridSize);
      } else if (activeTool === 'rectangle') {
        previewIndices = drawRectangle(sx, sy, x, y, gridSize);
      } else if (activeTool === 'circle') {
        const radius = Math.round(Math.sqrt((x - sx) ** 2 + (y - sy) ** 2));
        previewIndices = drawCircle(sx, sy, radius, gridSize);
      }

      drawInteraction(x, y, previewIndices);
      return;
    }

    // Hover cursor
    if (!isDrawingRef.current) {
      drawInteraction(x, y);
      return;
    }

    // Continuous drawing (pencil/eraser)
    if (!activeLayer || activeLayer.locked) return;
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;

    if (activeTool === 'pencil' || activeTool === 'eraser') {
      const drawColor = activeTool === 'eraser' ? 'transparent' : color;
      const last = lastPixelRef.current;

      if (last) {
        // Interpolate for smooth lines
        const lineIndices = drawLine(last.x, last.y, x, y, gridSize);
        const allIndices: number[] = [];
        for (const idx of lineIndices) {
          const lx = idx % gridSize;
          const ly = Math.floor(idx / gridSize);
          allIndices.push(...getSymmetryIndices(lx, ly));
        }
        setPixels(activeLayerId, [...new Set(allIndices)], drawColor);
      } else {
        const indices = getSymmetryIndices(x, y);
        setPixels(activeLayerId, indices, drawColor);
      }
      lastPixelRef.current = { x, y };
    }

    drawInteraction(x, y);
  }, [
    tool, color, gridSize, activeLayer, activeLayerId,
    screenToGrid, getSymmetryIndices,
    setPixels, setPan, drawInteraction,
  ]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;

    const activeTool = e.button === 2 ? 'eraser' : tool;
    const { x, y } = screenToGrid(e.clientX, e.clientY);

    // Finalize shape tools
    if (drawStartRef.current && activeLayer && !activeLayer.locked) {
      const sx = drawStartRef.current.x;
      const sy = drawStartRef.current.y;

      if (activeTool === 'line') {
        const indices = drawLine(sx, sy, x, y, gridSize);
        const allIndices: number[] = [];
        for (const idx of indices) {
          const lx = idx % gridSize;
          const ly = Math.floor(idx / gridSize);
          allIndices.push(...getSymmetryIndices(lx, ly));
        }
        setPixels(activeLayerId, [...new Set(allIndices)], color);
      } else if (activeTool === 'rectangle') {
        const indices = drawRectangle(sx, sy, x, y, gridSize);
        const allIndices: number[] = [];
        for (const idx of indices) {
          const lx = idx % gridSize;
          const ly = Math.floor(idx / gridSize);
          allIndices.push(...getSymmetryIndices(lx, ly));
        }
        setPixels(activeLayerId, [...new Set(allIndices)], color);
      } else if (activeTool === 'circle') {
        const radius = Math.round(Math.sqrt((x - sx) ** 2 + (y - sy) ** 2));
        const indices = drawCircle(sx, sy, radius, gridSize);
        const allIndices: number[] = [];
        for (const idx of indices) {
          const lx = idx % gridSize;
          const ly = Math.floor(idx / gridSize);
          allIndices.push(...getSymmetryIndices(lx, ly));
        }
        setPixels(activeLayerId, [...new Set(allIndices)], color);
      }
    }

    // Push history for drawing operations
    if (activeTool !== 'move' && activeTool !== 'picker' && activeTool !== 'fill') {
      pushHistory();
    }

    // Clear interaction overlay
    drawInteraction();

    isDrawingRef.current = false;
    setIsDrawing(false);
    drawStartRef.current = null;
    setDrawStart(null);
    lastPixelRef.current = null;
    preDrawPixelsRef.current = null;
    panStartRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, [
    tool, color, gridSize, activeLayer, activeLayerId,
    screenToGrid, getSymmetryIndices,
    setPixels, pushHistory, setIsDrawing, setDrawStart, drawInteraction,
  ]);

  const handlePointerLeave = useCallback(() => {
    drawInteraction();
  }, [drawInteraction]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // ===== WHEEL ZOOM =====
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const { zoom, setZoom } = usePaintStore.getState();
    const delta = e.deltaY > 0 ? -1 : 1;
    const zoomLevels = [50, 75, 100, 150, 200, 300, 400, 600, 800, 1200, 1600, 2400, 3200];
    const currentIdx = zoomLevels.findIndex(z => z >= zoom);
    const newIdx = Math.max(0, Math.min(zoomLevels.length - 1, (currentIdx === -1 ? zoomLevels.length - 1 : currentIdx) + delta));
    setZoom(zoomLevels[newIdx]);
  }, []);

  // ===== CURSOR =====
  const getCursor = () => {
    switch (tool) {
      case 'pencil': return 'crosshair';
      case 'eraser': return 'crosshair';
      case 'fill': return 'crosshair';
      case 'picker': return 'crosshair';
      case 'line': return 'crosshair';
      case 'rectangle': return 'crosshair';
      case 'circle': return 'crosshair';
      case 'move': return 'grab';
      default: return 'crosshair';
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_10%,rgba(139,92,246,.14),transparent_34rem),linear-gradient(transparent_23px,rgba(148,163,184,.045)_24px),linear-gradient(90deg,transparent_23px,rgba(148,163,184,.045)_24px),var(--bg)] bg-[length:auto,24px_24px,24px_24px,auto] p-3 sm:p-5"
    >
      <div className="pointer-events-none absolute left-4 top-4 z-20 hidden items-center gap-2 rounded-2xl border border-border/70 bg-bg/72 px-3 py-2 text-xs font-semibold text-text shadow-float backdrop-blur-xl md:flex">
        <span className="font-pixel text-primary">Board {gridSize} x {gridSize}</span>
        <span className="h-1 w-1 rounded-full bg-text-muted/50" />
        <span className="text-text-muted">{activeToolLabel}</span>
      </div>
      <div
        className="relative overflow-hidden rounded-[28px] border border-border/80 bg-[#080d19] shadow-[0_26px_80px_rgba(0,0,0,.42),inset_0_1px_0_rgba(255,255,255,.06)]"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          transform: `scale(${zoomFactor}) translate(${panX / zoomFactor}px, ${panY / zoomFactor}px)`,
          transformOrigin: 'center center',
        }}
      >
        {/* Checkerboard Background */}
        <canvas
          ref={checkerCanvasRef}
          className="absolute inset-0 pixel-art"
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            imageRendering: 'pixelated',
          }}
        />

        {/* Main Pixel Canvas */}
        <canvas
          ref={mainCanvasRef}
          className="absolute inset-0 pixel-art"
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            imageRendering: 'pixelated',
          }}
        />

        {/* Grid Overlay */}
        <canvas
          ref={gridCanvasRef}
          className="absolute inset-0"
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            pointerEvents: 'none',
          }}
        />

        {/* Interaction Layer (hover, previews) */}
        <canvas
          ref={interactionCanvasRef}
          className="absolute inset-0"
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            cursor: getCursor(),
            touchAction: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onContextMenu={handleContextMenu}
          onWheel={handleWheel}
        />
      </div>

      {/* Zoom indicator */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 rounded-2xl border border-border/70 bg-bg/72 px-3 py-2 text-[11px] font-medium text-text-muted shadow-float backdrop-blur-xl md:block">
        <span className="text-yellow">Tip:</span> Hold mouse to draw · Right click erases · Press ? for shortcuts
      </div>
      <div className="absolute bottom-4 right-4 rounded-xl border border-border/70 bg-bg/76 px-2.5 py-1.5 font-mono text-xs text-text-muted backdrop-blur-xl">
        {zoom}%
      </div>
    </div>
  );
}
