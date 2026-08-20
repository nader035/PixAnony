import Link from 'next/link';
import {
  ArrowLeft,
  FileImage,
  Home,
  MessageSquare,
  Shield,
  Users,
} from '@/components/ui/icons';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { AccessContext } from '@/lib/auth/access';
import { cn } from '@/lib/utils';

const commonNavigation = [
  { href: '#overview', label: 'Overview', icon: Home },
  { href: '#reports', label: 'Reports', icon: MessageSquare },
  { href: '#activity', label: 'Activity', icon: Shield },
];

export function DashboardShell({
  access,
  children,
}: {
  access: AccessContext;
  children: React.ReactNode;
}) {
  const isAdmin = access.role === 'admin';
  const navigation = isAdmin
    ? [
        ...commonNavigation.slice(0, 2),
        { href: '#content', label: 'Pixel arts', icon: FileImage },
        { href: '#users', label: 'Users & roles', icon: Users },
        commonNavigation[2],
      ]
    : commonNavigation;

  return (
    <div className="min-h-dvh bg-[#f4f6f9] text-[#172033] dark:bg-bg dark:text-text">
      <div className="mx-auto grid min-h-dvh max-w-[1680px] lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden border-e border-[#e5e9f0] bg-white px-4 py-5 dark:border-border dark:bg-card lg:flex lg:flex-col">
          <Link href="/dashboard" className="px-2 py-1">
            <Logo size="md" priority />
          </Link>

          <div className="mt-8 px-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a94a6] dark:text-text-muted">
              Staff workspace
            </p>
            <div className="mt-3 rounded-2xl border border-[#e8ebf1] bg-[#f8f9fb] p-3 dark:border-border dark:bg-surface">
              <span className="inline-flex rounded-full bg-[#eaf1ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#005efe] dark:bg-primary/15 dark:text-primary">
                {access.role}
              </span>
              <p className="mt-2 text-xs leading-5 text-[#657087] dark:text-text-muted">
                {isAdmin ? 'Platform management access' : 'Moderation-only access'}
              </p>
            </div>
          </div>

          <nav className="mt-7 space-y-1" aria-label="Dashboard navigation">
            {navigation.map(({ href, label, icon: Icon }, index) => (
              <a
                key={href}
                href={href}
                className={cn(
                  'flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors',
                  index === 0
                    ? 'bg-[#eef3ff] text-[#005efe] dark:bg-primary/12 dark:text-primary'
                    : 'text-[#687386] hover:bg-[#f4f6f9] hover:text-[#172033] dark:text-text-muted dark:hover:bg-surface dark:hover:text-text',
                )}
              >
                <Icon size={17} weight={index === 0 ? 'fill' : 'regular'} />
                {label}
              </a>
            ))}
          </nav>

          <div className="mt-auto space-y-4 pt-8">
            <ThemeToggle />
            <Link
              href="/home"
              className="flex h-10 items-center gap-2 rounded-xl border border-[#e5e9f0] px-3 text-sm font-semibold text-[#657087] transition-colors hover:bg-[#f4f6f9] dark:border-border dark:text-text-muted dark:hover:bg-surface"
            >
              <ArrowLeft size={16} className="rtl-flip" />
              Back to PixAnony
            </Link>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-4 border-b border-[#e5e9f0] bg-white/90 px-4 backdrop-blur-xl dark:border-border dark:bg-card/90 sm:px-6 lg:px-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#005efe]">PixAnony staff</p>
              <h1 className="text-base font-bold text-[#172033] dark:text-text">
                {isAdmin ? 'Admin dashboard' : 'Moderator dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/home"
                className="flex h-10 items-center gap-2 rounded-full border border-[#e5e9f0] bg-white px-3.5 text-xs font-semibold text-[#657087] dark:border-border dark:bg-card dark:text-text-muted lg:hidden"
              >
                <ArrowLeft size={15} className="rtl-flip" />
                PixAnony
              </Link>
              <span className="hidden rounded-full bg-[#eef3ff] px-3 py-2 text-xs font-bold capitalize text-[#005efe] dark:bg-primary/12 dark:text-primary sm:inline">
                {access.role}
              </span>
            </div>
          </header>

          <nav className="flex gap-2 overflow-x-auto border-b border-[#e5e9f0] bg-white px-4 py-2 dark:border-border dark:bg-card lg:hidden" aria-label="Dashboard sections">
            {navigation.map(({ href, label }) => (
              <a key={href} href={href} className="shrink-0 rounded-full bg-[#f4f6f9] px-3 py-2 text-xs font-semibold text-[#657087] dark:bg-surface dark:text-text-muted">
                {label}
              </a>
            ))}
          </nav>

          <main id="main-content" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
