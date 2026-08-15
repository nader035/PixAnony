'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { icon: 'h-8 w-8', text: 'text-sm', gap: 'gap-2' },
  md: { icon: 'h-10 w-10', text: 'text-base', gap: 'gap-2.5' },
  lg: { icon: 'h-12 w-12', text: 'text-2xl', gap: 'gap-3' },
};

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn('flex items-center', config.gap, className)}>
      <span className={cn('brand-splash shrink-0', config.icon)}>
        <span className="text-sm leading-none">P</span>
      </span>

      {showText && (
        <span
          className={cn(
            'font-bold tracking-[-0.03em] text-text',
            config.text
          )}
        >
          PixAnony
        </span>
      )}
    </div>
  );
}
