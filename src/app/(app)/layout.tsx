import type { Metadata } from 'next';
import { AppRouteLayout } from '@/components/layout/app-route-layout';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppRouteLayout>{children}</AppRouteLayout>;
}
