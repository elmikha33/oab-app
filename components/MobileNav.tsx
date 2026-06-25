'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGameState } from '../context/GameStateContext';
import {
  Award,
  BookOpen,
  Calendar,
  Coins,
  Crown,
  Flame,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  User2,
  X,
} from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useGameState();
  const [menuAberto, setMenuAberto] = useState(false);

  if (!user) return null;

  const mainLinks = [
    { name: 'Painel', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Estudo', href: '/play', icon: BookOpen },
    { name: 'Revisar', href: '/review', icon: Calendar },
  ];

  const initial = user.nome?.charAt(0)?.toUpperCase() || 'C';
  const xpNecessario = user.xpNecessario || 100;
  const xpPercent = Math.min(100, Math.max(0, Math.round((user.xp / xpNecessario) * 100)));

  return (
    <div className="md:hidden">
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-slate-950/92 px-4 backdrop-blur-xl">
        <Link href="/dashboard" className="flex items-center gap-1.5">
          <span className="font-heading text-base font-black tracking-wide text-white">
            OAB<span className="text-emerald-300">Play</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-bold">
          <div className="flex items-center gap-1 rounded-full border border-orange-400/15 bg-orange-400/10 px-2 py-1 text-orange-300">
            <Flame className="h-3.5 w-3.5" />
            <span>{user.streak}d</span>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-yellow-400/15 bg-yellow-400/10 px-2 py-1 text-yellow-300">
            <Coins className="h-3.5 w-3.5" />
            <span>{user.moedas}</span>
          </div>

          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-300 text-xs font-black text-emerald-950 shadow-lg shadow-emerald-500/20"
            aria-label="Abrir perfil"
          >
            {initial}
          </button>
        </div>
      </header>

      {menuAberto && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0"
            onClick={() => setMenuAberto(false)}
          />

          <div className="relative flex h-full w-80 max-w-[85vw] flex-col justify-between border-l border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black">
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-heading text-lg font-black text-white">
                  Menu do Aluno
                </h3>

                <button
                  type="button"
                  onClick={() => setMenuAberto(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" strokeWidth={3} />
                </button>
              </div>

              <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300 text-lg font-black text-emerald-950">
                    {initial}
                  </div>

                  <div className="min-w-0">
                    <h4 className="truncate font-bold text-white">{user.nome}</h4>
                    <span className="text-xs font-bold text-emerald-300">
                      {user.nome === 'admin' ? 'Administrador' : 'Estudante'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>
                      Nível {user.nivel} {user.nome === 'admin' ? 'Mestre' : 'Estagiário'}
                    </span>
                    <span>{user.xp} XP</span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-300"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href="/achievements"
                  onClick={() => setMenuAberto(false)}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold ${
                    pathname === '/achievements'
                      ? 'bg-emerald-300/10 text-white'
                      : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <Award className="h-5 w-5 text-emerald-300" />
                  <span>Conquistas</span>
                </Link>

                <Link
                  href="/premium"
                  onClick={() => setMenuAberto(false)}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold ${
                    pathname === '/premium'
                      ? 'bg-yellow-400/10 text-white'
                      : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <Crown className="h-5 w-5 text-yellow-300" />
                  <span className="flex items-center gap-2">
                    Seja Premium
                    {!user.isPremium && (
                      <span className="rounded bg-yellow-300 px-1.5 py-0.5 text-[9px] font-black text-slate-950">
                        PRO
                      </span>
                    )}
                  </span>
                </Link>

                {user.isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuAberto(false)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold ${
                      pathname === '/admin'
                        ? 'bg-emerald-300/10 text-white'
                        : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="h-5 w-5 text-emerald-300" />
                    <span>Painel Admin</span>
                  </Link>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMenuAberto(false);
                logout();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/20 py-3 text-sm font-bold text-red-300 transition hover:bg-red-400/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-4 left-4 right-4 z-40 flex h-16 items-center justify-around rounded-3xl border border-white/10 bg-slate-950/92 px-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {mainLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex h-12 w-14 flex-col items-center justify-center rounded-2xl transition-all ${
                isActive
                  ? 'scale-105 bg-emerald-300 text-emerald-950'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="mb-0.5 h-5 w-5" strokeWidth={2.5} />
              <span className="text-[10px] font-bold tracking-wide">{link.name}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          className="flex h-12 w-14 flex-col items-center justify-center rounded-2xl text-slate-500 hover:text-slate-300"
        >
          <User2 className="mb-0.5 h-5 w-5" strokeWidth={2.5} />
          <span className="text-[10px] font-bold tracking-wide">Perfil</span>
        </button>
      </nav>
    </div>
  );
}