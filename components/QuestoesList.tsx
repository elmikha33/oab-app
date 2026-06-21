'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useGameState } from '@/context/GameStateContext';

const PAGE_SIZE = 25;
const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
const FREE_DAILY_LIMIT = isDev ? Infinity : 25;
const LETRAS = ['A', 'B', 'C', 'D'];

type Questao = {
  id: number | string;
  materia?: string | null;
  tema?: string | null;
  enunciado: string;
  alternativas: string[];
  gabarito: number | string | null;
  comentario?: string | null;
};

function normalizarGabarito(valor: Questao['gabarito']) {
  if (typeof valor === 'number' && valor >= 0 && valor <= 3) return valor;

  const texto = String(valor ?? '').trim().toUpperCase();
  const letraIndex = LETRAS.indexOf(texto);
  if (letraIndex >= 0) return letraIndex;

  const numero = Number(texto);
  if (Number.isInteger(numero) && numero >= 0 && numero <= 3) return numero;

  return null;
}

function optionClass(index: number, selected: number | null, correct: number | null) {
  const answered = selected !== null;
  const isCorrect = answered && correct === index;
  const isWrongSelection = answered && selected === index && selected !== correct;

  if (isCorrect) {
    return 'border-emerald-400/70 bg-emerald-500/15 text-emerald-50 shadow-[0_16px_38px_rgba(16,185,129,.16)]';
  }

  if (isWrongSelection) {
    return 'border-rose-400/70 bg-rose-500/15 text-rose-50 shadow-[0_16px_38px_rgba(244,63,94,.14)]';
  }

  if (answered) {
    return 'border-white/10 bg-white/[0.03] text-slate-400 opacity-65';
  }

  return 'border-white/10 bg-white/[0.045] text-slate-100 hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-white/[0.075] hover:shadow-[0_14px_34px_rgba(34,211,238,.12)]';
}

function letterClass(index: number, selected: number | null, correct: number | null) {
  const answered = selected !== null;
  const isCorrect = answered && correct === index;
  const isWrongSelection = answered && selected === index && selected !== correct;

  if (isCorrect) return 'border-emerald-300/70 bg-emerald-300 text-emerald-950';
  if (isWrongSelection) return 'border-rose-300/70 bg-rose-300 text-rose-950';
  return 'border-white/10 bg-slate-950/70 text-slate-200';
}

function QuestaoCard({
  questao,
  index,
  total,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  nextPageHref,
}: {
  questao: Questao;
  index: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  nextPageHref: string | null;
}) {
  const {
    registrarAcerto,
    registrarErro,
    registrarRespostaFreeHoje,
  } = useGameState() || {};
  const [selected, setSelected] = useState<number | null>(null);

  const correct = normalizarGabarito(questao.gabarito);
  const answered = selected !== null;
  const acertou = answered && selected === correct;

  function responder(alternativaIndex: number) {
    if (answered) return;

    setSelected(alternativaIndex);
    registrarRespostaFreeHoje?.();

    if (correct !== null && alternativaIndex === correct) {
      registrarAcerto?.(questao.id);
    } else {
      registrarErro?.(questao.id);
    }
  }

  return (
    <article className="rounded-lg border border-white/10 bg-slate-900/72 p-4 shadow-[0_24px_80px_rgba(2,6,23,.38)] backdrop-blur md:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-normal text-slate-400">
        <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1">
          Questao {index + 1} de {total}
        </span>
        {questao.materia && (
          <span className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-cyan-100">
            {questao.materia}
          </span>
        )}
        {questao.tema && (
          <span className="rounded-md border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-amber-100">
            {questao.tema}
          </span>
        )}
      </div>

      <h2 className="mb-5 text-base font-semibold leading-relaxed text-white md:text-lg">
        {questao.enunciado}
      </h2>

      <div className="space-y-3">
        {questao.alternativas.map((alt, alternativaIndex) => {
          const isCorrect = answered && correct === alternativaIndex;
          const isWrongSelection =
            answered && selected === alternativaIndex && selected !== correct;

          return (
            <button
              key={`${questao.id}-${alternativaIndex}`}
              type="button"
              onClick={() => responder(alternativaIndex)}
              disabled={answered}
              className={`grid w-full grid-cols-[2.5rem_1fr_1.5rem] items-center gap-3 rounded-lg border px-3 py-3 text-left transition duration-200 md:px-4 ${optionClass(
                alternativaIndex,
                selected,
                correct
              )}`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm font-black transition ${letterClass(
                  alternativaIndex,
                  selected,
                  correct
                )}`}
              >
                {LETRAS[alternativaIndex]}
              </span>
              <span className="min-w-0 text-sm leading-relaxed md:text-[15px]">
                {alt}
              </span>
              <span className="flex justify-end">
                {isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-200" />}
                {isWrongSelection && <XCircle className="h-5 w-5 text-rose-200" />}
              </span>
            </button>
          );
        })}
      </div>

      {answered && (
        <section
          className={`mt-5 animate-scale-in rounded-lg border p-4 ${
            acertou
              ? 'border-emerald-300/35 bg-emerald-400/10'
              : 'border-rose-300/35 bg-rose-400/10'
          }`}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-bold text-white">
              {acertou ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-300" />
              )}
              <span>{acertou ? 'Correta' : 'Resposta incorreta'}</span>
            </div>

            <span
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-black ${
                acertou
                  ? 'bg-emerald-300 text-emerald-950'
                  : 'bg-rose-300 text-rose-950'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {acertou ? '+10 XP' : 'Revisar'}
            </span>
          </div>

          {!acertou && correct !== null && (
            <p className="mb-3 text-sm font-semibold text-rose-50">
              Resposta correta: {LETRAS[correct]}
            </p>
          )}

          {questao.comentario && (
            <div className="rounded-lg border border-white/10 bg-slate-950/55 p-3">
              <p className="mb-1 text-xs font-black uppercase tracking-normal text-slate-400">
                Comentario
              </p>
              <p className="text-sm leading-relaxed text-slate-100">
                {questao.comentario}
              </p>
            </div>
          )}
        </section>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-bold text-slate-200 transition hover:bg-white/[0.08] disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        {answered && hasNext && (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-amber-300 px-4 text-sm font-black text-slate-950 shadow-[0_14px_30px_rgba(251,191,36,.16)] transition hover:-translate-y-0.5 hover:bg-amber-200"
          >
            Proxima
            <ArrowRight className="h-4 w-4" />
          </button>
        )}

        {answered && !hasNext && nextPageHref && (
          <Link
            href={nextPageHref}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-amber-300 px-4 text-sm font-black text-slate-950 shadow-[0_14px_30px_rgba(251,191,36,.16)] transition hover:-translate-y-0.5 hover:bg-amber-200"
          >
            Proxima pagina
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}

        {answered && !hasNext && !nextPageHref && (
          <span className="rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-sm font-bold text-emerald-100">
            Rodada concluida
          </span>
        )}
      </div>
    </article>
  );
}

export default function QuestoesList() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page') ?? 0);

  const [data, setData] = useState<Questao[] | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let cancel = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`/api/questoes?page=${page}&limit=${FREE_DAILY_LIMIT}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || 'Falha ao buscar questoes');
        }

        if (!Array.isArray(json)) {
          throw new Error('Resposta invalida ao buscar questoes');
        }

        if (!cancel) {
          setData(json);
          setCurrentIndex(0);
        }
      } catch (err: any) {
        if (!cancel) setError(err.message ?? 'Erro');
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    load();
    return () => {
      cancel = true;
    };
  }, [page]);

  if (loading || !data) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center p-4 text-slate-300">
        <p className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando questoes...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <div className="rounded-lg border border-rose-300/30 bg-rose-400/10 p-4 text-rose-100">
          {error}{' '}
          <Link href={`/play?page=${page}`} className="font-bold underline">
            Tentar novamente
          </Link>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <div className="rounded-lg border border-white/10 bg-slate-900/70 p-4 text-slate-300">
          Nenhuma questao disponivel.
        </div>
      </div>
    );
  }

  const questaoAtual = data[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < data.length - 1;
  const nextPageHref = data.length === PAGE_SIZE ? `/play?page=${page + 1}` : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:py-8">
      <QuestaoCard
        key={questaoAtual.id}
        questao={questaoAtual}
        index={currentIndex}
        total={data.length}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        nextPageHref={nextPageHref}
        onPrevious={() => setCurrentIndex((current) => Math.max(0, current - 1))}
        onNext={() => setCurrentIndex((current) => Math.min(data.length - 1, current + 1))}
      />
    </div>
  );
}
