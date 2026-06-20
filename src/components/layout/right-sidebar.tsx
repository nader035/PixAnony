'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  Heart,
  UserPlus,
  Paintbrush,
  ArrowRight,
  Monitor,
  Moon,
  Sun,
  Crown,
} from '@/components/ui/icons';
import { createClient } from '@/lib/supabase/client';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { AnimatedButton } from '@/components/ui/animated-button';
import { cn, formatNumber } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

const sidebarVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 28 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 30 },
  },
};

/* ------------------------------------------------------------------ */
/*  Theme Selector (inline, 3-column grid)                             */
/* ------------------------------------------------------------------ */

const themes = [
  { value: 'system', icon: Monitor, label: 'System' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'light', icon: Sun, label: 'Light' },
] as const;

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {themes.map((t) => (
          <div key={t.value} className="h-10 rounded-xl bg-surface" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {themes.map((t) => {
        const isActive = theme === t.value;
        const Icon = t.icon;

        return (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5',
              'text-xs font-medium transition-all duration-200',
              'border',
              isActive
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-border bg-surface text-text-muted hover:border-border hover:bg-card-hover hover:text-text',
            )}
            aria-label={`Set ${t.label} theme`}
          >
            {isActive && (
              <motion.div
                layoutId="sidebar-theme-active"
                className="absolute inset-0 rounded-xl border border-primary bg-primary/10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              <Icon size={16} />
            </span>
            <span className="relative z-10">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pixel decoration (small 4×4 pixel art for the Pro card)            */
/* ------------------------------------------------------------------ */

function PixelDecoration({ className }: { className?: string }) {
  const pixels = [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [0, 1, 1, 0],
  ];

  return (
    <div className={cn('grid grid-cols-4 gap-px opacity-40', className)}>
      {pixels.flat().map((on, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 w-1.5 rounded-[1px]',
            on ? 'bg-pink' : 'bg-transparent',
          )}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function RightSidebar() {
  const supabase = useMemo(() => createClient(), []);
  const [artworks, setArtworks] = useState<TrendingArtwork[]>([]);
  const [profiles, setProfiles] = useState<SuggestedProfile[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [{ data: artworkData }, { data: profileData }] =
        await Promise.all([
          supabase
            .from('artworks')
            .select(
              'id, title, likes_count, profile:profiles!artworks_user_id_fkey(username)',
            )
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
    <aside className="sticky top-0 hidden h-screen w-[320px] shrink-0 overflow-y-auto px-4 py-5 xl:flex xl:flex-col xl:gap-4 hide-scrollbar">
      <motion.div
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4"
      >
        {/* ─── 1. Trending Artwork ─────────────────────────── */}
        <motion.section
          variants={cardVariants}
          className="surface-panel rounded-2xl p-4"
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
                🔥
              </span>
              <h2 className="text-sm font-semibold text-text">
                Trending artwork
              </h2>
            </div>
            <Link
              href="/explore"
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all
            </Link>
          </div>

          {/* List */}
          {artworks.length ? (
            <motion.div
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              className="space-y-0.5"
            >
              {artworks.map((artwork, index) => (
                <motion.div key={artwork.id} variants={itemVariants}>
                  <Link
                    href={`/art/${artwork.id}`}
                    className="group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-card-hover"
                  >
                    {/* Rank number */}
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                        index === 0
                          ? 'bg-primary/15 text-primary'
                          : 'text-text-muted',
                      )}
                    >
                      {index + 1}
                    </span>

                    {/* Avatar */}
                    <PixelAvatar
                      username={artwork.profile?.username || 'anon'}
                      size="xs"
                      showBadge={false}
                    />

                    {/* Title & artist */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-text group-hover:text-primary transition-colors">
                        {artwork.title || 'Untitled pixel art'}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        @{artwork.profile?.username || 'creator'}
                      </p>
                    </div>

                    {/* Heart count */}
                    <span className="flex shrink-0 items-center gap-1 text-xs text-text-muted">
                      <Heart size={11} className="text-pink/70" />
                      {formatNumber(artwork.likes_count ?? 0)}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="rounded-xl bg-surface/70 p-3">
              <p className="text-xs leading-5 text-text-muted">
                Trending work will appear as the community starts publishing.
              </p>
            </div>
          )}
        </motion.section>

        {/* ─── 2. New Creators ─────────────────────────────── */}
        <motion.section
          variants={cardVariants}
          className="surface-panel rounded-2xl p-4"
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan/15">
                <UserPlus size={13} className="text-cyan" />
              </span>
              <h2 className="text-sm font-semibold text-text">New creators</h2>
            </div>
            <Link
              href="/explore/creators"
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all
            </Link>
          </div>

          {/* Creator cards */}
          {profiles.length ? (
            <motion.div
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              className="space-y-1"
            >
              {profiles.map((profile) => (
                <motion.div key={profile.id} variants={itemVariants}>
                  <div className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-card-hover">
                    <Link href={`/@${profile.username}`}>
                      <PixelAvatar
                        username={profile.username}
                        src={profile.avatar_url}
                        size="sm"
                        isVerified={profile.is_verified}
                      />
                    </Link>
                    <Link
                      href={`/@${profile.username}`}
                      className="min-w-0 flex-1"
                    >
                      <p className="truncate text-[13px] font-medium text-text">
                        {profile.display_name}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        @{profile.username}
                      </p>
                    </Link>
                    <AnimatedButton
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-lg px-3 text-[11px]"
                    >
                      Follow
                    </AnimatedButton>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="rounded-xl bg-surface/70 p-3">
              <p className="text-xs leading-5 text-text-muted">
                Creator recommendations will appear after the first profiles
                join.
              </p>
            </div>
          )}
        </motion.section>

        {/* ─── 3. Create Something Awesome CTA ─────────────── */}
        <motion.section variants={cardVariants}>
          <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-pink/10 to-cyan/5 p-[1px]">
            <div className="rounded-2xl bg-card p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-pink">
                <Paintbrush size={16} className="text-white" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-text">
                Create something awesome
              </h3>
              <p className="mb-4 text-xs leading-relaxed text-text-muted">
                Open the pixel editor, publish to your profile, or send an
                anonymous artwork.
              </p>
              <Link href="/paint">
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  fullWidth
                  glow
                  rightIcon={<ArrowRight size={13} />}
                >
                  Start drawing
                </AnimatedButton>
              </Link>
            </div>
          </div>
        </motion.section>

        {/* ─── 4. Themes ──────────────────────────────────── */}
        <motion.section
          variants={cardVariants}
          className="surface-panel rounded-2xl p-4"
        >
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-text">Themes</h2>
            <p className="text-[11px] text-text-muted">
              Customize your experience
            </p>
          </div>
          <ThemeSelector />
        </motion.section>

        {/* ─── 5. PixAnony Pro ────────────────────────────── */}
        <motion.section
          variants={cardVariants}
          className="surface-panel relative overflow-hidden rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-yellow to-orange-500">
              <Crown size={14} className="text-white" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-text">PixAnony Pro</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
                Unlock premium tools, exclusive palettes, and unlimited canvas
                sizes.
              </p>
              <Link
                href="/pro"
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Learn more
                <ArrowRight size={11} />
              </Link>
            </div>
          </div>

          {/* Pixel art decoration */}
          <PixelDecoration className="absolute right-3 bottom-3" />

          {/* Subtle shimmer line */}
          <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
        </motion.section>
      </motion.div>

      {/* Bottom spacer for scroll breathing room */}
      <div className="h-4 shrink-0" />
    </aside>
  );
}
