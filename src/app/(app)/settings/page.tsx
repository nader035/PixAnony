'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { 
  User, Palette, Shield, Save, Loader2,
  Settings, UserCheck, Moon, Sun, Monitor
} from '@/components/ui/icons';
import { createClient } from '@/lib/supabase/client';
import { DrawnAvatarEditor } from '@/components/ui/drawn-avatar-editor';
import { PageFrame, PageHeader } from '@/components/ui/page-layout';
import { toast } from 'sonner';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useI18n } from '@/components/i18n/locale-provider';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';

const themeOptions = [
  { value: 'light', labelKey: 'theme.light', icon: Sun },
  { value: 'dark', labelKey: 'theme.dark', icon: Moon },
  { value: 'system', labelKey: 'theme.system', icon: Monitor },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();

  // Navigation
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'security'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionUser, setSessionUser] = useState<SupabaseUser | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [email, setEmail] = useState('');

  // Fetch current user and profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/login');
          return;
        }

        setSessionUser(user);
        setEmail(user.email || '');

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setUsername(data.username || '');
          setDisplayName(data.display_name || '');
          setBio(data.bio || '');
          setWebsite(data.website || '');
          setLocation(data.location || '');
          setAvatarUrl(data.avatar_url || '');
          setBannerUrl(data.banner_url || '');
        }
      } catch (err) {
        console.error('Failed to load profile settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router, supabase]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      toast.error(t('settings.usernameRequired'));
      return;
    }

    try {
      setSaving(true);
      
      if (!sessionUser) return;

      // Update in Supabase profiles
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.toLowerCase().trim(),
          display_name: displayName.trim(),
          bio: bio.trim(),
          website: website.trim(),
          location: location.trim(),
          avatar_url: avatarUrl,
          banner_url: bannerUrl
        })
        .eq('id', sessionUser.id);

      if (error) throw error;

      toast.success(t('settings.profileUpdated'));
    } catch {
      toast.error(t('settings.profileUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-text">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-semibold text-text-muted">{t('settings.loading')}</p>
      </div>
    );
  }

  return (
    <PageFrame>
      <PageHeader
        eyebrow={t('settings.eyebrow')}
        title={t('settings.title')}
        description={t('settings.description')}
        actions={<span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--lilac)] text-text"><Settings size={19} /></span>}
      />

      <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
        {/* Left Side: Navigation Menu */}
        <aside className="flex gap-2 overflow-x-auto rounded-[24px] bg-surface p-2 md:sticky md:top-24 md:h-fit md:flex-col md:overflow-visible">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'bg-primary text-bg'
                : 'text-text-muted hover:bg-card hover:text-text'
            }`}
          >
            <User className="w-4 h-4" />
            {t('settings.profile')}
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'appearance'
                ? 'bg-primary text-bg'
                : 'text-text-muted hover:bg-card hover:text-text'
            }`}
          >
            <Palette className="w-4 h-4" />
            {t('settings.appearance')}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'security'
                ? 'bg-primary text-bg'
                : 'text-text-muted hover:bg-card hover:text-text'
            }`}
          >
            <Shield className="w-4 h-4" />
            {t('settings.security')}
          </button>
        </aside>

        {/* Right Side: Active Settings Form */}
        <div className="min-w-0">
          {activeTab === 'profile' && (
            <motion.form
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSaveProfile}
              className="space-y-5"
            >
              <div className="rounded-[24px] bg-[var(--powder)] p-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-text">{t('settings.avatarTitle')}</h3>
                  <p className="mt-1 text-xs leading-5 text-text-muted">
                    {t('settings.avatarDescription')}
                  </p>
                </div>
                <DrawnAvatarEditor
                  username={username || 'guest'}
                  value={avatarUrl}
                  disabled={saving}
                  onChange={setAvatarUrl}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-text/80">{t('settings.username')}</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder="pixel_artist"
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-primary/80 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-text/80">{t('settings.displayName')}</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t('auth.displayNamePlaceholder')}
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-primary/80 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-text/80">{t('settings.bio')}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t('settings.bioPlaceholder')}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-primary/80 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-text/80">{t('settings.website')}</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://myart.portfolio"
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-primary/80 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-text/80">{t('settings.location')}</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('settings.locationPlaceholder')}
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-primary/80 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(0,94,254,0.22)] transition-all hover:brightness-105 active:scale-[0.98]"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {t('settings.saveProfile')}
              </button>
            </motion.form>
          )}

          {activeTab === 'appearance' && (
            <motion.div
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <h2 className="mb-2 text-lg font-semibold text-text">{t('settings.themeTitle')}</h2>
              <p className="text-xs text-text-muted leading-relaxed">
                {t('settings.themeDescription')}
              </p>

              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
                {themeOptions.map(({ value, labelKey, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border px-4 py-4 text-sm font-semibold transition-all ${
                      theme === value 
                        ? 'bg-primary/10 border-primary text-primary glow-primary' 
                        : 'bg-card border-border hover:bg-card-hover text-text-muted hover:text-text'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {t(labelKey)}
                  </button>
                ))}
              </div>

              <div className="rounded-[24px] bg-[var(--powder)] p-5">
                <h2 className="text-lg font-semibold text-text">{t('settings.languageTitle')}</h2>
                <p className="mt-2 text-xs leading-6 text-text-muted">{t('settings.languageDescription')}</p>
                <LanguageSwitcher className="mt-4" />
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <h2 className="text-lg font-semibold text-text">{t('settings.credentials')}</h2>
              
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-text/80">{t('settings.authEmail')}</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full cursor-not-allowed rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-text-muted"
                />
                <p className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-green" />
                  {t('settings.emailManaged')}
                </p>
              </div>

            </motion.div>
          )}
        </div>
      </div>
    </PageFrame>
  );
}
