'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuthProfile } from '@/hooks/use-auth-profile';
import { createClient } from '@/lib/supabase/client';

type NotificationCenterValue = {
  unreadCount: number;
  refreshUnread: () => Promise<void>;
};

const NotificationCenterContext = createContext<NotificationCenterValue>({
  unreadCount: 0,
  refreshUnread: async () => {},
});

export function NotificationCenterProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const { user } = useAuthProfile();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (!error) setUnreadCount(count ?? 0);
  }, [supabase, user]);

  useEffect(() => {
    // The external Supabase unread count is synchronized when auth changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshUnread();
    if (!user) return;

    const channel = supabase
      .channel(`notification-center:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => void refreshUnread(),
      )
      .subscribe();

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refreshUnread();
    };
    const refreshOnFocus = () => void refreshUnread();
    const interval = window.setInterval(() => void refreshUnread(), 60_000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshOnFocus);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshOnFocus);
      void supabase.removeChannel(channel);
    };
  }, [refreshUnread, supabase, user]);

  return (
    <NotificationCenterContext.Provider value={{ unreadCount, refreshUnread }}>
      {children}
    </NotificationCenterContext.Provider>
  );
}

export function useNotificationCenter() {
  return useContext(NotificationCenterContext);
}
