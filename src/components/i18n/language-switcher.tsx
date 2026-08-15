'use client';

import { Languages } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { useI18n } from './locale-provider';

export function LanguageSwitcher({ className, showLabel = true }: { className?: string; showLabel?: boolean }) {
  const { locale, setLocale, isPending, t } = useI18n();
  const nextLocale = locale === 'ar' ? 'en' : 'ar';
  const label = locale === 'ar' ? t('language.english') : t('language.arabic');
  const accessibleLabel = locale === 'ar' ? t('language.switchToEnglish') : t('language.switchToArabic');

  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      disabled={isPending}
      aria-label={accessibleLabel}
      title={accessibleLabel}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border bg-card px-3 text-sm font-semibold text-text transition-colors hover:bg-card-hover disabled:opacity-60',
        className,
      )}
    >
      <Languages size={17} aria-hidden="true" />
      {showLabel && <span>{label}</span>}
    </button>
  );
}
