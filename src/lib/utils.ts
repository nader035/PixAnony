import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function formatNumber(num: number, locale: 'en' | 'ar' = 'en'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}

export function formatTimeAgo(date: string, locale: 'en' | 'ar' = 'en'): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const intlLocale = locale === 'ar' ? 'ar-EG' : 'en-US';
  const relative = new Intl.RelativeTimeFormat(intlLocale, { numeric: 'auto' });

  if (diffSec < 60) return relative.format(0, 'second');
  if (diffMin < 60) return relative.format(-diffMin, 'minute');
  if (diffHour < 24) return relative.format(-diffHour, 'hour');
  if (diffDay < 7) return relative.format(-diffDay, 'day');
  return d.toLocaleDateString(intlLocale, { month: 'short', day: 'numeric' });
}

export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
}

export function createEmptyPixelArray(width: number, height: number = width): string[] {
  return new Array(width * height).fill('transparent');
}

export function pixelDataToImageData(
  pixels: string[],
  gridWidth: number,
  scale: number = 1,
  gridHeight: number = gridWidth,
): ImageData {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = gridWidth * scale;
  canvas.height = gridHeight * scale;

  for (let i = 0; i < pixels.length; i++) {
    const color = pixels[i];
    if (color === 'transparent') continue;
    const x = (i % gridWidth) * scale;
    const y = Math.floor(i / gridWidth) * scale;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, scale, scale);
  }

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function renderPixelArtToCanvas(
  ctx: CanvasRenderingContext2D,
  pixels: string[],
  gridWidth: number,
  cellSize: number,
  offsetX: number = 0,
  offsetY: number = 0
): void {
  for (let i = 0; i < pixels.length; i++) {
    const color = pixels[i];
    if (color === 'transparent') continue;
    const x = (i % gridWidth) * cellSize + offsetX;
    const y = Math.floor(i / gridWidth) * cellSize + offsetY;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, cellSize, cellSize);
  }
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function floodFill(
  pixels: string[],
  gridWidth: number,
  startIdx: number,
  fillColor: string,
  gridHeight: number = gridWidth,
): string[] {
  const newPixels = [...pixels];
  const targetColor = newPixels[startIdx];
  if (targetColor === fillColor) return newPixels;

  const stack = [startIdx];
  const visited = new Set<number>();

  while (stack.length > 0) {
    const idx = stack.pop()!;
    if (visited.has(idx)) continue;
    if (idx < 0 || idx >= newPixels.length) continue;
    if (newPixels[idx] !== targetColor) continue;

    visited.add(idx);
    newPixels[idx] = fillColor;

    const x = idx % gridWidth;
    const y = Math.floor(idx / gridWidth);

    if (x > 0) stack.push(idx - 1);
    if (x < gridWidth - 1) stack.push(idx + 1);
    if (y > 0) stack.push(idx - gridWidth);
    if (y < gridHeight - 1) stack.push(idx + gridWidth);
  }

  return newPixels;
}

export function drawLine(
  x0: number, y0: number,
  x1: number, y1: number,
  gridWidth: number,
  gridHeight: number = gridWidth,
): number[] {
  const indices: number[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let cx = x0, cy = y0;
  while (true) {
    if (cx >= 0 && cx < gridWidth && cy >= 0 && cy < gridHeight) {
      indices.push(cy * gridWidth + cx);
    }
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx) { err += dx; cy += sy; }
  }
  return indices;
}

export function drawRectangle(
  x0: number, y0: number,
  x1: number, y1: number,
  gridWidth: number,
  gridHeight: number = gridWidth,
): number[] {
  const indices: number[] = [];
  const minX = Math.max(0, Math.min(x0, x1));
  const maxX = Math.min(gridWidth - 1, Math.max(x0, x1));
  const minY = Math.max(0, Math.min(y0, y1));
  const maxY = Math.min(gridHeight - 1, Math.max(y0, y1));

  for (let x = minX; x <= maxX; x++) {
    indices.push(minY * gridWidth + x);
    indices.push(maxY * gridWidth + x);
  }
  for (let y = minY + 1; y < maxY; y++) {
    indices.push(y * gridWidth + minX);
    indices.push(y * gridWidth + maxX);
  }
  return indices;
}

export function drawCircle(
  cx: number, cy: number,
  radius: number,
  gridWidth: number,
  gridHeight: number = gridWidth,
): number[] {
  const indices: number[] = [];
  let x = radius;
  let y = 0;
  let err = 0;

  while (x >= y) {
    const points = [
      [cx + x, cy + y], [cx + y, cy + x],
      [cx - y, cy + x], [cx - x, cy + y],
      [cx - x, cy - y], [cx - y, cy - x],
      [cx + y, cy - x], [cx + x, cy - y],
    ];
    for (const [px, py] of points) {
      if (px >= 0 && px < gridWidth && py >= 0 && py < gridHeight) {
        indices.push(py * gridWidth + px);
      }
    }
    y++;
    if (err <= 0) { err += 2 * y + 1; }
    if (err > 0) { x--; err -= 2 * x + 1; }
  }
  return [...new Set(indices)];
}
