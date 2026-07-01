'use client';

import { motion } from 'framer-motion';
import {
  Pencil, Eraser, PaintBucket, Minus, Square,
  Circle, Pipette, Move,
} from '@/components/ui/icons';
import { usePaintStore } from '@/stores/paint-store';
import type { PaintTool } from '@/lib/types';
import { PAINT_TOOL_SHORTCUTS } from '@/lib/paint-shortcuts';
import { cn } from '@/lib/utils';

interface ToolConfig {
  id: PaintTool;
  label: string;
  shortcut: string;
  icon: React.ElementType;
}

const iconMap: Record<string, React.ElementType> = {
  pencil: Pencil,
  eraser: Eraser,
  fill: PaintBucket,
  line: Minus,
  rectangle: Square,
  circle: Circle,
  picker: Pipette,
  move: Move,
};

const TOOLS: ToolConfig[] = PAINT_TOOL_SHORTCUTS.map((item) => ({
  id: item.tool,
  label: item.label,
  shortcut: item.shortcut,
  icon: iconMap[item.tool],
}));

export default function ToolPanel({ compact = false }: { compact?: boolean }) {
  const { tool, setTool } = usePaintStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={cn(
        'editor-panel border border-border/80 bg-surface/95',
        compact
          ? 'flex max-w-full gap-1 overflow-x-auto rounded-2xl p-1.5 hide-scrollbar'
          : 'flex flex-col gap-1.5 rounded-2xl p-2.5'
      )}
    >
      <div className={cn('px-2 py-1.5 text-[10px] font-semibold uppercase text-text-muted', compact && 'hidden')}>
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
            className={cn(
              'group relative flex items-center gap-2.5 rounded-xl border text-sm transition-all duration-150',
              compact ? 'h-11 min-w-11 justify-center px-3' : 'px-3 py-2.5',
              isActive
                ? 'bg-primary text-white shadow-[0_10px_26px_rgba(139,92,246,.28)] border-primary'
                : 'border-border/45 bg-card/55 text-text-muted hover:border-primary/35 hover:bg-card-hover hover:text-text'
              ,
            )}
            title={`${t.label} (${t.shortcut})`}
          >
            {/* Active glow */}
            {isActive && (
              <motion.div
                layoutId="tool-glow"
                className="absolute inset-0 rounded-xl bg-white/8"
                style={{
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.16)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}

            <Icon
              size={16}
              className={cn('relative z-10', isActive ? 'text-white' : '')}
            />
            <span className={cn('relative z-10 flex-1 text-left text-xs font-medium', compact && 'sr-only')}>
              {t.label}
            </span>
            <span
              className={cn(
                'relative z-10 rounded px-1.5 py-0.5 font-mono text-[9px]',
                isActive ? 'bg-white/16 text-white' : 'bg-bg/80 text-text-muted',
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
