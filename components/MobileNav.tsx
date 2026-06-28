'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
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
import AchievementMiniatures from '@/components/AchievementMiniatures';
import ProfileEditor from '@/components/ProfileEditor';
import SoundToggle from '@/components/SoundToggle';
import { useGameState } from '@/context/GameStateContext';
import useSyncedTheme from '@/hooks/useSyncedTheme';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/play', label: 'Responder Questões', icon: BookOpen },
  { href: '/review', label: 'Modo Revisão', icon: RotateCcw },
  { href: '/achievements', label: 'Conquistas', icon: Trophy },
  { href: '/ranking', label: 'Ranking', icon: BarChart3 },
];

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
  const router = useRouter();
  const { user, logout } = useGameState() || {};
  const [open, setOpen] = useState(false);
  const { darkMode, toggleTheme } = useSyncedTheme();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    router.prefetch('/premium');
  }, [router]);

  const premiumUntil = formatDate(user?.premium_ate);

  function openPremium() {
    setOpen(false);
    router.push('/premium');
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 text-slate-950 shadow-sm backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-slate-950/95 dark:text-white">
        <div className="grid h-16 grid-cols-[3.25rem_1fr_6.25rem] items-center px-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 transition active:scale-95 dark:border-white/10 dark:bg-slate-900 dark:text-white"
            aria-label="Abrir opções"
          >
            <Menu className="h-5 w-5" strokeWidth={2.8} />
          </button>

          <Link
            href="/dashboard"
            className="mx-auto flex min-w-0 items-center gap-2 rounded-2xl px-1"
            aria-label="OAPlay"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-slate-950 shadow-sm dark:border-emerald-300/20">
              <img
                src="/oaplay-icon-1024.png"
                alt=""
                className="h-7 w-7 rounded-lg object-contain"
              />
            </span>
            <span className="min-w-0 text-left leading-none">
              <span className="block font-heading text-[21px] font-black tracking-normal text-slate-950 dark:text-white">
                OA<span className="text-emerald-600 dark:text-emerald-300">Play</span>
              </span>
              <span className="mt-1 block text-[8px] font-black uppercase leading-none tracking-[0.12em] text-slate-600 dark:text-emerald-100">
                Sua aprovação expressa
              </span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <SoundToggle compact className="h-11 w-11 rounded-2xl bg-slate-50 shadow-none active:scale-95 dark:bg-slate-900" />
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 transition active:scale-95 dark:border-white/10 dark:bg-slate-900 dark:text-white"
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
              <Link
                href="/dashboard"
                className="flex min-w-0 items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-3 py-2 dark:border-emerald-300/20 dark:bg-slate-900"
                aria-label="OAPlay"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-slate-950 dark:border-emerald-300/20">
                  <img
                    src="/oaplay-icon-1024.png"
                    alt=""
                    className="h-8 w-8 rounded-lg object-contain"
                  />
                </span>
                <span className="min-w-0 leading-none">
                  <span className="block font-heading text-2xl font-black tracking-normal text-slate-950 dark:text-white">
                    OA<span className="text-emerald-600 dark:text-emerald-300">Play</span>
                  </span>
                  <span className="mt-1 block text-[10px] font-black uppercase leading-none tracking-[0.14em] text-slate-600 dark:text-emerald-100">
                    Sua aprovação expressa
                  </span>
                </span>
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

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <ProfileEditor>
                <div className="space-y-3">
                  <AchievementMiniatures user={user} />

                  {user?.isPremium ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-950 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-500 dark:text-amber-300" strokeWidth={2.8} />
                        <p className="text-sm font-black">Plano Premium</p>
                      </div>
                      {premiumUntil && (
                        <p className="mt-1 text-xs font-bold text-emerald-800 dark:text-emerald-200">Até {premiumUntil}</p>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={openPremium}
                      className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-left text-emerald-950 shadow-sm transition active:scale-[0.99] dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-emerald-700 dark:text-emerald-200" strokeWidth={2.8} />
                        <p className="text-sm font-black">Plano Free</p>
                      </div>
                      <div className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm shadow-emerald-950/10 dark:bg-emerald-300 dark:text-emerald-950">
                        Conhecer Premium
                        <ArrowRight className="h-4 w-4" strokeWidth={3} />
                      </div>
                    </button>
                  )}
                </div>
              </ProfileEditor>

              <nav className="mt-4 space-y-1">
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
            </div>

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
