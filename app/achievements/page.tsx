'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, Crown, Lock, Trophy } from 'lucide-react';
import { useGameState } from '@/context/GameStateContext';
import { ACHIEVEMENTS, countUnlockedAchievements, isAchievementUnlocked } from '@/lib/achievements';

export default function AchievementsPage() {
  const { user } = useGameState() || {};

  if (!user) {
    return (
      <main className="min-h-screen bg-white p-6 text-slate-950 dark:bg-slate-950 dark:text-white">
        Carregando conquistas...
      </main>
    );
  }

  const unlockedCount = countUnlockedAchievements(user);
  const total = ACHIEVEMENTS.length;
  const totalCorrect = Math.max(Number(user?.lifetimeCorrect || 0), Number(user?.acertos || 0));

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-8 text-slate-950 md:px-10 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950 dark:text-white">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-300">
              Coleção OAPlay
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
              Suas Conquistas
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-300 md:text-base">
              Sua coleção cresce no seu ritmo. Cada tentativa conta, cada retorno fortalece e cada badge marca uma etapa do treino.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-white px-5 py-4 shadow-sm dark:border-emerald-300/25 dark:bg-emerald-300/10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-200">
              Coleção liberada
            </p>
            <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">
              {unlockedCount}/{total}
            </p>
          </div>
        </div>

        <div className="mb-8 grid gap-3 md:grid-cols-4">
          <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 shadow-sm shadow-emerald-950/5 dark:border-white/10 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950">
            <BookOpen className="h-6 w-6 text-emerald-500 dark:text-emerald-300" />
            <p className="mt-4 text-2xl font-black text-slate-950 dark:text-white">Em movimento</p>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">cada questão conta</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 dark:text-emerald-300" />
            <p className="mt-4 text-2xl font-black">{totalCorrect}</p>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">acertos</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
            <Trophy className="h-6 w-6 text-emerald-500 dark:text-emerald-300" />
            <p className="mt-4 text-2xl font-black">{unlockedCount}/{total}</p>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">coleção liberada</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
            <Crown className="h-6 w-6 text-amber-500 dark:text-amber-300" />
            <p className="mt-4 text-2xl font-black">{user?.isPremium ? 'Premium' : 'Free'}</p>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">plano atual</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = isAchievementUnlocked(achievement.id, user);
            const Icon = achievement.icon;

            return (
              <article
                key={achievement.id}
                className={
                  unlocked
                    ? 'relative overflow-hidden rounded-3xl border border-emerald-300/45 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 shadow-xl shadow-emerald-950/10 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950 dark:shadow-emerald-950/20'
                    : 'relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 opacity-90 dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none'
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={
                      unlocked
                        ? 'flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/35 bg-emerald-300/10 text-3xl'
                        : 'flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-500'
                    }
                  >
                    {unlocked ? achievement.emoji : <Lock className="h-7 w-7" />}
                  </div>

                  {unlocked && (
                    <div className="rounded-full border border-emerald-300/35 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-200">
                      Liberada
                    </div>
                  )}
                </div>

                <Icon
                  className={
                    unlocked
                      ? 'mt-5 h-5 w-5 text-emerald-600 dark:text-emerald-300'
                      : 'mt-5 h-5 w-5 text-slate-600'
                  }
                />

                <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">
                  {achievement.title}
                </h2>

                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600 dark:text-slate-400">
                  {achievement.description}
                </p>

                <p
                  className={
                    unlocked
                      ? 'mt-4 inline-flex rounded-full border border-emerald-300/35 bg-emerald-300/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-200'
                      : 'mt-4 inline-flex rounded-full border border-slate-300/60 bg-slate-100 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-500 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-500'
                  }
                >
                  {achievement.requirement}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/play"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-emerald-950 transition hover:bg-emerald-200"
          >
            Continuar estudando
            <ArrowRight className="h-4 w-4" strokeWidth={3} />
          </Link>
        </div>
      </section>
    </main>
  );
}
