'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Copy, Inbox, Send, Shield, Sparkles, User } from '@/components/ui/icons';
import { formatNumber } from '@/lib/utils';
import { toast } from 'sonner';
import { useI18n } from '@/components/i18n/locale-provider';

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
  const { t, locale } = useI18n();
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/send/${username}`;
    return `${window.location.origin}/send/${username}`;
  }, [username]);

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success(t('profile.inboxLinkCopied'));
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mt-7"
    >
      <div className="relative overflow-hidden rounded-[28px] bg-[var(--blush)] p-5 sm:p-6">
        <div className="absolute -end-12 -top-12 h-32 w-32 rounded-full bg-[var(--butter)]" aria-hidden="true" />

        <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm font-bold text-text">
                <Sparkles size={12} />
                {t('profile.inboxEyebrow')}
              </p>
              <h2 className="text-2xl font-semibold text-text sm:text-3xl">
                {ownProfile ? t('profile.ownInboxTitle') : t('profile.otherInboxTitle', { name: displayName })}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
                {ownProfile
                  ? t('profile.ownInboxDescription')
                  : t('profile.otherInboxDescription')}
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <span className="flex min-h-12 items-center gap-2 rounded-2xl border border-border/70 bg-bg/70 px-3 text-xs font-semibold text-text-muted">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  {t('profile.anonymousDefault')}
                </span>
                <span className="flex min-h-12 items-center gap-2 rounded-2xl border border-border/70 bg-bg/70 px-3 text-xs font-semibold text-text-muted">
                  <User className="h-3.5 w-3.5 text-cyan" />
                  {t('profile.signedOptional')}
                </span>
              </div>
            </div>

            {ownProfile ? (
              <div className="min-w-0 rounded-[20px] bg-card p-3 sm:min-w-[320px]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                    <Inbox className="h-3.5 w-3.5 text-primary" />
                    {t('common.receivedCount', { count: formatNumber(receivedCount, locale) })}
                  </span>
                  <Link href={`/profile/${username}/received`} className="text-xs font-semibold text-primary hover:text-primary-glow">
                    {t('profile.openInbox')}
                  </Link>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <code className="rtl-isolate min-w-0 flex-1 truncate rounded-xl border border-border/70 bg-surface px-3 py-2.5 text-[11px] text-text-muted">
                    {shareUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyShareLink()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white"
                    aria-label={t('profile.copyInboxLink')}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href={`/send/${username}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-bg shadow-[0_16px_36px_rgba(44,40,58,0.16)] transition-transform hover:-translate-y-0.5 hover:bg-primary-glow"
              >
                <Send className="rtl-flip h-4 w-4" />
                {t('profile.drawFor', { username })}
              </Link>
            )}
        </div>
      </div>
    </motion.section>
  );
}
