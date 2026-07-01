'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  ChevronDown,
  Home,
  Inbox,
  LogOut,
  Paintbrush,
  Settings,
  User,
} from '@/components/ui/icons';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import type { AuthProfile } from '@/hooks/use-auth-profile';
import { cn } from '@/lib/utils';

type UserMenuProps = {
  profile: AuthProfile;
  signOut: () => Promise<void>;
  compact?: boolean;
  className?: string;
};

export function UserMenu({ profile, signOut, compact = false, className }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const menuItems = [
    { label: 'Dashboard', href: '/home', icon: Home },
    { label: 'Create', href: '/paint', icon: Paintbrush },
    { label: 'Profile', href: `/profile/${profile.username}`, icon: User },
    { label: 'Private Drops', href: `/profile/${profile.username}/received`, icon: Inbox },
    { label: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
    { label: 'Settings', href: '/settings', icon: Settings },
  ] as const;

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((next) => !next)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'flex min-h-11 items-center gap-2 rounded-full border border-border bg-card/80 px-2.5 py-1.5 text-left transition hover:border-primary/25 hover:bg-card focus:outline-none focus:ring-4 focus:ring-primary/15',
          compact && 'h-11 w-11 justify-center rounded-2xl p-0',
        )}
      >
        <PixelAvatar
          username={profile.username}
          src={profile.avatar_url}
          size="sm"
          isVerified={profile.is_verified}
          showBadge={!compact}
        />
        {!compact && (
          <>
            <span className="hidden min-w-0 md:block">
              <span className="block max-w-28 truncate text-sm font-semibold text-text">{profile.display_name}</span>
              <span className="block max-w-28 truncate text-xs text-text-muted">@{profile.username}</span>
            </span>
            <ChevronDown size={12} className={cn('text-text-muted transition-transform', open && 'rotate-180')} />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-64 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-float"
        >
          <div className="mb-1 flex items-center gap-3 rounded-xl bg-surface/80 p-2.5">
            <PixelAvatar username={profile.username} src={profile.avatar_url} size="sm" isVerified={profile.is_verified} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">{profile.display_name}</p>
              <p className="truncate text-xs text-text-muted">@{profile.username}</p>
            </div>
          </div>

          {menuItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted transition hover:bg-card-hover hover:text-text focus:bg-card-hover focus:text-text focus:outline-none"
            >
              <Icon size={15} className="text-primary/75" />
              {label}
            </Link>
          ))}

          <button
            type="button"
            role="menuitem"
            onClick={() => void handleLogout()}
            className="mt-1 flex w-full items-center gap-3 rounded-xl border-t border-border/60 px-3 py-2.5 text-left text-sm font-semibold text-red transition hover:bg-red/8 focus:bg-red/8 focus:outline-none"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
