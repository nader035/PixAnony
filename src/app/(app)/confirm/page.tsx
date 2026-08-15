'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Home, Paintbrush, Send, Sparkles } from '@/components/ui/icons';

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signed = searchParams.get('mode') === 'signed';

  return (
    <main id="main-content" className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-bg px-4 py-8 text-text">
      <span className="absolute -left-16 top-20 h-52 w-52 rounded-full bg-[var(--powder)] blur-3xl" />
      <span className="absolute -right-12 bottom-12 h-48 w-48 rounded-full bg-[var(--blush)] blur-3xl" />
      <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease: [0.32,0.72,0,1] }} className="relative w-full max-w-lg overflow-hidden rounded-[32px] bg-card p-8 text-center shadow-float sm:p-12">
        <span className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[var(--butter)]" />
        <div className="relative">
          <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full bg-[var(--lilac)]">
            <Send size={34} weight="fill" />
            <motion.span animate={{ rotate: [0, 18, 0], y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="absolute -right-2 -top-2 grid h-9 w-9 place-items-center rounded-full bg-[var(--blush)]"><Sparkles size={16} /></motion.span>
          </div>
          <p className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--mint)] px-4 py-2 text-sm font-bold"><CheckCircle2 size={16} />{signed ? 'Sent with your name' : 'Sent anonymously'}</p>
          <h1 className="mt-6 text-4xl font-bold">Your artwork is on its way.</h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-text-muted">{signed ? 'It has been delivered privately with your profile attached.' : 'It has been delivered privately. The recipient can see the artwork, while your identity stays hidden.'}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button onClick={() => router.push('/home')} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-surface px-5 text-base font-semibold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[.98]"><Home size={17} />Back to feed</button>
            <button onClick={() => router.push('/paint')} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-base font-semibold text-bg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[.98]"><Paintbrush size={17} />Create another <ArrowRight size={15} /></button>
          </div>
        </div>
      </motion.section>
    </main>
  );
}

export default function ConfirmPage() {
  return <Suspense fallback={<div className="min-h-[100dvh] bg-bg" />}><ConfirmContent /></Suspense>;
}
