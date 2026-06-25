'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BellOff, Heart, Inbox, MailOpen, MessageSquare, Repeat2, Trash2, UserPlus } from '@/components/ui/icons';
import { createClient } from '@/lib/supabase/client';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { PageFrame, PageHeader } from '@/components/ui/page-layout';
import { formatTimeAgo } from '@/lib/utils';
import { toast } from 'sonner';

type NotificationRow = {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  actor: { username: string; display_name: string; avatar_url: string | null } | null;
  artwork: { id: string; title: string | null } | null;
};

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    setUserId(user.id);
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, read, created_at, actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url), artwork:artworks(id, title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as unknown as NotificationRow[]) ?? []);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    // This effect synchronizes the page with the authenticated Supabase session.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, supabase, userId]);

  const markAllRead = async () => {
    if (!userId) return;
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    if (error) return toast.error(error.message);
    setItems((current) => current.map((item) => ({ ...item, read: true })));
  };

  const clearAll = async () => {
    if (!userId) return;
    const { error } = await supabase.from('notifications').delete().eq('user_id', userId);
    if (error) return toast.error(error.message);
    setItems([]);
  };

  const detail = (item: NotificationRow) => {
    if (item.type === 'like') return { icon: Heart, text: 'liked your artwork' };
    if (item.type === 'repost') return { icon: Repeat2, text: 'reposted your artwork' };
    if (item.type === 'follow') return { icon: UserPlus, text: 'started following you' };
    if (item.type === 'comment') return { icon: MessageSquare, text: 'commented on your artwork' };
    return { icon: Inbox, text: item.actor ? 'sent you signed pixel art' : 'sent you anonymous pixel art' };
  };

  return (
    <PageFrame width="compact">
      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        description="Likes, follows, comments, reposts, and received artwork."
        actions={items.length > 0 ? (
          <div className="flex gap-2">
            <button onClick={() => void markAllRead()} aria-label="Mark all read" className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-text-muted hover:text-text"><MailOpen size={17} /></button>
            <button onClick={() => void clearAll()} aria-label="Clear notifications" className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-text-muted hover:text-red"><Trash2 size={17} /></button>
          </div>
        ) : undefined}
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl border border-border bg-card" />)}
        </div>
      ) : items.length ? (
        <div className="space-y-2">
          {items.map((item) => {
            const { icon: Icon, text } = detail(item);
            const href = item.artwork?.id ? `/art/${item.artwork.id}` : item.actor?.username ? `/@${item.actor.username}` : '#';
            return (
              <Link
                key={item.id}
                href={href}
                className={`interactive-surface flex items-start gap-3 rounded-2xl border p-3.5 sm:items-center sm:gap-4 sm:p-4 ${item.read ? 'border-border bg-card/45' : 'border-primary/30 bg-primary/[0.07]'}`}
              >
                <div className="relative">
                  <PixelAvatar username={item.actor?.username || 'anonymous'} src={item.actor?.avatar_url} size="md" />
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-surface text-primary"><Icon size={11} /></span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text">
                    <strong>{item.actor?.display_name || 'Someone'}</strong>{' '}
                    <span className="text-text-muted">{text}</span>
                  </p>
                  {item.artwork?.title && <p className="mt-1 truncate text-xs text-text-muted">{item.artwork.title}</p>}
                </div>
                <time className="shrink-0 text-[11px] text-text-muted">{formatTimeAgo(item.created_at)}</time>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 text-center">
          <BellOff size={30} className="mb-4 text-primary" />
          <h2 className="text-lg font-semibold text-text">All quiet</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">New activity will appear here as people interact with your artwork.</p>
          <Link href="/home" className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">Browse feed</Link>
        </div>
      )}
    </PageFrame>
  );
}
