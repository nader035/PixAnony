'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BadgeCheck, Crown } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

interface PixelAvatarProps {
  src?: string | null;
  username: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  isVerified?: boolean;
  isPro?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeConfig = {
  xs: { container: 'h-6 w-6', text: 'text-[10px]', badge: 10, badgeOffset: '-right-0.5 -bottom-0.5' },
  sm: { container: 'h-8 w-8', text: 'text-xs', badge: 12, badgeOffset: '-right-0.5 -bottom-0.5' },
  md: { container: 'h-10 w-10', text: 'text-sm', badge: 14, badgeOffset: '-right-1 -bottom-1' },
  lg: { container: 'h-12 w-12', text: 'text-base', badge: 16, badgeOffset: '-right-1 -bottom-1' },
  xl: { container: 'h-24 w-24', text: 'text-2xl', badge: 22, badgeOffset: '-right-1.5 -bottom-1.5' },
};

function getAvatarColor(username: string): string {
  const colors = [
    'from-primary to-pink',
    'from-pink to-cyan',
    'from-cyan to-green',
    'from-primary to-cyan',
    'from-pink to-primary',
    'from-[#F97316] to-pink',
    'from-green to-cyan',
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function PixelAvatar({
  src,
  username,
  size = 'md',
  showBadge = true,
  isVerified = false,
  isPro = false,
  className,
  onClick,
}: PixelAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const config = sizeConfig[size];
  const showImg = src && !imgError;
  const isDataImage = Boolean(src?.startsWith('data:image'));
  const letter = username?.charAt(0)?.toUpperCase() || '?';
  const gradientColor = getAvatarColor(username);

  return (
    <div
      className={cn('relative flex-shrink-0', className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div
        className={cn(
          'rounded-2xl p-[2px]',
          'bg-gradient-to-br from-primary/70 via-pink/60 to-cyan/60',
          'shadow-[0_12px_26px_rgba(124,58,237,0.16)]',
          onClick && 'cursor-pointer transition-transform hover:-translate-y-0.5'
        )}
      >
        <div
          className={cn(
            'overflow-hidden rounded-[14px] flex items-center justify-center',
            'ring-2 ring-bg',
            config.container
          )}
        >
          {showImg && isDataImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={username}
              className="h-full w-full bg-surface object-cover pixel-art"
              onError={() => setImgError(true)}
            />
          ) : showImg ? (
            <Image
              src={src}
              alt={username}
              width={96}
              height={96}
              loader={({ src: imageSrc }) => imageSrc}
              unoptimized
              className="h-full w-full object-cover pixel-art"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className={cn(
                'grid h-full w-full grid-cols-4 gap-px bg-bg p-1',
                gradientColor,
                config.text
              )}
            >
              {Array.from({ length: 16 }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    'rounded-[2px]',
                    (index + letter.charCodeAt(0)) % 5 === 0
                      ? 'bg-pink'
                      : (index + letter.charCodeAt(0)) % 3 === 0
                        ? 'bg-primary'
                        : (index + letter.charCodeAt(0)) % 2 === 0
                          ? 'bg-cyan'
                          : 'bg-surface',
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Badge */}
      {showBadge && (isVerified || isPro) && (
        <div className={cn('absolute z-10', config.badgeOffset)}>
          {isPro ? (
            <div className="rounded-full bg-yellow p-0.5 shadow-lg">
              <Crown size={config.badge - 4} className="text-black" strokeWidth={2.5} />
            </div>
          ) : isVerified ? (
            <BadgeCheck
              size={config.badge}
              className="text-primary fill-primary stroke-bg"
              strokeWidth={2}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
