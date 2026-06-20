'use client';

import { type LucideIcon } from '@/components/ui/icons';
import { motion } from 'framer-motion';
import { AnimatedButton } from './animated-button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      <motion.div
        initial={false}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="mb-4 rounded-2xl bg-card border border-border p-5"
      >
        <Icon size={32} className="text-text-muted" strokeWidth={1.5} />
      </motion.div>

      <motion.h3
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-text mb-1.5"
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-text-muted max-w-sm leading-relaxed mb-6"
        >
          {description}
        </motion.p>
      )}

      {actionLabel && onAction && (
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AnimatedButton variant="primary" glow onClick={onAction}>
            {actionLabel}
          </AnimatedButton>
        </motion.div>
      )}
    </motion.div>
  );
}
