'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dark = resolvedTheme === 'dark';

  if (!mounted) {
    return (
      <button
        type="button"
        className="invisible inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold"
        aria-hidden="true"
      >
        <Moon className="h-4 w-4" />
        <span>Tema</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        const nextTheme = dark ? 'light' : 'dark';
        setTheme(nextTheme);
        document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      }}
      aria-label="Alternar tema"
      aria-pressed={dark}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800"
    >
      {dark ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-slate-700" />}
      <span>Tema</span>
    </button>
  );
}
