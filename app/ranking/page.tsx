'use client';

import Link from 'next/link';
import { ArrowLeft, Crown, Medal, Trophy } from 'lucide-react';
import { useGameState } from '@/context/GameStateContext';

const BASE_RANKING = [
  { nome: 'Ana Clara', rankingScore: 392, rankingQuestions: 270, rankingActiveDays: 41 },
  { nome: 'Bruno Lima', rankingScore: 351, rankingQuestions: 248, rankingActiveDays: 34 },
  { nome: 'Carla Mendes', rankingScore: 326, rankingQuestions: 236, rankingActiveDays: 30 },
  { nome: 'Diego Torres', rankingScore: 301, rankingQuestions: 219, rankingActiveDays: 28 },
  { nome: 'Fernanda Reis', rankingScore: 278, rankingQuestions: 197, rankingActiveDays: 25 },
  { nome: 'Gabriel Nunes', rankingScore: 244, rankingQuestions: 180, rankingActiveDays: 21 },
  { nome: 'Helena Duarte', rankingScore: 221, rankingQuestions: 164, rankingActiveDays: 18 },
  { nome: 'Igor Martins', rankingScore: 197, rankingQuestions: 143, rankingActiveDays: 16 },
  { nome: 'Julia Prado', rankingScore: 172, rankingQuestions: 128, rankingActiveDays: 13 },
  { nome: 'Lucas Barros', rankingScore: 149, rankingQuestions: 111, rankingActiveDays: 11 },
  { nome: 'Marina Lopes', rankingScore: 126, rankingQuestions: 94, rankingActiveDays: 9 },
  { nome: 'Rafael Alves', rankingScore: 104, rankingQuestions: 78, rankingActiveDays: 8 },
];

function icon(index: number) {
  if (index === 0) return <Crown className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />;
  if (index === 1) return <Medal className="h-5 w-5 text-slate-500 dark:text-slate-300" />;
  if (index === 2) return <Trophy className="h-5 w-5 text-teal-600 dark:text-teal-300" />;
  return <span className="text-sm font-black text-slate-500 dark:text-slate-400">#{index + 1}</span>;
}

export default function RankingPage() {
  const { user } = useGameState();

  const ranking = [
    ...BASE_RANKING,
    {
      nome: user?.nome || 'Candidato',
      rankingScore: user?.rankingScore || 0,
      rankingQuestions: user?.rankingQuestions || 0,
      rankingActiveDays: user?.rankingActiveDays || 0,
      atual: true,
    },
  ].sort((a, b) => {
    if (b.rankingScore !== a.rankingScore) return b.rankingScore - a.rankingScore;
    if (b.rankingActiveDays !== a.rankingActiveDays) return b.rankingActiveDays - a.rankingActiveDays;
    return b.rankingQuestions - a.rankingQuestions;
  });

  return (
    <main className="min-h-screen bg-emerald-50/40 px-4 py-6 text-slate-950 dark:bg-slate-950 dark:text-white md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
              LegⅠ
            </p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">
              Ranking de Assiduidade
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-700 dark:text-slate-300">
              Ranking vitalício. Ele não reseta quando o aluno reinicia questões.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-black text-emerald-800 transition hover:bg-emerald-50 dark:border-emerald-300/30 dark:bg-slate-900 dark:text-emerald-200 dark:hover:bg-emerald-300/10"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            Voltar
          </Link>
        </div>

        <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm shadow-emerald-950/5 dark:border-white/15 dark:bg-slate-900 md:p-5">
          <div className="space-y-3">
            {ranking.map((item, index) => (
              <div
                key={`${item.nome}-${index}`}
                className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-4 ${
                  item.atual
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400/40 dark:bg-emerald-300/10'
                    : 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white dark:border-white/10 dark:bg-slate-900">
                    {icon(index)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-base font-black">
                      {item.nome}
                      {item.atual ? ' · você' : ''}
                    </p>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {item.rankingActiveDays} dias ativos · {item.rankingQuestions} questões únicas
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    {item.rankingScore}
                  </p>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    pontos
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
