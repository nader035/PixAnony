'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Plus, Bell, User, LogIn } from '@/components/ui/icons';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
      setUsername(data?.username ?? null);
    })();
  }, [supabase]);

  const items = [
    { label: 'Home', href: '/home', icon: Home },
    { label: 'Explore', href: '/explore', icon: Compass },
    { label: 'Create', href: '/paint', icon: Plus, center: true },
    { label: 'Alerts', href: '/notifications', icon: Bell },
    { label: username ? 'Profile' : 'Sign in', href: username ? `/@${username}` : '/login', icon: username ? User : LogIn },
  ];

  return (
    <nav className="safe-area-bottom fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-[var(--glass-bg)] backdrop-blur-2xl lg:hidden">
      <div className="mx-auto flex h-[4.25rem] max-w-lg items-center justify-around px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-w-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium',
                item.center && '-mt-5'
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center transition-all',
                  item.center
                    ? 'h-14 w-14 rounded-[18px] bg-gradient-to-br from-primary to-pink text-white shadow-[0_10px_28px_rgba(139,92,246,.34)]'
                    : active
                      ? 'text-primary'
                      : 'text-text-muted'
                )}
              >
                <Icon size={item.center ? 24 : 21} strokeWidth={active ? 2.5 : 2} />
              </span>
              {!item.center && <span className={active ? 'text-primary' : 'text-text-muted'}>{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
