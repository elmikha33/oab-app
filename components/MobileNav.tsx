'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Crown,
  Grid2X2,
  LogOut,
  Menu,
  Medal,
  Trophy,
  X,
} from 'lucide-react';
import { useGameState } from '@/context/GameStateContext';
import { supabase } from '@/lib/supabase';

const navItems = [
  {
    label: 'Painel',
    href: '/dashboard',
    icon: Grid2X2,
  },
  {
    label: 'Estudo',
    href: '/play',
    icon: BookOpen,
  },
  {
    label: 'Revisar',
    href: '/review',
    icon: CalendarDays,
  },
  {
    label: 'Perfil',
    href: '/achievements',
    icon: Medal,
  },
];

const drawerItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Grid2X2,
  },
  {
    label: 'Responder Questoes',
    href: '/play',
    icon: BookOpen,
  },
  {
    label: 'Modo Revisao',
    href: '/review',
    icon: CalendarDays,
  },
  {
    label: 'Conquistas',
    href: '/achievements',
    icon: Medal,
  },
  {
    label: 'Ranking',
    href: '/ranking',
    icon: Trophy,
  },
];

function formatarData(data?: string | null) {
  if (!data) return null;

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString('pt-BR');
}

function MobileAvatar({ user }: { user: any }) {
  const letra = String(user?.nome || user?.email || 'U').slice(0, 1).toUpperCase();

  return (
    <div
      className={
        user?.isPremium
          ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200 via-emerald-300 to-cyan-300 text-sm font-black text-slate-950 shadow-lg shadow-black/20'
          : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-300 text-sm font-black text-emerald-950 shadow-lg shadow-black/20'
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

  const premiumAte = formatarData(user?.premium_ate);

  if (!user) return null;

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
      <header className="fixed left-0 right-0 top-0 z-[80] border-b border-white/10 bg-slate-950/90 px-4 py-3 shadow-xl shadow-black/30 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-950/30 active:scale-95"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" strokeWidth={3} />
          </button>

          <Link href="/dashboard" className="flex min-w-0 flex-1 items-center justify-center">
            <div className="flex items-center gap-2">
              <img
                src="/oaplay-icon-192.png"
                alt="OAPlay"
                className="h-9 w-9 rounded-xl"
              />

              <div className="leading-none">
                <p className="text-lg font-black text-white">
                  OA<span className="text-emerald-300">Play</span>
                </p>
                <p className="mt-1 text-[8px] font-black uppercase tracking-[0.18em] text-emerald-300">
                  aprovacao expressa
                </p>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <div className="rounded-2xl border border-orange-300/20 bg-orange-300/10 px-3 py-2 text-xs font-black text-orange-200">
              {user?.streak || 1}d
            </div>

            <MobileAvatar user={user} />
          </div>
        </div>
      </header>

      <nav className="fixed bottom-4 left-3 right-3 z-[80] rounded-[1.75rem] border border-emerald-300/15 bg-slate-950/92 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? 'flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-emerald-300 text-emerald-950 shadow-lg shadow-emerald-950/30'
                    : 'flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl text-slate-400 transition active:scale-95'
                }
              >
                <Icon className="h-5 w-5" strokeWidth={2.8} />
                <span className="text-[11px] font-black">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-[120] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />

          <aside className="absolute bottom-0 left-0 top-0 w-[86vw] max-w-[360px] overflow-y-auto border-r border-white/10 bg-slate-950 px-5 py-5 text-white shadow-2xl shadow-black">
            <div className="mb-6 flex items-center justify-between gap-3">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3"
              >
                <img
                  src="/oaplay-icon-192.png"
                  alt="OAPlay"
                  className="h-12 w-12 rounded-2xl"
                />

                <div>
                  <p className="text-xl font-black">
                    OA<span className="text-emerald-300">Play</span>
                  </p>
                  <p className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300">
                    sua aprovacao expressa
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 active:scale-95"
                aria-label="Fechar menu"
              >
                <X className="h-6 w-6" strokeWidth={3} />
              </button>
            </div>

            <section className="mb-5 rounded-[1.5rem] border border-white/10 bg-slate-900 p-4">
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

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-orange-300/20 bg-orange-300/10 px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-orange-200">
                    Sequencia
                  </p>
                  <p className="mt-1 text-lg font-black text-white">
                    {user?.streak || 1}d
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-200">
                    Acertos
                  </p>
                  <p className="mt-1 text-lg font-black text-white">
                    {user?.acertos || 0}
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-5 rounded-[1.5rem] border border-emerald-300/20 bg-emerald-300/10 p-4">
              <div className="flex items-center gap-3">
                <div
                  className={
                    user?.isPremium
                      ? 'flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-300 text-sm font-black text-emerald-950'
                      : 'flex h-11 w-11 items-center justify-center rounded-xl bg-amber-300 text-sm font-black text-amber-950'
                  }
                >
                  {user?.isPremium ? 'P' : 'F'}
                </div>

                <div>
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

            <div className="space-y-2">
              {drawerItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={
                      active
                        ? 'flex min-h-13 items-center gap-3 rounded-2xl bg-emerald-300 px-4 text-sm font-black text-emerald-950'
                        : 'flex min-h-13 items-center gap-3 rounded-2xl px-4 text-sm font-black text-slate-300 transition hover:bg-white/5'
                    }
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.7} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={saindo}
              className="mt-8 flex min-h-13 w-full items-center justify-center gap-3 rounded-2xl border border-rose-300/25 bg-rose-500/10 px-4 text-sm font-black text-rose-200 transition active:scale-95 disabled:opacity-60"
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