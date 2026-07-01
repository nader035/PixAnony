'use client';

import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  const pathname = usePathname();

  return (
    <div className="app-backdrop min-h-screen w-full bg-bg">
      <div className="pointer-events-none fixed inset-0 z-0 dot-grid opacity-30" aria-hidden="true" />
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
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0.85, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0.85, y: -4 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="w-full min-w-0"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {showRightSidebar && <RightSidebarPanel />}
      </div>

      <MobileNav />
    </div>
  );
}
