'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, Trophy, XCircle } from 'lucide-react';
import { useGameState } from '@/context/GameStateContext';
import useSoundEffects from '@/hooks/useSoundEffects';
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

function lerRevisaoLocal() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem('user-game-data');
    if (!raw) return [];

    const user = JSON.parse(raw);

    return [
      ...(Array.isArray(user.revisaoIds) ? user.revisaoIds : []),
      ...(Array.isArray(user.questoesErradas) ? user.questoesErradas : []),
    ].map(String);
  } catch {
    return [];
  }
}

function getMateriaNome(questao: any) {
  return String(questao?.materia || 'Sem matéria').trim();
}

function scrollFeedbackIntoView(primaryId: string, fallbackId?: string) {
  window.setTimeout(() => {
    const element = document.getElementById(primaryId) || (fallbackId ? document.getElementById(fallbackId) : null);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const topPadding = 88;
    const bottomPadding = 36;

    if (rect.top >= topPadding && rect.bottom <= viewportHeight - bottomPadding) return;

    const targetY =
      rect.height > viewportHeight - topPadding - bottomPadding
        ? window.scrollY + rect.top - topPadding
        : window.scrollY + rect.bottom - viewportHeight + bottomPadding;

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: 'smooth',
    });
  }, 140);
}

export default function ReviewPage() {
  const { user, setUser, registrarErro, registrarAcerto, registrarQuestaoRevisada } = useGameState();

  const [questoes, setQuestoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [revisaoLocalIds, setRevisaoLocalIds] = useState<string[]>([]);
  const { playSuccess, playError } = useSoundEffects();

  useEffect(() => {
    setRevisaoLocalIds(lerRevisaoLocal());

    function atualizar() {
      setRevisaoLocalIds(lerRevisaoLocal());
    }

    window.addEventListener('storage', atualizar);
    window.addEventListener('focus', atualizar);
    window.addEventListener('oaplay-revisao-atualizada', atualizar);

    return () => {
      window.removeEventListener('storage', atualizar);
      window.removeEventListener('focus', atualizar);
      window.removeEventListener('oaplay-revisao-atualizada', atualizar);
    };
  }, []);

  useEffect(() => {
    async function loadQuestoes() {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setQuestoes([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({ page: '0', limit: '10000' });
      const response = await fetch(`/api/questoes?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => []);

      if (!response.ok || !Array.isArray(data)) {
        setQuestoes([]);
        setLoading(false);
        return;
      }

      setQuestoes(data);
      setLoading(false);
    }

    loadQuestoes();
  }, []);

  const revisaoIds = useMemo(() => {
    return [
      ...(user?.revisaoIds || []),
      ...(user?.questoesErradas || []),
      ...revisaoLocalIds,
    ].map(String);
  }, [user, revisaoLocalIds]);

  const questoesRevisao = useMemo(() => {
    const ids = new Set(revisaoIds);
    return questoes.filter((q) => ids.has(String(q.id)));
  }, [questoes, revisaoIds]);

  const resumoRevisao = useMemo(() => {
    const materias = new Map<
      string,
      {
        materia: string;
        total: number;
        respondidas: number;
        pendentes: number;
        primeiroId: string;
      }
    >();

    let acertosAgora = 0;
    let errosAgora = 0;
    let respondidasAgora = 0;

    for (const questao of questoesRevisao) {
      const key = String(questao.id);
      const selected = respostas[key];
      const answered = selected !== undefined;
      const correct = normalizarGabarito(questao.gabarito);
      const materia = getMateriaNome(questao);
      const atual =
        materias.get(materia) ||
        {
          materia,
          total: 0,
          respondidas: 0,
          pendentes: 0,
          primeiroId: key,
        };

      atual.total += 1;

      if (answered) {
        atual.respondidas += 1;
        respondidasAgora += 1;

        if (correct !== null && selected === correct) {
          acertosAgora += 1;
        } else {
          errosAgora += 1;
        }
      } else {
        atual.pendentes += 1;
      }

      materias.set(materia, atual);
    }

    const total = questoesRevisao.length;
    const pendentes = Math.max(total - respondidasAgora, 0);
    const progresso = total ? Math.round((respondidasAgora / total) * 100) : 0;

    return {
      total,
      respondidasAgora,
      pendentes,
      acertosAgora,
      errosAgora,
      progresso,
      materias: [...materias.values()].sort((a, b) => b.pendentes - a.pendentes || b.total - a.total),
    };
  }, [questoesRevisao, respostas]);

  function irParaQuestao(id: string) {
    document.getElementById(`revisao-${id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  function responder(questao: any, alternativaIndex: number) {
    const key = String(questao.id);
    if (respostas[key] !== undefined) return;

    const correta = normalizarGabarito(questao.gabarito);
    const acertou = correta !== null && alternativaIndex === correta;

    setRespostas((current) => ({ ...current, [key]: alternativaIndex }));
    scrollFeedbackIntoView(`revisao-comentario-${questao.id}`, `revisao-feedback-${questao.id}`);

    if (acertou) {
      playSuccess();
      // IMPORTANTE:
      // No modo revisão, a questão NÃO pode sair da tela imediatamente.
      // Primeiro mostramos o feedback, a resposta certa e o comentário.
      // Ela só sai quando o usuário clicar em "Continuar e remover da revisão".
      registrarQuestaoRevisada?.(questao.id);
      registrarAcerto?.(questao.id);
      return;
    }

    playError();
    registrarErro?.(questao.id);
    setRevisaoLocalIds((current) => [
      ...new Set([...current, String(questao.id)]),
    ]);
  }

  function removerDaRevisaoDepoisDoFeedback(questaoId: number | string) {
    const id = String(questaoId);

    setRevisaoLocalIds((current) => current.filter((item: string) => item !== id));
    setRespostas((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });

    setUser?.((prev: any) => {
      if (!prev) return prev;

      return {
        ...prev,
        revisaoIds: Array.isArray(prev.revisaoIds)
          ? prev.revisaoIds.map(String).filter((item: string) => item !== id)
          : [],
        questoesErradas: Array.isArray(prev.questoesErradas)
          ? prev.questoesErradas.map(String).filter((item: string) => item !== id)
          : [],
      };
    });

    try {
      const raw = localStorage.getItem('user-game-data');
      const current = raw ? JSON.parse(raw) : {};

      localStorage.setItem(
        'user-game-data',
        JSON.stringify({
          ...current,
          revisaoIds: Array.isArray(current.revisaoIds)
            ? current.revisaoIds.map(String).filter((item: string) => item !== id)
            : [],
          questoesErradas: Array.isArray(current.questoesErradas)
            ? current.questoesErradas.map(String).filter((item: string) => item !== id)
            : [],
        })
      );

      window.dispatchEvent(new Event('oaplay-revisao-atualizada'));
      window.dispatchEvent(new StorageEvent('storage', { key: 'user-game-data' }));
    } catch {
      // ignora falha de localStorage
    }
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
              OAPlay
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

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-emerald-200 bg-white p-5 dark:border-white/15 dark:bg-slate-900">
            <p className="text-3xl font-black">{resumoRevisao.total}</p>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              na fila
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white p-5 dark:border-white/15 dark:bg-slate-900">
            <p className="text-3xl font-black">{resumoRevisao.pendentes}</p>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              pendentes
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white p-5 dark:border-white/15 dark:bg-slate-900">
            <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{resumoRevisao.acertosAgora}</p>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              acertos agora
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white p-5 dark:border-white/15 dark:bg-slate-900">
            <p className="text-3xl font-black text-rose-700 dark:text-rose-300">{resumoRevisao.errosAgora}</p>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              erros agora
            </p>
          </div>
        </section>

        {questoesRevisao.length === 0 ? (
          <section className="rounded-3xl border border-emerald-200 bg-white p-8 text-center dark:border-white/15 dark:bg-slate-900">
            <Trophy className="mx-auto mb-4 h-10 w-10 text-emerald-600 dark:text-emerald-300" />
            <h2 className="text-2xl font-black">Nada para revisar agora</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-slate-600 dark:text-slate-400">
              Quando você errar uma questão, ela vai entrar automaticamente aqui.
            </p>
            <Link
              href="/play"
              className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700"
            >
              Responder questões
            </Link>
          </section>
        ) : (
          <div className="space-y-6">
            <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-slate-900">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">
                    Sumário da revisão
                  </p>
                  <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">
                    {resumoRevisao.respondidasAgora} de {resumoRevisao.total} respondidas nesta sessão
                  </h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Use o mapa por matéria para se localizar quando a fila estiver grande.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100">
                  <p className="text-xs font-black uppercase tracking-wide">progresso</p>
                  <p className="mt-1 text-2xl font-black">{resumoRevisao.progresso}%</p>
                </div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all dark:bg-emerald-300"
                  style={{ width: `${resumoRevisao.progresso}%` }}
                />
              </div>

              <div className="mt-5 grid gap-2 md:grid-cols-2">
                {resumoRevisao.materias.map((item) => (
                  <button
                    key={item.materia}
                    type="button"
                    onClick={() => irParaQuestao(item.primeiroId)}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-slate-950 dark:hover:bg-emerald-300/10"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-slate-950 dark:text-white">
                        {item.materia}
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {item.respondidas}/{item.total} respondidas
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-black text-emerald-800 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100">
                      {item.pendentes} pend.
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {questoesRevisao.map((questao, index) => {
              const key = String(questao.id);
              const selected = respostas[key] ?? null;
              const correct = normalizarGabarito(questao.gabarito);
              const answered = selected !== null;
              const acertou = answered && selected === correct;

              return (
                <article
                  key={questao.id}
                  id={`revisao-${questao.id}`}
                  className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-slate-900 md:p-6"
                >
                  <div className="mb-4 flex flex-wrap gap-2 text-xs font-black uppercase">
                    <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-emerald-900 dark:border-emerald-300/35 dark:bg-emerald-300/10 dark:text-emerald-100">
                      Revisão {index + 1} de {questoesRevisao.length}
                    </span>
                    <span className="rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1 text-slate-700 dark:border-white/15 dark:bg-slate-800 dark:text-slate-200">
                      {questao.materia || 'Sem matéria'}
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
                          <span className="text-sm leading-relaxed md:text-[15px]">{alt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {answered && (
                    <section
                      id={`revisao-feedback-${questao.id}`}
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

                      {correct !== null && (
                        <p
                          className={`mb-3 text-sm font-black ${
                            acertou
                              ? 'text-emerald-800 dark:text-emerald-100'
                              : 'text-rose-800 dark:text-rose-100'
                          }`}
                        >
                          Resposta correta: {LETRAS[correct]}
                        </p>
                      )}

                      {questao.comentario && (
                        <div
                          id={`revisao-comentario-${questao.id}`}
                          className="rounded-lg border border-slate-300 bg-white p-3 dark:border-white/15 dark:bg-slate-950"
                        >
                          <p className="mb-1 text-xs font-black uppercase text-slate-600 dark:text-slate-400">
                            Comentário
                          </p>
                          <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                            {questao.comentario}
                          </p>
                        </div>
                      )}

                      {acertou && (
                        <button
                          type="button"
                          onClick={() => removerDaRevisaoDepoisDoFeedback(questao.id)}
                          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 md:w-auto"
                        >
                          Continuar e remover da revisão
                        </button>
                      )}
                    </section>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
