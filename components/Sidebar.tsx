'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Crown,
  LayoutDashboard,
  LogOut,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import AchievementMiniatures from '@/components/AchievementMiniatures';
import ProfileEditor from '@/components/ProfileEditor';
import SoundToggle from '@/components/SoundToggle';
import ThemeToggle from '@/components/ThemeToggle';
import { useGameState } from '@/context/GameStateContext';

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

function PlanStatus({ user }: { user: any }) {
  const premiumUntil = formatDate(user?.premium_ate);

  if (user?.isPremium) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-emerald-700 dark:text-emerald-200" strokeWidth={2.8} />
          <p className="text-sm font-black">Plano Premium</p>
        </div>
        {premiumUntil && (
          <p className="mt-2 text-xs font-bold text-emerald-800 dark:text-emerald-200">
            Até {premiumUntil}
          </p>
        )}
      </div>
    );
  }

  return (
    <Link
      href="/premium"
      className="block rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 transition hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100 dark:hover:bg-emerald-300/15"
    >
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5" strokeWidth={2.8} />
        <p className="text-sm font-black">Plano Free</p>
      </div>
      <div className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white dark:bg-emerald-300 dark:text-emerald-950">
        Conhecer Premium
        <ArrowRight className="h-4 w-4" strokeWidth={3} />
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useGameState() || {};

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[330px] overflow-y-auto border-r border-slate-200 bg-slate-50 px-5 py-6 text-slate-950 md:flex dark:border-white/10 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-full w-full flex-col gap-5">
        <Link
          href="/dashboard"
          className="group rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-emerald-950/10 dark:border-white/10 dark:bg-slate-900"
          aria-label="OAPlay"
        >
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-4 dark:border-emerald-300/20 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/70">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 shadow-sm shadow-emerald-950/15 ring-1 ring-emerald-300/30 dark:bg-slate-900 dark:ring-emerald-300/20">
                <img
                  src="/oaplay-icon-512.png"
                  alt=""
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </span>

              <div className="min-w-0">
                <p className="text-2xl font-black leading-none tracking-normal text-slate-950 dark:text-white">
                  OA<span className="text-emerald-600 dark:text-emerald-300">Play</span>
                </p>
                <p className="mt-2 text-[11px] font-black uppercase leading-tight tracking-[0.12em] text-slate-600 dark:text-slate-300">
                  Sua aprovação expressa
                </p>
              </div>
            </div>
          </div>
        </Link>

        <ProfileEditor>
          <AchievementMiniatures user={user} />
        </ProfileEditor>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? 'flex min-h-12 items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-sm dark:bg-emerald-300 dark:text-emerald-950'
                    : 'flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-white hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-emerald-200'
                }
              >
                <Icon className="h-5 w-5" strokeWidth={2.6} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 pt-1">
          <PlanStatus user={user} />
          <SoundToggle />
          <ThemeToggle />

          <button
            type="button"
            onClick={() => void logout?.()}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-rose-400/10 dark:hover:text-rose-200"
          >
            <LogOut className="h-5 w-5" strokeWidth={2.6} />
            Sair da conta
          </button>
        </div>
      </div>
    </aside>
  );
}
