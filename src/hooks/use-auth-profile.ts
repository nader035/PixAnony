'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export type AuthProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
};

export type AuthAccess = {
  role: 'admin' | 'moderator' | 'user';
  permissions: string[];
};

export function useAuthProfile() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [access, setAccess] = useState<AuthAccess>({ role: 'user', permissions: [] });
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (nextUser: User | null) => {
    setUser(nextUser);
    if (!nextUser) {
      setProfile(null);
      setAccess({ role: 'user', permissions: [] });
      setLoading(false);
      return;
    }

    const [{ data }, { data: accessData }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_verified')
        .eq('id', nextUser.id)
        .maybeSingle(),
      supabase.rpc('get_my_access'),
    ]);

    setProfile(data ?? null);
    const payload = (accessData ?? {}) as { role?: unknown; permissions?: unknown };
    setAccess({
      role: payload.role === 'admin' || payload.role === 'moderator' ? payload.role : 'user',
      permissions: Array.isArray(payload.permissions)
        ? payload.permissions.filter((permission): permission is string => typeof permission === 'string')
        : [],
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let active = true;

    void (async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (active) await loadProfile(currentUser);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setLoading(true);
      void loadProfile(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setAccess({ role: 'user', permissions: [] });
  }, [supabase]);

  return {
    user,
    profile,
    role: access.role,
    permissions: access.permissions,
    isStaff: access.role === 'admin' || access.role === 'moderator',
    loading,
    isAuthenticated: Boolean(user),
    signOut,
  };
}
