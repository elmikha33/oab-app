'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import { Crown, Moon, Sun } from 'lucide-react';
import { useGameState } from '@/context/GameStateContext';

function FloatingPremiumCard() {
  return (
    <Link
      href="/premium"
      className="fixed bottom-24 right-4 z-[45] hidden w-[280px] rounded-3xl border border-emerald-300/25 bg-slate-950/95 p-5 text-white shadow-2xl shadow-black/50 backdrop-blur-xl transition hover:-translate-y-1 hover:border-emerald-300/50 lg:block"
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-300">
        <Crown className="h-5 w-5" />
      </div>

      <p className="text-sm font-black text-white">Premium</p>

      <p className="mt-1 text-xs font-medium leading-relaxed text-slate-400">
        Desbloqueie recursos exclusivos e acelere seus estudos.
      </p>

      <div className="mt-4 flex w-full items-center justify-center rounded-2xl bg-emerald-300 px-4 py-2.5 text-sm font-black text-emerald-950 transition hover:bg-emerald-200">
        Conhecer plano
      </div>
    </Link>
  );
}

function MobileFloatingPremiumCard() {
  return (
    <Link
      href="/premium"
      className="fixed bottom-24 left-4 right-4 z-[39] rounded-3xl border border-emerald-300/25 bg-slate-950/95 p-4 text-white shadow-2xl shadow-black/50 backdrop-blur-xl transition active:scale-[0.99] lg:hidden"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-300">
          <Crown className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white">Premium</p>
          <p className="line-clamp-1 text-xs font-medium text-slate-400">
            Desbloqueie recursos exclusivos e acelere seus estudos.
          </p>
        </div>

        <span className="shrink-0 rounded-2xl bg-emerald-300 px-3 py-2 text-xs font-black text-emerald-950">
          Conhecer
        </span>
      </div>
    </Link>
  );
}

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useGameState();

  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  const hideLayout = pathname === '/' || pathname === '/auth';
  const showDesktopSidebar = pathname !== '/play';

  const showFloatingPremium =
    mounted &&
    user &&
    !user.isPremium &&
    !hideLayout &&
    pathname === '/play';

  useEffect(() => {
    const saved = localStorage.getItem('missao-oab-theme');
    const initialDark = saved ? saved === 'dark' : true;

    setDarkMode(initialDark);
    document.documentElement.classList.toggle('dark', initialDark);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (hideLayout) return;
    if (loading) return;
    if (!user) {
      router.replace('/auth');
    }
  }, [hideLayout, loading, user, router]);

  function toggleTheme() {
    const next = !darkMode;

    setDarkMode(next);
    localStorage.setItem('missao-oab-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  }

  if (hideLayout) {
    return <>{children}</>;
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-emerald-300">
        Carregando OAPlay...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 text-slate-950 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950 dark:text-white">
      <div className="flex min-h-screen">
        {showDesktopSidebar && <Sidebar />}

        <main className="min-w-0 flex-1 pb-28 pt-16 md:pb-0 md:pt-0">
          {children}
        </main>
      </div>

      {showFloatingPremium && (
        <>
          <FloatingPremiumCard />
          <MobileFloatingPremiumCard />
        </>
      )}

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