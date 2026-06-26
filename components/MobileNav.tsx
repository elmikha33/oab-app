'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  Crown,
  Grid2X2,
  LogOut,
  Medal,
  Menu,
  Moon,
  Sun,
  Trophy,
  X,
} from 'lucide-react';
import { useGameState } from '@/context/GameStateContext';
import { supabase } from '@/lib/supabase';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Grid2X2 },
  { label: 'Responder Questoes', href: '/play', icon: BookOpen },
  { label: 'Modo Revisao', href: '/review', icon: CalendarDays },
  { label: 'Conquistas', href: '/achievements', icon: Medal },
  { label: 'Ranking', href: '/ranking', icon: Trophy },
];

function formatarData(data?: string | null) {
  if (!data) return null;

  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString('pt-BR');
}

function LogoBlock({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/dashboard"
      onClick={onClick}
      className="flex min-w-0 items-center gap-3"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/25 bg-slate-950 shadow-lg shadow-black/20">
        <img
          src="/oaplay-icon-192.png"
          alt="OAPlay"
          className="h-8 w-8 object-contain"
        />
      </div>

      <div className="min-w-0 leading-none">
        <div className="flex items-baseline">
          <span className="text-xl font-black tracking-tight text-white">
            OA
          </span>
          <span className="text-xl font-black tracking-tight text-emerald-300">
            Play
          </span>
        </div>

        <p className="mt-1 text-[8px] font-black uppercase tracking-[0.18em] text-emerald-300">
          aprovacao expressa
        </p>
      </div>
    </Link>
  );
}

function MobileAvatar({ user }: { user: any }) {
  const letra = String(user?.nome || user?.email || 'U').slice(0, 1).toUpperCase();

  return (
    <div
      className={
        user?.isPremium
          ? 'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200 via-emerald-300 to-cyan-300 text-lg font-black text-slate-950 shadow-lg shadow-black/20'
          : 'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-300 text-lg font-black text-emerald-950 shadow-lg shadow-black/20'
      }
    >
      {letra}
    </div>
  );
}

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, setUser, refreshUser } = useGameState() || {};

  const [open, setOpen] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const premiumAte = formatarData(user?.premium_ate);

  useEffect(() => {
    const saved = localStorage.getItem('missao-oab-theme');
    const initialDark = saved ? saved === 'dark' : document.documentElement.classList.contains('dark');

    setDarkMode(initialDark);
    document.documentElement.classList.toggle('dark', initialDark);
  }, []);

  if (!user) return null;

  function toggleTheme() {
    const next = !darkMode;

    setDarkMode(next);
    localStorage.setItem('missao-oab-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  }

  async function handleLogout() {
    if (saindo) return;

    setSaindo(true);

    try {
      await supabase.auth.signOut();
    } catch {
      // continua logout local
    }

    try {
      logout?.();
    } catch {
      // ignora
    }

    try {
      setUser?.(null);
    } catch {
      // ignora
    }

    setOpen(false);
    router.replace('/auth');
    router.refresh();
  }

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-[80] border-b border-white/10 bg-slate-950/95 px-4 py-3 shadow-xl shadow-black/30 backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-[48px_1fr_48px] items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300 text-emerald-950 shadow-lg shadow-emerald-950/30 active:scale-95"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" strokeWidth={3} />
          </button>

          <div className="flex justify-center overflow-hidden">
            <LogoBlock />
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/25 bg-white/5 text-emerald-200 shadow-lg shadow-black/20 active:scale-95"
            aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {darkMode ? (
              <Sun className="h-5 w-5" strokeWidth={3} />
            ) : (
              <Moon className="h-5 w-5" strokeWidth={3} />
            )}
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[120] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />

          <aside className="absolute bottom-0 left-0 top-0 w-[88vw] max-w-[380px] overflow-y-auto border-r border-white/10 bg-slate-950 px-5 py-5 text-white shadow-2xl shadow-black">
            <div className="mb-5 flex items-center justify-between gap-3">
              <LogoBlock onClick={() => setOpen(false)} />

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 active:scale-95"
                aria-label="Fechar menu"
              >
                <X className="h-6 w-6" strokeWidth={3} />
              </button>
            </div>

            <section className="mb-5 rounded-[1.5rem] border border-white/10 bg-slate-900 p-4 shadow-xl shadow-black/20">
              <div className="flex items-center gap-4">
                <MobileAvatar user={user} />

                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-white">
                    {user?.nome || 'Usuario'}
                  </p>

                  <p className="text-sm font-black text-emerald-300">
                    {user?.isPremium ? 'Premium' : 'Free'}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-xs font-black text-emerald-200">
                {user?.streak || 1} dia ativo
              </div>
            </section>

            <nav className="mb-5 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={
                      active
                        ? 'flex min-h-14 items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-300 px-4 text-sm font-black text-emerald-950 shadow-lg shadow-emerald-950/10'
                        : 'flex min-h-14 items-center gap-3 rounded-2xl border border-transparent px-4 text-sm font-black text-slate-300 transition hover:border-emerald-300/40 hover:bg-emerald-300/10 hover:text-emerald-100'
                    }
                  >
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={2.7} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <section
              className={
                user?.isPremium
                  ? 'mb-5 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-4'
                  : 'mb-5 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4'
              }
            >
              <div className="flex items-center gap-3">
                <div
                  className={
                    user?.isPremium
                      ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-300 text-sm font-black text-emerald-950'
                      : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-300 text-sm font-black text-amber-950'
                  }
                >
                  {user?.isPremium ? 'P' : 'F'}
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
                    Plano atual
                  </p>

                  <p className="text-sm font-black text-white">
                    {user?.isPremium ? 'Premium' : 'Free'}
                  </p>

                  {user?.isPremium && premiumAte && (
                    <p className="mt-0.5 text-xs font-bold text-emerald-200">
                      Ate {premiumAte}
                    </p>
                  )}
                </div>
              </div>

              {!user?.isPremium && (
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void refreshUser?.();
                    }}
                    className="rounded-xl border border-emerald-300/25 bg-white/5 px-3 py-2 text-xs font-black text-emerald-200"
                  >
                    Atualizar status
                  </button>

                  <Link
                    href="/premium"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-3 py-2.5 text-xs font-black text-emerald-950"
                  >
                    <Crown className="h-4 w-4" strokeWidth={3} />
                    Conhecer Premium
                  </Link>
                </div>
              )}
            </section>

            <button
              type="button"
              onClick={handleLogout}
              disabled={saindo}
              className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-rose-300/25 bg-rose-500/10 px-4 text-sm font-black text-rose-200 transition active:scale-95 disabled:opacity-60"
            >
              <LogOut className="h-5 w-5" strokeWidth={2.7} />
              Sair da conta
            </button>
          </aside>
        </div>
      )}
    </>
  );
}