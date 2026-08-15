'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  X,
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
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    maxHeight: number;
  }>({ left: 12, maxHeight: 420 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = Math.min(256, viewportWidth - 24);
    const left = Math.min(
      Math.max(12, compact ? rect.right - menuWidth : rect.left),
      viewportWidth - menuWidth - 12,
    );

    if (compact) {
      const top = rect.bottom + 10;
      const availableBelow = viewportHeight - top - 12;
      if (availableBelow < 240) {
        setMenuPosition({
          top: 12,
          left,
          maxHeight: viewportHeight - 24,
        });
        return;
      }
      setMenuPosition({
        top,
        left,
        maxHeight: availableBelow,
      });
      return;
    }

    const bottom = viewportHeight - rect.top + 10;
    setMenuPosition({
      bottom,
      left,
      maxHeight: rect.top - 22,
    });
  }, [compact]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onViewportChange = () => updateMenuPosition();
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [open, updateMenuPosition]);

  const menuItems = [
    { label: 'Dashboard', href: '/home', icon: Home },
    { label: 'Create', href: '/paint', icon: Paintbrush },
    { label: 'Profile', href: `/profile/${profile.username}`, icon: User },
    { label: 'Private Drops', href: '/drops', icon: Inbox },
    { label: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
    { label: 'Settings', href: '/settings', icon: Settings },
  ] as const;

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    router.push('/login');
  };

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          updateMenuPosition();
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown' || open) return;
          event.preventDefault();
          updateMenuPosition();
          setOpen(true);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-menu"
        aria-label={open ? 'Close account menu' : 'Open account menu'}
        className={cn(
          'flex w-full min-h-11 items-center gap-2 rounded-full border border-border bg-card/80 px-2.5 py-1.5 text-left transition hover:border-primary/25 hover:bg-card focus:outline-none focus:ring-4 focus:ring-primary/15',
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
            <span className="hidden min-w-0 flex-1 md:block">
              <span className="block truncate text-sm font-semibold text-text">{profile.display_name}</span>
              <span className="block truncate text-xs text-text-muted">@{profile.username}</span>
            </span>
            <ChevronDown size={12} className={cn('ml-auto shrink-0 text-text-muted transition-transform', open && 'rotate-180')} />
          </>
        )}
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          id="account-menu"
          role="menu"
          aria-label="Account navigation"
          style={{
            top: menuPosition.top,
            bottom: menuPosition.bottom,
            left: menuPosition.left,
            maxHeight: menuPosition.maxHeight,
          }}
          className="fixed z-[100] w-[min(16rem,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain rounded-[22px] border border-border bg-card p-2 shadow-float"
        >
          <div className="mb-1 flex items-center gap-3 rounded-xl bg-surface/80 p-2.5">
            <PixelAvatar username={profile.username} src={profile.avatar_url} size="sm" isVerified={profile.is_verified} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text">{profile.display_name}</p>
              <p className="truncate text-xs text-text-muted">@{profile.username}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition hover:bg-card hover:text-text focus:bg-card focus:text-text focus:outline-none"
              aria-label="Close account menu"
            >
              <X size={14} />
            </button>
          </div>

          {menuItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
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
        </div>,
        document.body,
      )}
    </div>
  );
}
