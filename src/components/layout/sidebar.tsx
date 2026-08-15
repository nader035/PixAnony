'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  Compass,
  Bell,
  Bookmark,
  Inbox,
  Trophy,
  Paintbrush,
  Settings,
  LogIn,
  ArrowRight,
  User,
  type LucideIcon,
} from '@/components/ui/icons';
import { Logo } from '@/components/ui/logo';
import { UserMenu } from '@/components/auth/user-menu';
import { useAuthProfile } from '@/hooks/use-auth-profile';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

/* ===== Sidebar navigation items ===== */
type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  requiresAuth?: boolean;
};

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', href: '/home', icon: Home },
  { id: 'explore', label: 'Explore', href: '/explore', icon: Compass },
  { id: 'paint', label: 'Create', href: '/paint', icon: Paintbrush },
  { id: 'challenges', label: 'Challenges', href: '/challenges', icon: Trophy },
  { id: 'bookmarks', label: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
  { id: 'drops', label: 'Private Drops', href: '/drops', icon: Inbox, requiresAuth: true },
  { id: 'notifications', label: 'Notifications', href: '/notifications', icon: Bell },
  { id: 'profile', label: 'Profile', href: '/profile', icon: User, requiresAuth: true },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const { profile, user, signOut } = useAuthProfile();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!user || !active) {
        if (active) setUnread(0);
        return;
      }
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      if (active) setUnread(count ?? 0);
    })();
    return () => {
      active = false;
    };
  }, [supabase, user]);

  /* Resolve auth-dependent hrefs at render time.
     Profile href uses the real username; everything else stays stable. */
  const resolvedItems = navItems.map((item) => {
    if (item.id === 'profile' && profile) {
      return { ...item, href: `/profile/${profile.username}` };
    }
    return item;
  });

  return (
    <aside
      className={cn(
        'sticky top-4 z-40 hidden h-[calc(100dvh-2rem)] min-w-0 flex-col lg:flex',
        'rounded-[32px] bg-sidebar px-4 shadow-[0_20px_70px_rgba(44,40,58,0.1)] backdrop-blur-xl',
        'relative overflow-hidden',
      )}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[var(--lilac)] opacity-80"
        aria-hidden="true"
      />

      <div className="relative">
        <div
          className="pointer-events-none absolute -left-8 top-4 h-16 w-16 rounded-full bg-[var(--blush)] opacity-70"
          aria-hidden="true"
        />
        <Link href="/home" className="relative flex h-24 items-center px-2">
          <Logo size="md" />
        </Link>
      </div>

      {/* ===== Navigation ===== */}
      <nav aria-label="Primary navigation" className="relative flex-1 space-y-1 overflow-y-auto py-2">
        {resolvedItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.id === 'profile'
              ? pathname === item.href
              : item.id === 'drops'
                ? pathname === item.href || pathname?.startsWith('/drops')
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const badge = item.id === 'notifications' ? unread : 0;

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex h-11 items-center gap-3 rounded-full px-4 text-sm font-semibold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]',
                active
                  ? 'bg-primary text-bg shadow-[0_12px_24px_rgba(24,23,28,0.14)]'
                  : 'text-text-muted hover:bg-card-hover hover:text-text',
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-full bg-primary"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <span className="relative flex items-center justify-center">
                <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
                {badge > 0 && (
                  <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[9px] font-bold text-white ring-2 ring-sidebar">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>

              <span>{item.label}</span>

              {!active && (
                <span className="pointer-events-none absolute left-3 h-1.5 w-1.5 rounded-full bg-pink opacity-0 transition-opacity duration-700 group-hover:opacity-100" aria-hidden="true" />
              )}
            </Link>
          );
        })}

        <div className="pt-3">
          <Link
            href="/paint"
            className={cn(
              'group/create relative flex h-11 w-full items-center justify-between gap-2 rounded-full px-4',
              'bg-[var(--blush)] text-text text-sm font-semibold',
              'shadow-[0_14px_34px_rgba(44,40,58,0.08)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]',
              'hover:-translate-y-0.5 hover:bg-pink hover:text-white',
              'active:translate-y-0 active:shadow-md',
            )}
          >
            <span className="relative flex items-center gap-2.5">
              <Paintbrush size={16} />
              Create
            </span>
            <ArrowRight size={15} className="relative transition-transform duration-200 group-hover/create:translate-x-0.5" />
          </Link>
        </div>
      </nav>

      {/* ===== User Card ===== */}
      <div className="relative pb-5 pt-4">
        {profile ? (
          <UserMenu profile={profile} signOut={signOut} />
        ) : (
          <Link
            href="/login"
            className={cn(
              'flex h-11 items-center justify-center gap-2 rounded-full',
              'border border-border text-sm font-semibold text-text',
              'transition-all duration-200 hover:border-primary/30 hover:bg-card',
            )}
          >
            <LogIn size={17} />
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}
