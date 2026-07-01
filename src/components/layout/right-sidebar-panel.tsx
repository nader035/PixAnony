'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Heart,
  Palette,
  Sparkles,
  TrendingUp,
  Users,
} from '@/components/ui/icons';
import { createClient } from '@/lib/supabase/client';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { formatNumber } from '@/lib/utils';

type TrendingArtwork = {
  id: string;
  title: string | null;
  likes_count: number | null;
  profile: { username: string } | null;
};

type SuggestedProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
};

export function RightSidebarPanel() {
  const supabase = useMemo(() => createClient(), []);
  const [artworks, setArtworks] = useState<TrendingArtwork[]>([]);
  const [profiles, setProfiles] = useState<SuggestedProfile[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [{ data: artworkData }, { data: profileData }] = await Promise.all([
        supabase
          .from('artworks')
          .select('id, title, likes_count, profile:profiles!artworks_user_id_fkey(username)')
          .eq('visibility', 'public')
          .order('likes_count', { ascending: false })
          .limit(5),
        supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, is_verified')
          .order('created_at', { ascending: false })
          .limit(4),
      ]);
      if (!active) return;
      setArtworks((artworkData as unknown as TrendingArtwork[]) ?? []);
      setProfiles(profileData ?? []);
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  return (
    <aside className="page-enter sticky top-0 hidden h-svh min-w-0 overflow-y-auto border-l border-border/70 bg-bg/55 px-4 py-5 2xl:flex 2xl:flex-col 2xl:gap-4">
      <section className="surface-panel rounded-2xl p-4">
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/12">
              <TrendingUp size={14} className="text-primary" />
            </span>
            <h2 className="text-[13px] font-semibold text-text">Trending artwork</h2>
          </div>
          <Link href="/explore?filter=trending" className="text-xs font-semibold text-primary hover:text-primary-glow transition-colors">
            View all
          </Link>
        </div>
        {artworks.length ? (
          <div className="space-y-0.5">
            {artworks.map((artwork, index) => (
              <Link
                key={artwork.id}
                href={`/art/${artwork.id}`}
                className="group flex items-center gap-3 rounded-xl p-2.5 transition-all duration-200 hover:bg-card-hover"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-surface/80 text-[11px] font-semibold text-text-muted">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-text group-hover:text-primary transition-colors">
                    {artwork.title || 'Untitled pixel art'}
                  </p>
                  <p className="truncate text-[11px] text-text-muted mt-0.5">
                    @{artwork.profile?.username || 'creator'}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-text-muted">
                  <Heart size={11} className="text-pink/60" />
                  {formatNumber(artwork.likes_count ?? 0)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-surface/70 p-3.5 text-xs leading-5 text-text-muted">
            Trending work will appear after creators publish public artwork.
          </p>
        )}
      </section>

      <section className="surface-panel rounded-2xl p-4">
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan/12">
              <Users size={14} className="text-cyan" />
            </span>
            <h2 className="text-[13px] font-semibold text-text">New creators</h2>
          </div>
          <Link href="/explore" className="text-xs font-semibold text-primary hover:text-primary-glow transition-colors">
            Explore
          </Link>
        </div>
        {profiles.length ? (
          <div className="space-y-0.5">
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/profile/${profile.username}`}
                className="group flex items-center gap-3 rounded-xl p-2.5 transition-all duration-200 hover:bg-card-hover"
              >
                <PixelAvatar
                  username={profile.username}
                  src={profile.avatar_url}
                  size="sm"
                  isVerified={profile.is_verified}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-text group-hover:text-primary transition-colors">{profile.display_name}</p>
                  <p className="truncate text-[11px] text-text-muted mt-0.5">@{profile.username}</p>
                </div>
                <ArrowRight size={12} className="text-text-muted/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary/60" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-surface/70 p-3.5 text-xs leading-5 text-text-muted">
            Creator recommendations will appear as profiles join.
          </p>
        )}
      </section>

      <Link
        href="/paint"
        className="group interactive-surface rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-pink/6 p-4"
      >
        <span className="mb-2.5 flex items-center gap-2.5 text-sm font-semibold text-text">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink/20 to-primary/20">
            <Palette size={15} className="text-pink" />
          </span>
          Open the pixel editor
        </span>
        <span className="block text-xs leading-5 text-text-muted">
          Publish to your profile or send an anonymous piece.
        </span>
        <span className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors group-hover:text-primary-glow">
          <Sparkles size={12} />
          Start drawing
          <ArrowRight size={11} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </Link>

      <div className="mt-auto surface-panel rounded-2xl p-3.5">
        <ThemeToggle showLabel />
      </div>
    </aside>
  );
}
