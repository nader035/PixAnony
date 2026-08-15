'use client';

import Link from 'next/link';
import { Search, Plus, Bell, LogIn } from '@/components/ui/icons';
import { Logo } from '@/components/ui/logo';
import { UserMenu } from '@/components/auth/user-menu';
import { useAuthProfile } from '@/hooks/use-auth-profile';
import { useNotificationCenter } from '@/components/notifications/notification-center';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { useI18n } from '@/components/i18n/locale-provider';
import { formatNumber } from '@/lib/utils';

export function TopBar() {
  const { profile, isAuthenticated, signOut } = useAuthProfile();
  const { unreadCount } = useNotificationCenter();
  const { locale, t } = useI18n();
  const createHref = isAuthenticated ? '/paint' : '/login?next=%2Fpaint';

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-2 bg-[var(--glass-bg)] px-3 backdrop-blur-2xl sm:gap-3 sm:px-4 lg:hidden">
      <Link href="/home" aria-label={t('common.pixanonyHome')} className="shrink-0">
        <Logo size="sm" showText={false} priority />
      </Link>
      <Link
        href="/explore"
        className="group flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-surface px-3 text-sm text-text-muted transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-card-hover hover:text-text sm:gap-2.5 sm:px-3.5"
      >
        <Search size={15} className="shrink-0 text-text-muted/70 transition-colors group-hover:text-primary/70" />
        <span className="truncate max-[379px]:hidden">{t('nav.searchLong')}</span>
        <span className="hidden truncate max-[379px]:inline">{t('nav.searchShort')}</span>
      </Link>
      <Link
        href={createHref}
        aria-label={t('nav.createArt')}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-bg shadow-[0_12px_28px_rgba(44,40,58,0.14)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-95"
      >
        <Plus size={19} />
      </Link>
      {profile ? (
        <>
          <Link
            href="/notifications"
            aria-label={t('nav.notifications')}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent text-text-muted transition-all duration-200 hover:border-border hover:bg-card hover:text-text max-[359px]:hidden"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute end-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[9px] font-bold text-white ring-2 ring-[var(--glass-bg)]">
                {unreadCount > 9 ? (locale === 'ar' ? '+٩' : '9+') : formatNumber(unreadCount, locale)}
              </span>
            )}
          </Link>
          <UserMenu profile={profile} signOut={signOut} compact />
        </>
      ) : (
        <Link
          href="/login"
          aria-label={t('nav.signIn')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-text-muted transition-all duration-200 hover:bg-card-hover hover:text-text"
        >
          <LogIn size={17} />
        </Link>
      )}
      <LanguageSwitcher showLabel={false} className="h-10 w-10 shrink-0 px-0 max-[419px]:hidden" />
    </header>
  );
}
