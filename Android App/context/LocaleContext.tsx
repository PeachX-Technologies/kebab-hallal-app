import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LOCALE } from '../constants';
import { STORAGE_KEYS } from '../utils/storageKeys';

import en from '../data/translations/en.json';
import it from '../data/translations/it.json';

export type Locale = 'en' | 'it';

const translations: Record<Locale, Record<string, unknown>> = { en, it };

/**
 * Resolve a dot-notation key against a nested object.
 * e.g. "auth.login.title" → translations.en.auth.login.title
 */
function resolve(obj: Record<string, unknown>, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleState | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.LOCALE).then((stored) => {
      if (stored === 'en' || stored === 'it') {
        setLocaleState(stored);
      }
    });
  }, []);

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LOCALE, newLocale);
    } catch {
      // non-fatal
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      // Try active locale first, fall back to Italian
      let value =
        resolve(translations[locale] as Record<string, unknown>, key) ??
        resolve(translations['it'] as Record<string, unknown>, key) ??
        key;

      // Replace {{param}} placeholders
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
        });
      }
      return value;
    },
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleState {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

export default LocaleContext;
