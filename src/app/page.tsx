'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight, Bookmark, Heart, Lock, Menu, MessageCircle, Paintbrush,
  Repeat2, Shield, Sparkles, Users, X,
} from '@/components/ui/icons';
import { Logo } from '@/components/ui/logo';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { PixelCanvasMock } from '@/components/ui/pixel-canvas-mock';
import { UserMenu } from '@/components/auth/user-menu';
import { useAuthProfile } from '@/hooks/use-auth-profile';

const navLinks = [
  { label: 'Why PixAnony', href: '/#benefits' },
  { label: 'How it works', href: '/#workflow' },
  { label: 'Community', href: '/explore' },
  { label: 'Questions', href: '/#questions' },
] as const;

const transition = { duration: 0.8, ease: [0.32, 0.72, 0, 1] as const };

function Navbar() {
  const [open, setOpen] = useState(false);
  const { profile, signOut } = useAuthProfile();

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:pt-6">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between rounded-full bg-card/90 px-3 shadow-[0_16px_48px_rgba(44,40,58,0.12)] backdrop-blur-2xl sm:px-5" aria-label="Primary">
        <Link href="/home" aria-label="PixAnony home feed"><Logo size="sm" /></Link>
        <div className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => <Link key={link.href} href={link.href} className="text-sm font-semibold text-text-muted transition-colors hover:text-text">{link.label}</Link>)}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {profile ? (
            <>
              <Link href="/home" className="rounded-full px-4 py-2 text-sm font-semibold text-text-muted hover:bg-surface hover:text-text">Open feed</Link>
              <Link href="/paint" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-bg">Create art</Link>
              <UserMenu profile={profile} signOut={signOut} compact />
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-text-muted hover:bg-surface hover:text-text">Sign in</Link>
              <Link href="/login?mode=signup" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-bg">Start creating</Link>
            </>
          )}
        </div>
        <button type="button" onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-full bg-surface md:hidden" aria-label="Toggle navigation" aria-expanded={open}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>
      {open && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={transition} className="mx-auto mt-2 max-w-lg rounded-[28px] bg-card/95 p-3 shadow-float backdrop-blur-3xl md:hidden">
          {navLinks.map((link, index) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-sm font-semibold text-text-muted hover:bg-surface hover:text-text" style={{ transitionDelay: `${index * 50}ms` }}>{link.label}</Link>)}
          <Link href={profile ? '/home' : '/login?mode=signup'} className="mt-2 flex min-h-12 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-bg">{profile ? 'Open feed' : 'Start creating'}</Link>
        </motion.div>
      )}
    </header>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <span className="absolute -left-6 top-20 h-16 w-16 rounded-full bg-[var(--butter)] shadow-float sm:-left-10" />
      <span className="absolute -right-4 bottom-20 h-20 w-20 rounded-full bg-[var(--blush)] shadow-float sm:-right-10" />
      <div className="grid min-h-[540px] overflow-hidden rounded-[32px] bg-card p-4 shadow-[0_32px_100px_rgba(44,40,58,0.2)] md:grid-cols-[176px_minmax(0,1fr)_190px] md:p-5">
        <aside className="hidden flex-col border-r border-border/60 pr-4 md:flex">
          <div className="flex flex-col items-center py-5 text-center">
            <PixelAvatar username="Mina" size="lg" />
            <p className="mt-3 text-sm font-bold">Mina Sol</p>
            <p className="text-xs text-text-muted">@minasol</p>
          </div>
          <div className="mt-3 space-y-1">
            {['Home', 'Explore', 'Private drops', 'Bookmarks', 'Settings'].map((item, index) => <span key={item} className={`block rounded-full px-4 py-3 text-xs font-semibold ${index === 0 ? 'bg-primary text-bg' : 'text-text-muted'}`}>{item}</span>)}
          </div>
          <div className="mt-auto rounded-[24px] bg-[var(--lilac)] p-4 text-center"><Sparkles className="mx-auto" size={18} /><p className="mt-2 text-xs font-bold">Your ideas belong here</p></div>
        </aside>

        <section className="min-w-0 px-0 md:px-5" aria-label="PixAnony feed preview">
          <div className="flex items-center justify-between pb-4"><h2 className="text-xl font-bold">Your feed</h2><div className="flex gap-4 text-xs font-semibold"><span>Friends</span><span className="text-text-muted">Recent</span></div></div>
          <article className="rounded-[28px] bg-[var(--powder)] p-4 sm:p-5">
            <div className="flex items-center gap-3"><PixelAvatar username="Raya" size="sm" /><div><p className="text-sm font-bold">Raya Noor</p><p className="text-xs text-text-muted">12 minutes ago</p></div></div>
            <p className="mt-4 text-sm leading-6">A quiet little landscape I made after today’s walk. What should I draw next?</p>
            <div className="mt-4 overflow-hidden rounded-[20px] bg-card p-3"><PixelCanvasMock className="min-h-[250px]" /></div>
            <div className="mt-4 flex items-center gap-5 text-xs font-semibold text-text-muted"><span className="flex items-center gap-1.5"><Heart size={15} />482</span><span className="flex items-center gap-1.5"><MessageCircle size={15} />36</span><span className="flex items-center gap-1.5"><Repeat2 size={15} />18</span><Bookmark className="ml-auto" size={15} /></div>
          </article>
          <article className="mt-3 rounded-[28px] bg-[var(--butter)] p-5"><div className="flex items-center gap-3"><PixelAvatar username="Omar" size="sm" /><p className="text-sm font-bold">Omar Lee</p></div><p className="mt-4 text-sm leading-6">Sending a little warmth into the community today.</p></article>
        </section>

        <aside className="hidden border-l border-border/60 pl-4 md:block">
          <h2 className="py-3 text-lg font-bold">Creators</h2>
          <div className="flex gap-2">{['Aya', 'Leo', 'Sam'].map((name) => <PixelAvatar key={name} username={name} size="md" />)}</div>
          <h3 className="mb-3 mt-8 text-sm font-bold">For you</h3>
          {['Nora Wilde', 'Yusuf K.', 'Mai Chen'].map((name) => <div key={name} className="mb-3 flex items-center gap-2"><PixelAvatar username={name} size="xs" /><span className="min-w-0 flex-1 truncate text-xs font-semibold">{name}</span><span className="rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-bg">Follow</span></div>)}
          <div className="mt-8 rounded-[24px] bg-[var(--blush)] p-4"><Shield size={18} /><p className="mt-3 text-sm font-bold">Anonymous when you want it</p><p className="mt-2 text-xs leading-5 text-text-muted">Send privately without revealing who you are.</p></div>
        </aside>
      </div>
    </div>
  );
}

function Hero() {
  const { isAuthenticated } = useAuthProfile();
  return (
    <section className="relative overflow-hidden pb-24 pt-36 sm:pt-44">
      <div className="absolute left-[-5rem] top-40 h-52 w-52 rounded-full bg-[var(--lilac)] blur-3xl" />
      <div className="absolute right-[-4rem] top-24 h-48 w-48 rounded-full bg-[var(--powder)] blur-3xl" />
      <div className="site-container relative">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={transition} className="mx-auto max-w-[680px] text-center">
          <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-card"><Sparkles size={15} className="text-pink" />A softer place to make and share</p>
          <h1 className="text-5xl font-bold leading-none tracking-[-0.05em] text-text sm:text-7xl">Make something small.<br />Share something real.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-text-muted sm:text-lg">Draw artwork, publish it to a creative community, or send it privately and anonymously. You decide how every piece enters the world.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={isAuthenticated ? '/paint' : '/login?mode=signup'} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-bg shadow-[0_16px_32px_rgba(44,40,58,0.18)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 active:scale-[.98]">Start creating <ArrowRight size={17} /></Link>
            <Link href="/explore" className="inline-flex min-h-12 items-center justify-center rounded-full bg-card px-6 text-base font-semibold text-text shadow-card transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 active:scale-[.98]">Explore the community</Link>
          </div>
          <p className="mt-5 text-sm font-medium text-text-muted">Free to join. Share publicly or stay anonymous.</p>
        </motion.div>
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ ...transition, delay: 0.15 }} className="mt-16"><ProductPreview /></motion.div>
      </div>
    </section>
  );
}

function TaglineReveal() {
  const words = 'Your art can be public. Your identity does not have to be.'.split(' ');
  return <section className="site-container py-24 sm:py-32"><h2 className="max-w-[680px] text-4xl font-bold leading-tight sm:text-6xl">{words.map((word, index) => <motion.span key={`${word}-${index}`} className="mr-[.24em] inline-block" initial={{ opacity: .28 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: .8 }} transition={{ duration: .7, delay: index * .06, ease: [0.32,0.72,0,1] }}>{word}</motion.span>)}</h2></section>;
}

const benefits = [
  { icon: Paintbrush, title: 'A focused studio', text: 'The drawing tools stay close while the interface gives your work room to breathe.', tone: 'bg-[var(--powder)]' },
  { icon: Lock, title: 'Private by choice', text: 'Send a piece anonymously or attach your profile when you want to be known.', tone: 'bg-[var(--blush)]' },
  { icon: Users, title: 'Built for community', text: 'Discover creators, follow their work, and respond through likes, comments, and reposts.', tone: 'bg-[var(--butter)]' },
] as const;

function Benefits() {
  return <section id="benefits" className="site-container py-20"><div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]"><div className="rounded-[32px] bg-card p-8 shadow-card sm:p-12"><p className="text-sm font-bold text-pink">Why PixAnony</p><h2 className="mt-4 max-w-xl text-4xl font-bold sm:text-5xl">Creativity feels better without performance pressure.</h2><p className="mt-5 max-w-xl text-base leading-7 text-text-muted">Make work for the joy of making it. Share openly, send quietly, or keep exploring until inspiration arrives.</p></div><div className="grid gap-4">{benefits.map(({ icon: Icon, title, text, tone }) => <article key={title} className={`rounded-[28px] p-6 ${tone}`}><div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-card"><Icon size={20} /></span><div><h3 className="text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-text-muted">{text}</p></div></div></article>)}</div></div></section>;
}

function Workflow() {
  const steps = [
    ['01', 'Draw', 'Open the studio and shape an idea with the canvas tools you already know.'],
    ['02', 'Choose', 'Publish to the community or select a person and send privately.'],
    ['03', 'Connect', 'Follow the response or let an anonymous gift simply make someone’s day.'],
  ];
  return <section id="workflow" className="site-container py-20"><div className="rounded-[32px] bg-primary p-8 text-bg sm:p-12"><p className="text-sm font-bold text-pink">How it works</p><h2 className="mt-4 max-w-[680px] text-4xl font-bold sm:text-5xl">From blank canvas to meaningful connection.</h2><div className="mt-12 grid gap-8 md:grid-cols-3">{steps.map(([step,title,text]) => <article key={step}><span className="text-sm font-bold text-bg/50">{step}</span><h3 className="mt-5 text-2xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-bg/65">{text}</p></article>)}</div></div></section>;
}

function Questions() {
  const questions = [
    ['Can I use PixAnony without sharing my identity?', 'Yes. Private artwork can be sent anonymously, and the recipient will not see who created it.'],
    ['Can I publish work publicly too?', 'Yes. Publish finished pieces to your profile and the community feed whenever you want attribution.'],
    ['What can I do in the editor?', 'Choose canvas sizes, draw with multiple tools, work with layers, zoom, undo, redo, and export your finished piece.'],
    ['Can I change my mind before sending?', 'Yes. You choose private or public delivery and anonymous or signed identity at the final sharing step.'],
    ['Is PixAnony free?', 'You can create an account and start drawing without paying.'],
    ['Does it work on mobile?', 'Yes. The full social experience is responsive, with a touch friendly drawing and navigation experience.'],
  ];
  return <section id="questions" className="site-container py-20"><div className="grid gap-10 lg:grid-cols-[.65fr_1.35fr]"><div><p className="text-sm font-bold text-pink">Questions</p><h2 className="mt-4 text-4xl font-bold sm:text-5xl">Good things to know.</h2><p className="mt-5 text-base leading-7 text-text-muted">The short version: you stay in control of every piece and every interaction.</p></div><div className="grid gap-3 sm:grid-cols-2">{questions.map(([question,answer], index) => <article key={question} className={`rounded-[28px] p-6 ${index % 3 === 0 ? 'bg-[var(--powder)]' : index % 3 === 1 ? 'bg-[var(--butter)]' : 'bg-[var(--blush)]'}`}><h3 className="text-lg font-bold">{question}</h3><p className="mt-3 text-sm leading-6 text-text-muted">{answer}</p></article>)}</div></div></section>;
}

function Footer() {
  return <footer className="site-container pb-8 pt-20"><div className="rounded-[32px] bg-card p-8 shadow-card sm:p-12"><div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"><div><Logo /><h2 className="mt-8 max-w-xl text-3xl font-bold sm:text-5xl">Draw it your way.<br />Share it on your terms.</h2></div><Link href="/login?mode=signup" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-bg">Start creating <ArrowRight size={17} /></Link></div><div className="mt-12 flex flex-wrap items-center gap-5 border-t border-border pt-6 text-sm font-semibold text-text-muted"><Link href="/explore">Explore</Link><Link href="/login">Sign in</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><span className="ml-auto">© {new Date().getFullYear()} PixAnony</span></div></div></footer>;
}

export default function LandingPage() {
  return <main id="main-content" className="min-h-screen bg-bg text-text"><Navbar /><Hero /><TaglineReveal /><Benefits /><Workflow /><Questions /><Footer /></main>;
}
