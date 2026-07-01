'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { icon: 'h-7 w-7', text: 'text-sm', gap: 'gap-2' },
  md: { icon: 'h-9 w-9', text: 'text-base', gap: 'gap-2.5' },
  lg: { icon: 'h-12 w-12', text: 'text-2xl', gap: 'gap-3' },
};

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn('flex items-center', config.gap, className)}>
      <span className={cn('relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-primary text-white shadow-[0_14px_32px_rgba(124,58,237,0.2)]', config.icon)}>
        <span className="font-pixel text-[10px] font-semibold leading-none">PX</span>
        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-sm bg-white/70" />
        <span className="absolute bottom-1 left-1 h-1 w-1 rounded-sm bg-white/50" />
      </span>

      {showText && (
        <span
          className={cn(
            'font-semibold text-text',
            config.text
          )}
        >
          PixAnony
        </span>
      )}
    </div>
  );
}
