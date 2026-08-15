import 'server-only';

import { cookies, headers } from 'next/headers';
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  translate,
  type Locale,
  type TranslationKey,
  type TranslationValues,
} from './translations';

export async function getServerLocale(): Promise<Locale> {
  const savedLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(savedLocale)) return savedLocale;

  const acceptedLanguages = (await headers()).get('accept-language')?.toLowerCase() ?? '';
  if (acceptedLanguages.split(',').some((language) => language.trim().startsWith('ar'))) return 'ar';
  return DEFAULT_LOCALE;
}

export async function getServerI18n() {
  const locale = await getServerLocale();
  return {
    locale,
    t: (key: TranslationKey, values?: TranslationValues) => translate(locale, key, values),
  };
}
