'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { icon: 24, text: 'text-base', gap: 'gap-1.5' },
  md: { icon: 32, text: 'text-xl', gap: 'gap-2' },
  lg: { icon: 48, text: 'text-3xl', gap: 'gap-3' },
};

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn('flex items-center', config.gap, className)}>
      {/* Pixel Heart SVG */}
      <svg
        width={config.icon}
        height={config.icon}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pixel-art flex-shrink-0"
        style={{ imageRendering: 'pixelated' }}
      >
        <defs>
          <linearGradient id="pixHeart" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id="pixHeartLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="100%" stopColor="#F9A8D4" />
          </linearGradient>
        </defs>
        {/* Row 1 */}
        <rect x="2" y="1" width="3" height="1" fill="url(#pixHeart)" />
        <rect x="7" y="1" width="3" height="1" fill="url(#pixHeart)" />
        {/* Row 2 */}
        <rect x="1" y="2" width="5" height="1" fill="url(#pixHeart)" />
        <rect x="6" y="2" width="5" height="1" fill="url(#pixHeart)" />
        {/* Row 3 - with highlight */}
        <rect x="1" y="3" width="1" height="1" fill="url(#pixHeart)" />
        <rect x="2" y="3" width="2" height="1" fill="url(#pixHeartLight)" />
        <rect x="4" y="3" width="7" height="1" fill="url(#pixHeart)" />
        {/* Row 4 */}
        <rect x="1" y="4" width="10" height="1" fill="url(#pixHeart)" />
        {/* Row 5 */}
        <rect x="1" y="5" width="10" height="1" fill="url(#pixHeart)" />
        {/* Row 6 */}
        <rect x="2" y="6" width="8" height="1" fill="url(#pixHeart)" />
        {/* Row 7 */}
        <rect x="3" y="7" width="6" height="1" fill="url(#pixHeart)" />
        {/* Row 8 */}
        <rect x="4" y="8" width="4" height="1" fill="url(#pixHeart)" />
        {/* Row 9 */}
        <rect x="5" y="9" width="2" height="1" fill="url(#pixHeart)" />
        {/* Row 10 */}
        <rect x="6" y="10" width="1" height="1" fill="url(#pixHeart)" />
      </svg>

      {showText && (
        <span
          className={cn(
            'font-pixel font-bold tracking-tight',
            'bg-gradient-to-r from-primary via-[#A855F7] to-pink bg-clip-text text-transparent',
            config.text
          )}
        >
          PixAnony
        </span>
      )}
    </div>
  );
}
