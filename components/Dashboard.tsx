'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Flame, PlayCircle, ShieldCheck, Trophy } from 'lucide-react';
import RankingPreview from '@/components/RankingPreview';
import ThemeToggle from '@/components/ThemeToggle';
import { useGameState } from '@/context/GameStateContext';
import { ACHIEVEMENTS, isAchievementUnlocked } from '@/lib/achievements';

const MOTIVATIONAL_PHRASES = [
  'Constância vence ansiedade: uma rodada bem feita por vez.',
  'Seu futuro na OAB é construído nas questões que você encara hoje.',
  'Estude com calma, revise com honestidade e avance com método.',
  'Cada acerto consolida uma tese. Cada erro mostra onde lapidar.',
];

function getFirstName(nome?: string | null) {
  const clean = String(nome || 'Candidato').trim();
  return clean.split(/\s+/)[0] || 'Candidato';
}

function countUnique(values: unknown) {
  if (!Array.isArray(values)) return 0;
  return new Set(values.map(String)).size;
}

function getChallengeAction(achievementId?: string) {
  switch (achievementId) {
    case 'reviewed_33':
      return { href: '/review', label: 'Revisar agora' };
    case 'premium':
      return { href: '/premium', label: 'Conhecer Premium' };
    case 'seven_days':
      return { href: '/play', label: 'Fazer rodada' };
    default:
      return { href: '/play', label: 'Responder agora' };
  }
}

export default function Dashboard() {
  const router = useRouter();
  const gameState = useGameState();
  const user = gameState?.user;
  const loading = Boolean(gameState?.loading);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth');
    }
  }, [loading, router, user]);

  const phrase = useMemo(() => {
    const seed = String(user?.id || user?.email || user?.nome || 'oaplay');
    const total = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return MOTIVATIONAL_PHRASES[total % MOTIVATIONAL_PHRASES.length];
  }, [user?.email, user?.id, user?.nome]);

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
          Carregando seu painel...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
          Redirecionando para entrar na conta...
        </div>
      </main>
    );
  }

  const activeDays = Math.max(
    Number(user?.lifetimeActiveDays || 0),
    Number(user?.rankingActiveDays || 0),
    Number(user?.streak || 0)
  );

  const correctAnswers = Math.max(Number(user?.lifetimeCorrect || 0), Number(user?.acertos || 0));
  const answeredQuestions = Math.max(
    Number(user?.lifetimeQuestions || 0),
    countUnique(user?.questoesRespondidas)
  );

  const suggestedAchievement = ACHIEVEMENTS.find((achievement) => !isAchievementUnlocked(achievement.id, user));
  const challengeAction = getChallengeAction(suggestedAchievement?.id);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="hidden justify-end md:flex">
        <ThemeToggle compact className="rounded-full" />
      </div>

      <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm shadow-emerald-950/5 dark:border-white/10 dark:bg-slate-900">
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="p-6 sm:p-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              OAPlay
            </div>

            <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">
              Bem-vindo, {getFirstName(user?.nome)}
            </h1>

            <p className="mt-4 max-w-2xl text-base font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
              {phrase}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/play"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/15 transition hover:bg-emerald-700 dark:bg-emerald-300 dark:text-emerald-950 dark:hover:bg-emerald-200"
              >
                <PlayCircle className="h-5 w-5" strokeWidth={2.8} />
                Estudar Agora
              </Link>

              <Link
                href="/review"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-emerald-300/10"
              >
                Revisar erros
                <ArrowRight className="h-4 w-4" strokeWidth={3} />
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50 p-6 sm:p-8 lg:border-l lg:border-t-0 dark:border-white/10 dark:bg-slate-950/55">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Sua rotina
            </p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">dias ativos</p>
                    <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{activeDays}</p>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                    <Flame className="h-6 w-6" strokeWidth={2.8} />
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">questões corretas</p>
                    <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{correctAnswers}</p>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-300/10 dark:text-emerald-200">
                    <CheckCircle2 className="h-6 w-6" strokeWidth={2.8} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">questões feitas</p>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{answeredQuestions}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">plano atual</p>
          <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {user?.isPremium ? 'Premium' : 'Free'}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-300/25 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
            <Trophy className="h-4 w-4" strokeWidth={2.7} />
            Desafio do Dia
          </div>

          <p className="mt-3 text-lg font-black leading-tight text-slate-950 dark:text-white">
            {suggestedAchievement?.title || 'Mantenha sua sequência'}
          </p>

          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
            {suggestedAchievement?.description || 'Faça uma rodada de questões hoje e mantenha o ritmo do treino.'}
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {suggestedAchievement?.requirement || 'Rodada do dia'}
            </p>

            <Link
              href={challengeAction.href}
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-700 dark:bg-emerald-300 dark:text-emerald-950 dark:hover:bg-emerald-200"
            >
              {suggestedAchievement ? challengeAction.label : 'Estudar agora'}
            </Link>
          </div>
        </div>
      </section>

      <RankingPreview />
    </main>
  );
}
