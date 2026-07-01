import { cn } from '@/lib/utils';

const defaultPixels = [
  '....vv....vv....',
  '...vvvv..vvvv...',
  '..vvvvvvvvvvvv..',
  '.vvvwwvvvvwwvvv.',
  '.vvvvvvvvvvvvvv.',
  '..vvvvvppvvvvv..',
  '...vvvvppppvv...',
  '....vvppppvv....',
  '.....vppppv.....',
  '......vppv......',
  '.......vv.......',
  '................',
  '..c.........y...',
  '.....p....c.....',
  '...y.........p..',
  '................',
] as const;

const colors: Record<string, string> = {
  '.': 'bg-transparent',
  v: 'bg-primary',
  p: 'bg-pink',
  c: 'bg-cyan',
  y: 'bg-yellow',
  w: 'bg-white',
};

export function PixelCanvasMock({ className, pixels = defaultPixels }: { className?: string; pixels?: readonly string[] }) {
  const flat = pixels.join('').split('');

  return (
    <div className={cn('checkerboard overflow-hidden rounded-2xl border border-border bg-surface p-5', className)}>
      <div className="mx-auto grid aspect-square max-w-[360px] gap-1" style={{ gridTemplateColumns: `repeat(${pixels[0].length}, minmax(0, 1fr))` }}>
        {flat.map((pixel, index) => (
          <span key={`${pixel}-${index}`} className={cn('aspect-square rounded-[3px]', colors[pixel] ?? 'bg-transparent')} />
        ))}
      </div>
    </div>
  );
}
