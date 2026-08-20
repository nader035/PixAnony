import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getAccessContext, hasAccess } from '@/lib/auth/access';

export const metadata: Metadata = {
  title: 'Staff dashboard',
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const access = await getAccessContext();
  if (!access) redirect('/login?next=%2Fdashboard');
  if (!hasAccess(access, 'dashboard.access')) redirect('/home');

  return <DashboardShell access={access}>{children}</DashboardShell>;
}
