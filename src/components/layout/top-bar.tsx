'use client';

import Link from 'next/link';
import { Search, Plus, Bell, LogIn } from '@/components/ui/icons';
import { Logo } from '@/components/ui/logo';
import { UserMenu } from '@/components/auth/user-menu';
import { useAuthProfile } from '@/hooks/use-auth-profile';

export function TopBar() {
  const { profile, isAuthenticated, signOut } = useAuthProfile();
  const createHref = isAuthenticated ? '/paint' : '/login?next=%2Fpaint';

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/70 bg-[var(--glass-bg)] px-4 backdrop-blur-2xl lg:hidden">
      <Link href="/home" aria-label="PixAnony home" className="shrink-0">
        <Logo size="sm" showText={false} />
      </Link>
      <Link
        href="/explore"
        className="group flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-border bg-card/80 px-3.5 text-sm text-text-muted transition-all duration-200 hover:border-primary/30 hover:bg-card hover:text-text"
      >
        <Search size={15} className="shrink-0 text-text-muted/70 transition-colors group-hover:text-primary/70" />
        <span className="truncate">Search art and creators</span>
      </Link>
      <Link
        href={createHref}
        aria-label="Create pixel art"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-[0_12px_28px_rgba(124,58,237,0.2)] transition-all duration-200 hover:bg-primary-glow active:scale-95"
      >
        <Plus size={19} />
      </Link>
      {profile ? (
        <>
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent text-text-muted transition-all duration-200 hover:border-border hover:bg-card hover:text-text"
          >
            <Bell size={19} />
          </Link>
          <UserMenu profile={profile} signOut={signOut} compact />
        </>
      ) : (
        <Link
          href="/login"
          aria-label="Sign in"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-text-muted transition-all duration-200 hover:bg-card-hover hover:text-text"
        >
          <LogIn size={17} />
        </Link>
      )}
    </header>
  );
}
