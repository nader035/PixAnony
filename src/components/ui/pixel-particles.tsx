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

function generateParticles(count: number, colors: string[]): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 5,
    driftX: (Math.random() - 0.5) * 60,
    driftY: -(Math.random() * 80 + 40),
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
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
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
