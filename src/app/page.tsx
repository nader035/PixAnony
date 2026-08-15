'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
  type Variants,
} from 'framer-motion';
import {
  ArrowRight, Bookmark, Heart, Lock, Menu, MessageCircle, Paintbrush,
  Repeat2, Shield, Sparkles, Users, X,
} from '@/components/ui/icons';
import { Logo } from '@/components/ui/logo';
import { PixelAvatar } from '@/components/ui/pixel-avatar';
import { PixelCanvasMock } from '@/components/ui/pixel-canvas-mock';
import { UserMenu } from '@/components/auth/user-menu';
import { useAuthProfile } from '@/hooks/use-auth-profile';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { useI18n } from '@/components/i18n/locale-provider';
import { formatNumber } from '@/lib/utils';

const navLinks = [
  { labelKey: 'landing.nav.why', href: '/#benefits' },
  { labelKey: 'landing.nav.how', href: '/#workflow' },
  { labelKey: 'landing.nav.founder', href: '/#founder' },
  { labelKey: 'landing.nav.community', href: '/explore' },
  { labelKey: 'landing.nav.questions', href: '/#questions' },
] as const;

const transition = { duration: 0.8, ease: [0.32, 0.72, 0, 1] as const };
const revealItem: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition },
};
const revealGroup: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

function Navbar() {
  const [open, setOpen] = useState(false);
  const { profile, signOut } = useAuthProfile();
  const { t } = useI18n();

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:pt-6">
      <nav
        className="mx-auto flex h-16 max-w-6xl items-center justify-between rounded-full bg-card/90 px-3 shadow-[0_16px_48px_rgba(16,43,94,0.13)] backdrop-blur-2xl sm:px-5"
        aria-label={t('nav.primary')}
      >
        <Link href="/home" aria-label={t('common.pixanonyHome')}><Logo size="sm" priority /></Link>
        <div className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-semibold text-text-muted transition-colors hover:text-primary">
              {t(link.labelKey)}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher showLabel={false} />
          {profile ? (
            <>
              <Link href="/home" className="rounded-full px-4 py-2 text-sm font-semibold text-text-muted hover:bg-surface hover:text-text">{t('landing.openFeed')}</Link>
              <Link href="/paint" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-contrast">{t('feed.createArtwork')}</Link>
              <UserMenu profile={profile} signOut={signOut} compact />
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-text-muted hover:bg-surface hover:text-text">{t('nav.signIn')}</Link>
              <Link href="/login?mode=signup" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-contrast">{t('landing.startCreating')}</Link>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="grid h-10 w-10 place-items-center rounded-full bg-surface text-text lg:hidden"
          aria-label={t('landing.toggleNav')}
          aria-expanded={open}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
          className="mx-auto mt-2 max-w-lg rounded-[28px] bg-card/95 p-3 shadow-float backdrop-blur-3xl lg:hidden"
        >
          {navLinks.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-sm font-semibold text-text-muted hover:bg-surface hover:text-primary"
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {t(link.labelKey)}
            </Link>
          ))}
          <Link
            href={profile ? '/home' : '/login?mode=signup'}
            className="mt-2 flex min-h-12 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-contrast"
          >
            {profile ? t('landing.openFeed') : t('landing.startCreating')}
          </Link>
          <LanguageSwitcher className="mt-2 w-full" />
        </motion.div>
      )}
    </header>
  );
}

function PixelDrift() {
  const reducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const nearY = useTransform(scrollY, [0, 1200], [0, 150]);
  const farY = useTransform(scrollY, [0, 1200], [0, -90]);
  const spin = useTransform(scrollY, [0, 1200], [0, 95]);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <motion.span
        style={reducedMotion ? undefined : { y: nearY, rotate: spin }}
        className="absolute left-[8%] top-48 h-4 w-4 rounded-[4px] bg-brand shadow-[0_10px_24px_rgba(0,94,254,.28)] sm:left-[13%]"
      />
      <motion.span
        style={reducedMotion ? undefined : { y: farY, rotate: spin }}
        className="absolute right-[9%] top-80 h-6 w-6 rounded-[6px] bg-[var(--blush)] shadow-card sm:right-[15%]"
      />
      <motion.span
        style={reducedMotion ? undefined : { y: nearY }}
        className="absolute right-[22%] top-40 h-2.5 w-2.5 rounded-[3px] bg-[var(--mint)]"
      />
      <motion.span
        style={reducedMotion ? undefined : { y: farY }}
        className="absolute bottom-40 left-[6%] h-3 w-3 rounded-[3px] bg-[var(--butter)] sm:left-[18%]"
      />
    </div>
  );
}

function ProductPreview() {
  const { locale, t } = useI18n();
  const previewNav = [t('nav.home'), t('nav.explore'), t('nav.drops'), t('nav.bookmarks'), t('nav.settings')];
  const previewCreators = [t('landing.previewCreatorOne'), t('landing.previewCreatorTwo'), t('landing.previewCreatorThree')];
  const previewSuggestions = [t('landing.previewSuggestionOne'), t('landing.previewSuggestionTwo'), t('landing.previewSuggestionThree')];
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <span className="absolute -left-6 top-20 h-16 w-16 rounded-full bg-[var(--butter)] shadow-float sm:-left-10" />
      <span className="absolute -right-4 bottom-20 h-20 w-20 rounded-full bg-[var(--blush)] shadow-float sm:-right-10" />
      <span className="absolute -right-1 top-16 h-5 w-5 rotate-12 rounded-[5px] bg-brand shadow-[0_10px_28px_rgba(0,94,254,.26)] sm:-right-7" />
      <div className="grid min-h-[540px] overflow-hidden rounded-[32px] bg-card p-4 shadow-[0_32px_100px_rgba(16,43,94,0.2)] md:grid-cols-[176px_minmax(0,1fr)_190px] md:p-5">
        <aside className="hidden flex-col border-e border-border/60 pe-4 md:flex">
          <div className="flex flex-col items-center py-5 text-center">
            <PixelAvatar username={t('landing.previewProfileName')} size="lg" />
            <p className="mt-3 text-sm font-bold">{t('landing.previewProfileName')}</p>
            <p className="rtl-isolate text-xs text-text-muted">@minasol</p>
          </div>
          <div className="mt-3 space-y-1">
            {previewNav.map((item, index) => (
              <span key={item} className={`block rounded-full px-4 py-3 text-xs font-semibold ${index === 0 ? 'bg-primary text-primary-contrast' : 'text-text-muted'}`}>{item}</span>
            ))}
          </div>
          <div className="mt-auto rounded-[24px] bg-[var(--lilac)] p-4 text-center"><Sparkles className="mx-auto text-primary" size={18} /><p className="mt-2 text-xs font-bold">{t('landing.previewIdeas')}</p></div>
        </aside>

        <section className="min-w-0 px-0 md:px-5" aria-label={t('landing.previewLabel')}>
          <div className="flex items-center justify-between pb-4"><h2 className="text-xl font-bold">{t('landing.previewFeed')}</h2><div className="flex gap-4 text-xs font-semibold"><span className="text-primary">{t('landing.previewFriends')}</span><span className="text-text-muted">{t('landing.previewRecent')}</span></div></div>
          <article className="rounded-[28px] bg-[var(--powder)] p-4 sm:p-5">
            <div className="flex items-center gap-3"><PixelAvatar username={t('landing.previewPostAuthorOne')} size="sm" /><div><p className="text-sm font-bold">{t('landing.previewPostAuthorOne')}</p><p className="text-xs text-text-muted">{t('landing.previewTime')}</p></div></div>
            <p className="mt-4 text-sm leading-6">{t('landing.previewPostOne')}</p>
            <div className="mt-4 overflow-hidden rounded-[20px] bg-card p-3"><PixelCanvasMock className="min-h-[250px]" /></div>
            <div className="mt-4 flex items-center gap-5 text-xs font-semibold text-text-muted"><span className="flex items-center gap-1.5"><Heart size={15} />{formatNumber(482, locale)}</span><span className="flex items-center gap-1.5"><MessageCircle size={15} />{formatNumber(36, locale)}</span><span className="flex items-center gap-1.5"><Repeat2 size={15} />{formatNumber(18, locale)}</span><Bookmark className="ms-auto" size={15} /></div>
          </article>
          <article className="mt-3 rounded-[28px] bg-[var(--butter)] p-5"><div className="flex items-center gap-3"><PixelAvatar username={t('landing.previewPostAuthorTwo')} size="sm" /><p className="text-sm font-bold">{t('landing.previewPostAuthorTwo')}</p></div><p className="mt-4 text-sm leading-6">{t('landing.previewPostTwo')}</p></article>
        </section>

        <aside className="hidden border-s border-border/60 ps-4 md:block">
          <h2 className="py-3 text-lg font-bold">{t('landing.previewCreators')}</h2>
          <div className="flex gap-2">{previewCreators.map((name) => <PixelAvatar key={name} username={name} size="md" />)}</div>
          <h3 className="mb-3 mt-8 text-sm font-bold">{t('landing.previewForYou')}</h3>
          {previewSuggestions.map((name) => <div key={name} className="mb-3 flex items-center gap-2"><PixelAvatar username={name} size="xs" /><span className="min-w-0 flex-1 truncate text-xs font-semibold">{name}</span><span className="rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-primary-contrast">{t('landing.previewFollow')}</span></div>)}
          <div className="mt-8 rounded-[24px] bg-[var(--blush)] p-4"><Shield size={18} className="text-primary" /><p className="mt-3 text-sm font-bold">{t('landing.previewAnonymous')}</p><p className="mt-2 text-xs leading-5 text-text-muted">{t('landing.previewAnonymousText')}</p></div>
        </aside>
      </div>
    </div>
  );
}

function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.78], [1, 0.45]);
  const previewY = useTransform(scrollYProgress, [0, 1], [0, -34]);
  const { isAuthenticated } = useAuthProfile();
  const { t } = useI18n();

  return (
    <section ref={heroRef} className="relative overflow-hidden pb-24 pt-36 sm:pt-44">
      <div className="absolute left-[-5rem] top-40 h-52 w-52 rounded-full bg-[var(--lilac)] blur-3xl" />
      <div className="absolute right-[-4rem] top-24 h-48 w-48 rounded-full bg-[var(--powder)] blur-3xl" />
      <PixelDrift />
      <div className="site-container relative">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          style={reducedMotion ? undefined : { y: copyY, opacity: copyOpacity }}
          transition={transition}
          className="mx-auto max-w-[720px] text-center"
        >
          <p className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-card"><Sparkles size={15} className="text-primary" />{t('landing.heroBadge')}</p>
          <h1 className="text-5xl font-bold leading-none tracking-[-0.05em] text-text sm:text-7xl">{t('landing.heroLineOne')}<br /><span className="text-primary">{t('landing.heroLineTwo')}</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-text-muted sm:text-lg">{t('landing.heroDescription')}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={isAuthenticated ? '/paint' : '/login?mode=signup'} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-primary-contrast shadow-[0_16px_34px_rgba(0,94,254,0.24)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:bg-primary-glow active:scale-[.98]">{t('landing.startCreating')} <ArrowRight size={17} className="rtl-flip" /></Link>
            <Link href="/explore" className="inline-flex min-h-12 items-center justify-center rounded-full bg-card px-6 text-base font-semibold text-text shadow-card transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 active:scale-[.98]">{t('landing.exploreCommunity')}</Link>
          </div>
          <p className="mt-5 text-sm font-medium text-text-muted">{t('landing.heroNote')}</p>
        </motion.div>
        <motion.div style={reducedMotion ? undefined : { y: previewY }} className="mt-16"><ProductPreview /></motion.div>
      </div>
    </section>
  );
}

function ScrollWord({ word, index, total, progress }: { word: string; index: number; total: number; progress: MotionValue<number> }) {
  const reducedMotion = useReducedMotion();
  const start = 0.04 + (index / total) * 0.72;
  const opacity = useTransform(progress, [start, Math.min(start + 0.18, 1)], [0.16, 1]);
  const y = useTransform(progress, [start, Math.min(start + 0.18, 1)], [18, 0]);

  return <motion.span style={reducedMotion ? undefined : { opacity, y }} className="me-[.24em] inline-block">{word}</motion.span>;
}

function TaglineReveal() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start 85%', 'end 45%'] });
  const { t } = useI18n();
  const words = t('landing.expressionTitle').split(' ');

  return (
    <section ref={sectionRef} className="site-container py-24 sm:py-32">
      <p className="mb-5 text-sm font-bold text-primary">{t('landing.expressionEyebrow')}</p>
      <h2 className="max-w-[760px] text-4xl font-bold leading-tight sm:text-6xl">
        {words.map((word, index) => <ScrollWord key={`${word}-${index}`} word={word} index={index} total={words.length} progress={scrollYProgress} />)}
      </h2>
    </section>
  );
}

function Benefits() {
  const { t } = useI18n();
  const benefits = [
    { icon: Paintbrush, title: t('landing.benefitStudioTitle'), text: t('landing.benefitStudioText'), tone: 'bg-[var(--powder)]' },
    { icon: Lock, title: t('landing.benefitPrivateTitle'), text: t('landing.benefitPrivateText'), tone: 'bg-[var(--blush)]' },
    { icon: Users, title: t('landing.benefitCommunityTitle'), text: t('landing.benefitCommunityText'), tone: 'bg-[var(--butter)]' },
  ];
  return (
    <motion.section id="benefits" className="site-container py-20" variants={revealGroup} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }}>
      <div className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
        <motion.div variants={revealItem} className="rounded-[32px] bg-card p-8 shadow-card sm:p-12">
          <p className="text-sm font-bold text-primary">{t('landing.whyEyebrow')}</p>
          <h2 className="mt-4 max-w-xl text-4xl font-bold sm:text-5xl">{t('landing.whyTitle')}</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-text-muted">{t('landing.whyDescription')}</p>
        </motion.div>
        <motion.div className="grid gap-4" variants={revealGroup}>
          {benefits.map(({ icon: Icon, title, text, tone }) => (
            <motion.article key={title} variants={revealItem} className={`rounded-[28px] p-6 ${tone}`}>
              <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-card text-primary"><Icon size={20} /></span><div><h3 className="text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-text-muted">{text}</p></div></div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function Workflow() {
  const { t } = useI18n();
  const steps = [
    ['01', t('landing.stepDraw'), t('landing.stepDrawText')],
    ['02', t('landing.stepChoose'), t('landing.stepChooseText')],
    ['03', t('landing.stepConnect'), t('landing.stepConnectText')],
  ];

  return (
    <section id="workflow" className="site-container py-20">
      <motion.div className="relative overflow-hidden rounded-[32px] bg-brand p-8 text-white sm:p-12" variants={revealGroup} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
        <motion.span variants={revealItem} className="absolute -right-4 -top-5 h-24 w-24 rotate-12 rounded-[18px] bg-white/10" aria-hidden="true" />
        <motion.span variants={revealItem} className="absolute right-24 top-20 h-5 w-5 rounded-[5px] bg-[var(--butter)]" aria-hidden="true" />
        <motion.p variants={revealItem} className="relative text-sm font-bold text-white/70">{t('landing.workflowEyebrow')}</motion.p>
        <motion.h2 variants={revealItem} className="relative mt-4 max-w-[680px] text-4xl font-bold sm:text-5xl">{t('landing.workflowTitle')}</motion.h2>
        <motion.div variants={revealGroup} className="relative mt-12 grid gap-8 md:grid-cols-3">
          {steps.map(([step, title, text]) => (
            <motion.article variants={revealItem} key={step}>
              <span className="text-sm font-bold text-white/55">{step}</span>
              <h3 className="mt-5 text-2xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/72">{text}</p>
            </motion.article>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

function Founder() {
  const { t } = useI18n();
  return (
    <section id="founder" className="site-container py-20">
      <motion.div className="grid overflow-hidden rounded-[32px] bg-card shadow-card lg:grid-cols-[1.15fr_.85fr]" variants={revealGroup} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
        <motion.div variants={revealItem} className="p-8 sm:p-12">
          <p className="text-sm font-bold text-primary">{t('landing.founderEyebrow')}</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-bold sm:text-5xl">{t('landing.founderTitle')}</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-text-muted">{t('landing.founderDescription')}</p>
          <div className="mt-8 flex items-center gap-4">
            <PixelAvatar username="Nader Mohamed" size="xl" />
            <div>
              <h3 className="text-xl font-bold text-text">Nader Mohamed</h3>
              <p className="mt-1 text-sm font-semibold text-primary">{t('landing.founderRole')}</p>
            </div>
          </div>
        </motion.div>
        <motion.div variants={revealItem} className="relative min-h-72 overflow-hidden bg-[var(--powder)] p-8 sm:p-12">
          <span className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--lilac)]" aria-hidden="true" />
          <span className="absolute bottom-10 left-10 h-16 w-16 rounded-[18px] bg-brand shadow-[0_18px_36px_rgba(0,94,254,.2)]" aria-hidden="true" />
          <span className="absolute bottom-20 left-24 h-5 w-5 rounded-[5px] bg-[var(--blush)]" aria-hidden="true" />
          <div className="relative flex h-full flex-col justify-between">
            <Logo size="md" />
            <p className="ms-auto max-w-xs text-end text-2xl font-bold leading-tight text-text">{t('landing.founderQuote')}</p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function Questions() {
  const { t } = useI18n();
  const questions = [
    [t('landing.faqAnonymousQ'), t('landing.faqAnonymousA')],
    [t('landing.faqPublicQ'), t('landing.faqPublicA')],
    [t('landing.faqEditorQ'), t('landing.faqEditorA')],
    [t('landing.faqChoiceQ'), t('landing.faqChoiceA')],
    [t('landing.faqFreeQ'), t('landing.faqFreeA')],
    [t('landing.faqMobileQ'), t('landing.faqMobileA')],
  ];

  return (
    <motion.section id="questions" className="site-container py-20" variants={revealGroup} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
      <div className="grid gap-10 lg:grid-cols-[.65fr_1.35fr]">
        <motion.div variants={revealItem}>
          <p className="text-sm font-bold text-primary">{t('landing.questionsEyebrow')}</p>
          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">{t('landing.questionsTitle')}</h2>
          <p className="mt-5 text-base leading-7 text-text-muted">{t('landing.questionsDescription')}</p>
        </motion.div>
        <motion.div className="grid gap-3 sm:grid-cols-2" variants={revealGroup}>
          {questions.map(([question, answer], index) => (
            <motion.article key={question} variants={revealItem} className={`rounded-[28px] p-6 ${index % 3 === 0 ? 'bg-[var(--powder)]' : index % 3 === 1 ? 'bg-[var(--butter)]' : 'bg-[var(--blush)]'}`}>
              <h3 className="text-lg font-bold">{question}</h3>
              <p className="mt-3 text-sm leading-6 text-text-muted">{answer}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="site-container pb-8 pt-20">
      <div className="relative overflow-hidden rounded-[32px] bg-card p-8 shadow-card sm:p-12">
        <span className="absolute right-10 top-10 h-4 w-4 rounded-[4px] bg-brand" aria-hidden="true" />
        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div><Logo /><h2 className="mt-8 max-w-xl text-3xl font-bold sm:text-5xl">{t('landing.footerTitleOne')}<br />{t('landing.footerTitleTwo')}</h2></div>
          <Link href="/login?mode=signup" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-semibold text-primary-contrast">{t('landing.startCreating')} <ArrowRight size={17} className="rtl-flip" /></Link>
        </div>
        <div className="relative mt-12 flex flex-wrap items-center gap-5 border-t border-border pt-6 text-sm font-semibold text-text-muted"><Link href="/explore">{t('common.explore')}</Link><Link href="/#founder">{t('landing.nav.founder')}</Link><Link href="/login">{t('nav.signIn')}</Link><Link href="/privacy">{t('landing.privacy')}</Link><Link href="/terms">{t('landing.terms')}</Link><span className="ms-auto">© {new Date().getFullYear()} PixAnony</span></div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return <main id="main-content" className="min-h-screen bg-bg text-text"><Navbar /><Hero /><TaglineReveal /><Benefits /><Workflow /><Founder /><Questions /><Footer /></main>;
}
