'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Paintbrush, CheckCircle2, Sparkles } from '@/components/ui/icons';
import { PixelParticles } from '@/components/ui/pixel-particles';
import { AnimatedButton } from '@/components/ui/animated-button';



/* ===== CSS Pixel Envelope Animation ===== */
function PixelEnvelopeAnimation() {
  return (
    <div className="relative w-48 h-32 flex items-center justify-center mb-8">
      {/* Glow */}
      <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
      
      {/* Floating Sparkles */}
      <motion.div
        className="absolute -top-12 -left-6 text-yellow"
        animate={{ y: [0, -15, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
      >
        <Sparkles className="w-5 h-5" />
      </motion.div>
      <motion.div
        className="absolute -top-6 -right-8 text-cyan"
        animate={{ y: [0, -20, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
      >
        <Sparkles className="w-4 h-4" />
      </motion.div>

      {/* Envelope Outer */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="relative w-40 h-28 bg-card border-4 border-border rounded-lg shadow-2xl flex items-center justify-center overflow-visible"
      >
        {/* Flap Open/Close */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-0 border-t-[48px] border-t-card-hover border-x-[76px] border-x-transparent origin-top z-10"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateX: [0, 180, 180] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
        />

        {/* Envelope interior gradient */}
        <div className="absolute inset-1.5 bg-gradient-to-t from-surface to-card rounded-md z-0" />

        {/* Envelope Body Overlay (Fold Lines) */}
        <div className="absolute inset-0 border-b-[48px] border-b-card/80 border-x-[76px] border-x-transparent z-20 pointer-events-none rounded-b-md" />

        {/* Released Pixel Heart Floating Up */}
        <motion.div
          className="absolute z-15"
          animate={{ 
            y: [10, -80, -100], 
            scale: [0.6, 1.2, 0], 
            opacity: [0, 1, 0],
            rotate: [0, 15, -15, 0]
          }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity, 
            repeatDelay: 1, 
            ease: 'easeOut' 
          }}
        >
          {/* Custom SVG Pixel Heart */}
          <svg className="w-10 h-10 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 0H3V1H4V2H6V1H7V0H8V1H9V3H8V4H7V5H6V6H4V5H3V4H2V3H1V1H2V0Z" fill="url(#pinkGrad)"/>
            <defs>
              <linearGradient id="pinkGrad" x1="0" y1="0" x2="10" y2="9" gradientUnits="userSpaceOnUse">
                <stop stopColor="#EC4899" />
                <stop offset="1" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ===== MAIN CONFIRMATION PAGE ===== */
function ConfirmPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const signed = mode === 'signed';

  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-bg px-4">
      {/* Background Star Particles */}
      <PixelParticles count={30} />

      <div className="max-w-md w-full flex flex-col items-center text-center relative z-10">
        
        {/* Animated Envelope */}
        <PixelEnvelopeAnimation />

        {/* Checked Badge */}
        <motion.div
          initial={false}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="bg-green/10 text-green border border-green/30 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold tracking-wide mb-6 uppercase"
        >
          <CheckCircle2 className="w-4 h-4" />
          {signed ? 'Signed Pixel Delivered' : 'Pixel Art Dispatched'}
        </motion.div>

        {/* Message */}
        <motion.h1
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-2xl sm:text-3xl font-bold font-pixel tracking-wide text-text mb-3"
        >
          Your pixel is on its way.
        </motion.h1>
        
        <motion.p
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-sm text-text-muted leading-relaxed mb-10 max-w-sm"
        >
          {signed
            ? 'It has been delivered to their private collection with your profile attached.'
            : 'It has been delivered to their private collection anonymously. They can view the artwork while your identity remains hidden.'}
        </motion.p>

        {/* Call to Actions */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-3.5 w-full justify-center"
        >
          <AnimatedButton
            variant="ghost"
            onClick={() => router.push('/home')}
            className="w-full sm:w-auto px-6 py-3 text-sm font-semibold flex items-center justify-center gap-2 border border-border"
          >
            <Home className="w-4 h-4" />
            Back to Feed
          </AnimatedButton>
          
          <AnimatedButton
            variant="primary"
            onClick={() => router.push('/paint')}
            className="w-full sm:w-auto px-6 py-3 text-sm font-semibold flex items-center justify-center gap-2 glow-primary"
          >
            <Paintbrush className="w-4 h-4" />
            Draw Another Art
          </AnimatedButton>
        </motion.div>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh] bg-bg" />}>
      <ConfirmPageContent />
    </Suspense>
  );
}
