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
    'bg-[var(--powder)]',
    'bg-[var(--blush)]',
    'bg-[var(--mint)]',
    'bg-[var(--butter)]',
    'bg-[var(--lilac)]',
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
      <div className={cn('rounded-full bg-card p-0.5 shadow-[0_8px_20px_rgba(44,40,58,0.12)]', onClick && 'cursor-pointer transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5')}>
        <div
          className={cn(
            'overflow-hidden rounded-full flex items-center justify-center',
            'ring-2 ring-bg',
            config.container
          )}
        >
          {showImg && isDataImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={username}
              className="h-full w-full bg-surface object-cover"
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
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className={cn('flex h-full w-full items-center justify-center font-bold text-text', gradientColor, config.text)}
            >
              {letter}
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
