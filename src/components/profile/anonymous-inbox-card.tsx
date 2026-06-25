'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Copy, Inbox, Send, Shield, Sparkles, User } from '@/components/ui/icons';
import { BorderGlow } from '@/components/react-bits/border-glow';
import { PixelBlast } from '@/components/react-bits/pixel-blast';
import { formatNumber } from '@/lib/utils';
import { toast } from 'sonner';

interface AnonymousInboxCardProps {
  username: string;
  displayName: string;
  ownProfile: boolean;
  receivedCount?: number;
}

export function AnonymousInboxCard({
  username,
  displayName,
  ownProfile,
  receivedCount = 0,
}: AnonymousInboxCardProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/send/${username}`;
    return `${window.location.origin}/send/${username}`;
  }, [username]);

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Anonymous pixel link copied.');
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mt-7"
    >
      <BorderGlow animated className="rounded-[24px]" borderRadius={24} glowRadius={38} fillOpacity={0.34}>
        <div className="relative overflow-hidden rounded-[24px] bg-card p-5 sm:p-6">
          <div className="absolute inset-0 opacity-35">
            <PixelBlast
              variant="diamond"
              pixelSize={7}
              color={ownProfile ? '#22D3EE' : '#EC4899'}
              patternScale={3}
              patternDensity={1.25}
              pixelSizeJitter={0.35}
              enableRipples
              liquid
              liquidStrength={0.08}
              speed={0.45}
              edgeFade={0.18}
              transparent
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-card via-card/84 to-card/45" />

          <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/12 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                <Sparkles size={12} />
                Pixel inbox
              </p>
              <h2 className="text-2xl font-bold tracking-[-0.045em] text-text sm:text-3xl">
                {ownProfile ? 'Your anonymous pixel link' : `Send pixel art to ${displayName}`}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
                {ownProfile
                  ? 'Share this URL anywhere. People draw a pixel piece for you, then choose anonymous or signed delivery before sending.'
                  : 'Open a blank board, draw something personal, and choose anonymous or signed delivery before it reaches their private inbox.'}
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <span className="flex min-h-12 items-center gap-2 rounded-2xl border border-border/70 bg-bg/58 px-3 text-xs font-semibold text-text-muted">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Anonymous by default
                </span>
                <span className="flex min-h-12 items-center gap-2 rounded-2xl border border-border/70 bg-bg/58 px-3 text-xs font-semibold text-text-muted">
                  <User className="h-3.5 w-3.5 text-cyan" />
                  Signed is optional
                </span>
              </div>
            </div>

            {ownProfile ? (
              <div className="min-w-0 rounded-2xl border border-border/70 bg-bg/72 p-3 sm:min-w-[320px]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                    <Inbox className="h-3.5 w-3.5 text-primary" />
                    {formatNumber(receivedCount)} received
                  </span>
                  <Link href={`/@${username}/received`} className="text-xs font-semibold text-primary hover:text-primary-glow">
                    Open inbox
                  </Link>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-xl border border-border/70 bg-surface px-3 py-2.5 text-[11px] text-text-muted">
                    {shareUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyShareLink()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white"
                    aria-label="Copy anonymous pixel link"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href={`/send/${username}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-5 text-sm font-bold text-white shadow-glow transition-transform hover:-translate-y-0.5"
              >
                <Send className="h-4 w-4" />
                Draw for @{username}
              </Link>
            )}
          </div>
        </div>
      </BorderGlow>
    </motion.section>
  );
}
