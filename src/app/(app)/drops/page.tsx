'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Inbox,
  LockKeyhole,
  Paintbrush,
  Send,
  Sparkles,
  ArrowRight,
  BadgeCheck,
} from '@/components/ui/icons';
import { PageFrame, PageHeader } from '@/components/ui/page-layout';
import { PixelArtRenderer } from '@/components/ui/pixel-art-renderer';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { createClient } from '@/lib/supabase/client';
import { useAuthProfile } from '@/hooks/use-auth-profile';
import { formatTimeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';

type DropArtwork = {
  id: string;
  title: string | null;
  caption: string | null;
  pixel_data: unknown;
  grid_size: number;
  created_at: string | null;
  is_anonymous: boolean;
  profile: { username: string; display_name: string; avatar_url: string | null; is_verified: boolean } | null;
};

type TabId = 'received' | 'sent';

export default function DropsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { profile, user } = useAuthProfile();
  const [activeTab, setActiveTab] = useState<TabId>('received');
  const [received, setReceived] = useState<DropArtwork[]>([]);
  const [sent, setSent] = useState<DropArtwork[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDrops = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const [receivedResult, sentResult] = await Promise.all([
      supabase
        .from('artworks')
        .select('id, title, caption, pixel_data, grid_size, created_at, is_anonymous, profile:profiles!artworks_user_id_fkey(username, display_name, avatar_url, is_verified)')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('artworks')
        .select('id, title, caption, pixel_data, grid_size, created_at, is_anonymous, profile:profiles!artworks_user_id_fkey(username, display_name, avatar_url, is_verified)')
        .eq('user_id', user.id)
        .not('receiver_id', 'is', null)
        .order('created_at', { ascending: false }),
    ]);

    setReceived((receivedResult.data as unknown as DropArtwork[]) ?? []);
    setSent((sentResult.data as unknown as DropArtwork[]) ?? []);
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    void loadDrops();
  }, [loadDrops]);

  const drops = activeTab === 'received' ? received : sent;

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'received', label: 'Received', count: received.length },
    { id: 'sent', label: 'Sent', count: sent.length },
  ];

  return (
    <PageFrame width="wide">
      <PageHeader
        eyebrow="Private collection"
        title="Private Drops"
        description="Pixel art sent directly between creators. Received drops and artwork you've sent privately."
        actions={
          profile ? (
            <Link
              href={`/profile/${profile.username}`}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5',
                'bg-primary text-sm font-semibold text-white',
                'shadow-[0_12px_28px_rgba(124,58,237,0.18)] transition-all duration-200',
                'hover:-translate-y-0.5 hover:bg-primary-glow active:translate-y-0',
              )}
            >
              <Send size={14} />
              Share profile
            </Link>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-1.5 rounded-xl border border-border bg-surface/60 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200',
              activeTab === tab.id
                ? 'bg-card text-text shadow-sm'
                : 'text-text-muted hover:text-text',
            )}
          >
            {tab.label}
            {!loading && (
              <span className={cn(
                'ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                activeTab === tab.id ? 'bg-primary/12 text-primary' : 'bg-surface text-text-muted',
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : drops.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drops.map((artwork, index) => {
            const senderProfile = Array.isArray(artwork.profile) ? artwork.profile[0] : artwork.profile;
            return (
              <Link
                key={artwork.id}
                href={`/art/${artwork.id}`}
                className="group surface-panel interactive-surface overflow-hidden rounded-2xl"
              >
                <div className="relative aspect-square bg-surface p-4">
                  <PixelArtRenderer
                    pixels={Array.isArray(artwork.pixel_data) ? artwork.pixel_data as string[] : []}
                    gridSize={artwork.grid_size}
                    className="h-full w-full"
                  />
                  {index === 0 && (
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-primary/25 bg-bg/80 px-2 py-1 text-[10px] font-semibold text-primary backdrop-blur">
                      <Sparkles size={11} />
                      Latest
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="truncate text-sm font-semibold text-text">
                    {artwork.title || 'Anonymous artwork'}
                  </h2>
                  {artwork.caption && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-muted">{artwork.caption}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-text-muted">
                    {artwork.is_anonymous ? (
                      <span className="flex items-center gap-1">
                        <LockKeyhole size={12} />
                        Anonymous
                      </span>
                    ) : (
                      <span className="flex min-w-0 items-center gap-2">
                        <PixelAvatar
                          username={senderProfile?.username || 'sender'}
                          src={senderProfile?.avatar_url ?? null}
                          size="xs"
                          showBadge={false}
                        />
                        <span className="min-w-0 truncate">
                          {senderProfile?.display_name || senderProfile?.username || 'Signed sender'}
                        </span>
                        {senderProfile?.is_verified && (
                          <BadgeCheck size={11} className="shrink-0 text-primary" />
                        )}
                      </span>
                    )}
                    <span>{formatTimeAgo(artwork.created_at ?? new Date().toISOString())}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 text-center">
          <Inbox size={30} className="mb-4 text-primary" />
          <h2 className="text-lg font-semibold text-text">
            {activeTab === 'received' ? 'Your private inbox is empty' : 'No sent drops yet'}
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">
            {activeTab === 'received'
              ? 'Share your profile link so other creators can send anonymous or signed pixel art.'
              : 'Use the pixel editor to create and send private artwork to other creators.'}
          </p>
          <Link
            href={activeTab === 'received' && profile ? `/profile/${profile.username}` : '/paint'}
            className={cn(
              'mt-6 flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200',
              activeTab === 'received'
                ? 'border border-border bg-card text-text hover:bg-card-hover'
                : 'bg-primary text-white hover:bg-primary-glow',
            )}
          >
            {activeTab === 'received' ? (
              <>View your profile</>
            ) : (
              <>
                <Paintbrush size={15} />
                Create artwork
                <ArrowRight size={13} />
              </>
            )}
          </Link>
        </div>
      )}
    </PageFrame>
  );
}
