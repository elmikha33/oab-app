'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useGameState } from '@/context/GameStateContext';
import { supabase } from '@/lib/supabase';

const LETRAS = ['A', 'B', 'C', 'D'];

function normalizarGabarito(valor: any) {
  if (typeof valor === 'number' && valor >= 0 && valor <= 3) return valor;

  const texto = String(valor ?? '').trim().toUpperCase();
  const letraIndex = LETRAS.indexOf(texto);
  if (letraIndex >= 0) return letraIndex;

  const numero = Number(texto);
  if (Number.isInteger(numero) && numero >= 0 && numero <= 3) return numero;

  return null;
}

export default function ReviewPage() {
  const {
    user,
    registrarErro,
    registrarAcerto,
    removerRevisao,
  } = useGameState();

  const [questoes, setQuestoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [respostas, setRespostas] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadQuestoes() {
      setLoading(true);

      const { data, error } = await supabase
        .from('questoes_oab')
        .select('*')
        .order('id', { ascending: true });

      if (!error && data) {
        setQuestoes(data);
      }

      setLoading(false);
    }

    loadQuestoes();
  }, []);

  const revisaoIds = useMemo(() => {
    return (user?.revisaoIds || []).map(String);
  }, [user]);

  const questoesRevisao = useMemo(() => {
    return questoes.filter((questao) => revisaoIds.includes(String(questao.id)));
  }, [questoes, revisaoIds]);

  const total = questoesRevisao.length;
  const respondidas = Object.keys(respostas).length;
  const pendentes = Math.max(total - respondidas, 0);

  function responder(questao: any, alternativaIndex: number) {
    const key = String(questao.id);

    if (respostas[key] !== undefined) return;

    const correta = normalizarGabarito(questao.gabarito);
    const acertou = correta !== null && alternativaIndex === correta;

    setRespostas((current) => ({
      ...current,
      [key]: alternativaIndex,
    }));

    if (acertou) {
      registrarAcerto?.(questao.id);
      removerRevisao?.(questao.id);
    } else {
      registrarErro?.(questao.id);
    }
  }

  function resetarTela() {
    setRespostas({});
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-emerald-50/40 p-6 text-slate-950 dark:bg-slate-950 dark:text-white">
        <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center">
          <p className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando Revisão Inteligente...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-emerald-50/40 px-4 py-6 text-slate-950 dark:bg-slate-950 dark:text-white md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
              LegⅠ
            </p>

            <h1 className="mt-2 text-3xl font-black md:text-4xl">
              Revisão Inteligente
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-700 dark:text-slate-300">
              Transforme seus erros em pontos fortes. Questões erradas ficam aqui até você recuperar.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-black text-emerald-800 transition hover:bg-emerald-50 dark:border-emerald-300/30 dark:bg-slate-900 dark:text-emerald-200"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            Voltar
          </Link>
        </div>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm shadow-emerald-950/5 dark:border-white/15 dark:bg-slate-900">
            <Sparkles className="mb-3 h-6 w-6 text-emerald-600 dark:text-emerald-300" />
            <p className="text-3xl font-black">{total}</p>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              para revisar
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm shadow-emerald-950/5 dark:border-white/15 dark:bg-slate-900">
            <CheckCircle2 className="mb-3 h-6 w-6 text-emerald-600 dark:text-emerald-300" />
            <p className="text-3xl font-black">{respondidas}</p>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              respondidas agora
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm shadow-emerald-950/5 dark:border-white/15 dark:bg-slate-900">
            <Trophy className="mb-3 h-6 w-6 text-emerald-600 dark:text-emerald-300" />
            <p className="text-3xl font-black">{pendentes}</p>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              pendentes
            </p>
          </div>
        </section>

        {total === 0 ? (
          <section className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm shadow-emerald-950/5 dark:border-white/15 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300">
              <Trophy className="h-8 w-8" />
            </div>

            <h2 className="text-2xl font-black">
              Nada para revisar agora
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-600 dark:text-slate-400">
              Quando você errar uma questão, ela vai entrar automaticamente aqui.
            </p>

            <Link
              href="/play"
              className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700"
            >
              Responder questões
            </Link>
          </section>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={resetarTela}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/15 dark:bg-slate-900 dark:text-slate-200"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={3} />
                Reiniciar tentativa
              </button>
            </div>

            <div className="space-y-6">
              {questoesRevisao.map((questao, index) => {
                const key = String(questao.id);
                const selected = respostas[key] ?? null;
                const correct = normalizarGabarito(questao.gabarito);
                const answered = selected !== null;
                const acertou = answered && selected === correct;

                return (
                  <article
                    key={questao.id}
                    className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-slate-900 md:p-6"
                  >
                    <div className="mb-4 flex flex-wrap gap-2 text-xs font-black uppercase">
                      <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-emerald-900 dark:border-emerald-300/35 dark:bg-emerald-300/10 dark:text-emerald-100">
                        Revisão {index + 1} de {total}
                      </span>

                      <span className="rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1 text-slate-700 dark:border-white/15 dark:bg-slate-800 dark:text-slate-200">
                        {questao.materia || 'Sem matéria'}
                      </span>

                      <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-emerald-900 dark:border-emerald-300/35 dark:bg-emerald-300/10 dark:text-emerald-100">
                        {questao.tema || 'Sem tema'}
                      </span>
                    </div>

                    <h2 className="mb-5 text-base font-semibold leading-relaxed text-slate-950 dark:text-white md:text-lg">
                      {questao.enunciado}
                    </h2>

                    <div className="space-y-3">
                      {(questao.alternativas || []).map((alt: string, alternativaIndex: number) => {
                        const isCorrect = answered && correct === alternativaIndex;
                        const isWrong = answered && selected === alternativaIndex && selected !== correct;

                        return (
                          <button
                            key={`${questao.id}-${alternativaIndex}`}
                            type="button"
                            onClick={() => responder(questao, alternativaIndex)}
                            disabled={answered}
                            className={`grid w-full grid-cols-[2.5rem_1fr] items-center gap-3 rounded-xl border px-3 py-3 text-left transition md:px-4 ${
                              isCorrect
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-950 dark:border-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-50'
                                : isWrong
                                  ? 'border-rose-600 bg-rose-50 text-rose-950 dark:border-rose-400 dark:bg-rose-500/20 dark:text-rose-50'
                                  : answered
                                    ? 'border-slate-300 bg-slate-100 text-slate-600 opacity-75 dark:border-white/10 dark:bg-slate-800 dark:text-slate-400'
                                    : 'border-slate-300 bg-white text-slate-900 hover:border-emerald-600 hover:bg-emerald-50 dark:border-white/15 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'
                            }`}
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 text-sm font-black dark:border-white/15 dark:bg-slate-950">
                              {LETRAS[alternativaIndex]}
                            </span>

                            <span className="min-w-0 text-sm leading-relaxed md:text-[15px]">
                              {alt}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {answered && (
                      <section
                        className={`mt-5 rounded-xl border p-4 ${
                          acertou
                            ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-300/40 dark:bg-emerald-400/10'
                            : 'border-rose-500 bg-rose-50 dark:border-rose-300/40 dark:bg-rose-400/10'
                        }`}
                      >
                        <div className="mb-2 flex items-center gap-2 font-black">
                          {acertou ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                          ) : (
                            <XCircle className="h-5 w-5 text-rose-700 dark:text-rose-300" />
                          )}

                          <span>
                            {acertou
                              ? 'Recuperado! Essa questão saiu da revisão.'
                              : 'Ainda precisa revisar. Ela continuará na fila.'}
                          </span>
                        </div>

                        {!acertou && correct !== null && (
                          <p className="mb-3 text-sm font-black text-rose-800 dark:text-rose-100">
                            Resposta correta: {LETRAS[correct]}
                          </p>
                        )}

                        {questao.comentario && (
                          <div className="rounded-lg border border-slate-300 bg-white p-3 dark:border-white/15 dark:bg-slate-950">
                            <p className="mb-1 text-xs font-black uppercase text-slate-600 dark:text-slate-400">
                              Comentário
                            </p>
                            <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                              {questao.comentario}
                            </p>
                          </div>
                        )}
                      </section>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}