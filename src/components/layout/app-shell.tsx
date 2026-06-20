'use client';

import { Sidebar } from './sidebar';
import { RightSidebarPanel } from './right-sidebar-panel';
import { MobileNav } from './mobile-nav';
import { TopBar } from './top-bar';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  showRightSidebar?: boolean;
  className?: string;
}

export function AppShell({
  children,
  showRightSidebar = true,
  className,
}: AppShellProps) {
  return (
    <div className="app-backdrop min-h-screen w-full bg-bg">
      <div
        className={cn(
          'mx-auto grid min-h-screen w-full max-w-[1436px] grid-cols-1',
          'lg:grid-cols-[224px_minmax(0,1fr)] lg:gap-5 lg:px-4',
          showRightSidebar
            ? '2xl:grid-cols-[224px_minmax(0,820px)_296px] 2xl:gap-6 2xl:px-6'
            : '2xl:grid-cols-[224px_minmax(0,1040px)] 2xl:gap-7 2xl:px-6',
        )}
      >
        <Sidebar />

        <main
          className={cn(
            'min-w-0 pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pb-0',
            className,
          )}
        >
          <TopBar />
          <div className="w-full min-w-0">{children}</div>
        </main>

        {showRightSidebar && <RightSidebarPanel />}
      </div>

      <MobileNav />
    </div>
  );
}
