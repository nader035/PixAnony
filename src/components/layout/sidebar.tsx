'use client';

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
  Shield,
  SidebarSimple,
  type LucideIcon,
} from '@/components/ui/icons';
import { Logo } from '@/components/ui/logo';
import { UserMenu } from '@/components/auth/user-menu';
import { useAuthProfile } from '@/hooks/use-auth-profile';
import { cn, formatNumber } from '@/lib/utils';
import { useNotificationCenter } from '@/components/notifications/notification-center';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { useI18n } from '@/components/i18n/locale-provider';

/* ===== Sidebar navigation items ===== */
type NavItem = {
  id: string;
  labelKey: 'nav.home' | 'nav.explore' | 'nav.create' | 'nav.challenges' | 'nav.bookmarks' | 'nav.drops' | 'nav.notifications' | 'nav.profile' | 'nav.settings' | 'nav.dashboard';
  href: string;
  icon: LucideIcon;
  requiresAuth?: boolean;
};

const navItems: NavItem[] = [
  { id: 'home', labelKey: 'nav.home', href: '/home', icon: Home },
  { id: 'explore', labelKey: 'nav.explore', href: '/explore', icon: Compass },
  { id: 'paint', labelKey: 'nav.create', href: '/paint', icon: Paintbrush },
  { id: 'challenges', labelKey: 'nav.challenges', href: '/challenges', icon: Trophy },
  { id: 'bookmarks', labelKey: 'nav.bookmarks', href: '/bookmarks', icon: Bookmark },
  { id: 'drops', labelKey: 'nav.drops', href: '/drops', icon: Inbox, requiresAuth: true },
  { id: 'notifications', labelKey: 'nav.notifications', href: '/notifications', icon: Bell },
  { id: 'profile', labelKey: 'nav.profile', href: '/profile', icon: User, requiresAuth: true },
  { id: 'settings', labelKey: 'nav.settings', href: '/settings', icon: Settings },
];

export function Sidebar({
  collapsed = false,
  onToggle,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();
  const { profile, signOut, isStaff } = useAuthProfile();
  const { unreadCount } = useNotificationCenter();
  const { locale, t } = useI18n();

  /* Resolve auth-dependent hrefs at render time.
     Profile href uses the real username; everything else stays stable. */
  const staffAwareItems = isStaff
    ? [
        ...navItems.slice(0, -1),
        { id: 'dashboard', labelKey: 'nav.dashboard' as const, href: '/dashboard', icon: Shield },
        navItems[navItems.length - 1],
      ]
    : navItems;
  const resolvedItems = staffAwareItems.map((item) => {
    if (item.id === 'profile' && profile) {
      return { ...item, href: `/profile/${profile.username}` };
    }
    return item;
  });

  return (
    <aside
      className={cn(
        'sticky top-4 z-40 hidden h-[calc(100dvh-2rem)] min-w-0 flex-col lg:flex',
        'rounded-[32px] bg-sidebar shadow-[0_20px_70px_rgba(44,40,58,0.1)] backdrop-blur-xl',
        collapsed ? 'px-2' : 'px-4',
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]" aria-hidden="true">
        <div
          className="absolute -end-10 -top-10 h-28 w-28 rounded-full bg-[var(--lilac)] opacity-80"
        />
        <div className="absolute -start-8 top-4 h-16 w-16 rounded-full bg-[var(--blush)] opacity-70" />
      </div>

      <div className="relative">
        <Link
          href="/home"
          aria-label={collapsed ? 'PixAnony' : undefined}
          className={cn('relative flex h-24 items-center', collapsed ? 'justify-center px-0' : 'px-2')}
        >
          <Logo size="md" showText={!collapsed} priority />
        </Link>

      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        aria-expanded={!collapsed}
        aria-controls="primary-sidebar-navigation"
        title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        className="absolute -end-3 top-10 z-50 flex size-7 items-center justify-center rounded-full border border-border bg-sidebar text-text-muted shadow-sm transition-[transform,color] duration-150 hover:scale-105 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none"
      >
        <SidebarSimple size={14} weight={collapsed ? 'fill' : 'regular'} />
      </button>

      {/* ===== Navigation ===== */}
      <nav id="primary-sidebar-navigation" aria-label={t('nav.primary')} className="hide-scrollbar relative flex-1 space-y-1 overflow-y-auto py-2">
        {resolvedItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.id === 'profile'
              ? pathname === item.href
              : item.id === 'drops'
                ? pathname === item.href || pathname?.startsWith('/drops')
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const badge = item.id === 'notifications' ? unreadCount : 0;

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-label={collapsed ? t(item.labelKey) : undefined}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? t(item.labelKey) : undefined}
              className={cn(
                'group relative flex h-11 items-center rounded-full text-sm font-semibold transition-colors duration-150',
                collapsed ? 'justify-center px-0' : 'gap-3 px-4',
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
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                />
              )}

              <span className="relative flex shrink-0 items-center justify-center">
                <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
                {badge > 0 && (
                  <span className="absolute -end-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[9px] font-bold text-white ring-2 ring-sidebar">
                    {badge > 9 ? (locale === 'ar' ? '+٩' : '9+') : formatNumber(badge, locale)}
                  </span>
                )}
              </span>

              <span
                aria-hidden={collapsed}
                className={cn(
                  'truncate transition-[opacity,transform] duration-150 motion-reduce:transition-none',
                  collapsed ? 'pointer-events-none absolute -translate-x-1 opacity-0 rtl:translate-x-1' : 'translate-x-0 opacity-100',
                )}
              >
                {t(item.labelKey)}
              </span>

              {!collapsed && !active && (
                <span className="pointer-events-none absolute start-3 size-1.5 rounded-full bg-pink opacity-0 transition-opacity duration-150 group-hover:opacity-100" aria-hidden="true" />
              )}
            </Link>
          );
        })}

        {!collapsed && <div className="pt-3">
          <Link
            href="/paint"
            className={cn(
              'group/create relative flex h-11 w-full items-center justify-between gap-2 rounded-full px-4',
              'bg-[var(--blush)] text-text text-sm font-semibold',
              'shadow-[0_14px_34px_rgba(44,40,58,0.08)] transition-[transform,background-color,color,box-shadow] duration-150',
              'hover:-translate-y-0.5 hover:bg-pink hover:text-white',
              'active:translate-y-0 active:shadow-md',
            )}
          >
            <span className="relative flex items-center gap-2.5">
              <Paintbrush size={16} />
              {t('nav.create')}
            </span>
            <ArrowRight size={15} className="rtl-flip relative transition-transform duration-200 group-hover/create:translate-x-0.5" />
          </Link>
        </div>}
      </nav>

      {/* ===== User Card ===== */}
      <div className={cn('relative pb-5 pt-4', collapsed && 'flex flex-col items-center')}>
        <LanguageSwitcher
          showLabel={!collapsed}
          className={cn('mb-2 w-full', collapsed && 'px-0')}
        />
        {profile ? (
          <UserMenu profile={profile} signOut={signOut} compact={collapsed} />
        ) : (
          <Link
            href="/login"
            aria-label={collapsed ? t('nav.signIn') : undefined}
            title={collapsed ? t('nav.signIn') : undefined}
            className={cn(
              'flex h-11 items-center justify-center gap-2 rounded-full',
              'border border-border text-sm font-semibold text-text',
              'transition-colors duration-150 hover:border-primary/30 hover:bg-card',
              collapsed && 'size-11 px-0',
            )}
          >
            <LogIn size={17} />
            {!collapsed && <span>{t('nav.signIn')}</span>}
          </Link>
        )}
      </div>
    </aside>
  );
}
