'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { 
  User, Palette, Shield, Save, Upload, Loader2, 
  Settings, UserCheck, Moon, Sun, Monitor
} from '@/components/ui/icons';
import { createClient } from '@/lib/supabase/client';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { PageFrame, PageHeader } from '@/components/ui/page-layout';
import { toast } from 'sonner';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const themeOptions = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { theme, setTheme } = useTheme();

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
      toast.error('Username is required.');
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

      toast.success('Your profile settings have been updated!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);
      
      if (!sessionUser) return;

      // Real upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${sessionUser.id}/avatar.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success('Avatar uploaded successfully!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload avatar image.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-text">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="font-pixel text-xs text-text-muted">Loading settings...</p>
      </div>
    );
  }

  return (
    <PageFrame>
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Manage profile, appearance, and account details."
        actions={<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary"><Settings size={19} /></span>}
      />

      <div className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
        {/* Left Side: Navigation Menu */}
        <aside className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card/45 p-2 md:sticky md:top-24 md:h-fit md:flex-col md:overflow-visible">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'bg-primary/15 text-primary border border-primary/20'
                : 'text-text-muted hover:bg-card/30 hover:text-text border border-transparent'
            }`}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'appearance'
                ? 'bg-primary/15 text-primary border border-primary/20'
                : 'text-text-muted hover:bg-card/30 hover:text-text border border-transparent'
            }`}
          >
            <Palette className="w-4 h-4" />
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'security'
                ? 'bg-primary/15 text-primary border border-primary/20'
                : 'text-text-muted hover:bg-card/30 hover:text-text border border-transparent'
            }`}
          >
            <Shield className="w-4 h-4" />
            Security
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
              {/* Avatar Uploader UI */}
              <div className="surface-panel flex items-center gap-4 rounded-2xl p-4">
                <div className="relative">
                  <PixelAvatar
                    username={username || 'guest'}
                    src={avatarUrl}
                    size="lg"
                  />
                  <label className="absolute -bottom-1 -right-1 bg-primary border border-border/80 p-1.5 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-white">
                    <Upload className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={saving}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text">Profile Avatar</h3>
                  <p className="text-xs text-text-muted mt-0.5">Upload a clean square avatar PNG/JPG image.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-text/80">Username</label>
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
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-text/80">Display name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Pixel Artist"
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-primary/80 focus:outline-none"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-text/80 uppercase tracking-wider">Biography</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the community about yourself..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-primary/80 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-text/80">Website URL</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://myart.portfolio"
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-primary/80 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-text/80">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, country"
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors focus:border-primary/80 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-sm font-semibold text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.98]"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Profile Changes
              </button>
            </motion.form>
          )}

          {activeTab === 'appearance' && (
            <motion.div
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <h2 className="mb-2 text-lg font-semibold text-text">Theme preferences</h2>
              <p className="text-xs text-text-muted leading-relaxed">
                Choose the contrast that works best for your environment. Both themes use the same accessible interaction states.
              </p>

              <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
                {themeOptions.map(({ value, label, icon: Icon }) => (
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
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <h2 className="text-lg font-semibold text-text">Account credentials</h2>
              
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-text/80 uppercase tracking-wider">Auth Email Address</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full cursor-not-allowed rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-text-muted"
                />
                <p className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-green" />
                  Your login email is managed via Supabase auth services.
                </p>
              </div>

            </motion.div>
          )}
        </div>
      </div>
    </PageFrame>
  );
}
