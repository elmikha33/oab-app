'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Flame, PlayCircle, ShieldCheck } from 'lucide-react';
import RankingPreview from '@/components/RankingPreview';
import { useGameState } from '@/context/GameStateContext';

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

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6">
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
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-300/10 dark:text-orange-200">
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

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">foco do dia</p>
          <p className="mt-2 text-base font-black leading-relaxed text-slate-950 dark:text-white">
            Uma rodada com atenção já deixa o treino mais forte.
          </p>
        </div>
      </section>

      <RankingPreview />
    </main>
  );
}
