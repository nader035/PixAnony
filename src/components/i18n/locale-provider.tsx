'use client';

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  directionFor,
  LOCALE_COOKIE,
  translate,
  type Locale,
  type TranslationKey,
  type TranslationValues,
} from '@/lib/i18n/translations';

type LocaleContextValue = {
  locale: Locale;
  direction: 'ltr' | 'rtl';
  isPending: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setCurrentLocale] = useState(initialLocale);
  const [isPending, startTransition] = useTransition();

  const setLocale = useCallback((nextLocale: Locale) => {
    if (nextLocale === locale) return;
    setCurrentLocale(nextLocale);
    const direction = directionFor(nextLocale);
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = direction;
    document.documentElement.classList.toggle('font-ar', nextLocale === 'ar');
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    startTransition(() => router.refresh());
  }, [locale, router]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    direction: directionFor(locale),
    isPending,
    setLocale,
    t: (key, values) => translate(locale, key, values),
  }), [isPending, locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useI18n must be used inside LocaleProvider');
  return context;
}
