'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import { Moon, Sun } from 'lucide-react';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  const hideLayout = pathname === '/' || pathname === '/auth';

  /**
   * Correção principal:
   * no /play a sidebar desktop não aparece.
   * Assim a tela de questões volta a ficar limpa como antes.
   */
  const showDesktopSidebar = pathname !== '/play';

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

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 text-slate-950 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950 dark:text-white">
      <div className="flex min-h-screen">
        {showDesktopSidebar && <Sidebar />}

        <main className="min-w-0 flex-1 pb-28 pt-14 md:pb-0 md:pt-0">
          {children}
        </main>
      </div>

      {mounted && (
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
          title={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
          className="fixed right-4 top-4 z-[9999] hidden h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-50 md:inline-flex dark:border-emerald-300/30 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-slate-800"
        >
          {darkMode ? (
            <Sun className="h-5 w-5" strokeWidth={3} />
          ) : (
            <Moon className="h-5 w-5" strokeWidth={3} />
          )}
        </button>
      )}

      <MobileNav />
    </div>
  );
}   