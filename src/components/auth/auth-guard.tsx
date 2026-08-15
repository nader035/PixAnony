'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from '@/components/ui/icons';
import { useAuthProfile } from '@/hooks/use-auth-profile';
import { useI18n } from '@/components/i18n/locale-provider';

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
  const { t } = useI18n();
  const protectedRoute = isProtectedPath(pathname);

  useEffect(() => {
    if (!protectedRoute || loading || isAuthenticated) return;
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isAuthenticated, loading, pathname, protectedRoute, router]);

  if (protectedRoute && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-text">
        <div className="flex flex-col items-center gap-3 rounded-[28px] bg-card px-8 py-7 shadow-float">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm font-semibold text-text-muted">{t('auth.checking')}</p>
        </div>
      </div>
    );
  }

  if (protectedRoute && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-text">
        <div className="flex flex-col items-center gap-3 rounded-[28px] bg-card px-8 py-7 shadow-float">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm font-semibold text-text-muted">{t('auth.redirecting')}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
