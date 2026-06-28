'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronDown, Crown, Medal, Trophy } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { useGameState } from '@/context/GameStateContext';

const BASE_RANKING = [
  { nome: 'Ana Clara', rankingScore: 392, rankingQuestions: 270, rankingActiveDays: 41, sigla: 'AC' },
  { nome: 'Bruno Lima', rankingScore: 351, rankingQuestions: 248, rankingActiveDays: 34, sigla: 'BL' },
  { nome: 'Carla Mendes', rankingScore: 326, rankingQuestions: 236, rankingActiveDays: 30, sigla: 'CM' },
  { nome: 'Rafael Souza', rankingScore: 298, rankingQuestions: 211, rankingActiveDays: 26, sigla: 'RS' },
  { nome: 'Julia Ferreira', rankingScore: 285, rankingQuestions: 201, rankingActiveDays: 25, sigla: 'JF' },
  { nome: 'Lucas Pereira', rankingScore: 274, rankingQuestions: 195, rankingActiveDays: 23, sigla: 'LP' },
  { nome: 'Amanda Martins', rankingScore: 261, rankingQuestions: 188, rankingActiveDays: 22, sigla: 'AM' },
  { nome: 'Gustavo Vieira', rankingScore: 250, rankingQuestions: 180, rankingActiveDays: 20, sigla: 'GV' },
  { nome: 'Thiago Costa', rankingScore: 238, rankingQuestions: 172, rankingActiveDays: 19, sigla: 'TC' },
];

export default function RankingPreview() {
  const { user } = useGameState();
  const [expanded, setExpanded] = useState(false);

  const ranking = useMemo(() => {
    const nome = user?.nome || 'Candidato';
    const current = {
      nome,
      rankingScore: user?.rankingScore || 0,
      rankingQuestions: user?.rankingQuestions || 0,
      rankingActiveDays: user?.rankingActiveDays || 0,
      avatar_url: user?.avatar_url || null,
      sigla: nome.slice(0, 2).toUpperCase(),
      atual: true,
    };

    return [...BASE_RANKING, current]
      .sort((a, b) => {
        if (b.rankingScore !== a.rankingScore) return b.rankingScore - a.rankingScore;
        if (b.rankingActiveDays !== a.rankingActiveDays) return b.rankingActiveDays - a.rankingActiveDays;
        return b.rankingQuestions - a.rankingQuestions;
      })
      .slice(0, 10);
  }, [user]);

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3, 10);

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5 dark:border-white/15 dark:bg-slate-900">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
            <h2 className="text-xl font-black text-slate-950 dark:text-white">
              Ranking de Assiduidade
            </h2>
          </div>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
            Pontuação vitalícia: presença diária e questões únicas.
          </p>
        </div>

        <Link
          href="/ranking"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 sm:w-auto dark:bg-emerald-300/10 dark:text-emerald-200"
        >
          Ranking completo
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {top3.map((item, index) => (
          <div
            key={item.nome}
            className={`rounded-[1.75rem] border p-5 text-center ${
              index === 0
                ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-300/30 dark:bg-emerald-300/10'
                : 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950'
            }`}
          >
            <UserAvatar
              nome={item.nome}
              avatar={(item as any).avatar_url}
              className="mx-auto mb-3 h-14 w-14 rounded-full text-lg shadow-lg dark:bg-emerald-300 dark:text-emerald-950"
              textClassName={(item as any).avatar_url ? 'text-2xl' : ''}
            />

            <div className="mb-2 flex justify-center">
              {index === 0 ? (
                <Crown className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
              ) : index === 1 ? (
                <Medal className="h-5 w-5 text-slate-500" />
              ) : (
                <Trophy className="h-5 w-5 text-teal-600 dark:text-teal-300" />
              )}
            </div>

            <p className="font-black text-slate-950 dark:text-white">{item.nome}</p>
            <p className="mt-1 text-sm font-black text-emerald-700 dark:text-emerald-300">
              {item.rankingScore} pontos
            </p>
          </div>
        ))}
      </div>

      {expanded && (
        <div className="mt-5 grid gap-2 md:grid-cols-2">
          {rest.map((item, index) => (
            <div
              key={item.nome}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-6 shrink-0 text-sm font-black text-slate-500">#{index + 4}</span>
                <UserAvatar
                  nome={item.nome}
                  avatar={(item as any).avatar_url}
                  className="h-7 w-7 rounded-full bg-emerald-100 text-xs text-emerald-700 dark:bg-emerald-300/15 dark:text-emerald-200"
                  textClassName={(item as any).avatar_url ? 'text-base' : ''}
                />
                <span className="truncate font-bold text-slate-800 dark:text-slate-100">{item.nome}</span>
              </div>
              <span className="shrink-0 font-black text-slate-600 dark:text-slate-300">
                {item.rankingScore} pontos
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="mx-auto mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-50 sm:w-auto dark:text-emerald-300 dark:hover:bg-emerald-300/10"
      >
        {expanded ? 'Mostrar menos' : 'Ver mais 7'}
        <ChevronDown className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`} strokeWidth={3} />
      </button>
    </section>
  );
}
