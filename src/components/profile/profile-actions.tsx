'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Send, UserPlus } from '@/components/ui/icons';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useI18n } from '@/components/i18n/locale-provider';

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
  const { t } = useI18n();

  if (viewerId === profileId) {
    return (
      <Link href="/settings" className="rounded-full bg-surface px-4 py-2.5 text-sm font-semibold text-text hover:bg-card-hover">
        {t('profile.edit')}
      </Link>
    );
  }

  const toggleFollow = async () => {
    if (!viewerId) {
      toast.error(t('profile.signInFollow'));
      return;
    }
    setSaving(true);
    const { error } = following
      ? await supabase.from('follows').delete().eq('follower_id', viewerId).eq('following_id', profileId)
      : await supabase.from('follows').insert({ follower_id: viewerId, following_id: profileId });
    setSaving(false);
    if (error) {
      toast.error(t('common.actionFailed'));
      return;
    }
    setFollowing(!following);
  };

  return (
    <div className="flex gap-2">
      <Link href={`/send/${username}`} className="flex items-center gap-2 rounded-full bg-surface px-4 py-2.5 text-sm font-semibold text-text hover:bg-card-hover">
        <Send size={16} className="rtl-flip" />
        {t('profile.sendArtwork')}
      </Link>
      <button
        onClick={() => void toggleFollow()}
        disabled={saving}
        className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-bg disabled:opacity-60"
      >
        <UserPlus size={16} />
        {following ? t('profile.following') : t('profile.follow')}
      </button>
    </div>
  );
}
