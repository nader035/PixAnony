import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * /drops — canonical route for Private Drops.
 * Resolves the authenticated user's username and redirects to
 * /profile/{username}/received where the actual page lives.
 */
export default async function DropsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=%2Fdrops');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  if (!profile?.username) {
    redirect('/login?next=%2Fdrops');
  }

  redirect(`/profile/${profile.username}/received`);
}
