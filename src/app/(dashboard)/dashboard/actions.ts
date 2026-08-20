'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getAccessContext, hasAccess, type AppPermission } from '@/lib/auth/access';

function requiredString(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing ${name}`);
  }
  return value.trim();
}

function optionalString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function parseDimensions(value: string) {
  const match = /^(\d{1,3})x(\d{1,3})$/.exec(value);
  if (!match) throw new Error('Invalid canvas size.');
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width < 8 || height < 8 || width > 128 || height > 128 || width * height > 16384) {
    throw new Error('Invalid canvas size.');
  }
  return { width, height };
}

function toIsoDate(value: string, field: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${field}.`);
  return date.toISOString();
}

function challengeSlug(title: string) {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'challenge';
  return `${base}-${Date.now().toString(36)}`;
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

export async function createChallengeAction(formData: FormData) {
  const access = await requirePermission('platform.manage');
  const title = requiredString(formData, 'title');
  const startsAt = toIsoDate(requiredString(formData, 'startsAt'), 'start date');
  const endsAt = toIsoDate(requiredString(formData, 'endsAt'), 'end date');
  const { width, height } = parseDimensions(requiredString(formData, 'dimensions'));
  if (new Date(endsAt) <= new Date(startsAt)) throw new Error('End date must be after the start date.');

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('challenges')
    .insert({
      title,
      slug: challengeSlug(title),
      theme: optionalString(formData, 'theme') ?? 'Pixel art',
      description: optionalString(formData, 'description'),
      instructions: optionalString(formData, 'instructions'),
      starts_at: startsAt,
      ends_at: endsAt,
      status: 'draft',
      grid_width: width,
      grid_height: height,
      template_mode: formData.get('templateMode') === 'locked' ? 'locked' : 'editable',
      created_by: access.userId,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  redirect(`/paint?mode=challenge-template&challenge=${data.id}`);
}

export async function updateChallengeAction(formData: FormData) {
  await requirePermission('platform.manage');
  const challengeId = requiredString(formData, 'challengeId');
  const title = requiredString(formData, 'title');
  const startsAt = toIsoDate(requiredString(formData, 'startsAt'), 'start date');
  const endsAt = toIsoDate(requiredString(formData, 'endsAt'), 'end date');
  const { width, height } = parseDimensions(requiredString(formData, 'dimensions'));
  if (new Date(endsAt) <= new Date(startsAt)) throw new Error('End date must be after the start date.');

  const supabase = await createServerSupabaseClient();
  const { data: currentChallenge, error: currentChallengeError } = await supabase
    .from('challenges')
    .select('grid_width, grid_height, template_artwork_id')
    .eq('id', challengeId)
    .single();
  if (currentChallengeError) throw new Error(currentChallengeError.message);
  if (
    currentChallenge.template_artwork_id
    && (currentChallenge.grid_width !== width || currentChallenge.grid_height !== height)
  ) {
    throw new Error('Change the canvas size in the challenge template editor so the saved pixels stay aligned.');
  }
  const { error } = await supabase
    .from('challenges')
    .update({
      title,
      theme: optionalString(formData, 'theme') ?? 'Pixel art',
      description: optionalString(formData, 'description'),
      instructions: optionalString(formData, 'instructions'),
      starts_at: startsAt,
      ends_at: endsAt,
      grid_width: width,
      grid_height: height,
      template_mode: formData.get('templateMode') === 'locked' ? 'locked' : 'editable',
    })
    .eq('id', challengeId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/challenges');
  revalidatePath(`/paint`);
}

export async function setChallengeStatusAction(formData: FormData) {
  await requirePermission('platform.manage');
  const challengeId = requiredString(formData, 'challengeId');
  const status = requiredString(formData, 'status');
  if (!['draft', 'published', 'archived'].includes(status)) throw new Error('Invalid challenge status.');

  const supabase = await createServerSupabaseClient();
  if (status === 'published') {
    const { data } = await supabase.from('challenges').select('template_artwork_id').eq('id', challengeId).single();
    if (!data?.template_artwork_id) throw new Error('Save a challenge template before publishing.');
  }
  const { error } = await supabase.from('challenges').update({ status }).eq('id', challengeId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/challenges');
  revalidatePath('/challenges');
}

export async function removeChallengeAction(formData: FormData) {
  await requirePermission('platform.manage');
  const challengeId = requiredString(formData, 'challengeId');
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('challenges').delete().eq('id', challengeId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/challenges');
  revalidatePath('/challenges');
}
