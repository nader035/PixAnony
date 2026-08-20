'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  FileImage,
  Home,
  MessageSquare,
  Shield,
  SidebarSimple,
  Trophy,
  Users,
} from '@/components/ui/icons';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { AccessContext } from '@/lib/auth/access';
import { useI18n } from '@/components/i18n/locale-provider';
import type { TranslationKey } from '@/lib/i18n/translations';
import { cn } from '@/lib/utils';

const commonNavigation: Array<{ href: string; labelKey: TranslationKey; icon: typeof Home }> = [
  { href: '/dashboard#overview', labelKey: 'dashboard.nav.overview', icon: Home },
  { href: '/dashboard#reports', labelKey: 'dashboard.nav.reports', icon: MessageSquare },
  { href: '/dashboard#activity', labelKey: 'dashboard.nav.activity', icon: Shield },
];

const dashboardNavigationEvent = 'pixanony:dashboard-navigation';

function subscribeToHashChange(onStoreChange: () => void) {
  window.addEventListener('hashchange', onStoreChange);
  window.addEventListener('popstate', onStoreChange);
  window.addEventListener(dashboardNavigationEvent, onStoreChange);
  return () => {
    window.removeEventListener('hashchange', onStoreChange);
    window.removeEventListener('popstate', onStoreChange);
    window.removeEventListener(dashboardNavigationEvent, onStoreChange);
  };
}

function currentHash() {
  return window.location.hash;
}

function notifyAfterNavigation() {
  window.setTimeout(() => window.dispatchEvent(new Event(dashboardNavigationEvent)), 0);
}

export function DashboardShell({
  access,
  children,
}: {
  access: AccessContext;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const hash = useSyncExternalStore(subscribeToHashChange, currentHash, () => '');
  const [collapsed, setCollapsed] = useState(false);
  const reduceMotion = useReducedMotion();
  const isAdmin = access.role === 'admin';
  const navigation = isAdmin
    ? [
        ...commonNavigation.slice(0, 2),
        { href: '/dashboard/challenges', labelKey: 'dashboard.nav.challenges' as const, icon: Trophy },
        { href: '/dashboard#content', labelKey: 'dashboard.nav.artworks' as const, icon: FileImage },
        { href: '/dashboard#users', labelKey: 'dashboard.nav.users' as const, icon: Users },
        commonNavigation[2],
      ]
    : commonNavigation;

  const isNavigationActive = (href: string) => {
    const [targetPath, targetHash = ''] = href.split('#');
    if (targetHash) {
      if (pathname !== targetPath) return false;
      return targetHash === 'overview'
        ? !hash || hash === '#overview'
        : hash === `#${targetHash}`;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-dvh bg-[#f4f6f9] text-[#172033] dark:bg-bg dark:text-text">
      <div
        className={cn(
          'mx-auto grid min-h-dvh max-w-[1680px]',
          collapsed ? 'lg:grid-cols-[72px_minmax(0,1fr)]' : 'lg:grid-cols-[220px_minmax(0,1fr)]',
        )}
      >
        <aside
          className={cn(
            'relative hidden border-e border-[#e5e9f0] bg-white py-5 dark:border-border dark:bg-card lg:flex lg:flex-col',
            collapsed ? 'px-2' : 'px-4',
          )}
        >
          <Link
            href="/dashboard"
            aria-label={collapsed ? 'PixAnony' : undefined}
            className={cn('flex min-h-10 items-center py-1', collapsed ? 'justify-center' : 'px-2')}
          >
            <Logo size="md" showText={!collapsed} priority />
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? t('dashboard.sidebar.expand') : t('dashboard.sidebar.collapse')}
            aria-expanded={!collapsed}
            aria-controls="dashboard-sidebar-navigation"
            title={collapsed ? t('dashboard.sidebar.expand') : t('dashboard.sidebar.collapse')}
            className="absolute -end-3 top-7 z-50 flex size-7 items-center justify-center rounded-full border border-[#e5e9f0] bg-white text-[#687386] shadow-sm transition-[transform,color] duration-150 hover:scale-105 hover:text-[#005efe] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005efe] motion-reduce:transition-none dark:border-border dark:bg-card dark:text-text-muted dark:hover:text-primary"
          >
            <SidebarSimple size={14} weight={collapsed ? 'fill' : 'regular'} />
          </button>

          <div className={cn('mt-8 px-2', collapsed && 'hidden')}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a94a6] dark:text-text-muted">
              {t('dashboard.staffWorkspace')}
            </p>
            <div className="mt-3 rounded-2xl border border-[#e8ebf1] bg-[#f8f9fb] p-3 dark:border-border dark:bg-surface">
              <span className="inline-flex rounded-full bg-[#eaf1ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#005efe] dark:bg-primary/15 dark:text-primary">
                {access.role}
              </span>
              <p className="mt-2 text-xs leading-5 text-[#657087] dark:text-text-muted">
                {isAdmin ? t('dashboard.platformAccess') : t('dashboard.moderationAccess')}
              </p>
            </div>
          </div>

          <nav
            id="dashboard-sidebar-navigation"
            className={cn('space-y-1', collapsed ? 'mt-8' : 'mt-7')}
            aria-label={t('dashboard.navigation')}
          >
            {navigation.map(({ href, labelKey, icon: Icon }) => {
              const label = t(labelKey);
              const active = isNavigationActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={notifyAfterNavigation}
                  aria-label={collapsed ? label : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex h-10 items-center rounded-xl text-sm font-semibold transition-colors duration-150',
                    collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                    active
                      ? 'bg-[#eef3ff] text-[#005efe] dark:bg-primary/12 dark:text-primary'
                      : 'text-[#687386] hover:bg-[#f4f6f9] hover:text-[#172033] dark:text-text-muted dark:hover:bg-surface dark:hover:text-text',
                  )}
                >
                  <Icon className="shrink-0" size={18} weight={active ? 'fill' : 'regular'} />
                  <span
                    aria-hidden={collapsed}
                    className={cn(
                      'truncate transition-[opacity,transform] duration-150 motion-reduce:transition-none',
                      collapsed ? 'pointer-events-none absolute -translate-x-1 opacity-0 rtl:translate-x-1' : 'translate-x-0 opacity-100',
                    )}
                  >
                    {label}
                  </span>
                  {collapsed && (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute start-full z-50 ms-2 -translate-x-1 whitespace-nowrap rounded-lg bg-[#172033] px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-sm transition-[opacity,transform] duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none rtl:translate-x-1 dark:bg-white dark:text-[#172033]"
                    >
                      {label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className={cn('mt-auto pt-8', collapsed ? 'flex flex-col items-center' : 'space-y-4')}>
            {!collapsed && <ThemeToggle />}
            <Link
              href="/home"
              aria-label={collapsed ? t('dashboard.backToPixAnony') : undefined}
              className={cn(
                'group relative flex h-10 items-center rounded-xl border border-[#e5e9f0] text-sm font-semibold text-[#657087] transition-colors duration-150 hover:bg-[#f4f6f9] dark:border-border dark:text-text-muted dark:hover:bg-surface',
                collapsed ? 'size-10 justify-center px-0' : 'gap-2 px-3',
              )}
            >
              <ArrowLeft size={16} className="rtl-flip" />
              {!collapsed && <span className="truncate">{t('dashboard.backToPixAnony')}</span>}
              {collapsed && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute start-full z-50 ms-2 -translate-x-1 whitespace-nowrap rounded-lg bg-[#172033] px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-sm transition-[opacity,transform] duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none rtl:translate-x-1 dark:bg-white dark:text-[#172033]"
                >
                  {t('dashboard.backToPixAnony')}
                </span>
              )}
            </Link>
          </div>
        </aside>

        <motion.div
          layout="position"
          initial={false}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' }}
          className="min-w-0"
        >
          <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-4 border-b border-[#e5e9f0] bg-white/90 px-4 backdrop-blur-xl dark:border-border dark:bg-card/90 sm:px-6 lg:px-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#005efe]">{t('dashboard.staff')}</p>
              <h1 className="text-base font-bold text-[#172033] dark:text-text">
                {isAdmin ? t('dashboard.adminTitle') : t('dashboard.moderatorTitle')}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/home"
                className="flex h-10 items-center gap-2 rounded-full border border-[#e5e9f0] bg-white px-3.5 text-xs font-semibold text-[#657087] dark:border-border dark:bg-card dark:text-text-muted lg:hidden"
              >
                <ArrowLeft size={15} className="rtl-flip" />
                PixAnony
              </Link>
              <span className="hidden rounded-full bg-[#eef3ff] px-3 py-2 text-xs font-bold capitalize text-[#005efe] dark:bg-primary/12 dark:text-primary sm:inline">
                {access.role}
              </span>
            </div>
          </header>

          <nav className="flex gap-2 overflow-x-auto border-b border-[#e5e9f0] bg-white px-4 py-2 dark:border-border dark:bg-card lg:hidden" aria-label={t('dashboard.navigation')}>
            {navigation.map(({ href, labelKey }) => (
              <Link
                key={href}
                href={href}
                onClick={notifyAfterNavigation}
                aria-current={isNavigationActive(href) ? 'page' : undefined}
                className={cn(
                  'shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition-colors duration-150',
                  isNavigationActive(href)
                    ? 'bg-[#eef3ff] text-[#005efe] dark:bg-primary/12 dark:text-primary'
                    : 'bg-[#f4f6f9] text-[#657087] dark:bg-surface dark:text-text-muted',
                )}
              >
                {t(labelKey)}
              </Link>
            ))}
          </nav>

          <main id="main-content" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </motion.div>
      </div>
    </div>
  );
}
