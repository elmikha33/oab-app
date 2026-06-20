'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useGameState } from '@/context/GameStateContext';
import ThemeToggle from '@/components/ThemeToggle';
import {
  ArrowDown,
  ArrowLeft,
  CheckCircle2,
  Eraser,
  Lightbulb,
  Loader2,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';

const PAGE_SIZE = 25;
const BATCH_SIZE = 500;
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_KEY = 'missao-oab:questoes-oab:v4';

const CATEGORIES = {
  PRIORIDADE: {
    label: 'Prioridade',
    color: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    subjects: ['Ética Profissional'],
  },
  PUBLICO: {
    label: 'Direito Público',
    color: 'bg-blue-600 hover:bg-blue-500 text-white',
    subjects: [
      'Direito Constitucional',
      'Direito Administrativo',
      'Direito Tributário',
      'Direito Penal',
      'Direito Processual Penal',
    ],
  },
  PRIVADO: {
    label: 'Direito Privado',
    color: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    subjects: ['Direito Civil', 'Direito Processual Civil', 'Direito Empresarial', 'Direito Internacional'],
  },
  SOCIAL: {
    label: 'Direito Social',
    color: 'bg-orange-600 hover:bg-orange-500 text-white',
    subjects: [
      'Direito do Trabalho',
      'Direito Processual do Trabalho',
      'Direitos Humanos',
      'Direito Ambiental',
      'Direito do Consumidor',
      'Direito Previdenciário',
    ],
  },
  BASE: {
    label: 'Base',
    color: 'bg-slate-600 hover:bg-slate-500 text-white',
    subjects: ['Filosofia do Direito'],
  },
};

type StatusFilter = 'all' | 'pending' | 'answered';

let memoryQuestoesCache: { data: any[]; timestamp: number } | null = null;

function getMateria(q: any) {
  return String(q.materia || 'Sem matéria').trim();
}

function getQuestionKeys(q: any) {
  const materia = getMateria(q);
  const enunciado = String(q.enunciado || 'sem-enunciado').trim();
  const keys = [q.id, q.uuid, q.hash, q.questao_id, `${materia}:${enunciado}`];

  return [...new Set(keys.map((key) => String(key)).filter((key) => key && key !== 'undefined' && key !== 'null'))];
}

function getQuestionKey(q: any) {
  return getQuestionKeys(q)[0];
}

function hasQuestionKey(q: any, keys: Set<string>) {
  return getQuestionKeys(q).some((key) => keys.has(key));
}

function getProgressKeys(user: any) {
  return new Set([...(user?.questoesRespondidas || []), ...(user?.questoesErradas || [])].map(String));
}

function getWrongKeys(user: any) {
  return new Set((user?.questoesErradas || []).map(String));
}

function getAlternativas(q: any): string[] {
  if (Array.isArray(q.alternativas)) return q.alternativas.map(String);

  if (typeof q.alternativas === 'string') {
    try {
      const parsed = JSON.parse(q.alternativas);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return q.alternativas
        .split(/\r?\n|;\s*/)
        .map((item: string) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function getCorrectIndex(q: any, totalAlternativas: number) {
  const raw = q.gabarito ?? q.resposta_correta ?? q.correct_answer;

  if (typeof raw === 'string') {
    const normalized = raw.trim().toUpperCase();
    const letterIndex = ['A', 'B', 'C', 'D', 'E'].indexOf(normalized);
    if (letterIndex >= 0) return letterIndex;

    const numeric = Number(normalized);
    if (Number.isInteger(numeric)) {
      return numeric >= 1 && numeric <= totalAlternativas ? numeric - 1 : numeric;
    }
  }

  return Number(raw);
}

function getSortValue(q: any) {
  const numericId = Number(q.id);
  if (Number.isFinite(numericId)) return numericId;

  return String(q.hash || q.enunciado || '').localeCompare(String(q.materia || ''), 'pt-BR');
}

function dedupeQuestoes(data: any[]) {
  const seen = new Set<string>();
  const unique: any[] = [];

  data.forEach((q) => {
    const key = getQuestionKey(q);
    if (seen.has(key)) return;

    seen.add(key);
    unique.push(q);
  });

  return unique.sort((a, b) => {
    const av = getSortValue(a);
    const bv = getSortValue(b);
    return typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'pt-BR');
  });
}

function readCachedQuestoes() {
  const now = Date.now();
  if (memoryQuestoesCache && now - memoryQuestoesCache.timestamp < CACHE_TTL_MS) {
    return memoryQuestoesCache.data;
  }

  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.data) || now - parsed.timestamp >= CACHE_TTL_MS) return null;

    memoryQuestoesCache = parsed;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCachedQuestoes(data: any[]) {
  memoryQuestoesCache = { data, timestamp: Date.now() };

  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(memoryQuestoesCache));
  } catch {
    // Cache is only a speed boost. Some browsers reject large session data.
  }
}

function formatCount(total: number, singular: string, plural: string) {
  return `${total} ${total === 1 ? singular : plural}`;
}

function QuestaoCard({ q, onAnswer }: { q: any; onAnswer: (ids: string[], acerto: boolean) => void }) {
  const { user } = useGameState();
  const [selected, setSelected] = useState<number | null>(null);

  const questionKeys = useMemo(() => getQuestionKeys(q), [q]);
  const primaryKey = questionKeys[0];
  const answeredKeys = getProgressKeys(user);
  const wrongKeys = getWrongKeys(user);
  const answeredBefore = questionKeys.some((key) => answeredKeys.has(key));
  const wrongBefore = questionKeys.some((key) => wrongKeys.has(key));
  const alternativas = getAlternativas(q);
  const correct = getCorrectIndex(q, alternativas.length);
  const isResolved = selected !== null || answeredBefore;
  const acertou = selected === null ? !wrongBefore : selected === correct;
  const explicacao = q.comentario || q.explicacao || 'Comentário ainda não cadastrado.';

  return (
    <article className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900 md:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600 dark:bg-slate-950 dark:text-slate-400">
          {getMateria(q)}
        </span>
        {q.tema && <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{q.tema}</span>}
        {isResolved && (
          <span
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-bold uppercase ${
              wrongBefore ? 'bg-red-500/10 text-red-300' : 'bg-emerald-500/10 text-emerald-300'
            }`}
          >
            <CheckCircle2 size={12} />
            Respondida
          </span>
        )}
      </div>

      <h2 className="mb-4 text-[15px] font-medium leading-relaxed text-slate-900 dark:text-slate-100 md:text-sm">{q.enunciado}</h2>

      {alternativas.length === 0 ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          Esta questão está sem alternativas cadastradas.
        </div>
      ) : (
        <div className="space-y-2">
          {alternativas.map((alt: string, i: number) => (
            <button
              key={`${primaryKey}-${i}`}
              disabled={isResolved}
              onClick={() => {
                setSelected(i);
                onAnswer(questionKeys, i === correct);
              }}
              className={`min-h-12 w-full rounded-xl border p-3.5 text-left text-[13px] leading-relaxed transition-all ${
                isResolved
                  ? i === correct
                    ? 'border-emerald-500 bg-emerald-900/30 text-emerald-100'
                    : i === selected
                      ? 'border-red-500 bg-red-900/30 text-red-100'
                      : 'border-slate-800 bg-slate-950/60 text-slate-500'
                  : 'border-slate-200 bg-slate-50 text-slate-800 active:scale-[0.99] hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-900'
              }`}
            >
              {alt}
            </button>
          ))}
        </div>
      )}

      {isResolved && (
        <div
          className={`mt-5 rounded-xl border p-4 ${
            acertou ? 'border-emerald-700 bg-emerald-950/20' : 'border-red-700 bg-red-950/20'
          }`}
        >
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb size={14} />
            <span className="text-xs font-bold">{acertou ? 'Explicação' : 'Erro'}</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{explicacao}</p>
        </div>
      )}
    </article>
  );
}

export default function QuestoesList() {
  const { user, registrarAcerto, registrarErro, setUser } = useGameState();

  const [questoes, setQuestoes] = useState<any[]>([]);
  const [filtroMateria, setFiltroMateria] = useState<string | null>(null);
  const [statusFiltro, setStatusFiltro] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [ordemInicial, setOrdemInicial] = useState<Set<string> | null>(null);
  const [modalMateria, setModalMateria] = useState<string | null>(null);
  const questoesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || ordemInicial) return;
    setOrdemInicial(getProgressKeys(user));
  }, [user, ordemInicial]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadError('');
      const cached = readCachedQuestoes();

      if (cached?.length) {
        setQuestoes(cached);
        setIsLoading(false);
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const all: any[] = [];

        for (let from = 0; from < 20000; from += BATCH_SIZE) {
          const { data, error } = await supabase
            .from('questoes_oab')
            .select('*')
            .order('id', { ascending: true })
            .range(from, from + BATCH_SIZE - 1);

          if (error) throw error;
          if (cancelled) return;

          all.push(...(data || []));

          if (!cached?.length && from === 0) {
            setQuestoes(dedupeQuestoes(all));
            setIsLoading(false);
          }

          if (!data || data.length < BATCH_SIZE) break;
        }

        const unique = dedupeQuestoes(all);
        if (!cancelled) {
          setQuestoes(unique);
          writeCachedQuestoes(unique);
        }
      } catch (error: any) {
        if (!cancelled) setLoadError(error?.message || 'Não foi possível carregar as questões.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setVisibleLimit(PAGE_SIZE);
  }, [filtroMateria, statusFiltro, search]);

  const progressKeys = useMemo(() => getProgressKeys(user), [user]);

  const contagemPorMateria = useMemo(() => {
    const c: Record<string, number> = {};
    questoes.forEach((q) => {
      const m = getMateria(q);
      c[m] = (c[m] || 0) + 1;
    });
    return c;
  }, [questoes]);

  const categoriasVisiveis = useMemo(() => {
    const configuredSubjects = new Set(
      Object.values(CATEGORIES).flatMap((cat) => cat.subjects.map((subject) => subject.trim()))
    );
    const extraSubjects = Object.keys(contagemPorMateria)
      .filter((subject) => !configuredSubjects.has(subject))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    return [
      ...Object.entries(CATEGORIES),
      ...(extraSubjects.length
        ? [
            [
              'OUTRAS',
              {
                label: 'Outras matérias',
                color: 'bg-violet-600 hover:bg-violet-500 text-white',
                subjects: extraSubjects,
              },
            ] as const,
          ]
        : []),
    ];
  }, [contagemPorMateria]);

  const todasDoFiltro = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return questoes.filter((q) => {
      const materia = getMateria(q);
      if (filtroMateria && materia !== filtroMateria) return false;

      if (normalizedSearch) {
        const text = `${materia} ${q.tema || ''} ${q.enunciado || ''}`.toLowerCase();
        if (!text.includes(normalizedSearch)) return false;
      }

      return true;
    });
  }, [questoes, filtroMateria, search]);

  const exibidas = useMemo(() => {
    const answeredAtLoad = ordemInicial || new Set<string>();

    const filteredByStatus = todasDoFiltro.filter((q) => {
      const answeredNow = hasQuestionKey(q, progressKeys);
      if (statusFiltro === 'pending') return !answeredNow;
      if (statusFiltro === 'answered') return answeredNow;
      return true;
    });

    return [...filteredByStatus].sort((a, b) => {
      const aAnswered = hasQuestionKey(a, answeredAtLoad);
      const bAnswered = hasQuestionKey(b, answeredAtLoad);
      if (aAnswered !== bAnswered) return aAnswered ? 1 : -1;

      const av = getSortValue(a);
      const bv = getSortValue(b);
      return typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'pt-BR');
    });
  }, [todasDoFiltro, ordemInicial, progressKeys, statusFiltro]);

  const visibleQuestoes = exibidas.slice(0, visibleLimit);
  const respondidasAtuais = todasDoFiltro.filter((q) => hasQuestionKey(q, progressKeys)).length;
  const pendentes = Math.max(todasDoFiltro.length - respondidasAtuais, 0);
  const activeLabel = filtroMateria || 'Todas as questões';

  const selecionarMateria = (materia: string | null) => {
    setFiltroMateria(materia);
    setStatusFiltro('all');
    window.setTimeout(() => {
      questoesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const confirmarReset = (materia: string | null) => {
    const ids =
      materia === 'ALL'
        ? questoes.flatMap(getQuestionKeys)
        : questoes.filter((q) => getMateria(q) === materia).flatMap(getQuestionKeys);

    setUser((p: any) => ({
      ...p,
      questoesRespondidas: (p.questoesRespondidas || []).filter((id: number | string) => !ids.includes(String(id))),
      questoesErradas: (p.questoesErradas || []).filter((id: number | string) => !ids.includes(String(id))),
    }));
    setOrdemInicial((prev) => {
      const next = new Set(prev || []);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setModalMateria(null);
  };

  const handleAnswer = (ids: string[], acerto: boolean) => {
    if (acerto) registrarAcerto(ids);
    else registrarErro(ids);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 px-3 pb-28 pt-3 text-slate-950 dark:bg-slate-950 dark:text-slate-100 md:px-4 md:pb-8">
      <div className="sticky top-0 z-30 -mx-3 mb-3 border-b border-slate-200 bg-slate-50/95 px-3 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:static md:mx-auto md:max-w-3xl md:border-b-0 md:bg-transparent md:px-0">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:text-white"
            aria-label="Voltar para o dashboard"
          >
            <ArrowLeft size={16} />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">{activeLabel}</p>
            <p className="truncate text-sm font-semibold text-white">{formatCount(todasDoFiltro.length, 'questão', 'questões')}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="text-right text-[11px] leading-tight">
              <p className="font-bold text-emerald-300">{respondidasAtuais} feitas</p>
              <p className="text-slate-400">{pendentes} pendentes</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <section className="mx-auto mb-4 max-w-3xl rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/60 md:p-5">
        <div className="mb-3 grid grid-cols-[1fr_44px] gap-2">
          <button
            onClick={() => selecionarMateria(null)}
            className={`flex min-h-12 items-center justify-between rounded-xl border px-4 text-left text-sm font-bold transition-all ${
              filtroMateria === null
                ? 'border-indigo-400 bg-indigo-600 text-white'
                : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-700'
            }`}
          >
            <span>Todas as questões</span>
            <span className="inline-flex items-center gap-2 text-xs opacity-90">
              {questoes.length}
              <ArrowDown size={14} />
            </span>
          </button>

          <button
            onClick={() => setModalMateria('ALL')}
            className="flex h-12 w-11 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
            title="Limpar progresso de todas as questões"
            aria-label="Limpar progresso de todas as questões"
          >
            <Eraser size={16} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por tema ou enunciado"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-10 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Limpar busca"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1 text-xs font-bold dark:bg-slate-950">
          {[
            ['all', 'Todas'],
            ['pending', 'Pendentes'],
            ['answered', 'Feitas'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStatusFiltro(value as StatusFilter)}
              className={`min-h-9 rounded-lg transition-all ${
                statusFiltro === value ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:gap-2 md:overflow-visible">
          {categoriasVisiveis.flatMap(([key, cat]) =>
            cat.subjects.map((m) => {
              const count = contagemPorMateria[m] || 0;
              const isActive = filtroMateria === m;

              return (
                <div key={`${key}-${m}`} className="grid min-w-[210px] grid-cols-[1fr_40px] gap-2 md:min-w-0">
                  <button
                    onClick={() => selecionarMateria(m)}
                    disabled={count === 0}
                    className={`min-h-12 rounded-xl px-3 text-left text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-45 ${
                      isActive ? 'ring-2 ring-white/80 ' : ''
                    }${cat.color}`}
                  >
                    <span className="block truncate">{m}</span>
                    <span className="text-[10px] font-semibold opacity-80">{formatCount(count, 'questão', 'questões')}</span>
                  </button>

                  <button
                    onClick={() => setModalMateria(m)}
                    disabled={count === 0}
                    className="flex h-12 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:border-red-500/40 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-red-300"
                    title={`Limpar progresso de ${m}`}
                    aria-label={`Limpar progresso de ${m}`}
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section ref={questoesRef} className="mx-auto max-w-3xl scroll-mt-20 space-y-3 md:scroll-mt-4 md:space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
          <div>
            <p className="text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">{activeLabel}</p>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white md:text-xl">
              Mostrando {Math.min(visibleLimit, exibidas.length)} de {exibidas.length}
            </h1>
          </div>
          {isRefreshing && (
            <span className="inline-flex items-center gap-2 rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300">
              <Loader2 className="animate-spin" size={13} />
              Atualizando
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-8 text-slate-300">
            <Loader2 className="animate-spin" size={18} />
            Carregando questões...
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-100">{loadError}</div>
        ) : exibidas.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center text-sm text-slate-400">
            Nenhuma questão encontrada neste filtro.
          </div>
        ) : (
          <>
            {visibleQuestoes.map((q) => (
              <QuestaoCard key={getQuestionKey(q)} q={q} onAnswer={handleAnswer} />
            ))}

            {visibleLimit < exibidas.length && (
              <button
                onClick={() => setVisibleLimit((current) => current + PAGE_SIZE)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-4 text-sm font-bold text-white hover:bg-slate-800"
              >
                Mostrar mais {Math.min(PAGE_SIZE, exibidas.length - visibleLimit)}
              </button>
            )}
          </>
        )}
      </section>

      {modalMateria && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 md:items-center">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
            <h2 className="mb-2 text-lg font-bold text-white">Limpar progresso</h2>
            <p className="mb-5 text-sm text-slate-300">
              {modalMateria === 'ALL'
                ? 'Deseja limpar o progresso de todas as questões?'
                : `Deseja limpar o progresso de ${modalMateria}?`}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setModalMateria(null)}
                className="rounded-lg bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700"
              >
                Cancelar
              </button>

              <button
                onClick={() => confirmarReset(modalMateria)}
                className="rounded-lg bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-500"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
