'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('missao-oab-theme');
    const initialDark = saved ? saved === 'dark' : true;

    setDarkMode(initialDark);
    document.documentElement.classList.toggle('dark', initialDark);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const next = !darkMode;

    setDarkMode(next);
    localStorage.setItem('missao-oab-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  }

  return (
    <>
      {children}

      {mounted && (
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
          title={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
          className="fixed right-4 top-4 z-[9999] inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-300 bg-white text-emerald-700 shadow-lg shadow-emerald-950/10 transition hover:scale-105 hover:bg-emerald-50 dark:border-emerald-300/30 dark:bg-slate-900 dark:text-emerald-300 dark:shadow-black/30 dark:hover:bg-slate-800"
        >
          {darkMode ? (
            <Sun className="h-5 w-5" strokeWidth={3} />
          ) : (
            <Moon className="h-5 w-5" strokeWidth={3} />
          )}
        </button>
      )}
    </>
  );
}
