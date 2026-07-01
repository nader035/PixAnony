'use client';

import { useMemo, useState } from 'react';
import { Eraser, Save } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const GRID_SIZE = 8;
const DEFAULT_COLORS = ['#181528', '#7c3aed', '#db2777', '#0891b2', '#059669', '#f59e0b', '#f8fafc', 'transparent'];

function seedPixels(username: string) {
  const pixels = Array(GRID_SIZE * GRID_SIZE).fill('transparent');
  let hash = 0;
  for (const char of username || 'pixanony') hash = char.charCodeAt(0) + ((hash << 5) - hash);
  const palette = ['#7c3aed', '#db2777', '#0891b2', '#059669'];
  const color = palette[Math.abs(hash) % palette.length];
  const accent = palette[Math.abs(hash + 2) % palette.length];

  const points = [
    [2, 1], [3, 1], [4, 1], [5, 1],
    [1, 2], [2, 2], [5, 2], [6, 2],
    [1, 3], [3, 3], [4, 3], [6, 3],
    [1, 4], [2, 4], [5, 4], [6, 4],
    [2, 5], [3, 5], [4, 5], [5, 5],
    [3, 6], [4, 6],
  ];

  for (const [x, y] of points) pixels[y * GRID_SIZE + x] = color;
  pixels[2 * GRID_SIZE + 3] = accent;
  pixels[2 * GRID_SIZE + 4] = accent;
  return pixels;
}

function pixelsToDataUrl(pixels: string[]) {
  const cells = pixels
    .map((color, index) => {
      if (!color || color === 'transparent') return '';
      const x = index % GRID_SIZE;
      const y = Math.floor(index / GRID_SIZE);
      return `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`;
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID_SIZE} ${GRID_SIZE}" shape-rendering="crispEdges">${cells}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function DrawnAvatarEditor({
  username,
  value,
  onChange,
  disabled = false,
  className,
}: {
  username: string;
  value?: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const seeded = useMemo(() => seedPixels(username), [username]);
  const [pixels, setPixels] = useState<string[]>(seeded);
  const [activeColor, setActiveColor] = useState(DEFAULT_COLORS[1]);

  const paint = (index: number) => {
    if (disabled) return;
    setPixels((current) => current.map((pixel, i) => (i === index ? activeColor : pixel)));
  };

  const clear = () => !disabled && setPixels(Array(GRID_SIZE * GRID_SIZE).fill('transparent'));
  const useSeed = () => !disabled && setPixels(seeded);
  const save = () => !disabled && onChange(pixelsToDataUrl(pixels));

  return (
    <section className={cn('surface-panel rounded-2xl p-4', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="mx-auto w-32 shrink-0 rounded-2xl border border-border bg-bg p-2 sm:mx-0">
          <div className="grid aspect-square gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}>
            {pixels.map((pixel, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Avatar pixel ${index + 1}`}
                onClick={() => paint(index)}
                disabled={disabled}
                className="aspect-square rounded-[3px] border border-border/40 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: pixel === 'transparent' ? 'transparent' : pixel }}
              />
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-text">Drawn avatar</h3>
              <p className="mt-1 text-xs leading-5 text-text-muted">
                Create a tiny built-in avatar. PixAnony does not use profile photo uploads.
              </p>
            </div>
            {value && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="h-10 w-10 rounded-xl border border-border bg-bg pixel-art" />
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {DEFAULT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setActiveColor(color)}
                disabled={disabled}
                aria-label={color === 'transparent' ? 'Transparent' : `Use ${color}`}
                className={cn(
                  'h-8 w-8 rounded-xl border transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60',
                  activeColor === color ? 'border-primary ring-4 ring-primary/10' : 'border-border',
                  color === 'transparent' && 'checkerboard',
                )}
                style={{ background: color === 'transparent' ? undefined : color }}
              />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={save} disabled={disabled} leftIcon={<Save size={13} />}>
              Use avatar
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={useSeed} disabled={disabled}>
              Suggest one
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={disabled} leftIcon={<Eraser size={13} />}>
              Clear
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
