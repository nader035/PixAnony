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
      <div className="pointer-events-none fixed inset-0 z-0 pixel-grid-plane opacity-[0.16]" aria-hidden="true" />
      <div
        className={cn(
          'app-shell-grid relative z-10 min-h-screen w-full',
          showRightSidebar ? 'app-shell-grid--right' : 'app-shell-grid--plain',
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
