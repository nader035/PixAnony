'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BellOff, Heart, Inbox, MailOpen, MessageSquare, Repeat2, Trash2, UserPlus } from '@/components/ui/icons';
import { createClient } from '@/lib/supabase/client';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { PageFrame, PageHeader } from '@/components/ui/page-layout';
import { formatNumber, formatTimeAgo } from '@/lib/utils';
import { toast } from 'sonner';
import { useNotificationCenter } from '@/components/notifications/notification-center';
import { useI18n } from '@/components/i18n/locale-provider';

type NotificationRow = {
  id: string;
  type: string;
  read: boolean;
  created_at: string;
  actor: { username: string; display_name: string; avatar_url: string | null } | null;
  artwork: { id: string; title: string | null } | null;
};

function notificationDetail(item: NotificationRow, t: ReturnType<typeof useI18n>['t']) {
  if (item.type === 'like') return { icon: Heart, text: t('notifications.like') };
  if (item.type === 'repost') return { icon: Repeat2, text: t('notifications.repost') };
  if (item.type === 'follow') return { icon: UserPlus, text: t('notifications.follow') };
  if (item.type === 'comment') return { icon: MessageSquare, text: t('notifications.comment') };
  if (item.type === 'mention') return { icon: MessageSquare, text: t('notifications.mention') };
  if (item.type === 'received_pixel') {
    return { icon: Inbox, text: item.actor ? t('notifications.receivedSigned') : t('notifications.receivedAnonymous') };
  }
  return { icon: Inbox, text: t('notifications.update') };
}

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { refreshUnread } = useNotificationCenter();
  const { t, locale } = useI18n();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const markLoadedNotificationsSeen = useCallback(async (ownerId: string, ids: string[]) => {
    if (!ids.length) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', ownerId)
      .in('id', ids);
    if (!error) await refreshUnread();
  }, [refreshUnread, supabase]);

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setErrorMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/login?next=%2Fnotifications');
      return;
    }

    setUserId(user.id);
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, read, created_at, actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url), artwork:artworks(id, title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      setErrorMessage(error.message);
      if (showLoading) setItems([]);
      setLoading(false);
      return;
    }

    const nextItems = (data as unknown as NotificationRow[]) ?? [];
    setItems(nextItems);
    setLoading(false);

    // Visiting the notification center marks the loaded batch as seen in the
    // database, while preserving its "new" styling for this visit.
    const unreadIds = nextItems.filter((item) => !item.read).map((item) => item.id);
    void markLoadedNotificationsSeen(user.id, unreadIds);
  }, [markLoadedNotificationsSeen, router, supabase]);

  useEffect(() => {
    // This effect synchronizes the page with the authenticated Supabase session.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(true);
  }, [load]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-page:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => void load())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => void load())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, supabase, userId]);

  const markOneRead = (id: string) => {
    const item = items.find((candidate) => candidate.id === id);
    if (!item || item.read || !userId) return;
    setItems((current) => current.map((candidate) => candidate.id === id ? { ...candidate, read: true } : candidate));
    void supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .then(() => refreshUnread());
  };

  const markAllRead = async () => {
    if (!userId || !items.some((item) => !item.read)) return;
    setBusy(true);
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    setBusy(false);
    if (error) return toast.error(error.message);
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    await refreshUnread();
    toast.success(t('notifications.markedRead'));
  };

  const clearAll = async () => {
    if (!userId || !items.length) return;
    setBusy(true);
    const { error } = await supabase.from('notifications').delete().eq('user_id', userId);
    setBusy(false);
    if (error) return toast.error(error.message);
    setItems([]);
    await refreshUnread();
    toast.success(t('notifications.cleared'));
  };

  const newCount = items.filter((item) => !item.read).length;

  return (
    <PageFrame width="compact">
      <PageHeader
        eyebrow={t('notifications.eyebrow')}
        title={t('notifications.title')}
        description={newCount > 0 ? t('notifications.newCount', { count: formatNumber(newCount, locale) }) : t('notifications.description')}
        actions={items.length > 0 ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={busy || newCount === 0}
              aria-label={t('notifications.markAll')}
              title={t('notifications.markAll')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-text-muted transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MailOpen size={17} />
            </button>
            <button
              type="button"
              onClick={() => void clearAll()}
              disabled={busy}
              aria-label={t('notifications.clearAll')}
              title={t('notifications.clearAll')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-text-muted transition-colors hover:text-red disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ) : undefined}
      />

      {loading ? (
        <div className="space-y-3" aria-label={t('notifications.loading')}>
          {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl border border-border bg-card" />)}
        </div>
      ) : errorMessage ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-red/35 bg-red/5 px-6 text-center">
          <BellOff size={30} className="mb-4 text-red" />
          <h2 className="text-lg font-semibold text-text">{t('notifications.loadErrorTitle')}</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">{errorMessage}</p>
          <button type="button" onClick={() => void load(true)} className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">{t('common.tryAgain')}</button>
        </div>
      ) : items.length ? (
        <div className="space-y-2" role="list" aria-label={t('notifications.list')}>
          {items.map((item) => {
            const { icon: Icon, text } = notificationDetail(item, t);
            const href = item.artwork?.id ? `/art/${item.artwork.id}` : item.actor?.username ? `/profile/${item.actor.username}` : '/notifications';
            return (
              <Link
                key={item.id}
                href={href}
                onClick={() => markOneRead(item.id)}
                role="listitem"
                className={`interactive-surface relative flex items-start gap-3 rounded-[24px] p-3.5 sm:items-center sm:gap-4 sm:p-4 ${item.read ? 'bg-surface' : 'bg-[var(--powder)] shadow-[0_10px_30px_rgba(16,43,94,.09)]'}`}
              >
                {!item.read && <span className="absolute end-3 top-3 h-2 w-2 rounded-full bg-primary sm:end-4 sm:top-4" aria-label={t('notifications.new')} />}
                <div className="relative">
                  <PixelAvatar username={item.actor?.username || 'anonymous'} src={item.actor?.avatar_url} size="md" />
                  <span className="absolute -bottom-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-primary"><Icon size={11} /></span>
                </div>
                <div className="min-w-0 flex-1 pe-3">
                  <p className="text-sm text-text">
                    <strong>{item.actor?.display_name || (item.type === 'received_pixel' ? t('notifications.someone') : t('notifications.aCreator'))}</strong>{' '}
                    <span className="text-text-muted">{text}</span>
                  </p>
                  {item.artwork?.title && <p className="mt-1 truncate text-xs text-text-muted">{item.artwork.title}</p>}
                </div>
                <time dateTime={item.created_at} className="shrink-0 pt-0.5 text-[11px] text-text-muted sm:pt-0">{formatTimeAgo(item.created_at, locale)}</time>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 text-center">
          <BellOff size={30} className="mb-4 text-primary" />
          <h2 className="text-lg font-semibold text-text">{t('notifications.emptyTitle')}</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">{t('notifications.emptyDescription')}</p>
          <Link href="/home" className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">{t('bookmarks.browse')}</Link>
        </div>
      )}
    </PageFrame>
  );
}
