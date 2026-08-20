import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export type AppRole = 'admin' | 'moderator' | 'user';

export type AppPermission =
  | 'dashboard.access'
  | 'platform.manage'
  | 'users.read'
  | 'users.manage'
  | 'roles.manage'
  | 'content.read_all'
  | 'reports.read'
  | 'reports.manage'
  | 'artworks.moderate'
  | 'moderation_log.read'
  | 'stats.read';

export type AccessContext = {
  userId: string;
  role: AppRole;
  permissions: AppPermission[];
};

type AccessPayload = {
  role?: unknown;
  permissions?: unknown;
};

function isAppRole(value: unknown): value is AppRole {
  return value === 'admin' || value === 'moderator' || value === 'user';
}

export const getAccessContext = cache(async (): Promise<AccessContext | null> => {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc('get_my_access');
  if (error) {
    return { userId: user.id, role: 'user', permissions: [] };
  }

  const payload = (data ?? {}) as AccessPayload;
  const role = isAppRole(payload.role) ? payload.role : 'user';
  const permissions = Array.isArray(payload.permissions)
    ? payload.permissions.filter((permission): permission is AppPermission => typeof permission === 'string')
    : [];

  return { userId: user.id, role, permissions };
});

export function hasAccess(access: AccessContext, permission: AppPermission) {
  return access.permissions.includes(permission);
}
