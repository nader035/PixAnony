import { cn } from '@/lib/utils';

type BadgeTone = 'violet' | 'pink' | 'cyan' | 'green' | 'yellow' | 'neutral';

const tones: Record<BadgeTone, string> = {
  violet: 'border-primary/20 bg-primary/10 text-primary',
  pink: 'border-pink/20 bg-pink/10 text-pink',
  cyan: 'border-cyan/20 bg-cyan/10 text-cyan',
  green: 'border-green/20 bg-green/10 text-green',
  yellow: 'border-yellow/20 bg-yellow/10 text-yellow',
  neutral: 'border-border bg-card-hover text-text-muted',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold', tones[tone], className)}>
      {children}
    </span>
  );
}
