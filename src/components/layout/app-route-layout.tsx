'use client';

import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { AuthGuard } from '@/components/auth/auth-guard';

export function AppRouteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isImmersivePage = pathname === '/paint' || pathname.startsWith('/send/') || pathname === '/confirm';

  if (isImmersivePage) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-bg text-text">{children}</div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
