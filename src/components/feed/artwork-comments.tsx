'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, MessageSquare, Send } from '@/components/ui/icons';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { createClient } from '@/lib/supabase/client';
import { formatTimeAgo, cn } from '@/lib/utils';
import { toast } from 'sonner';

type CommentItem = {
  id: string;
  content: string;
  created_at: string;
  profile: { username: string; display_name: string; avatar_url: string | null } | null;
};

export function ArtworkComments({
  artworkId,
  initialComments,
  viewer,
}: {
  artworkId: string;
  initialComments: CommentItem[];
  viewer: { id: string; username: string; display_name: string; avatar_url: string | null } | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = content.trim();
    if (!value) return;
    if (!viewer) {
      toast.error('Sign in to comment.');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from('comments')
      .insert({ artwork_id: artworkId, user_id: viewer.id, content: value })
      .select('id, content, created_at')
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    setComments((current) => [...current, { ...data, profile: viewer }]);
    setContent('');
  };

  return (
    <section className="surface-panel rounded-2xl sm:rounded-[22px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border/50 px-4 py-4 sm:px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <MessageSquare size={15} className="text-primary" />
        </span>
        <h2 className="text-sm font-semibold text-text">
          Comments
        </h2>
        <span className="rounded-full bg-card-hover px-2 py-0.5 text-[11px] font-semibold tabular-nums text-text-muted">
          {comments.length}
        </span>
      </div>

      {/* Comment list */}
      <div className="px-4 sm:px-5">
        {comments.length ? comments.map((comment, i) => (
          <div
            key={comment.id}
            className={cn(
              'flex gap-3 py-4 animate-slide-up',
              i < comments.length - 1 && 'border-b border-border/40'
            )}
            style={{
              animationDelay: `${Math.min(i * 40, 200)}ms`,
              animationFillMode: 'both',
            }}
          >
            <div className="shrink-0 pt-0.5">
              <PixelAvatar username={comment.profile?.username || 'user'} src={comment.profile?.avatar_url} size="sm" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={comment.profile?.username ? `/profile/${comment.profile.username}` : '#'}
                  className="truncate text-[13px] font-semibold text-text transition-colors hover:text-primary"
                >
                  {comment.profile?.display_name || 'Creator'}
                </Link>
                <time className="shrink-0 text-[11px] font-medium text-text-muted/70">
                  {formatTimeAgo(comment.created_at)}
                </time>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-text/85">
                {comment.content}
              </p>
            </div>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-card-hover">
              <MessageSquare size={20} className="text-text-muted/60" />
            </span>
            <p className="text-sm font-medium text-text-muted">
              No comments yet
            </p>
            <p className="mt-1 text-xs text-text-muted/60">
              Start the conversation below
            </p>
          </div>
        )}
      </div>

      {/* Comment form */}
      <form
        onSubmit={submit}
        className="flex items-center gap-2.5 border-t border-border/50 px-4 py-3.5 sm:px-5"
      >
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={500}
          placeholder={viewer ? 'Write a thoughtful comment…' : 'Sign in to comment'}
          className={cn(
            'h-11 min-w-0 flex-1 rounded-xl border border-border/70 bg-surface px-4 text-sm text-text placeholder:text-text-muted/50',
            'outline-none transition-all duration-200',
            'focus:border-primary/60 focus:ring-2 focus:ring-primary/15 focus:bg-bg-deep'
          )}
        />
        <button
          disabled={saving || !content.trim()}
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition-all duration-200',
            'bg-primary hover:bg-primary-glow active:scale-95',
            'disabled:opacity-40 disabled:hover:bg-primary disabled:active:scale-100',
            'shadow-sm hover:shadow-[0_4px_15px_rgba(139,92,246,0.3)]'
          )}
        >
          {saving ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
        </button>
      </form>
    </section>
  );
}
