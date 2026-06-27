'use client';

import { useCallback, useEffect, useState } from 'react';

const THEME_KEY = 'oaplay-theme';
const THEME_EVENT = 'oaplay-theme-change';

type ThemeMode = 'dark' | 'light';

function readTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';

  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;

  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function applyTheme(theme: ThemeMode, notify = true) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_KEY, theme);

  if (notify) {
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
  }
}

export default function useSyncedTheme() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initialTheme = readTheme();
    setTheme(initialTheme);
    applyTheme(initialTheme, false);
    setMounted(true);

    function syncTheme(event?: Event) {
      const nextTheme =
        event instanceof CustomEvent && (event.detail === 'dark' || event.detail === 'light')
          ? event.detail
          : readTheme();

      setTheme(nextTheme);
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    }

    window.addEventListener(THEME_EVENT, syncTheme);
    window.addEventListener('storage', syncTheme);

    return () => {
      window.removeEventListener(THEME_EVENT, syncTheme);
      window.removeEventListener('storage', syncTheme);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = readTheme() === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  return {
    theme,
    mounted,
    darkMode: theme === 'dark',
    toggleTheme,
  };
}
