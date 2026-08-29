import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, ColorsDark, buildTheme, type Shadows, type BorderRadii, type FontSizes, type FontWeights, type FontFamily, type Spacing } from '../theme';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'kebab-hallal-theme';

export interface ThemeObject {
  colors: typeof Colors;
  fontSizes: typeof FontSizes;
  fontWeights: typeof FontWeights;
  fontFamily: typeof FontFamily;
  spacing: typeof Spacing;
  borderRadii: typeof BorderRadii;
  shadows: typeof Shadows;
}

interface ThemeValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  colors: typeof Colors;
  themeObj: ThemeObject;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'dark' || stored === 'light') {
        setThemeState(stored);
      }
    });
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch {}
  }, []);

  const toggleTheme = useCallback(async () => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<ThemeValue>(
    () => {
      const colors = theme === 'dark' ? ColorsDark : Colors;
      return {
        theme,
        toggleTheme,
        setThemeMode,
        colors,
        themeObj: buildTheme(colors),
        isDark: theme === 'dark',
      };
    },
    [theme, toggleTheme, setThemeMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default ThemeContext;
