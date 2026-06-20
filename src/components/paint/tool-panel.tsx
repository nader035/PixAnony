'use client';

import { motion } from 'framer-motion';
import {
  Pencil, Eraser, PaintBucket, Minus, Square,
  Circle, Pipette, Move,
} from '@/components/ui/icons';
import { usePaintStore } from '@/stores/paint-store';
import type { PaintTool } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ToolConfig {
  id: PaintTool;
  label: string;
  shortcut: string;
  icon: React.ElementType;
}

const TOOLS: ToolConfig[] = [
  { id: 'pencil', label: 'Pencil', shortcut: 'B', icon: Pencil },
  { id: 'eraser', label: 'Eraser', shortcut: 'E', icon: Eraser },
  { id: 'fill', label: 'Fill', shortcut: 'F', icon: PaintBucket },
  { id: 'line', label: 'Line', shortcut: 'L', icon: Minus },
  { id: 'rectangle', label: 'Rect', shortcut: 'R', icon: Square },
  { id: 'circle', label: 'Circle', shortcut: 'C', icon: Circle },
  { id: 'picker', label: 'Picker', shortcut: 'I', icon: Pipette },
  { id: 'move', label: 'Move', shortcut: 'Space', icon: Move },
];

export default function ToolPanel({ compact = false }: { compact?: boolean }) {
  const { tool, setTool } = usePaintStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={cn(
        'bg-surface border border-border',
        compact
          ? 'flex max-w-full gap-1 overflow-x-auto rounded-xl p-1.5 hide-scrollbar'
          : 'flex flex-col gap-1 rounded-xl p-2'
      )}
    >
      <div className={cn('px-2 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider', compact && 'hidden')}>
        Tools
      </div>

      {TOOLS.map((t, i) => {
        const isActive = tool === t.id;
        const Icon = t.icon;

        return (
          <motion.button
            key={t.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.05 * i }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setTool(t.id)}
            className={`
              relative flex items-center gap-2.5 rounded-lg text-sm transition-all duration-150 group
              ${compact ? 'h-11 min-w-11 justify-center px-3' : 'px-3 py-2'}
              ${isActive
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-text-muted hover:text-text hover:bg-card-hover border border-transparent'
              }
            `}
            title={`${t.label} (${t.shortcut})`}
          >
            {/* Active glow */}
            {isActive && (
              <motion.div
                layoutId="tool-glow"
                className="absolute inset-0 rounded-lg bg-primary/10"
                style={{
                  boxShadow: '0 0 12px rgba(139, 92, 246, 0.3), inset 0 0 12px rgba(139, 92, 246, 0.1)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}

            <Icon
              size={16}
              className={`relative z-10 ${isActive ? 'text-primary' : ''}`}
            />
            <span className={cn('relative z-10 flex-1 text-left text-xs font-medium', compact && 'sr-only')}>
              {t.label}
            </span>
            <span
              className={cn(
                'relative z-10 rounded px-1.5 py-0.5 font-mono text-[9px]',
                isActive ? 'bg-primary/20 text-primary' : 'bg-card text-text-muted',
                compact && 'hidden'
              )}
            >
              {t.shortcut}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
