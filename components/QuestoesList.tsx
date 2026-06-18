'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useGameState } from '@/context/GameStateContext';
import { useTheme } from '@/context/ThemeContext';
import { Loader2, Lightbulb, Eraser, Sun, Moon } from 'lucide-react';

const CATEGORIES = {
  PRIORIDADE: {
    label: 'PRIORIDADE MÁXIMA',
    color: 'bg-amber-500 hover:bg-amber-600 text-black',
    subjects: ['Ética Profissional']
  },
  PUBLICO: {
    label: 'DIREITO PÚBLICO',
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
    subjects: ['Direito Constitucional', 'Direito Administrativo', 'Direito Tributário', 'Direito Penal', 'Direito Processual Penal']
  },
  PRIVADO: {
    label: 'DIREITO PRIVADO',
    color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    subjects: ['Direito Civil', 'Direito Processual Civil', 'Direito Empresarial', 'Direito Internacional']
  },
  SOCIAL: {
    label: 'DIREITO SOCIAL',
    color: 'bg-orange-600 hover:bg-orange-700 text-white',
    subjects: ['Direito do Trabalho', 'Direito Processual do Trabalho', 'Direitos Humanos', 'Direito Ambiental', 'Direito do Consumidor', 'Direito Previdenciário']
  },
  BASE: {
    label: 'BASE',
    color: 'bg-slate-600 hover:bg-slate-700 text-white',
    subjects: ['Filosofia do Direito']
  }
};

function QuestaoCard({ q, onAnswer }: any) {
  const { user } = useGameState();
  const { theme } = useTheme();

  const [selected, setSelected] = useState<number | null>(null);

  const correct = Number(q.gabarito);

  const isResolved =
    selected !== null || user?.questoesRespondidas?.includes(q.id);

  return (
    <div
      className={
        theme === 'dark'
          ? 'bg-slate-900 border border-slate-800 text-white rounded-2xl p-5'
          : 'bg-white border border-slate-200 text-black rounded-2xl p-5 font-semibold'
      }
    >
      {/* MATÉRIA */}
      <p className="text-xs font-bold opacity-70 mb-2">{q.materia}</p>

      {/* ENUNCIADO */}
      <h2 className={
        theme === 'dark'
          ? 'text-base font-medium mb-4 leading-relaxed'
          : 'text-base font-semibold mb-4 leading-relaxed text-slate-900'
      }>
        {q.enunciado}
      </h2>

      {/* ALTERNATIVAS */}
      <div className="space-y-2">
        {q.alternativas.map((alt: string, i: number) => {
          const isCorrect = i === correct;
          const isSelected = i === selected;

          return (
            <button
              key={i}
              disabled={isResolved}
              onClick={() => {
                setSelected(i);
                onAnswer(q.id, i === correct);
              }}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                !isResolved
                  ? theme === 'dark'
                    ? 'border-slate-700 bg-slate-950 hover:border-slate-500'
                    : 'border-slate-200 bg-slate-100 hover:border-slate-400 font-medium text-slate-900'
                  : isCorrect
                  ? 'bg-green-600/20 border-green-500 text-green-400'
                  : isSelected
                  ? 'bg-red-600/20 border-red-500 text-red-400'
                  : 'opacity-40'
              }`}
            >
              {alt}
            </button>
          );
        })}
      </div>

      {/* COMENTÁRIO IA */}
      {isResolved && (
        <div
          className={
            theme === 'dark'
              ? 'mt-4 p-4 rounded-xl border border-purple-500/40 bg-purple-500/10'
              : 'mt-4 p-4 rounded-xl border border-purple-400 bg-purple-50'
          }
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={16} className="text-purple-500" />

            <span
              className={
                theme === 'dark'
                  ? 'text-sm font-bold text-purple-300'
                  : 'text-sm font-bold text-purple-700'
              }
            >
              Comentário da IA
            </span>
          </div>

          <p
            className={
              theme === 'dark'
                ? 'text-sm text-purple-100/80'
                : 'text-sm text-purple-900 font-medium'
            }
          >
            {q.comentario || 'Sem comentário disponível.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function QuestoesList({ onCorrectAnswer }: any) {
  const { user, registrarAcerto, registrarErro, setUser } = useGameState();
  const { theme, toggleTheme } = useTheme();

  const [questoes, setQuestoes] = useState<any[]>([]);
  const [filtro, setFiltro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const anchorRef = useRef<HTMLDivElement>(null);

  const respondidasSet = useMemo(
    () => new Set((user?.questoesRespondidas ?? []).map(Number)),
    [user?.questoesRespondidas]
  );

  const erradasSet = useMemo(
    () => new Set((user?.questoesErradas ?? []).map(Number)),
    [user?.questoesErradas]
  );

  const revisaoSet = useMemo(
    () => new Set((user?.revisaoIds ?? []).map(Number)),
    [user?.revisaoIds]
  );

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('questoes_oab').select('*');
      if (data) setQuestoes(data);
      setLoading(false);
    })();
  }, []);

  const exibidas = useMemo(() => {
    const base = filtro
      ? questoes.filter(q => q.materia.trim() === filtro)
      : questoes;

    const getRank = (q: any) => {
      const id = Number(q.id);

      if (revisaoSet.has(id)) return 0;
      if (erradasSet.has(id)) return 1;
      if (!respondidasSet.has(id)) return 2;
      return 3;
    };

    return [...base].sort((a, b) => {
      const diff = getRank(a) - getRank(b);
      if (diff !== 0) return diff;
      return Number(a.id) - Number(b.id);
    });
  }, [questoes, filtro, respondidasSet, erradasSet, revisaoSet]);

  const handleAnswer = (id: number, ok: boolean) => {
    if (ok) registrarAcerto(id);
    else registrarErro(id);

    onCorrectAnswer?.();
  };

  const resetAll = () => {
    if (!confirm('Resetar tudo?')) return;

    setUser((p: any) => ({
      ...p,
      questoesRespondidas: [],
      questoesErradas: []
    }));
  };

  const resetMateria = (m: string) => {
    const ids = questoes.filter(q => q.materia === m).map(q => q.id);

    setUser((p: any) => ({
      ...p,
      questoesRespondidas: (p.questoesRespondidas || []).filter((x: number) => !ids.includes(x)),
      questoesErradas: (p.questoesErradas || []).filter((x: number) => !ids.includes(x))
    }));
  };

  const selectMateria = (m: string | null) => {
    setFiltro(m);
    setTimeout(() => {
      anchorRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  return (
    <div className={
      theme === 'dark'
        ? 'min-h-screen bg-slate-950 text-white p-4'
        : 'min-h-screen bg-slate-100 text-black p-4'
    }>

      {/* TOP BAR */}
      <div className="max-w-3xl mx-auto flex justify-between mb-4">
        <Link href="/dashboard" className="font-bold">
          ← Voltar
        </Link>

        <button
          onClick={() => toggleTheme?.()}
          className="px-4 py-2 rounded-xl bg-slate-700 text-white flex items-center gap-2"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          Tema
        </button>
      </div>

      {/* CATEGORIES */}
      <div className="max-w-3xl mx-auto space-y-4 mb-6">
        {Object.entries(CATEGORIES).map(([k, cat]) => (
          <div key={k}>
            <p className="text-xs font-bold opacity-60 mb-2">{cat.label}</p>

            {cat.subjects.map(m => (
              <div key={m} className="flex gap-2 mb-2">
                <button
                  onClick={() => selectMateria(m)}
                  className={`flex-1 p-3 rounded-xl font-bold ${cat.color}`}
                >
                  {m}
                </button>

                <button
                  onClick={() => resetMateria(m)}
                  className="px-3 rounded-xl bg-slate-700 text-white"
                >
                  <Eraser size={16} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div ref={anchorRef} />

      {/* QUESTIONS */}
      <div className="max-w-3xl mx-auto space-y-4">
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          exibidas.map(q => (
            <QuestaoCard key={q.id} q={q} onAnswer={handleAnswer} />
          ))
        )}
      </div>
    </div>
  );
}