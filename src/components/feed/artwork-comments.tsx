'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, MessageSquare, Send } from '@/components/ui/icons';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { createClient } from '@/lib/supabase/client';
import { formatTimeAgo } from '@/lib/utils';
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
    <section className="surface-panel rounded-2xl p-4 sm:p-5">
      <h2 className="flex items-center gap-2 border-b border-border pb-4 text-sm font-semibold text-text">
        <MessageSquare size={16} className="text-primary" />
        Comments <span className="text-text-muted">({comments.length})</span>
      </h2>
      <div className="divide-y divide-border/60">
        {comments.length ? comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 py-4">
            <PixelAvatar username={comment.profile?.username || 'user'} src={comment.profile?.avatar_url} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <Link href={`/@${comment.profile?.username}`} className="truncate text-sm font-semibold text-text hover:text-primary">
                  {comment.profile?.display_name || 'Creator'}
                </Link>
                <time className="shrink-0 text-[11px] text-text-muted">{formatTimeAgo(comment.created_at)}</time>
              </div>
              <p className="mt-1 text-sm leading-6 text-text/90">{comment.content}</p>
            </div>
          </div>
        )) : (
          <p className="py-8 text-center text-sm text-text-muted">No comments yet. Start the conversation.</p>
        )}
      </div>
      <form onSubmit={submit} className="mt-2 flex gap-2 border-t border-border pt-4">
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={500}
          placeholder={viewer ? 'Write a thoughtful comment' : 'Sign in to comment'}
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-primary"
        />
        <button disabled={saving || !content.trim()} className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white disabled:opacity-50">
          {saving ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
        </button>
      </form>
    </section>
  );
}
