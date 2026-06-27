'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Crown,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  RotateCcw,
  Sun,
  Trophy,
  X,
} from 'lucide-react';
import { useGameState } from '@/context/GameStateContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/play', label: 'Responder Questões', icon: BookOpen },
  { href: '/review', label: 'Modo Revisão', icon: RotateCcw },
  { href: '/achievements', label: 'Conquistas', icon: Trophy },
  { href: '/ranking', label: 'Ranking', icon: BarChart3 },
];

const THEME_KEY = 'oaplay-theme';

function getInitials(nome?: string | null) {
  const parts = String(nome || 'Candidato')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return 'OA';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function formatDate(date?: string | null) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useGameState() || {};
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    const initialDark = saved ? saved === 'dark' : document.documentElement.classList.contains('dark');

    setDarkMode(initialDark);
    document.documentElement.classList.toggle('dark', initialDark);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  }

  const premiumUntil = formatDate(user?.premium_ate);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 text-slate-950 shadow-sm backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-slate-950/95 dark:text-white">
        <div className="grid h-16 grid-cols-[3.25rem_1fr_3.25rem] items-center px-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 transition active:scale-95 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            aria-label="Abrir opções"
          >
            <Menu className="h-5 w-5" strokeWidth={2.8} />
          </button>

          <Link href="/dashboard" className="mx-auto flex items-center gap-2" aria-label="OAPlay">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-black text-white dark:bg-emerald-300 dark:text-emerald-950">
              OA
            </span>
            <span className="text-lg font-black tracking-tight">OAPlay</span>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className="ml-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 transition active:scale-95 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {darkMode ? (
              <Sun className="h-5 w-5" strokeWidth={2.8} />
            ) : (
              <Moon className="h-5 w-5" strokeWidth={2.8} />
            )}
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />

          <aside className="relative flex h-full w-[86vw] max-w-[340px] flex-col border-r border-slate-200 bg-slate-50 p-4 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-white">
            <div className="mb-4 flex items-center justify-between gap-3">
              <Link href="/dashboard" className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-black text-white dark:bg-emerald-300 dark:text-emerald-950">
                  OA
                </span>
                <div>
                  <p className="text-lg font-black">OAPlay</p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">treino inteligente OAB</p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" strokeWidth={2.8} />
              </button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white dark:bg-white dark:text-slate-950">
                  {getInitials(user?.nome)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{user?.nome || 'Candidato'}</p>
                  <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {user?.email || 'Usuário OAPlay'}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500 dark:text-amber-300" strokeWidth={2.8} />
                  <p className="text-sm font-black">{user?.isPremium ? 'Plano Premium' : 'Plano Free'}</p>
                </div>
                {user?.isPremium && premiumUntil ? (
                  <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">Até {premiumUntil}</p>
                ) : (
                  <Link href="/premium" className="mt-2 inline-flex text-xs font-black text-emerald-700 dark:text-emerald-300">
                    Conhecer Premium
                  </Link>
                )}
              </div>
            </div>

            <nav className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      active
                        ? 'flex min-h-12 items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white dark:bg-emerald-300 dark:text-emerald-950'
                        : 'flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-white hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-emerald-200'
                    }
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.6} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => void logout?.()}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-rose-400/10 dark:hover:text-rose-200"
            >
              <LogOut className="h-5 w-5" strokeWidth={2.6} />
              Sair da conta
            </button>
          </aside>
        </div>
      )}
    </>
  );
}
