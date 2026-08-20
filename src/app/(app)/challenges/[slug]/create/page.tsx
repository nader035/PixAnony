import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function ChallengeCreatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('challenges')
    .select('id, starts_at, ends_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (!data) notFound();

  // The board and submission RPC both repeat the active-window check.
  const now = Date.now();
  if (new Date(data.starts_at).getTime() > now || new Date(data.ends_at).getTime() <= now) notFound();

  redirect(`/paint?mode=challenge-entry&challenge=${data.id}`);
}
