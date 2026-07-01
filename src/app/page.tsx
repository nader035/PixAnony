'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bookmark,
  ChevronRight,
  Eye,
  Heart,
  Lock,
  Menu,
  MessageCircle,
  Palette,
  Paintbrush,
  Repeat2,
  Send,
  Shield,
  Sparkles,
  Users,
  X as XIcon,
} from '@/components/ui/icons';
import { Logo } from '@/components/ui/logo';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { PixelCanvasMock } from '@/components/ui/pixel-canvas-mock';
import { UserMenu } from '@/components/auth/user-menu';
import { useAuthProfile } from '@/hooks/use-auth-profile';
import { BRAND } from '@/lib/constants';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'Workflow', href: '/#workflow' },
  { label: 'Community', href: '/explore' },
  { label: 'Team', href: '/#team' },
] as const;

const workflow = [
  {
    step: '01',
    icon: Paintbrush,
    title: 'Draw in a focused studio',
    text: 'The editor keeps tools, layers, palettes, and zoom close without turning the interface into a retro arcade.',
  },
  {
    step: '02',
    icon: Send,
    title: 'Publish or send quietly',
    text: 'Share public artwork to your profile or send anonymous pieces through the same calm product language.',
  },
  {
    step: '03',
    icon: Heart,
    title: 'Let real interaction happen',
    text: 'Likes, comments, reposts, bookmarks, and creator pages stay readable and grounded in the live app.',
  },
] as const;

const features = [
  { icon: Palette, title: 'Pixel editor', text: 'Pixel identity stays inside the canvas, previews, and small metadata accents.' },
  { icon: Lock, title: 'Anonymous delivery', text: 'Private sends feel deliberate without hiding behind heavy visual effects.' },
  { icon: Eye, title: 'Explore feed', text: 'Artwork cards, search, and creator context are clean, social, and scannable.' },
  { icon: Users, title: 'Creator profiles', text: 'Profiles foreground galleries, bio details, and the anonymous send entry point.' },
] as const;

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, signOut } = useAuthProfile();
  const isSignedIn = Boolean(profile);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-bg/82 backdrop-blur-2xl">
      <nav className="site-container flex h-16 items-center justify-between" aria-label="Primary">
        <Link href="/" aria-label="PixAnony home">
          <Logo size="md" />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-text-muted transition-colors hover:text-text">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {isSignedIn && profile ? (
            <>
              <Link href="/home" className="rounded-full px-4 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:bg-card-hover hover:text-text">
                Dashboard
              </Link>
              <Link href="/paint" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(124,58,237,0.22)] transition hover:-translate-y-0.5">
                Create
                <ArrowRight size={14} />
              </Link>
              <UserMenu profile={profile} signOut={signOut} compact />
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:bg-card-hover hover:text-text">
                Login
              </Link>
              <Link href="/login?mode=signup" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(124,58,237,0.22)] transition hover:-translate-y-0.5">
                Get started
                <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/70 text-text-muted transition hover:text-text md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <XIcon size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-border/70 bg-bg/95 px-4 py-4 backdrop-blur-xl md:hidden">
          <div className="mx-auto grid max-w-lg gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-2xl px-3 py-3 text-sm font-medium text-text-muted transition hover:bg-card-hover hover:text-text"
              >
                {link.label}
              </Link>
            ))}
            {isSignedIn && profile ? (
              <div className="mt-2 grid gap-2 border-t border-border pt-3">
                <Link href="/home" onClick={() => setMobileOpen(false)} className="rounded-2xl px-3 py-3 text-sm font-semibold text-text hover:bg-card-hover">
                  Dashboard
                </Link>
                <Link href="/paint" onClick={() => setMobileOpen(false)} className="flex min-h-12 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-white">
                  Create artwork
                </Link>
                <Link href={`/profile/${profile.username}`} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-2xl border border-border bg-card/75 px-3 py-3">
                  <PixelAvatar username={profile.username} src={profile.avatar_url} size="sm" isVerified={profile.is_verified} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-text">{profile.display_name}</span>
                    <span className="block truncate text-xs text-text-muted">@{profile.username}</span>
                  </span>
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/profile/${profile.username}/received`} onClick={() => setMobileOpen(false)} className="rounded-2xl border border-border bg-card/70 px-3 py-2.5 text-center text-xs font-semibold text-text-muted">
                    Private Drops
                  </Link>
                  <Link href="/settings" onClick={() => setMobileOpen(false)} className="rounded-2xl border border-border bg-card/70 px-3 py-2.5 text-center text-xs font-semibold text-text-muted">
                    Settings
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    void signOut();
                  }}
                  className="rounded-2xl px-3 py-2.5 text-sm font-semibold text-red hover:bg-red/8"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login?mode=signup" className="mt-2 flex min-h-12 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-white">
                Get started
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function CreateCta({ children, className }: { children: React.ReactNode; className: string }) {
  const { isAuthenticated, loading } = useAuthProfile();
  const href = isAuthenticated ? '/paint' : '/login?next=%2Fpaint';

  return (
    <Link href={href} aria-disabled={loading} className={className}>
      {children}
    </Link>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 sm:pt-32">
      <div className="absolute inset-0 dot-grid opacity-40" />
      <div className="absolute left-1/2 top-28 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />
      <div className="site-container relative grid min-h-[calc(100svh-7rem)] items-center gap-12 pb-20 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/18 bg-primary/8 px-4 py-2 text-xs font-semibold text-primary">
            <Sparkles size={13} />
            Modern anonymous pixel art sharing
          </p>
          <h1 className="text-4xl font-semibold leading-[1.05] text-text sm:text-6xl">
            Share creative pixel art without the arcade costume.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-text-muted sm:text-lg">
            PixAnony is a calm social platform for drawing, publishing, and sending anonymous artwork with a clean interface and a subtle pixel signature.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CreateCta className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(124,58,237,0.22)] transition hover:-translate-y-0.5">
              Create your studio
              <ArrowRight size={14} />
            </CreateCta>
            <Link href="/explore" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-card/70 px-6 text-sm font-semibold text-text transition hover:border-primary/25 hover:bg-card">
              Explore artwork
              <ChevronRight size={13} />
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Shield, label: 'Privacy-first flows' },
              { icon: Palette, label: 'Real editor tools' },
              { icon: Eye, label: 'Readable social UI' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card/45 px-3 py-3 text-sm font-medium text-text-muted">
                <Icon size={14} className="text-primary" />
                {label}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.12 }} className="relative mx-auto w-full max-w-[560px]">
          <div className="absolute -inset-8 rounded-[3rem] bg-primary/12 blur-3xl" />
          <div className="surface-panel relative overflow-hidden rounded-[2rem] p-4 shadow-float sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3 rounded-3xl border border-border/70 bg-surface/80 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <Palette size={17} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-text">Canvas preview</p>
                  <p className="text-xs text-text-muted">Subtle pixel DNA, polished shell</p>
                </div>
              </div>
              <span className="rounded-full bg-green/12 px-3 py-1 text-xs font-semibold text-green">Live app</span>
            </div>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_8rem]">
              <PixelCanvasMock className="min-h-[280px]" />
              <div className="grid gap-3">
                {['Brush', 'Fill', 'Erase', 'Send'].map((tool, index) => (
                  <span
                    key={tool}
                    className={cn(
                      'flex items-center justify-center rounded-2xl border px-3 py-3 text-xs font-semibold',
                      index === 0 ? 'border-primary/30 bg-primary text-white shadow-[0_12px_26px_rgba(124,58,237,0.18)]' : 'border-border bg-surface text-text-muted',
                    )}
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 rounded-3xl border border-border bg-surface/80 p-4">
              <div className="flex items-center gap-3">
                <PixelAvatar username="PixAnony" size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text">A tiny piece, shared beautifully</p>
                  <p className="truncate text-xs text-text-muted">@anonymous-creator</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[Heart, MessageCircle, Repeat2, Bookmark].map((Icon, index) => (
                  <span key={index} className="inline-flex items-center gap-1.5 rounded-full bg-bg px-3 py-2 text-xs font-semibold text-text-muted">
                    <Icon size={12} className="text-primary" />
                    {['Like', 'Comment', 'Repost', 'Save'][index]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section id="workflow" className="py-20 sm:py-28">
      <div className="site-container">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase text-primary">Workflow</p>
          <h2 className="mt-3 text-3xl font-semibold text-text sm:text-5xl">Creative, private, and still easy to understand.</h2>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {workflow.map(({ step, icon: Icon, title, text }) => (
            <article key={title} className="surface-panel rounded-[1.75rem] p-6">
              <div className="mb-8 flex items-center justify-between">
                <span className="text-sm font-semibold text-text-muted">{step}</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon size={18} />
                </span>
              </div>
              <h3 className="text-lg font-semibold text-text">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-text-muted">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="bg-surface/45 py-20 sm:py-28">
      <div className="site-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase text-primary">Feature set</p>
          <h2 className="mt-3 text-3xl font-semibold text-text sm:text-5xl">A social product shell with pixel accents where they belong.</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-[1.5rem] border border-border bg-card p-5 shadow-soft">
              <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon size={18} />
              </span>
              <h3 className="text-sm font-semibold text-text">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-text-muted">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamSection() {
  return (
    <section id="team" className="py-20 sm:py-28">
      <div className="site-container">
        <div className="surface-panel grid gap-8 overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:grid-cols-[0.82fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Team</p>
            <h2 className="mt-3 text-3xl font-semibold text-text sm:text-5xl">Built with product focus, not visual noise.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-text-muted">
              PixAnony keeps the main interface quiet so the artwork, creator profiles, and anonymous delivery moments stay clear.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-border bg-surface/80 p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <PixelAvatar username="Nader Mohamed" size="xl" showBadge={false} />
              <div>
                <p className="text-xl font-semibold text-text">Nader Mohamed</p>
                <p className="mt-1 text-sm font-semibold text-primary">Founder & Product Builder</p>
                <p className="mt-3 max-w-md text-sm leading-6 text-text-muted">
                  Designing PixAnony around crisp boards, honest privacy, and a community feed that rewards real pixel work.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="site-container py-20 sm:py-28">
      <div className="relative overflow-hidden rounded-[2rem] border border-primary/18 bg-gradient-to-br from-primary/12 via-card to-pink/8 p-8 text-center shadow-float sm:p-14">
        <div className="absolute inset-0 dot-grid opacity-35" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold text-text sm:text-5xl">Draw something small. Send something memorable.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-text-muted sm:text-base">
            Open the editor, publish to your profile, or send an anonymous piece to another creator.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <CreateCta className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(124,58,237,0.22)]">
              Start creating
              <ArrowRight size={14} />
            </CreateCta>
            <Link href="/paint" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-bg/70 px-7 text-sm font-semibold text-text transition hover:border-primary/25">
              Open editor
              <Paintbrush size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/70 py-10">
      <div className="site-container flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo size="sm" />
          <p className="mt-2 max-w-sm text-xs leading-5 text-text-muted">{BRAND.tagline}</p>
        </div>
        <div className="flex flex-wrap gap-5 text-xs font-semibold text-text-muted">
          <Link href="/explore" className="transition hover:text-text">Explore</Link>
          <Link href="/login" className="transition hover:text-text">Sign in</Link>
          <Link href="/paint" className="transition hover:text-text">Editor</Link>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-bg text-text">
      <Navbar />
      <Hero />
      <WorkflowSection />
      <FeaturesSection />
      <TeamSection />
      <FinalCta />
      <Footer />
    </main>
  );
}
