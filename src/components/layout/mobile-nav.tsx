'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Compass, Plus, Bell, User, LogIn } from '@/components/ui/icons';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { useAuthProfile } from '@/hooks/use-auth-profile';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const { profile, isAuthenticated } = useAuthProfile();

  const items = [
    { label: 'Home', href: '/home', icon: Home },
    { label: 'Explore', href: '/explore', icon: Compass },
    { label: 'Create', href: isAuthenticated ? '/paint' : '/login?next=%2Fpaint', icon: Plus, center: true },
    { label: 'Alerts', href: isAuthenticated ? '/notifications' : '/login?next=%2Fnotifications', icon: Bell },
    {
      label: profile ? 'Profile' : 'Sign in',
      href: profile ? `/profile/${profile.username}` : '/login',
      icon: profile ? User : LogIn,
      avatar: Boolean(profile),
    },
  ];

  return (
    <nav
      className={cn(
        'safe-area-bottom fixed inset-x-0 bottom-0 z-50 lg:hidden',
        'border-t border-border/70 bg-[var(--glass-bg)] backdrop-blur-3xl',
        'shadow-[0_-12px_36px_rgba(58,42,92,0.1)]',
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-lg items-center justify-around px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (!item.href.includes('?') && pathname?.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-[10px] font-medium',
                'transition-all duration-200',
                item.center && '-mt-5',
              )}
            >
              <span
                className={cn(
                  'relative flex items-center justify-center transition-all duration-200',
                  item.center
                    ? cn(
                        'h-14 w-14 rounded-[18px] bg-primary text-white',
                        'shadow-[0_12px_30px_rgba(124,58,237,0.24)]',
                        'hover:scale-105 active:scale-95',
                      )
                    : active
                      ? 'scale-105 text-primary'
                      : 'text-text-muted hover:text-text',
                )}
              >
                {item.avatar && profile ? (
                  <PixelAvatar username={profile.username} src={profile.avatar_url} size="xs" isVerified={profile.is_verified} showBadge={false} />
                ) : (
                  <Icon size={item.center ? 24 : 21} strokeWidth={active ? 2.5 : 2} />
                )}
              </span>

              {!item.center && (
                <span className={cn('transition-colors duration-200', active ? 'text-primary' : 'text-text-muted')}>
                  {item.label}
                </span>
              )}

              {/* Animated active indicator dot */}
              {active && !item.center && (
                <motion.span
                  layoutId="mobile-nav-dot"
                  className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
