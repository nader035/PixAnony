'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PixelParticlesProps {
  count?: number;
  className?: string;
  colors?: string[];
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
}

const defaultColors = [
  'rgba(139, 92, 246, 0.6)',   // purple
  'rgba(168, 85, 247, 0.5)',   // violet
  'rgba(236, 72, 153, 0.5)',   // pink
  'rgba(34, 211, 238, 0.4)',   // cyan
  'rgba(250, 204, 21, 0.4)',   // yellow
  'rgba(139, 92, 246, 0.3)',   // faint purple
  'rgba(236, 72, 153, 0.3)',   // faint pink
];

function seededRandom(seed: number) {
  const value = Math.sin(seed * 9301 + 49297) * 233280;
  return value - Math.floor(value);
}

function generateParticles(count: number, colors: string[]): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: seededRandom(i + 1) * 100,
    y: seededRandom(i + 11) * 100,
    size: seededRandom(i + 21) * 4 + 2,
    color: colors[Math.floor(seededRandom(i + 31) * colors.length)],
    duration: seededRandom(i + 41) * 8 + 6,
    delay: seededRandom(i + 51) * 5,
    driftX: (seededRandom(i + 61) - 0.5) * 60,
    driftY: -(seededRandom(i + 71) * 80 + 40),
  }));
}

export function PixelParticles({
  count = 30,
  className,
  colors = defaultColors,
}: PixelParticlesProps) {
  const particles = useMemo(() => generateParticles(count, colors), [count, colors]);

  return (
    <div
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x.toFixed(4)}%`,
            top: `${particle.y.toFixed(4)}%`,
            width: `${particle.size.toFixed(3)}px`,
            height: `${particle.size.toFixed(3)}px`,
            backgroundColor: particle.color,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0],
            x: [0, particle.driftX * 0.3, particle.driftX * 0.7, particle.driftX],
            y: [0, particle.driftY * 0.3, particle.driftY * 0.7, particle.driftY],
            rotate: [0, 90, 180, 270],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
