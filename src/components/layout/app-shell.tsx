'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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

/* Lightweight content transition — respects prefers-reduced-motion. */
const contentVariants = {
  initial: { opacity: 0.92, y: 6 },
  animate: { opacity: 1, y: 0 },
};

const reducedMotionVariants = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0 },
};

export function AppShell({
  children,
  showRightSidebar = true,
  className,
}: AppShellProps) {
  const pathname = usePathname();

  /* Detect prefers-reduced-motion on client.
     Falls back to false during SSR so the animation markup is always present. */
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const variants = prefersReduced ? reducedMotionVariants : contentVariants;

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
          {/*
           * Replaced AnimatePresence mode="wait" + key={pathname} with a
           * simple motion.div that uses `key={pathname}` for enter-only
           * animation. AnimatePresence mode="wait" was causing a fatal
           * "removeChild" crash when server-side redirects produced rapid
           * key changes with no rendered DOM content in between (e.g. the
           * /drops page redirect). This approach:
           *  - Keeps smooth fade/slide entrance on route change
           *  - Sidebar & shell never remount
           *  - No DOM manipulation conflicts
           *  - Respects prefers-reduced-motion
           */}
          <motion.div
            key={pathname}
            variants={variants}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full min-w-0"
          >
            {children}
          </motion.div>
        </main>

        {showRightSidebar && <RightSidebarPanel />}
      </div>

      <MobileNav />
    </div>
  );
}
