'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { Sun, Moon, Monitor } from '@/components/ui/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/i18n/locale-provider';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

const themes = [
  { value: 'light', icon: Sun, labelKey: 'theme.light' },
  { value: 'dark', icon: Moon, labelKey: 'theme.dark' },
  { value: 'system', icon: Monitor, labelKey: 'theme.system' },
] as const;

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div className={cn('flex items-center gap-1 rounded-xl bg-surface p-1', className)}>
        {themes.map((themeOption) => (
          <div key={themeOption.value} className="h-8 w-8 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {showLabel && (
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider px-1">
          {t('theme.label')}
        </span>
      )}
      <div className="flex items-center gap-1 rounded-xl bg-surface p-1 border border-border">
        {themes.map((themeOption) => {
          const isActive = theme === themeOption.value;
          const Icon = themeOption.icon;
          const label = t(themeOption.labelKey);

          return (
            <button
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={cn(
                'relative flex items-center justify-center rounded-lg h-8 w-8 transition-colors duration-200',
                'hover:text-text',
                isActive ? 'text-text' : 'text-text-muted'
              )}
              title={label}
              aria-label={t('theme.set', { theme: label })}
            >
              {isActive && (
                <motion.div
                  layoutId="theme-active"
                  className="absolute inset-0 rounded-lg bg-card border border-border shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={themeOption.value}
                  className="relative z-10"
                  initial={{ scale: 0.8, opacity: 0, rotate: -30 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.8, opacity: 0, rotate: 30 }}
                  transition={{ duration: 0.15 }}
                >
                  <Icon size={16} />
                </motion.div>
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </div>
  );
}
