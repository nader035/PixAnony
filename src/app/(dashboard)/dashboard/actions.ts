'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAccessContext, hasAccess, type AppPermission } from '@/lib/auth/access';

function requiredString(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing ${name}`);
  }
  return value.trim();
}

async function requirePermission(permission: AppPermission) {
  const access = await getAccessContext();
  if (!access || !hasAccess(access, permission)) {
    throw new Error('You do not have permission to perform this action.');
  }
  return access;
}

export async function setUserRoleAction(formData: FormData) {
  const access = await requirePermission('roles.manage');
  const userId = requiredString(formData, 'userId');
  const role = requiredString(formData, 'role');

  if (userId === access.userId) {
    throw new Error('You cannot change your own role.');
  }
  if (!['admin', 'moderator', 'user'].includes(role)) {
    throw new Error('Invalid role.');
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc('set_user_role', {
    target_user_id: userId,
    target_role: role,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
}
export async function reviewReportAction(formData: FormData) {
  await requirePermission('reports.manage');
  const reportId = requiredString(formData, 'reportId');
  const decision = requiredString(formData, 'decision');
  const noteValue = formData.get('note');
  const note = typeof noteValue === 'string' && noteValue.trim() ? noteValue.trim() : null;

  if (!['in_review', 'resolved', 'dismissed'].includes(decision)) {
    throw new Error('Invalid report decision.');
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc('review_report', {
    target_report_id: reportId,
    decision,
    note,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
}

export async function removeArtworkAction(formData: FormData) {
  await requirePermission('artworks.moderate');
  const artworkId = requiredString(formData, 'artworkId');
  const reportValue = formData.get('reportId');
  const noteValue = formData.get('note');

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc('moderate_artwork', {
    target_artwork_id: artworkId,
    linked_report_id: typeof reportValue === 'string' && reportValue ? reportValue : null,
    note: typeof noteValue === 'string' && noteValue.trim() ? noteValue.trim() : null,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
}
