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
      <div
        className={cn(
          'app-shell-grid relative z-10 min-h-screen w-full',
          showRightSidebar ? 'app-shell-grid--right' : 'app-shell-grid--plain',
        )}
      >
        <Sidebar />

        <main
          id="main-content"
          className={cn(
            'min-w-0 overflow-hidden bg-card pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:min-h-[calc(100dvh-2rem)] lg:rounded-[32px] lg:pb-0 lg:shadow-[0_20px_70px_rgba(44,40,58,0.1)]',
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
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
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
