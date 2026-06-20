'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Send, UserPlus } from '@/components/ui/icons';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function ProfileActions({
  profileId,
  username,
  viewerId,
  initiallyFollowing,
}: {
  profileId: string;
  username: string;
  viewerId: string | null;
  initiallyFollowing: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [following, setFollowing] = useState(initiallyFollowing);
  const [saving, setSaving] = useState(false);

  if (viewerId === profileId) {
    return (
      <Link href="/settings" className="rounded-xl border border-border bg-bg/80 px-4 py-2.5 text-sm font-semibold text-text hover:bg-card">
        Edit profile
      </Link>
    );
  }

  const toggleFollow = async () => {
    if (!viewerId) {
      toast.error('Sign in to follow creators.');
      return;
    }
    setSaving(true);
    const { error } = following
      ? await supabase.from('follows').delete().eq('follower_id', viewerId).eq('following_id', profileId)
      : await supabase.from('follows').insert({ follower_id: viewerId, following_id: profileId });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setFollowing(!following);
  };

  return (
    <div className="flex gap-2">
      <Link href={`/send/${username}`} className="flex items-center gap-2 rounded-xl border border-border bg-bg/80 px-4 py-2.5 text-sm font-semibold text-text hover:bg-card">
        <Send size={16} />
        Send art
      </Link>
      <button
        onClick={() => void toggleFollow()}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        <UserPlus size={16} />
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  );
}
