'use client';

import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '';

  // Immersive editor pages have custom full-screen layouts
  const isImmersivePage = pathname === '/paint' || pathname.startsWith('/send/') || pathname === '/confirm';
  
  if (isImmersivePage) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-bg text-text">{children}</div>
      </AuthGuard>
    );
  }

  // Standard pages get the default 3-column shell
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
