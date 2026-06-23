'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  Award,
  BookOpen,
  Calendar,
  Crown,
  LayoutDashboard,
  Menu,
  Moon,
  Scale,
  Sun,
  X,
} from 'lucide-react';

const mobileLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Responder Questões', href: '/play', icon: BookOpen },
  { name: 'Modo Revisão', href: '/review', icon: Calendar },
  { name: 'Ranking', href: '/ranking', icon: Award },
  { name: 'Seja Premium', href: '/premium', icon: Crown },
];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const hideLayout = pathname === '/' || pathname === '/auth';

  useEffect(() => {
    const saved = localStorage.getItem('missao-oab-theme');
    const initialDark = saved ? saved === 'dark' : true;

    setDarkMode(initialDark);
    document.documentElement.classList.toggle('dark', initialDark);
    setMounted(true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
        <Sidebar />

        <main className="min-w-0 flex-1 pt-16 lg:pt-0">
          {children}
        </main>
      </div>

      {mounted && (
        <>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            className="fixed left-4 top-4 z-[9999] inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 shadow-lg lg:hidden dark:border-emerald-300/30 dark:bg-slate-900 dark:text-emerald-300"
          >
            <Menu className="h-5 w-5" strokeWidth={3} />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            className="fixed right-4 top-4 z-[9999] inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 shadow-lg dark:border-emerald-300/30 dark:bg-slate-900 dark:text-emerald-300"
          >
            {darkMode ? (
              <Sun className="h-5 w-5" strokeWidth={3} />
            ) : (
              <Moon className="h-5 w-5" strokeWidth={3} />
            )}
          </button>

          {menuOpen && (
            <div className="fixed inset-0 z-[10000] lg:hidden">
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMenuOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              <aside className="relative flex h-full w-[84vw] max-w-[340px] flex-col border-r border-emerald-100 bg-white p-5 text-slate-900 shadow-2xl shadow-black/30 dark:border-white/10 dark:bg-slate-950 dark:text-white">
                <div className="mb-7 flex items-center justify-between gap-3">
                  <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-slate-900 dark:text-emerald-300">
                      <Scale className="h-6 w-6" strokeWidth={2.5} />
                    </div>

                    <div className="leading-tight">
                      <p className="text-2xl font-black text-slate-950 dark:text-white">
                        Leg<span className="text-emerald-600 dark:text-emerald-400">Ⅰ</span>
                      </p>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                        Missão OAB
                      </p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Fechar menu"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <X className="h-5 w-5" strokeWidth={3} />
                  </button>
                </div>

                <nav className="space-y-2">
                  {mobileLinks.map(({ name, href, icon: Icon }) => {
                    const active = pathname === href;

                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
                          active
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 dark:bg-emerald-300 dark:text-emerald-950'
                            : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-300 dark:hover:bg-emerald-300/10 dark:hover:text-emerald-200'
                        }`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2.5} />
                        <span>{name}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-auto rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-300/20 dark:bg-emerald-300/10">
                  <p className="text-sm font-black text-emerald-900 dark:text-emerald-100">
                    Continue sua evolução
                  </p>
                  <p className="mt-1 text-xs font-medium text-emerald-800/80 dark:text-emerald-100/70">
                    Use o Ranking e a Revisão para manter constância.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
}