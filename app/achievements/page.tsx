'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Crown,
  Flame,
  Lock,
  Medal,
  RotateCcw,
  ShieldCheck,
  Star,
  Target,
  Trophy,
} from 'lucide-react';
import { useGameState } from '@/context/GameStateContext';

const ACHIEVEMENTS = [
  {
    id: 'first_question',
    emoji: '🎯',
    icon: Target,
    title: 'Primeira questao',
    description: 'Responda sua primeira questao no OAPlay.',
    requirement: 'Responder 1 questao',
  },
  {
    id: 'ten_correct',
    emoji: '⚔️',
    icon: CheckCircle2,
    title: 'Sequencia inicial',
    description: 'Acerte 10 questoes no total.',
    requirement: '10 acertos',
  },
  {
    id: 'fifty_correct',
    emoji: '🔥',
    icon: Flame,
    title: 'Ritmo de prova',
    description: 'Acerte 50 questoes no total.',
    requirement: '50 acertos',
  },
  {
    id: 'hundred_correct',
    emoji: '🏆',
    icon: Trophy,
    title: 'Maratonista OAB',
    description: 'Acerte 100 questoes no total.',
    requirement: '100 acertos',
  },
  {
    id: 'first_review',
    emoji: '🧠',
    icon: RotateCcw,
    title: 'Entrou na revisao',
    description: 'Tenha questoes para revisar.',
    requirement: '1 questao em revisao',
  },
  {
    id: 'five_review',
    emoji: '🛡️',
    icon: ShieldCheck,
    title: 'Caçador de erros',
    description: 'Acumule 5 questoes para revisar.',
    requirement: '5 questoes em revisao',
  },
  {
    id: 'seven_days',
    emoji: '📅',
    icon: Flame,
    title: 'Constancia semanal',
    description: 'Estude em 7 dias ativos.',
    requirement: '7 dias ativos',
  },
  {
    id: 'premium',
    emoji: '👑',
    icon: Crown,
    title: 'Aluno Premium',
    description: 'Desbloqueie o plano Premium.',
    requirement: 'Conta Premium ativa',
  },
];

function totalRespondidas(user: any) {
  return Array.isArray(user?.questoesRespondidas) ? user.questoesRespondidas.length : 0;
}

function totalRevisao(user: any) {
  const revisao = Array.isArray(user?.revisaoIds) ? user.revisaoIds.length : 0;
  const erradas = Array.isArray(user?.questoesErradas) ? user.questoesErradas.length : 0;

  return revisao + erradas;
}

function isUnlocked(id: string, user: any) {
  const acertos = Number(user?.acertos || 0);
  const respondidas = totalRespondidas(user);
  const revisao = totalRevisao(user);
  const diasAtivos = Math.max(Number(user?.rankingActiveDays || 0), Number(user?.streak || 0));

  switch (id) {
    case 'first_question':
      return respondidas >= 1 || acertos >= 1;
    case 'ten_correct':
      return acertos >= 10;
    case 'fifty_correct':
      return acertos >= 50;
    case 'hundred_correct':
      return acertos >= 100;
    case 'first_review':
      return revisao >= 1;
    case 'five_review':
      return revisao >= 5;
    case 'seven_days':
      return diasAtivos >= 7;
    case 'premium':
      return Boolean(user?.isPremium);
    default:
      return false;
  }
}

export default function AchievementsPage() {
  const { user } = useGameState() || {};

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        Carregando conquistas...
      </main>
    );
  }

  const unlockedCount = ACHIEVEMENTS.filter((item) => isUnlocked(item.id, user)).length;
  const total = ACHIEVEMENTS.length;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
              Colecao OAPlay
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
              Suas Conquistas
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-slate-300 md:text-base">
              Libere badges automaticamente conforme responde questoes, acerta mais, revisa erros e evolui no app.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-300/25 bg-emerald-300/10 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
              Progresso
            </p>
            <p className="mt-1 text-3xl font-black text-white">
              {unlockedCount}/{total}
            </p>
          </div>
        </div>

        <div className="mb-8 grid gap-3 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
            <BookOpen className="h-6 w-6 text-emerald-300" />
            <p className="mt-4 text-2xl font-black">{totalRespondidas(user)}</p>
            <p className="text-sm font-bold text-slate-400">questoes respondidas</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
            <CheckCircle2 className="h-6 w-6 text-emerald-300" />
            <p className="mt-4 text-2xl font-black">{user?.acertos || 0}</p>
            <p className="text-sm font-bold text-slate-400">acertos</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
            <RotateCcw className="h-6 w-6 text-amber-300" />
            <p className="mt-4 text-2xl font-black">{totalRevisao(user)}</p>
            <p className="text-sm font-bold text-slate-400">em revisao</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
            <Crown className="h-6 w-6 text-amber-300" />
            <p className="mt-4 text-2xl font-black">{user?.isPremium ? 'Premium' : 'Free'}</p>
            <p className="text-sm font-bold text-slate-400">plano atual</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked = isUnlocked(achievement.id, user);
            const Icon = achievement.icon;

            return (
              <article
                key={achievement.id}
                className={
                  unlocked
                    ? 'relative overflow-hidden rounded-3xl border border-emerald-300/35 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-5 shadow-xl shadow-emerald-950/20'
                    : 'relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-5 opacity-70'
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={
                      unlocked
                        ? 'flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/35 bg-emerald-300/10 text-3xl'
                        : 'flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-slate-950 text-slate-500'
                    }
                  >
                    {unlocked ? achievement.emoji : <Lock className="h-7 w-7" />}
                  </div>

                  {unlocked && (
                    <div className="rounded-full border border-emerald-300/35 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">
                      Liberada
                    </div>
                  )}
                </div>

                <Icon
                  className={
                    unlocked
                      ? 'mt-5 h-5 w-5 text-emerald-300'
                      : 'mt-5 h-5 w-5 text-slate-600'
                  }
                />

                <h2 className="mt-3 text-xl font-black text-white">
                  {achievement.title}
                </h2>

                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-400">
                  {achievement.description}
                </p>

                <p className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-400">
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