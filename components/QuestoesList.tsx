'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  RotateCcw,
  Shuffle,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useGameState } from '@/context/GameStateContext';
import useSoundEffects from '@/hooks/useSoundEffects';
import { supabase } from '@/lib/supabase';

const LIMIT_QUESTOES = 10000;
const FREE_DAILY_LIMIT = 5;
const LETRAS = ['A', 'B', 'C', 'D'];
const TODAS_AS_MATERIAS = '__TODAS_AS_MATERIAS__';
const TODOS_OS_EXAMES = '__TODOS_OS_EXAMES__';

type AbaQuestoes = 'todas' | 'naoRespondidas' | 'feitas';
type RespostasState = Record<string, number>;

type Questao = {
  id: number | string;
  materia?: string | null;
  tema?: string | null;
  enunciado: string;
  alternativas: string[];
  gabarito: number | string | null;
  comentario?: string | null;
  explicacao?: string | null;
  comentario_ia?: string | null;
  comentarioIA?: string | null;
  explanation?: string | null;
  origem?: string | null;
  fonte?: string | null;
  arquivo?: string | null;
  prova?: string | number | null;
  exame?: string | number | null;
  edicao?: string | number | null;
  edicao_exame?: string | number | null;
  numero_exame?: string | number | null;
  numero_prova?: string | number | null;
};



type MateriaResumo = {
  materia: string;
  total: number;
  feitas: number;
  naoRespondidas: number;
  firstId: number | string;
  peso: number;
  prioridade: number;
  temas: Array<{
    tema: string;
    total: number;
    feitas: number;
    naoRespondidas: number;
    firstId: number | string;
  }>;
};

type ExameResumo = {
  key: string;
  label: string;
  numero: number;
  total: number;
};

const PRIORIDADES = [
  { peso: 8, prioridade: 1, nomes: ['etica', 'estatuto da oab', 'codigo de etica'] },
  { peso: 6, prioridade: 2, nomes: ['direito civil'] },
  { peso: 6, prioridade: 3, nomes: ['direito processual civil', 'processo civil'] },
  { peso: 6, prioridade: 4, nomes: ['direito constitucional'] },
  { peso: 6, prioridade: 5, nomes: ['direito penal'] },
  { peso: 6, prioridade: 6, nomes: ['direito processual penal', 'processo penal'] },
  { peso: 5, prioridade: 7, nomes: ['direito administrativo'] },
  { peso: 5, prioridade: 8, nomes: ['direito do trabalho'] },
  { peso: 5, prioridade: 9, nomes: ['direito processual do trabalho', 'processo do trabalho'] },
  { peso: 5, prioridade: 10, nomes: ['direito tributario'] },
  { peso: 4, prioridade: 11, nomes: ['direito empresarial'] },
  { peso: 2, prioridade: 12, nomes: ['direitos humanos'] },
  { peso: 2, prioridade: 13, nomes: ['filosofia do direito'] },
  { peso: 2, prioridade: 14, nomes: ['direito internacional'] },
  { peso: 2, prioridade: 15, nomes: ['direito financeiro'] },
  { peso: 2, prioridade: 16, nomes: ['direito eleitoral'] },
  { peso: 2, prioridade: 17, nomes: ['direito ambiental'] },
  { peso: 2, prioridade: 18, nomes: ['direito do consumidor'] },
  { peso: 2, prioridade: 19, nomes: ['eca', 'crianca e adolescente'] },
  { peso: 2, prioridade: 20, nomes: ['direito previdenciario'] },
];

function normalizarTexto(valor: string) {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function getMateriaNome(questao: Questao) {
  return String(questao.materia || 'Sem matéria').trim();
}

function getTemaNome(questao: Questao) {
  return String(questao.tema || 'Sem tema').trim();
}

function getKey(questao: Questao) {
  return String(questao.id);
}

function getConfigMateria(materia: string) {
  const texto = normalizarTexto(materia);

  return (
    PRIORIDADES.find((item) => item.nomes.some((nome) => texto.includes(nome))) ?? {
      peso: 0,
      prioridade: 999,
      nomes: [],
    }
  );
}

function isEtica(materia: string) {
  return getConfigMateria(materia).prioridade === 1;
}

function numeroParaRomano(valor: number) {
  const partes: Array<[number, string]> = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];

  let numero = Math.floor(valor);
  let romano = '';

  for (const [decimal, letra] of partes) {
    while (numero >= decimal) {
      romano += letra;
      numero -= decimal;
    }
  }

  return romano;
}

function extrairNumeroExame(questao: Questao) {
  const campos = [
    questao.edicao_exame,
    questao.numero_exame,
    questao.numero_prova,
    questao.exame,
    questao.edicao,
    questao.prova,
    questao.origem,
    questao.fonte,
    questao.arquivo,
  ];

  for (const campo of campos) {
    const texto = String(campo ?? '').trim();
    if (!texto) continue;

    if (/^\d{1,3}$/.test(texto)) {
      const numero = Number(texto);
      if (numero > 0) return numero;
    }

    const match =
      texto.match(/(?:prova|oab|exame|edicao|edição|gabarito)[_\-\s]*(\d{1,3})/i) ||
      texto.match(/(?:prova|oab|exame|edicao|edição|gabarito).*?(\d{1,3})/i) ||
      texto.match(/\b(\d{2,3})\b/);

    if (match?.[1]) {
      const numero = Number(match[1]);
      if (Number.isFinite(numero) && numero > 0) return numero;
    }
  }

  return null;
}

function getExameInfo(questao: Questao) {
  const numero = extrairNumeroExame(questao);

  if (!numero) {
    return { key: 'sem-exame', label: 'Exame não identificado', numero: 0 };
  }

  return { key: String(numero), label: `Exame (${numero}) ${numeroParaRomano(numero)}`, numero };
}

function ordenarQuestoes(questoes: Questao[]) {
  return [...questoes].sort((a, b) => {
    const exameA = getExameInfo(a).numero;
    const exameB = getExameInfo(b).numero;
    if (exameA !== exameB) return exameB - exameA;

    const configA = getConfigMateria(getMateriaNome(a));
    const configB = getConfigMateria(getMateriaNome(b));
    if (configA.prioridade !== configB.prioridade) return configA.prioridade - configB.prioridade;

    const temaCompare = getTemaNome(a).localeCompare(getTemaNome(b));
    if (temaCompare !== 0) return temaCompare;

    return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
  });
}

function normalizarGabarito(valor: Questao['gabarito']) {
  if (typeof valor === 'number' && valor >= 0 && valor <= 3) return valor;

  const texto = String(valor ?? '').trim().toUpperCase();
  const letraMatch = texto.match(/[A-D]/);
  if (letraMatch?.[0]) {
    const letraIndex = LETRAS.indexOf(letraMatch[0]);
    if (letraIndex >= 0) return letraIndex;
  }

  const numeroMatch = texto.match(/\d+/);
  const numero = numeroMatch ? Number(numeroMatch[0]) : Number(texto);
  if (Number.isInteger(numero) && numero >= 0 && numero <= 3) return numero;
  if (Number.isInteger(numero) && numero >= 1 && numero <= 4) return numero - 1;

  return null;
}

function getComentarioQuestao(questao: Questao) {
  const possiveisComentarios = [
    questao.comentario,
    questao.explicacao,
    questao.comentario_ia,
    questao.comentarioIA,
    questao.explanation,
  ];

  const comentario = possiveisComentarios.find((valor) => String(valor ?? '').trim().length > 0);
  return String(comentario ?? '').trim();
}

function scrollToQuestoes() {
  window.setTimeout(() => {
    document.getElementById('questoes-em-jogo')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, 120);
}

function scrollToResumo() {
  window.setTimeout(() => {
    document.getElementById('resumo-rodada')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, 80);
}

function optionClass(index: number, selected: number | null, correct: number | null) {
  const answered = selected !== null;

  if (answered && correct === index) {
    return 'border-emerald-600 bg-emerald-50 text-emerald-950 dark:border-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-50';
  }

  if (answered && selected === index && selected !== correct) {
    return 'border-rose-600 bg-rose-50 text-rose-950 dark:border-rose-400 dark:bg-rose-500/20 dark:text-rose-50';
  }

  if (answered) {
    return 'border-slate-300 bg-slate-100 text-slate-600 opacity-75 dark:border-white/10 dark:bg-slate-800 dark:text-slate-400';
  }

  return 'border-slate-300 bg-white text-slate-900 hover:border-cyan-600 hover:bg-cyan-50 dark:border-white/15 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700';
}

function letterClass(index: number, selected: number | null, correct: number | null) {
  const answered = selected !== null;

  if (answered && correct === index) return 'border-emerald-600 bg-emerald-500 text-white dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950';
  if (answered && selected === index && selected !== correct) return 'border-rose-600 bg-rose-500 text-white dark:border-rose-300 dark:bg-rose-300 dark:text-rose-950';

  return 'border-slate-300 bg-slate-100 text-slate-900 dark:border-white/15 dark:bg-slate-950 dark:text-slate-100';
}

function tabClass(active: boolean) {
  if (active) {
    return 'border-emerald-700 bg-emerald-600 text-white dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950';
  }

  return 'border-slate-300 bg-white text-slate-900 hover:border-emerald-500 hover:bg-emerald-50 dark:border-white/15 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700';
}

function QuestaoCard({
  questao,
  index,
  total,
  selected,
  reviewSuccessPending,
  onResponder,
  onConfirmarAcertoRevisao,
}: {
  questao: Questao;
  index: number;
  total: number;
  selected: number | null;
  reviewSuccessPending?: boolean;
  onResponder: (questao: Questao, alternativaIndex: number) => void;
  onConfirmarAcertoRevisao?: (questao: Questao) => void;
}) {
  const correct = normalizarGabarito(questao.gabarito);
  const answered = selected !== null;
  const acertou = answered && selected === correct;
  const exame = getExameInfo(questao);
  const comentario = getComentarioQuestao(questao);

  return (
    <article
      id={`questao-${questao.id}`}
      className="scroll-mt-24 rounded-2xl border border-slate-300 bg-white p-3 shadow-sm dark:border-white/15 dark:bg-slate-900 md:p-6"
    >
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-black uppercase">
        <span className="rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1 text-slate-700 dark:border-white/15 dark:bg-slate-800 dark:text-slate-200">
          Questão {index + 1} de {total}
        </span>

        <span
          className={
            isEtica(getMateriaNome(questao))
              ? 'rounded-md border border-emerald-500 bg-emerald-100 px-2.5 py-1 text-emerald-950 dark:border-amber-300/45 dark:bg-amber-300/15 dark:text-amber-100'
              : 'rounded-md border border-cyan-500 bg-cyan-50 px-2.5 py-1 text-cyan-950 dark:border-cyan-300/35 dark:bg-cyan-300/10 dark:text-cyan-100'
          }
        >
          {getMateriaNome(questao)}
        </span>

        <span className="rounded-md border border-violet-500 bg-violet-50 px-2.5 py-1 text-violet-950 dark:border-violet-300/35 dark:bg-violet-300/10 dark:text-violet-100">
          {exame.label}
        </span>

        <span className="rounded-md border border-emerald-500 bg-emerald-50 px-2.5 py-1 text-emerald-950 dark:border-emerald-300/35 dark:bg-emerald-300/10 dark:text-emerald-100">
          {getTemaNome(questao)}
        </span>
      </div>

      <h2 className="mb-5 whitespace-pre-line text-left text-[15px] font-semibold leading-7 tracking-normal text-slate-950 dark:text-white md:mb-6 md:text-justify md:text-lg md:leading-9 md:tracking-wide">
        {questao.enunciado}
      </h2>

      <div className="space-y-2 md:space-y-3">
        {questao.alternativas.map((alt, alternativaIndex) => {
          const isCorrect = answered && correct === alternativaIndex;
          const isWrongSelection = answered && selected === alternativaIndex && selected !== correct;

          return (
            <button
              key={`${questao.id}-${alternativaIndex}`}
              type="button"
              onClick={() => onResponder(questao, alternativaIndex)}
              disabled={answered}
              className={`grid w-full grid-cols-[2.25rem_1fr_1.25rem] items-start gap-2.5 rounded-xl border px-3 py-3 text-left transition md:grid-cols-[2.5rem_1fr_1.5rem] md:gap-4 md:px-5 md:py-5 ${optionClass(
                alternativaIndex,
                selected,
                correct
              )}`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-black md:h-10 md:w-10 ${letterClass(alternativaIndex, selected, correct)}`}>
                {LETRAS[alternativaIndex]}
              </span>

              <span className="min-w-0 whitespace-pre-line text-left text-sm leading-6 tracking-normal md:text-justify md:text-base md:leading-8 md:tracking-wide">{alt}</span>

              <span className="flex justify-end">
                {isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />}
                {isWrongSelection && <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-300" />}
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-black text-slate-950 dark:text-white">
              {acertou ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-700 dark:text-rose-300" />
              )}
              <span>{acertou ? 'Correta' : 'Resposta incorreta'}</span>
            </div>

            <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-black ${acertou ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              <Sparkles className="h-3.5 w-3.5" />
              {acertou ? 'Acertou' : 'Revisar'}
            </span>
          </div>

          {correct !== null ? (
            <p className={`mb-3 text-sm font-black ${acertou ? 'text-emerald-800 dark:text-emerald-100' : 'text-rose-800 dark:text-rose-100'}`}>
              Resposta correta: {LETRAS[correct]}
            </p>
          ) : (
            <p className="mb-3 text-sm font-black text-amber-800 dark:text-amber-100">
              Gabarito não identificado para esta questão.
            </p>
          )}

          <div className="rounded-lg border border-slate-300 bg-white p-3 dark:border-white/15 dark:bg-slate-950">
            <p className="mb-1 text-xs font-black uppercase text-slate-600 dark:text-slate-400">
              Comentário
            </p>
            <p className="whitespace-pre-line text-left text-sm leading-6 tracking-normal text-slate-800 dark:text-slate-100 md:text-justify md:text-[15px] md:leading-8 md:tracking-wide">
              {comentario || 'Comentário ainda não cadastrado para esta questão.'}
            </p>
          </div>

          {reviewSuccessPending && (
            <div className="mt-4 rounded-xl border border-emerald-300 bg-white p-3 dark:border-emerald-300/30 dark:bg-slate-950">
              <p className="text-sm font-bold leading-relaxed text-emerald-900 dark:text-emerald-100">
                Você acertou esta questão de revisão. Ela só será removida da revisão quando você continuar.
              </p>

              <button
                type="button"
                onClick={() => onConfirmarAcertoRevisao?.(questao)}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-emerald-700 bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950 dark:hover:bg-emerald-200 md:w-auto"
              >
                Continuar e remover da revisão
              </button>
            </div>
          )}
        </section>
      )}
    </article>
  );
}

function Summary({
  todasQuestoes,
  questoesDoExame,
  respostas,
  aba,
  activeMateria,
  activeExame,
  activeTema,
  exames,
  onChangeAba,
  onSelectMateria,
  onSelectTema,
  onSelectExame,
  onResetMateria,
  onResetTodas,
  onShuffle,
}: {
  todasQuestoes: Questao[];
  questoesDoExame: Questao[];
  respostas: RespostasState;
  aba: AbaQuestoes;
  activeMateria: string;
  activeExame: string;
  activeTema: string | null;
  exames: ExameResumo[];
  onChangeAba: (aba: AbaQuestoes) => void;
  onSelectMateria: (materia: string) => void;
  onSelectTema: (materia: string, tema: string) => void;
  onSelectExame: (exame: string) => void;
  onResetMateria: (materia: string) => void;
  onResetTodas: () => void;
  onShuffle: () => void;
}) {
  const [openMaterias, setOpenMaterias] = useState<Record<string, boolean>>({});

  const questoesDoModoAtual = useMemo(() => {
    const base =
      activeMateria === TODAS_AS_MATERIAS
        ? questoesDoExame
        : questoesDoExame.filter((questao) => getMateriaNome(questao) === activeMateria);

    if (!activeTema) return base;

    return base.filter((questao) => getTemaNome(questao) === activeTema);
  }, [questoesDoExame, activeMateria, activeTema]);

  const totalFeitas = questoesDoModoAtual.filter((questao) => respostas[getKey(questao)] !== undefined).length;
  const totalNaoRespondidas = questoesDoModoAtual.length - totalFeitas;

  const materias = useMemo<MateriaResumo[]>(() => {
    const map = new Map<
      string,
      {
        total: number;
        feitas: number;
        naoRespondidas: number;
        firstId: number | string;
        temas: Map<string, { total: number; feitas: number; naoRespondidas: number; firstId: number | string }>;
      }
    >();

    for (const questao of questoesDoExame) {
      const materia = getMateriaNome(questao);
      const tema = getTemaNome(questao);
      const respondida = respostas[getKey(questao)] !== undefined;

      if (!map.has(materia)) {
        map.set(materia, { total: 0, feitas: 0, naoRespondidas: 0, firstId: questao.id, temas: new Map() });
      }

      const materiaInfo = map.get(materia)!;
      materiaInfo.total += 1;
      if (respondida) materiaInfo.feitas += 1;
      else materiaInfo.naoRespondidas += 1;

      if (!materiaInfo.temas.has(tema)) {
        materiaInfo.temas.set(tema, { total: 0, feitas: 0, naoRespondidas: 0, firstId: questao.id });
      }

      const temaInfo = materiaInfo.temas.get(tema)!;
      temaInfo.total += 1;
      if (respondida) temaInfo.feitas += 1;
      else temaInfo.naoRespondidas += 1;
    }

    return Array.from(map.entries())
      .map(([materia, info]) => {
        const config = getConfigMateria(materia);

        return {
          materia,
          total: info.total,
          feitas: info.feitas,
          naoRespondidas: info.naoRespondidas,
          firstId: info.firstId,
          peso: config.peso,
          prioridade: config.prioridade,
          temas: Array.from(info.temas.entries())
            .map(([tema, temaInfo]) => ({
              tema,
              total: temaInfo.total,
              feitas: temaInfo.feitas,
              naoRespondidas: temaInfo.naoRespondidas,
              firstId: temaInfo.firstId,
            }))
            .sort((a, b) => b.total - a.total || a.tema.localeCompare(b.tema)),
        };
      })
      .sort((a, b) => {
        if (a.prioridade !== b.prioridade) return a.prioridade - b.prioridade;
        return b.total - a.total || a.materia.localeCompare(b.materia);
      });
  }, [questoesDoExame, respostas]);

  return (
    <section id="resumo-rodada" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-sm dark:border-white/10 dark:bg-slate-900/95 md:p-4">
      <div className="mb-2.5 flex flex-col gap-2.5 md:mb-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black leading-tight text-slate-950 dark:text-white md:text-2xl">
            {activeMateria === TODAS_AS_MATERIAS
              ? 'Todas as matérias'
              : activeTema
                ? `${activeMateria} · ${activeTema}`
                : activeMateria}
          </h1>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-300 md:text-sm">
            Escolha uma matéria ou estude tudo misturado.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <button
            type="button"
            onClick={onShuffle}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-black text-emerald-800 shadow-sm transition hover:border-emerald-500 hover:bg-emerald-50 dark:border-emerald-300/25 dark:bg-slate-800 dark:text-emerald-200 dark:hover:bg-emerald-300/10 md:min-h-10 md:px-3.5 md:text-sm"
          >
            <Shuffle className="h-4 w-4" strokeWidth={3} />
            Embaralhar
          </button>
        </div>
      </div>

      <div className="mb-2.5 rounded-2xl border border-emerald-200 bg-slate-50/80 p-2 dark:border-emerald-300/20 dark:bg-slate-800/70 md:mb-3 md:p-2.5">
        <div className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-100 md:text-[11px] md:tracking-[0.16em]">
          <FileText className="h-4 w-4" strokeWidth={3} />
          Edicao do exame
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => onSelectExame(TODOS_OS_EXAMES)}
            className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-black transition ${
              activeExame === TODOS_OS_EXAMES
                ? 'border-emerald-700 bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950'
                : 'border-emerald-300 bg-white text-emerald-950 hover:bg-emerald-100 dark:border-emerald-300/25 dark:bg-slate-900 dark:text-emerald-100 dark:hover:bg-emerald-300/10'
            }`}
          >
            Todos os exames
          </button>

          {exames.map((exame) => (
            <button
              key={exame.key}
              type="button"
              onClick={() => onSelectExame(exame.key)}
              className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-black transition ${
                activeExame === exame.key
                  ? 'border-emerald-700 bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950'
                  : 'border-emerald-300 bg-white text-emerald-950 hover:bg-emerald-100 dark:border-emerald-300/25 dark:bg-slate-900 dark:text-emerald-100 dark:hover:bg-emerald-300/10'
              }`}
            >
              {exame.label} · {exame.total} questões
            </button>
          ))}
        </div>
      </div>

      <div className="mb-2.5 grid grid-cols-2 gap-2 md:mb-3 lg:grid-cols-4">
        <button type="button" onClick={() => onChangeAba('todas')} className={`rounded-xl border px-2 py-2 text-xs font-black transition md:px-4 md:py-2.5 md:text-sm ${tabClass(aba === 'todas')}`}>
          Todas · {questoesDoModoAtual.length}
        </button>
        <button type="button" onClick={() => onChangeAba('naoRespondidas')} className={`rounded-xl border px-2 py-2 text-xs font-black transition md:px-4 md:py-2.5 md:text-sm ${tabClass(aba === 'naoRespondidas')}`}>
          Não respondidas · {totalNaoRespondidas}
        </button>
        <button type="button" onClick={() => onChangeAba('feitas')} className={`rounded-xl border px-2 py-2 text-xs font-black transition md:px-4 md:py-2.5 md:text-sm ${tabClass(aba === 'feitas')}`}>
          Feitas · {totalFeitas}
        </button>
        <button
          type="button"
          onClick={onResetTodas}
          className="col-span-2 inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-black text-rose-700 shadow-sm transition hover:border-rose-500 hover:bg-rose-50 dark:border-rose-300/40 dark:bg-slate-900 dark:text-rose-200 dark:hover:bg-rose-400/10 lg:col-span-1 md:min-h-10 md:px-4 md:py-2.5 md:text-sm"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={3} />
          Resetar {todasQuestoes.length} questões
        </button>
      </div>

      <div className="mb-2.5 rounded-2xl border border-emerald-300 bg-white p-2.5 text-emerald-950 dark:border-emerald-300/25 dark:bg-slate-800/80 dark:text-emerald-100 md:mb-3 md:p-3">
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-100 md:h-9 md:w-9">
            <AlertTriangle className="h-5 w-5" strokeWidth={3} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.13em] md:text-xs md:tracking-[0.15em]">
              Ordem sugerida na OAB
            </p>
            <p className="mt-0.5 text-xs font-semibold leading-relaxed text-emerald-900 dark:text-emerald-100 md:text-sm">
              Ética primeiro, depois as matérias de maior peso.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <div
          className={
            activeMateria === TODAS_AS_MATERIAS
              ? 'rounded-xl border-2 border-emerald-500 bg-white p-2.5 dark:border-emerald-300/50 dark:bg-slate-800 md:p-3'
              : 'rounded-xl border border-emerald-200 bg-white p-2.5 dark:border-emerald-300/20 dark:bg-slate-800/80 md:p-3'
          }
        >
          <button
            type="button"
            onClick={() => onSelectMateria(TODAS_AS_MATERIAS)}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-white px-3 py-2.5 text-left text-sm font-black text-emerald-950 transition hover:bg-emerald-100 dark:border-emerald-300/25 dark:bg-slate-900 dark:text-emerald-100 dark:hover:bg-emerald-300/10"
          >
            <span className="min-w-0">
              Todas as matérias · {questoesDoExame.length}
            </span>

            <span className="ml-auto rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-900 dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-100">
              modo todas
            </span>
          </button>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-100 dark:bg-slate-950">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all dark:bg-emerald-300"
              style={{
                width: `${questoesDoExame.length > 0 ? Math.round((questoesDoModoAtual.filter((questao) => respostas[getKey(questao)] !== undefined).length / questoesDoExame.length) * 100) : 0}%`,
              }}
            />
          </div>

          <p className="mt-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-100">
            Estude todas as matérias misturadas, simulando melhor o ritmo da prova.
          </p>
        </div>

        {materias.map((item) => {
          const isOpen = Boolean(openMaterias[item.materia]);
          const isActive = activeMateria === item.materia;
          const progresso = item.total > 0 ? Math.round((item.feitas / item.total) * 100) : 0;

          return (
            <div
              key={item.materia}
              className={
                isActive
                  ? 'rounded-xl border-2 border-emerald-500 bg-white p-2.5 dark:border-emerald-300/50 dark:bg-slate-800 md:p-3'
                  : 'rounded-xl border border-slate-200 bg-white p-2.5 dark:border-white/10 dark:bg-slate-800/80 md:p-3'
              }
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectMateria(item.materia)}
                  className="flex min-h-10 min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-black text-slate-950 hover:bg-emerald-50 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-700"
                >
                  <span className="min-w-0">
                    {isEtica(item.materia) ? '⚡ ' : item.peso >= 6 ? '🔥 ' : ''}
                    {item.materia} · {item.total}
                  </span>

                  <span className="ml-auto hidden rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-900 md:inline-flex dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">
                    Peso {item.peso || '-'}
                  </span>
                </button>

                <div className="flex shrink-0 gap-1.5 md:gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMaterias((current) => ({ ...current, [item.materia]: !current[item.materia] }))
                    }
                    aria-expanded={isOpen}
                    aria-label={isOpen ? 'Recolher temas' : 'Expandir temas'}
                    title={isOpen ? 'Recolher temas' : 'Expandir temas'}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-700"
                  >
                    <ChevronDown className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`} strokeWidth={3} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onResetMateria(item.materia)}
                    aria-label={`Resetar ${item.materia}`}
                    title={`Resetar ${item.materia}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-rose-300/45 dark:hover:bg-rose-400/10 dark:hover:text-rose-200"
                  >
                    <RotateCcw className="h-4 w-4" strokeWidth={3} />
                  </button>
                </div>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-300 dark:bg-slate-950">
                <div className="h-full rounded-full bg-emerald-600 dark:bg-emerald-300" style={{ width: `${progresso}%` }} />
              </div>

              <p className="mt-1.5 text-[11px] font-black text-slate-700 dark:text-slate-300">
                Feitas: {item.feitas} · Não respondidas: {item.naoRespondidas}
              </p>

              {isOpen && (
                <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-slate-300 bg-white p-3 dark:border-white/15 dark:bg-slate-950">
                  {item.temas.map((tema) => (
                    <button
                      key={`${item.materia}-${tema.tema}`}
                      type="button"
                      onClick={() => onSelectTema(item.materia, tema.tema)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-black transition hover:bg-amber-50 dark:border-white/15 dark:hover:bg-slate-700 ${
                        activeTema === tema.tema && activeMateria === item.materia
                          ? 'border-emerald-700 bg-emerald-600 text-white dark:bg-emerald-300 dark:text-emerald-950'
                          : 'border-slate-300 bg-white text-slate-900 dark:bg-slate-800 dark:text-white'
                      }`}
                    >
                      {tema.tema} · {tema.total}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}


function lerUserGameDataLocal() {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem('user-game-data');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function questaoEstaEmRevisaoLocal(idQuestao: number | string) {
  const current = lerUserGameDataLocal();
  const id = String(idQuestao);

  const revisaoIds = Array.isArray(current.revisaoIds)
    ? current.revisaoIds.map(String)
    : [];

  const questoesErradas = Array.isArray(current.questoesErradas)
    ? current.questoesErradas.map(String)
    : [];

  return revisaoIds.includes(id) || questoesErradas.includes(id);
}

function removerQuestaoDaRevisaoLocal(idQuestao: number | string) {
  const current = lerUserGameDataLocal();
  const id = String(idQuestao);

  const revisaoIds = Array.isArray(current.revisaoIds)
    ? current.revisaoIds.map(String).filter((item: string) => item !== id)
    : [];

  const questoesErradas = Array.isArray(current.questoesErradas)
    ? current.questoesErradas.map(String).filter((item: string) => item !== id)
    : [];

  localStorage.setItem(
    'user-game-data',
    JSON.stringify({
      ...current,
      revisaoIds,
      questoesErradas,
    })
  );

  window.dispatchEvent(new Event('oaplay-revisao-atualizada'));
  window.dispatchEvent(new StorageEvent('storage', { key: 'user-game-data' }));
}


function resetarAcertosDoDashboard() {
  const keys = ['user-game-data', 'oaplay:user', 'oaplay-user'];

  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);

      const next = {
        ...parsed,
        acertos: 0,
      };

      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignora chaves que não forem JSON
    }
  }

  window.dispatchEvent(new Event('oaplay-reset-acertos'));
  window.dispatchEvent(new StorageEvent('storage', { key: 'user-game-data' }));
}


function hashStringForShuffle(valor: string) {
  let hash = 0;

  for (let index = 0; index < valor.length; index += 1) {
    hash = (hash * 31 + valor.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function ordenarEmbaralhado(questoes: Questao[], seed: number) {
  if (!seed) return questoes;

  return [...questoes].sort((a, b) => {
    const hashA = hashStringForShuffle(`${seed}-${getKey(a)}`);
    const hashB = hashStringForShuffle(`${seed}-${getKey(b)}`);
    return hashA - hashB;
  });
}

function lerRespondidasSalvasParaOrdenacao(): Record<string, true> {
  const current = lerUserGameDataLocal();
  const ids = new Set<string>();

  if (Array.isArray(current.questoesRespondidas)) {
    current.questoesRespondidas.forEach((id: number | string) => ids.add(String(id)));
  }

  if (current.respostasQuestoes && typeof current.respostasQuestoes === 'object') {
    Object.keys(current.respostasQuestoes).forEach((id) => ids.add(String(id)));
  }

  return Array.from(ids).reduce<Record<string, true>>((acc, id) => {
    acc[id] = true;
    return acc;
  }, {});
}

function moverRespondidasSalvasParaFinal(
  questoes: Questao[],
  respondidasSalvas: Record<string, true>
) {
  if (!Object.keys(respondidasSalvas).length) return questoes;

  return [...questoes].sort((a, b) => {
    const aRespondida = Boolean(respondidasSalvas[getKey(a)]);
    const bRespondida = Boolean(respondidasSalvas[getKey(b)]);

    if (aRespondida === bRespondida) return 0;
    return aRespondida ? 1 : -1;
  });
}

export default function QuestoesList() {
  const [data, setData] = useState<Questao[] | null>(null);
  const [error, setError] = useState('');
  const [respostas, setRespostas] = useState<RespostasState>({});
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState<AbaQuestoes>('naoRespondidas');
  const [activeMateria, setActiveMateria] = useState<string>('');
  const [activeTema, setActiveTema] = useState<string | null>(null);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [activeExame, setActiveExame] = useState<string>(TODOS_OS_EXAMES);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [reviewSuccessPending, setReviewSuccessPending] = useState<Record<string, boolean>>({});
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [showFreeLimitModal, setShowFreeLimitModal] = useState(false);
  const [respondidasSalvasAoCarregar, setRespondidasSalvasAoCarregar] = useState<Record<string, true>>({});

  const { user, registrarAcerto, registrarErro, registrarRespostaFreeHoje, registrarQuestaoRevisada, resetarAcertos } = useGameState() || {};
  const { playSuccess, playError } = useSoundEffects();

  const freeDailyCount = user?.freeDailyAnswers?.date === new Date().toISOString().split('T')[0]
    ? user?.freeDailyAnswers?.count || 0
    : 0;

  const freeLimitReached = !user?.isPremium && freeDailyCount >= FREE_DAILY_LIMIT;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname.toLowerCase();
    setIsReviewMode(pathname.includes('review') || pathname.includes('revisao') || pathname.includes('revisão'));
  }, []);

  useEffect(() => {
    let cancel = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        if (!token) {
          throw new Error('Entre na conta para carregar as questões.');
        }

        const params = new URLSearchParams({ page: '0', limit: String(LIMIT_QUESTOES) });
        const res = await fetch(`/api/questoes?${params.toString()}`, {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json().catch(() => null);

        if (!res.ok) throw new Error(json?.error || `Falha ao buscar questões (${res.status})`);
        if (!Array.isArray(json)) throw new Error('Resposta inválida ao buscar questões');

        const ordenadas = ordenarQuestoes(json);
        const respondidasSalvas = lerRespondidasSalvasParaOrdenacao();

        if (!cancel) {
          setData(ordenadas);
          setRespostas({});
          setRespondidasSalvasAoCarregar(respondidasSalvas);
          setReviewSuccessPending({});
          setAba('naoRespondidas');
          setActiveMateria(getMateriaNome(ordenadas[0]));
        }
      } catch (err: unknown) {
        if (!cancel) {
          setData([]);
          setError(err instanceof Error ? err.message : 'Erro ao carregar questões');
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    load();

    return () => {
      cancel = true;
    };
  }, []);

  const exames = useMemo<ExameResumo[]>(() => {
    if (!data) return [];

    const map = new Map<string, ExameResumo>();

    for (const questao of data) {
      const exame = getExameInfo(questao);
      const atual = map.get(exame.key);

      if (atual) {
        atual.total += 1;
      } else {
        map.set(exame.key, { key: exame.key, label: exame.label, numero: exame.numero, total: 1 });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.key === 'sem-exame') return 1;
      if (b.key === 'sem-exame') return -1;
      return b.numero - a.numero;
    });
  }, [data]);

  const questoesDoExame = useMemo(() => {
    if (!data) return [];
    if (activeExame === TODOS_OS_EXAMES) return data;
    return data.filter((questao) => getExameInfo(questao).key === activeExame);
  }, [data, activeExame]);

  const materiasOrdenadas = useMemo(() => {
    return Array.from(new Set(questoesDoExame.map((questao) => getMateriaNome(questao)))).sort((a, b) => {
      const configA = getConfigMateria(a);
      const configB = getConfigMateria(b);

      if (configA.prioridade !== configB.prioridade) return configA.prioridade - configB.prioridade;
      return a.localeCompare(b);
    });
  }, [questoesDoExame]);

  useEffect(() => {
    if (!materiasOrdenadas.length) return;
    if (activeMateria === TODAS_AS_MATERIAS) return;

    if (!materiasOrdenadas.includes(activeMateria)) {
      setActiveMateria(materiasOrdenadas[0]);
      setActiveTema(null);
      setAba('naoRespondidas');
    }
  }, [materiasOrdenadas, activeMateria]);

  const questoesDaMateria = useMemo(() => {
    const base =
      activeMateria === TODAS_AS_MATERIAS
        ? questoesDoExame
        : questoesDoExame.filter((questao) => getMateriaNome(questao) === activeMateria);

    if (!activeTema) return base;

    return base.filter((questao) => getTemaNome(questao) === activeTema);
  }, [questoesDoExame, activeMateria, activeTema]);

  const questoesVisiveis = useMemo(() => {
    let base = questoesDaMateria;

    if (aba === 'feitas') {
      base = questoesDaMateria.filter((questao) => respostas[getKey(questao)] !== undefined);
    } else if (aba === 'naoRespondidas') {
      base = questoesDaMateria.filter((questao) => {
        const key = getKey(questao);

        // No modo revisão, quando o usuário acerta, a questão precisa continuar
        // aparecendo até ele clicar em "Continuar e remover da revisão".
        // Sem isso, a aba "Não respondidas" remove a questão assim que a resposta
        // é registrada e o usuário não consegue ver gabarito nem comentário.
        return !respondidasSalvasAoCarregar[key] || Boolean(reviewSuccessPending[key]);
      });
    }

    return moverRespondidasSalvasParaFinal(
      ordenarEmbaralhado(base, shuffleSeed),
      respondidasSalvasAoCarregar
    );
  }, [aba, questoesDaMateria, respostas, respondidasSalvasAoCarregar, reviewSuccessPending, shuffleSeed]);

  function responder(questao: Questao, alternativaIndex: number) {
    const key = getKey(questao);
    if (respostas[key] !== undefined) return;

    if (freeLimitReached) {
      setShowFreeLimitModal(true);
      return;
    }

    const estaRevisandoQuestao = isReviewMode || questaoEstaEmRevisaoLocal(questao.id);

    if (estaRevisandoQuestao) {
      registrarQuestaoRevisada?.(questao.id);
    }

    setRespostas((current) => ({ ...current, [key]: alternativaIndex }));
    window.setTimeout(() => {
      document.getElementById(`questao-${questao.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    registrarRespostaFreeHoje?.();

    const correct = normalizarGabarito(questao.gabarito);

    if (correct !== null && alternativaIndex === correct) {
      playSuccess();

      if (estaRevisandoQuestao) {
        setReviewSuccessPending((current) => ({ ...current, [key]: true }));
        return;
      }

      registrarAcerto?.(questao.id);
    } else {
      playError();

      setReviewSuccessPending((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });

      registrarErro?.(questao.id);

      const raw = localStorage.getItem('user-game-data');
      const current = raw ? JSON.parse(raw) : {};

      const id = String(questao.id);
      const revisaoIds = Array.isArray(current.revisaoIds)
        ? current.revisaoIds.map(String)
        : [];

      const questoesErradas = Array.isArray(current.questoesErradas)
        ? current.questoesErradas.map(String)
        : [];

      localStorage.setItem(
        'user-game-data',
        JSON.stringify({
          ...current,
          revisaoIds: [...new Set([...revisaoIds, id])],
          questoesErradas: [...new Set([...questoesErradas, id])],
        })
      );

      window.dispatchEvent(new Event('oaplay-revisao-atualizada'));
      window.dispatchEvent(new StorageEvent('storage', { key: 'user-game-data' }));
    }
  }

  function confirmarAcertoRevisao(questao: Questao) {
    const key = getKey(questao);

    registrarAcerto?.(questao.id);
    removerQuestaoDaRevisaoLocal(questao.id);

    setReviewSuccessPending((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });

    scrollToQuestoes();
  }

  function consolidarRespostasDaSessaoAtual() {
    const idsRespondidosAgora = Object.keys(respostas);

    if (!idsRespondidosAgora.length) return;

    setRespondidasSalvasAoCarregar((current) => {
      const next = { ...current };

      idsRespondidosAgora.forEach((id) => {
        next[id] = true;
      });

      return next;
    });
  }

  function selecionarMateria(materia: string) {
    if (materia !== activeMateria || activeTema) {
      consolidarRespostasDaSessaoAtual();
    }

    setActiveMateria(materia);
    setActiveTema(null);
    setAba('naoRespondidas');
    scrollToQuestoes();
  }

  function embaralharQuestoes() {
    setShuffleSeed(Date.now());
    setAba('naoRespondidas');
    scrollToQuestoes();
  }

  function selecionarTema(materia: string, tema: string) {
    if (materia !== activeMateria || tema !== activeTema) {
      consolidarRespostasDaSessaoAtual();
    }

    setActiveMateria(materia);
    setActiveTema(tema);
    setAba('naoRespondidas');
    scrollToQuestoes();
  }

  function selecionarExame(exame: string) {
    if (exame !== activeExame) {
      consolidarRespostasDaSessaoAtual();
    }

    setActiveExame(exame);
    setActiveMateria('');
    setActiveTema(null);
    setAba('naoRespondidas');
    scrollToResumo();
  }


  function resetarMateria(materia: string) {
    setRespostas((current) => {
      const next = { ...current };

      for (const questao of questoesDoExame) {
        if (getMateriaNome(questao) === materia) delete next[getKey(questao)];
      }

      return next;
    });

    setReviewSuccessPending((current) => {
      const next = { ...current };

      for (const questao of questoesDoExame) {
        if (getMateriaNome(questao) === materia) delete next[getKey(questao)];
      }

      return next;
    });

    setActiveMateria(materia);
    setActiveTema(null);
    setAba('naoRespondidas');
    scrollToResumo();
  }

  function resetarTodas() {
    setShowResetConfirm(true);
  }

  function confirmarResetarTodas() {
    setRespostas({});
    setRespondidasSalvasAoCarregar({});
    setReviewSuccessPending({});
    resetarAcertos?.();

    setActiveExame(TODOS_OS_EXAMES);
    setAba('naoRespondidas');
    setActiveTema(null);
    setShowResetConfirm(false);

    const primeiraMateria = Array.from(
      new Set((data || []).map((questao) => getMateriaNome(questao)))
    ).sort((a, b) => {
      const configA = getConfigMateria(a);
      const configB = getConfigMateria(b);

      if (configA.prioridade !== configB.prioridade) return configA.prioridade - configB.prioridade;
      return a.localeCompare(b);
    })[0];

    if (primeiraMateria) setActiveMateria(primeiraMateria);
    scrollToResumo();
  }

  if (loading || !data) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center p-4 text-slate-700 dark:text-slate-300">
        <p className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando questões...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl p-4">
        <div className="rounded-lg border border-rose-500 bg-rose-50 p-4 font-semibold text-rose-900 dark:border-rose-300/40 dark:bg-rose-400/10 dark:text-rose-100">
          {error}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="mx-auto max-w-5xl p-4">
        <div className="rounded-lg border border-slate-300 bg-white p-4 font-semibold text-slate-700 dark:border-white/15 dark:bg-slate-900 dark:text-slate-300">
          Nenhuma questão disponível.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-2.5 py-3 sm:px-4 md:space-y-6 md:py-8">
      <Summary
        todasQuestoes={data}
        questoesDoExame={questoesDoExame}
        respostas={respostas}
        aba={aba}
        activeMateria={activeMateria}
        activeExame={activeExame}
        activeTema={activeTema}
        exames={exames}
        onChangeAba={setAba}
        onSelectMateria={selecionarMateria}
        onSelectTema={selecionarTema}
        onSelectExame={selecionarExame}
        onResetMateria={resetarMateria}
        onResetTodas={resetarTodas}
        onShuffle={embaralharQuestoes}
      />

      {!user?.isPremium && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-sm dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em]">
                Plano gratuito
              </p>

              <p className="mt-1 text-sm font-bold leading-relaxed">
                Você usou {freeDailyCount} de {FREE_DAILY_LIMIT} questões grátis hoje.
              </p>
            </div>

            <a
              href="/premium"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-300"
            >
              Liberar Premium
            </a>
          </div>
        </section>
      )}

      <section id="questoes-em-jogo" className="scroll-mt-24 rounded-2xl border border-slate-300 bg-white p-3 shadow-sm dark:border-white/15 dark:bg-slate-900 md:p-5">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-800 dark:text-cyan-300">
            Questões em jogo
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
            {activeMateria === TODAS_AS_MATERIAS
              ? 'Todas as matérias'
              : activeTema
                ? `${activeMateria} · ${activeTema}`
                : activeMateria}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
            Exibindo {questoesVisiveis.length} questão(ões) {activeMateria === TODAS_AS_MATERIAS ? 'misturadas de todas as matérias' : activeTema ? `do tema ${activeTema}` : 'da matéria selecionada'}.
          </p>
        </div>

        {questoesVisiveis.length ? (
          <div className="space-y-6">
            {questoesVisiveis.map((questao, index) => (
              <QuestaoCard
                key={questao.id}
                questao={questao}
                index={index}
                total={questoesVisiveis.length}
                selected={respostas[getKey(questao)] ?? null}
                reviewSuccessPending={Boolean(reviewSuccessPending[getKey(questao)])}
                onResponder={responder}
                onConfirmarAcertoRevisao={confirmarAcertoRevisao}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-500 bg-emerald-50 p-4 text-sm font-black text-emerald-900 dark:border-emerald-300/35 dark:bg-emerald-300/10 dark:text-emerald-100">
            Nenhuma questão nesta seleção. Troque a edição do exame, a matéria ou a aba.
          </div>
        )}
      </section>

      {showFreeLimitModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/90 px-4 backdrop-blur-xl">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-amber-300/30 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-2xl shadow-black ring-1 ring-white/10">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300" />
            <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-6rem] -right-20 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="relative p-6 text-center md:p-8">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/35 bg-amber-300/15 text-amber-200 shadow-lg shadow-black/30">
                <AlertTriangle className="h-8 w-8" strokeWidth={2.8} />
              </div>

              <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-amber-200">
                Plano gratuito
              </p>

              <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                Limite diário atingido
              </h2>

              <p className="mx-auto mt-4 max-w-sm text-sm font-semibold leading-relaxed text-slate-300 md:text-base">
                Você respondeu suas {FREE_DAILY_LIMIT} questões gratuitas de hoje. Assine o Premium para continuar estudando sem limite.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
                <div className="rounded-xl bg-slate-950/60 p-3">
                  <p className="text-xl font-black text-amber-200">5</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    grátis por dia
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/60 p-3">
                  <p className="text-xl font-black text-emerald-200">?</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    no Premium
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/60 p-3">
                  <p className="text-xl font-black text-cyan-200">24h</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    renova amanhã
                  </p>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowFreeLimitModal(false)}
                  className="min-h-12 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-black text-slate-100 transition hover:bg-white/10"
                >
                  Continuar amanhã
                </button>

                <a
                  href="/premium"
                  className="flex min-h-12 items-center justify-center rounded-2xl border border-emerald-200/40 bg-gradient-to-r from-emerald-300 to-cyan-300 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:from-emerald-200 hover:to-cyan-200"
                >
                  Desbloquear Premium
                </a>
              </div>

              <p className="mt-5 text-xs font-medium leading-relaxed text-slate-500">
                Premium libera questões ilimitadas e remove essa trava diária.
              </p>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 px-4 backdrop-blur-lg">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-rose-300/25 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/60 text-white shadow-2xl shadow-rose-950/50 ring-1 ring-white/10">
            <div className="relative p-5 md:p-6">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-orange-400 to-emerald-300" />

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-300/35 bg-rose-500/15 text-rose-300 shadow-lg shadow-rose-950/30">
                <AlertTriangle className="h-8 w-8" strokeWidth={2.7} />
              </div>

              <h2 className="text-center text-xl font-black tracking-tight md:text-2xl">
                Resetar todas as {data.length} questões?
              </h2>

              <p className="mx-auto mt-3 max-w-sm text-center text-sm font-medium leading-relaxed text-slate-300">
                Isso vai limpar suas respostas, acertos e revisão local. O ranking permanente não será apagado.
              </p>

              <div className="mt-5 rounded-2xl border border-rose-300/25 bg-rose-500/10 px-4 py-3 text-center text-sm font-black text-rose-200">
                Essa ação não pode ser desfeita.
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="min-h-12 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-black text-slate-100 transition hover:bg-white/10"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={confirmarResetarTodas}
                  className="min-h-12 rounded-2xl border border-rose-300/40 bg-gradient-to-r from-rose-600 to-rose-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-rose-950/30 transition hover:from-rose-500 hover:to-rose-400"
                >
                  Sim, resetar tudo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
