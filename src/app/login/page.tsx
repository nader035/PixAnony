'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Google, Github, ArrowLeft, ArrowRight, Lock, User, Eye, EyeOff, Loader2 } from '@/components/ui/icons';
import { Logo } from '@/components/ui/logo';
import { PixelCanvasMock } from '@/components/ui/pixel-canvas-mock';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';


const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } },
};

/* ===== OAuth Button ===== */
function OAuthButton({
  icon: Icon,
  label,
  color,
  onClick,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      variants={fadeUp}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      type="button"
      className="group flex w-full items-center justify-between rounded-2xl border border-border bg-card/75 px-5 py-3 text-sm font-medium text-text transition-all hover:border-primary/30 hover:bg-card disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 transition-colors" style={{ color }} />
        <span>Continue with {label}</span>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.button>
  );
}

/* ===== Floating Stars ===== */
function FloatingStars() {
  const stars = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: (i * 37) % 100,
    y: (i * 61) % 100,
    size: (i % 3) + 1,
    delay: (i % 7) * 0.4,
    duration: 2.4 + (i % 4) * 0.5,
  }));

  return (
    <>
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.1, 0.8, 0.1],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  );
}

/* ===== Pixel Heart Portal ===== */
function PixelHeartPortal() {
  const heartPixels = [
    [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
  ];

  return (
    <div className="relative">
      <motion.div
        className="absolute -inset-12 rounded-full border-2 border-primary/20"
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -inset-20 rounded-full border border-pink/10"
        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      <motion.div
        initial={false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative z-10"
      >
        <div className="inline-grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
          {heartPixels.flat().map((pixel, i) => (
            <motion.div
              key={i}
              className="w-4 h-4 lg:w-5 lg:h-5 rounded-sm"
              style={{
                background: pixel
                  ? `linear-gradient(135deg, var(--primary), var(--pink))`
                  : 'transparent',
              }}
              initial={false}
              animate={{ scale: pixel ? 1 : 0, opacity: pixel ? 1 : 0 }}
              transition={{ delay: 0.5 + i * 0.008, duration: 0.3 }}
            />
          ))}
        </div>
      </motion.div>

      <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full -z-10" />
      <div className="absolute inset-0 bg-pink/10 blur-[60px] rounded-full -z-10" />
    </div>
  );
}

void FloatingStars;
void PixelHeartPortal;

/* ===== LOGIN PAGE ===== */
function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const nextPath = useMemo(() => {
    const next = searchParams.get('next');
    return next?.startsWith('/') && !next.startsWith('//') ? next : '/home';
  }, [searchParams]);
  const requestedMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const isContinuingSendDraft = nextPath.startsWith('/send/');
  
  const [authMethod, setAuthMethod] = useState<'social' | 'email'>('social');
  const [mode, setMode] = useState<'login' | 'signup'>(requestedMode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (active && user) router.replace(nextPath);
    })();
    return () => {
      active = false;
    };
  }, [nextPath, router, supabase]);

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'OAuth authentication failed.');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (mode === 'signup' && !username) {
      toast.error('Username is required for sign up.');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Successfully logged in! Redirecting...');
        router.push(nextPath);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              preferred_username: username.toLowerCase().trim(),
              full_name: displayName.trim() || username.trim(),
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success('Account created! Redirecting...');
          router.push(nextPath);
          return;
        }
        toast.success('Sign up successful! Please check your email for a confirmation link.');
        setMode('login');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[100svh] bg-bg lg:grid-cols-[minmax(420px,.9fr)_minmax(0,1.1fr)]">
      <div className="pointer-events-none fixed inset-0 dot-grid opacity-35" />
      {/* Left — Form Panel */}
      <div className="relative flex min-w-0 flex-col justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
        <motion.div
          initial={false}
          animate="visible"
          variants={stagger}
          className="w-full max-w-md mx-auto"
        >
          {/* Back + Logo */}
          <motion.div variants={fadeUp} className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
            <Logo />
          </motion.div>

          {/* Heading */}
          <motion.div variants={fadeUp} className="mb-6">
            <h1 className="mb-2 text-2xl font-semibold text-text sm:text-3xl">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-text-muted text-sm">
              {isContinuingSendDraft
                ? 'Sign in to deliver your saved private canvas.'
                : mode === 'login'
                  ? 'Sign in to continue your anonymous pixel art journey.'
                  : 'Create a profile and start drawing.'}
            </p>
          </motion.div>

          <AnimatePresence mode="wait" initial={false}>
            {authMethod === 'social' ? (
              <motion.div
                key="social"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-3"
              >
                <OAuthButton
                  icon={Google}
                  label="Google"
                  color="#4285F4"
                  onClick={() => handleOAuthLogin('google')}
                  disabled={loading}
                />
                <OAuthButton
                  icon={Github}
                  label="GitHub"
                  color="#181528"
                  onClick={() => handleOAuthLogin('github')}
                  disabled={loading}
                />



                <motion.div variants={fadeUp} className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-semibold uppercase text-text-muted">or</span>
                  <div className="flex-1 h-px bg-border" />
                </motion.div>

                <motion.button
                  variants={fadeUp}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAuthMethod('email')}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3.5 text-sm font-semibold text-primary transition-all hover:bg-primary/15"
                >
                  <Mail className="w-5 h-5 text-primary" />
                  Continue with Email
                </motion.button>
              </motion.div>
            ) : (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleEmailAuth}
                className="space-y-4"
              >
                {mode === 'signup' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase text-text/80">Username</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 h-5 w-5 text-text-muted" />
                        <input
                          type="text"
                          required
                          minLength={3}
                          maxLength={30}
                          placeholder="pixel_master"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                          className="w-full rounded-2xl border border-border bg-card/70 py-3 pl-11 pr-4 text-sm transition-colors focus:border-primary/70 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase text-text/80">Display name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 h-5 w-5 text-text-muted opacity-50" />
                        <input
                          type="text"
                          placeholder="Pixel Master (Optional)"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full rounded-2xl border border-border bg-card/70 py-3 pl-11 pr-4 text-sm transition-colors focus:border-primary/70 focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-text/80">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-text-muted" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-card/70 py-3 pl-11 pr-4 text-sm transition-colors focus:border-primary/70 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-text/80">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-card/70 py-3 pl-11 pr-11 text-sm transition-colors focus:border-primary/70 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-text-muted hover:text-text transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthMethod('social')}
                    disabled={loading}
                    className="flex-1 rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-semibold text-text transition-colors hover:bg-card-hover"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(124,58,237,0.22)] transition-all hover:brightness-105 active:scale-[0.98]"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : mode === 'login' ? (
                      'Sign In'
                    ) : (
                      'Sign Up'
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Toggle */}
          <motion.p variants={fadeUp} className="text-center text-sm text-text-muted mt-8">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-primary hover:text-primary-glow font-medium transition-colors"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </motion.p>

          {/* Terms */}
          <motion.p variants={fadeUp} className="text-center text-xs text-text-muted mt-6 leading-relaxed">
            By continuing, you agree to the community terms and privacy expectations.
          </motion.p>
        </motion.div>
      </div>

      <div className="relative hidden min-w-0 items-center justify-center overflow-hidden border-l border-border/70 bg-gradient-to-br from-surface via-bg to-primary/8 p-12 lg:flex">
        <div className="absolute inset-0 dot-grid opacity-40" />
        <div className="absolute right-16 top-16 h-72 w-72 rounded-full bg-primary/12 blur-3xl" />
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="surface-panel relative w-full max-w-lg rounded-[2rem] p-5 shadow-float"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-primary">Private canvas</p>
              <h2 className="mt-1 text-2xl font-semibold text-text">Draw, sign in, share softly.</h2>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">PixAnony</span>
          </div>
          <PixelCanvasMock className="min-h-[340px]" />
          <p className="mt-4 text-sm leading-6 text-text-muted">
            Authentication remains Supabase-powered. The interface simply gets calmer around it.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh] bg-bg" />}>
      <LoginPageContent />
    </Suspense>
  );
}
