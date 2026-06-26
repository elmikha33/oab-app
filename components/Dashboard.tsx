'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Flame,
  Quote,
  RefreshCcw,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { useGameState } from '@/context/GameStateContext';
import RankingPreview from '@/components/RankingPreview';

const FRASES = [
  {
    texto: 'Dominar a prova come\u00e7a por conhecer o padr\u00e3o dela.',
    autor: 'Prov\u00e9rbio de Estudo',
  },
  {
    texto: 'Cada quest\u00e3o respondida deixa a pr\u00f3xima mais f\u00e1cil.',
    autor: 'OAPlay',
  },
  {
    texto: 'Consist\u00eancia vence pressa. Um bloco por vez.',
    autor: 'Rotina de Aprova\u00e7\u00e3o',
  },
  {
    texto: 'Errar, revisar e voltar mais forte tamb\u00e9m \u00e9 evoluir.',
    autor: 'Treino Inteligente',
  },
];

function numeroSeguro(valor: unknown, fallback = 0) {
  const numero = Number(valor);

  if (Number.isFinite(numero)) {
    return numero;
  }

  return fallback;
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useGameState();

  const [quote, setQuote] = useState(() => {
    return FRASES[Math.floor(Math.random() * FRASES.length)];
  });

  useEffect(() => {
    if (!user) {
      router.replace('/auth');
    }
  }, [user, router]);

  const totalAcertos = numeroSeguro(user?.acertos, 0);
  const streak = numeroSeguro(user?.streak, 0);
  const moedas = numeroSeguro(user?.moedas, 0);
  const xp = numeroSeguro(user?.xp, 0);
  const xpNecessario = Math.max(numeroSeguro(user?.xpNecessario, 100), 1);
  const nivel = numeroSeguro(user?.nivel, 1);

  const progressoNivel = useMemo(() => {
    return Math.min(100, Math.max(0, Math.round((xp / xpNecessario) * 100)));
  }, [xp, xpNecessario]);

  const primeiroNome = useMemo(() => {
    const nome = String(user?.nome || user?.email || 'Estudante').trim();

    return nome.split(' ')[0] || 'Estudante';
  }, [user]);

  const streakLabel = streak === 1 ? 'dia ativo' : 'dias ativos';
  const acertosLabel = totalAcertos === 1 ? 'quest\u00e3o correta' : 'quest\u00f5es corretas';

  function refreshQuote() {
    let nova = FRASES[Math.floor(Math.random() * FRASES.length)];

    if (FRASES.length > 1) {
      while (nova.texto === quote.texto) {
        nova = FRASES[Math.floor(Math.random() * FRASES.length)];
      }
    }

    setQuote(nova);
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-emerald-300/20 border-t-emerald-300" />

          <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
            Entrando no OAPlay
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" strokeWidth={3} />
              Painel de treino
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              Bem-vindo,{' '}
              <span className="text-emerald-600 dark:text-emerald-300">
                {primeiroNome}
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-base font-semibold leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
              Continue seu treino com foco, ritmo e quest\u00f5es organizadas para avan\u00e7ar todos os dias.
            </p>

            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-950/60">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-300 text-emerald-950">
                  <Quote className="h-5 w-5" strokeWidth={3} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-base font-black leading-relaxed text-slate-950 dark:text-white">
                    &quot;{quote.texto}&quot;
                  </p>

                  <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                    {quote.autor}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={refreshQuote}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-emerald-300"
                  aria-label="Trocar frase"
                  title="Trocar frase"
                >
                  <RefreshCcw className="h-4 w-4" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[1.5rem] border border-orange-300/25 bg-orange-300/10 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-4xl font-black text-slate-950 dark:text-white">
                    {streak}
                  </p>

                  <p className="mt-1 text-sm font-black text-orange-700 dark:text-orange-200">
                    {streakLabel}
                  </p>

                  <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Mantenha a consist\u00eancia.
                  </p>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-300 text-orange-950">
                  <Flame className="h-7 w-7" strokeWidth={3} />
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-300/25 bg-emerald-300/10 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-4xl font-black text-slate-950 dark:text-white">
                    {totalAcertos}
                  </p>

                  <p className="mt-1 text-sm font-black text-emerald-700 dark:text-emerald-200">
                    {acertosLabel}
                  </p>

                  <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Continue praticando.
                  </p>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-300 text-emerald-950">
                  <Target className="h-7 w-7" strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <button
            type="button"
            onClick={() => router.push('/play')}
            className="group rounded-[2rem] border border-emerald-300/30 bg-gradient-to-br from-emerald-300 to-cyan-300 p-6 text-left text-emerald-950 shadow-xl shadow-emerald-950/10 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-emerald-950/20"
          >
            <div className="flex items-center justify-between gap-5">
              <div>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-950/10">
                  <BookOpen className="h-7 w-7" strokeWidth={3} />
                </div>

                <h2 className="text-2xl font-black">
                  Estudar Agora
                </h2>

                <p className="mt-2 max-w-xl text-sm font-bold text-emerald-950/75">
                  Responda quest\u00f5es e mantenha sua evolu\u00e7\u00e3o.
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-emerald-300 transition group-hover:translate-x-1">
                <ArrowRight className="h-6 w-6" strokeWidth={3} />
              </div>
            </div>
          </button>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
                  Evolu\u00e7\u00e3o
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                  N\u00edvel {nivel}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
                <BarChart3 className="h-6 w-6" strokeWidth={3} />
              </div>
            </div>

            <div className="h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-950">
              <div
                className="h-full rounded-full bg-emerald-300"
                style={{ width: `${progressoNivel}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-sm font-bold text-slate-600 dark:text-slate-400">
              <span>{xp} XP</span>
              <span>{xpNecessario} XP</span>
            </div>
          </div>
        </div>

        <aside className="grid gap-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
              Carteira
            </p>

            <p className="mt-2 text-4xl font-black text-slate-950 dark:text-white">
              {moedas}
            </p>

            <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-400">
              moedas acumuladas no treino.
            </p>
          </div>

          <RankingPreview />
        </aside>
      </section>
    </div>
  );
}