'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Crown, Flame, PlayCircle, ShieldCheck, Sparkles, Trophy } from 'lucide-react';
import AchievementMiniatures from '@/components/AchievementMiniatures';
import ProfileEditor from '@/components/ProfileEditor';
import RankingPreview from '@/components/RankingPreview';
import SoundToggle from '@/components/SoundToggle';
import ThemeToggle from '@/components/ThemeToggle';
import { useGameState } from '@/context/GameStateContext';
import { ACHIEVEMENTS, isAchievementUnlocked } from '@/lib/achievements';

const MOTIVATIONAL_PHRASES = [
  'Ritmo bom é o que você consegue repetir amanhã.',
  'Seu futuro na OAB é construído nas questões que você encara hoje.',
  'Estude com calma, revise com honestidade e avance com método.',
  'Cada acerto consolida uma tese. Cada erro mostra onde lapidar.',
];

const ACTION_BASE =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';
const PRIMARY_ACTION =
  `${ACTION_BASE} bg-emerald-600 text-white shadow-lg shadow-emerald-950/15 hover:bg-emerald-700 dark:bg-emerald-300 dark:text-emerald-950 dark:hover:bg-emerald-200`;
const SECONDARY_ACTION =
  `${ACTION_BASE} border border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-emerald-300/10`;
const PREMIUM_ACTION =
  `${ACTION_BASE} bg-gradient-to-r from-amber-200 via-emerald-300 to-cyan-300 text-slate-950 shadow-sm hover:-translate-y-0.5 hover:from-amber-100 hover:via-emerald-200 hover:to-cyan-200`;

function getFirstName(nome?: string | null) {
  const clean = String(nome || 'Candidato').trim();
  return clean.split(/\s+/)[0] || 'Candidato';
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

function ChallengeCard({
  suggestedAchievement,
  challengeAction,
  className = '',
}: {
  suggestedAchievement: any;
  challengeAction: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={`flex h-full flex-col rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-300/25 dark:bg-slate-900 ${className}`}>
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

      <p className="mt-5 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {suggestedAchievement?.requirement || 'Rodada do dia'}
      </p>

      <Link
        href={challengeAction.href}
        className={`mt-auto ${PRIMARY_ACTION}`}
      >
        {suggestedAchievement ? challengeAction.label : 'Estudar agora'}
        <ArrowRight className="h-4 w-4" strokeWidth={3} />
      </Link>
    </div>
  );
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

  const suggestedAchievement = ACHIEVEMENTS.find((achievement) => !isAchievementUnlocked(achievement.id, user));
  const challengeAction = getChallengeAction(suggestedAchievement?.id);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="hidden justify-end gap-2 md:flex">
        <SoundToggle compact className="rounded-full" />
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

            <div className="mt-7 grid gap-3 sm:grid-cols-2 sm:max-w-[24.5rem]">
              <Link
                href="/play"
                className={PRIMARY_ACTION}
              >
                <PlayCircle className="h-5 w-5" strokeWidth={2.8} />
                Estudar Agora
              </Link>

              <Link
                href="/review"
                className={SECONDARY_ACTION}
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
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300">
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

      <div className="md:hidden">
        <ProfileEditor>
          <AchievementMiniatures user={user} />
        </ProfileEditor>
      </div>

      <ChallengeCard
        suggestedAchievement={suggestedAchievement}
        challengeAction={challengeAction}
        className="md:hidden"
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:order-3 dark:border-white/10 dark:bg-slate-900">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">próximo passo</p>
          <p className="mt-2 text-xl font-black leading-tight text-slate-950 dark:text-white">
            Mais uma questão agora. Mais segurança na prova depois.
          </p>
          <Link
            href="/play"
            className={`mt-auto ${PRIMARY_ACTION}`}
          >
            Continuar treino
            <ArrowRight className="h-4 w-4" strokeWidth={3} />
          </Link>
        </div>

        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-white via-amber-50 to-emerald-50 p-5 shadow-sm md:order-2 dark:border-amber-200/25 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                plano atual
              </p>
              <p className="mt-2 flex items-center gap-2 text-3xl font-black text-slate-950 dark:text-white">
                {user?.isPremium ? 'Premium ativo' : 'Plano Free'}
              </p>
            </div>

            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-200/30 dark:bg-amber-300/10 dark:text-amber-200">
              {user?.isPremium ? (
                <Crown className="h-6 w-6" strokeWidth={2.8} />
              ) : (
                <Sparkles className="h-6 w-6" strokeWidth={2.8} />
              )}
            </span>
          </div>

          <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-300">
            {user?.isPremium
              ? 'Questões ilimitadas, revisão livre e progresso salvo para continuar sem trava diária.'
              : 'Você ainda tem limite diário. O Premium libera treino sem bloqueio e mantém seu avanço protegido.'}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-slate-700 dark:text-slate-200">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 dark:border-emerald-300/25 dark:bg-emerald-300/10">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-200" strokeWidth={3} />
              {user?.isPremium ? 'sem limite diário' : '5 questões grátis/dia'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/80 px-3 py-1.5 dark:border-amber-200/25 dark:bg-amber-300/10">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-200" strokeWidth={3} />
              {user?.isPremium ? 'conquistas permanentes' : 'progresso protegido'}
            </span>
          </div>

          {user?.isPremium ? (
            <Link
              href="/achievements"
              className={`mt-auto ${PRIMARY_ACTION}`}
            >
              Ver conquistas
              <ArrowRight className="h-4 w-4" strokeWidth={3} />
            </Link>
          ) : (
            <Link
              href="/premium"
              className={`mt-auto ${PREMIUM_ACTION}`}
            >
              Conhecer Premium
              <ArrowRight className="h-4 w-4" strokeWidth={3} />
            </Link>
          )}
        </div>

        <ChallengeCard
          suggestedAchievement={suggestedAchievement}
          challengeAction={challengeAction}
          className="hidden md:order-1 md:block"
        />
      </section>

      <RankingPreview />
    </main>
  );
}
