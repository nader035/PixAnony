'use client';

import Link from 'next/link';
import { Search, Plus, Bell } from '@/components/ui/icons';
import { Logo } from '@/components/ui/logo';

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/80 bg-[var(--glass-bg)] px-4 backdrop-blur-2xl lg:hidden">
      <Link href="/home" aria-label="PixAnony home">
        <Logo size="sm" showText={false} />
      </Link>
      <Link
        href="/explore"
        className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-surface/75 px-3 text-sm text-text-muted"
      >
        <Search size={16} />
        <span className="truncate">Search art and creators</span>
      </Link>
      <Link href="/paint" aria-label="Create pixel art" className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
        <Plus size={19} />
      </Link>
      <Link href="/notifications" aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-xl text-text-muted hover:bg-card hover:text-text">
        <Bell size={19} />
      </Link>
    </header>
  );
}
