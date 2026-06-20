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
  Trophy,
  Paintbrush,
  Settings,
  LogIn,
  ArrowRight,
  type LucideIcon,
} from '@/components/ui/icons';
import { Logo } from '@/components/ui/logo';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { NAV_ITEMS } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

/* ===== Icon map ===== */
const iconMap: Record<string, LucideIcon> = {
  Home,
  Compass,
  Bell,
  Bookmark,
  Trophy,
  Paintbrush,
  Settings,
};

/* ===== Types ===== */
type NavProfile = {
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
};

/* ===== Nav items without Create (rendered separately) ===== */
const SIDEBAR_NAV = NAV_ITEMS.filter((item) => item.label !== 'Create');

export function Sidebar() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<NavProfile | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;
      const [{ data }, { count }] = await Promise.all([
        supabase
          .from('profiles')
          .select('username, display_name, avatar_url, is_verified')
          .eq('id', user.id)
          .single(),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false),
      ]);
      if (active) {
        setProfile(data);
        setUnread(count ?? 0);
      }
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  return (
    <aside
      className={cn(
        'sticky top-0 z-40 hidden h-svh min-w-0 flex-col lg:flex',
        'border-r border-border/60 bg-sidebar/92 px-3 backdrop-blur-xl',
      )}
    >
      {/* ===== Logo ===== */}
      <Link href="/home" className="flex h-[72px] items-center px-3">
        <Logo size="md" />
      </Link>

      {/* ===== Navigation ===== */}
      <nav aria-label="Primary navigation" className="flex-1 space-y-0.5 overflow-y-auto py-2">
        {SIDEBAR_NAV.map((item) => {
          const Icon = iconMap[item.icon] || Home;
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const badge = item.label === 'Notifications' ? unread : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-[14px] font-medium transition-all duration-200',
                active
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-text-muted hover:bg-card hover:text-text',
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-primary"
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
            </Link>
          );
        })}

        {/* ===== Create Button ===== */}
        <div className="pt-3">
          <Link
            href="/paint"
            className={cn(
              'flex h-11 w-full items-center justify-between gap-2 rounded-xl px-4',
              'bg-gradient-to-r from-primary to-pink text-white text-sm font-semibold',
              'shadow-lg shadow-primary/25 transition-all duration-200',
              'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30',
              'active:translate-y-0 active:shadow-md',
            )}
          >
            <span className="flex items-center gap-2.5">
              <Paintbrush size={16} />
              Create
            </span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </nav>

      {/* ===== User Card ===== */}
      <div className="border-t border-border/50 pb-4 pt-3">
        {profile ? (
          <div className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-card/70">
              <Link href={`/@${profile.username}`} className="shrink-0">
                <PixelAvatar
                  username={profile.username}
                  src={profile.avatar_url}
                  size="sm"
                  isVerified={profile.is_verified}
                />
              </Link>

              <Link href={`/@${profile.username}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text">
                  {profile.display_name}
                </p>
                <p className="truncate text-xs text-text-muted">@{profile.username}</p>
              </Link>

              <Link
                href="/settings"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface hover:text-text"
                aria-label="Open settings"
              >
                <Settings size={15} />
              </Link>
          </div>
        ) : (
          <Link
            href="/login"
            className={cn(
              'flex h-11 items-center justify-center gap-2 rounded-xl',
              'border border-border text-sm font-semibold text-text',
              'transition-colors hover:border-primary/40 hover:bg-card',
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
