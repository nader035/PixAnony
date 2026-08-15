'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { full: 'h-8 w-auto', icon: 'h-8 w-8' },
  md: { full: 'h-10 w-auto', icon: 'h-10 w-10' },
  lg: { full: 'h-12 w-auto', icon: 'h-12 w-12' },
};

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const config = sizeConfig[size];
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const height = size === 'sm' ? 32 : size === 'md' ? 40 : 48;

  if (!mounted) {
    return (
      <div className={cn('flex items-center', className)}>
        <span
          className={cn('block shrink-0', showText ? config.full : config.icon)}
          style={{ aspectRatio: showText ? '2012 / 534' : '1 / 1' }}
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center', className)}>
      <Image
        src={showText
          ? resolvedTheme === 'dark'
            ? '/assets/images/logo-darktheme-nav.png'
            : '/assets/images/logo-lightTheme-nav.png'
          : '/assets/images/32x32.png'}
        alt="PixAnony"
        width={showText ? 2012 : 128}
        height={showText ? 534 : 128}
        sizes={showText ? `${Math.round(height * (2012 / 534))}px` : `${height}px`}
        className={cn('block shrink-0 object-contain', showText ? config.full : config.icon)}
      />
    </div>
  );
}
