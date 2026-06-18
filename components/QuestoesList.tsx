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
    <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5">
      <p className="text-xs font-bold opacity-70 mb-2">{q.materia}</p>

      <h2 className="text-base font-medium mb-4 leading-relaxed">
        {q.enunciado}
      </h2>

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
                  ? 'border-slate-700 bg-slate-950 hover:border-slate-500'
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

      {isResolved && (
        <div className="mt-4 p-4 rounded-xl border border-purple-500/40 bg-purple-500/10">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={16} className="text-purple-500" />
            <span className="text-sm font-bold text-purple-300">
              Comentário da IA
            </span>
          </div>

          <p className="text-sm text-purple-100/80">
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

    return base;
  }, [questoes, filtro]);

  const handleAnswer = (id: number, ok: boolean) => {
    if (ok) registrarAcerto(id);
    else registrarErro(id);

    onCorrectAnswer?.();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">

      <div className="max-w-3xl mx-auto flex justify-between mb-4">
        <Link href="/dashboard">← Voltar</Link>

        <button
          onClick={() => toggleTheme?.()}
          className="px-4 py-2 bg-slate-700 rounded-xl"
        >
          {theme === 'dark' ? '🌙' : '☀️'} Tema
        </button>
      </div>

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