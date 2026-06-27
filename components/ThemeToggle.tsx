'use client';

import { Moon, Sun } from 'lucide-react';
import useSyncedTheme from '@/hooks/useSyncedTheme';

type ThemeToggleProps = {
  compact?: boolean;
  className?: string;
};

export default function ThemeToggle({ compact = false, className = '' }: ThemeToggleProps) {
  const { darkMode, mounted, toggleTheme } = useSyncedTheme();

  const label = darkMode ? 'Ativar modo claro' : 'Ativar modo escuro';
  const Icon = darkMode ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={
        compact
          ? `inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-emerald-200 ${className}`
          : `inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-emerald-300/10 dark:hover:text-emerald-200 ${className}`
      }
    >
      <Icon className="h-5 w-5" strokeWidth={2.8} />
      {!compact && <span>{mounted ? label : 'Tema'}</span>}
    </button>
  );
}
