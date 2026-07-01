'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from '@/components/ui/icons';
import { useAuthProfile } from '@/hooks/use-auth-profile';

const protectedPrefixes = [
  '/home',
  '/paint',
  '/drops',
  '/notifications',
  '/bookmarks',
  '/challenges',
  '/settings',
];

function isProtectedPath(pathname: string) {
  if (protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  return /^\/profile\/[^/]+\/received(?:\/)?$/.test(pathname);
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { loading, isAuthenticated } = useAuthProfile();
  const protectedRoute = isProtectedPath(pathname);

  useEffect(() => {
    if (!protectedRoute || loading || isAuthenticated) return;
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isAuthenticated, loading, pathname, protectedRoute, router]);

  if (protectedRoute && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-text">
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card px-8 py-7 shadow-soft">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm font-semibold text-text-muted">Checking your PixAnony session...</p>
        </div>
      </div>
    );
  }

  if (protectedRoute && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-text">
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card px-8 py-7 shadow-soft">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm font-semibold text-text-muted">Taking you to sign in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
