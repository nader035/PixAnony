'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Shield, X } from '@/components/ui/icons';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const reasons = [
  ['spam', 'Spam or misleading'],
  ['harassment', 'Harassment or bullying'],
  ['hate', 'Hate or abusive content'],
  ['sexual', 'Sexual content'],
  ['violence', 'Violence or threats'],
  ['copyright', 'Copyright violation'],
  ['other', 'Something else'],
] as const;

export function ReportArtworkDialog({
  artworkId,
  ownerId,
  open,
  onClose,
}: {
  artworkId: string;
  ownerId: string;
  open: boolean;
  onClose: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState<(typeof reasons)[number][0]>('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 80);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  if (!open || typeof document === 'undefined') return null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Sign in to report artwork.');
        return;
      }
      if (user.id === ownerId) {
        toast.error('You cannot report your own artwork.');
        return;
      }

      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        artwork_id: artworkId,
        reason,
        details: details.trim() || null,
      });
      if (error) {
        toast.error(error.code === '23505' ? 'You already have an active report for this artwork.' : error.message);
        return;
      }

      toast.success('Report sent to the PixAnony moderation team.');
      setDetails('');
      setReason('spam');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-text/35 p-3 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby={`report-${artworkId}`} className="w-full max-w-md rounded-[28px] bg-card p-5 shadow-float">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red/10 text-red">
              <Shield size={20} />
            </span>
            <div>
              <h2 id={`report-${artworkId}`} className="text-lg font-bold text-text">Report pixel art</h2>
              <p className="mt-1 text-sm leading-5 text-text-muted">Tell the moderation team what may violate the community rules.</p>
            </div>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-text-muted hover:text-text" aria-label="Close report dialog">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-text">Reason</span>
            <select value={reason} onChange={(event) => setReason(event.target.value as typeof reason)} className="h-11 w-full rounded-2xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary">
              {reasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold text-text">Details <span className="font-normal text-text-muted">(optional)</span></span>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Add context that will help the moderator review this report."
              className="w-full resize-none rounded-2xl border border-border bg-surface px-3 py-3 text-sm leading-5 text-text outline-none placeholder:text-text-muted focus:border-primary"
            />
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-11 rounded-full bg-surface px-4 text-sm font-bold text-text-muted hover:text-text">Cancel</button>
            <button type="submit" disabled={submitting} className="flex h-11 items-center gap-2 rounded-full bg-red px-5 text-sm font-bold text-white disabled:opacity-55">
              {submitting && <Loader2 size={15} className="animate-spin" />}
              Submit report
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}
