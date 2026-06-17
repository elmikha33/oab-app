'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from "@/lib/supabase";
import { RefreshCcw, ArrowLeft, Star, Loader2 } from 'lucide-react';

const CATEGORIES = {
  PRIORIDADE: { label: 'Prioridade', color: 'bg-amber-500', textColor: 'text-black', subjects: ['Ética Profissional'] },
  PUBLICO: { label: 'Público', color: 'bg-blue-600', textColor: 'text-white', subjects: ['Direito Constitucional', 'Direito Administrativo', 'Direito Tributário', 'Direito Penal', 'Direito Processual Penal'] },
  PRIVADO: { label: 'Privado', color: 'bg-emerald-600', textColor: 'text-white', subjects: ['Direito Civil', 'Direito Processual Civil', 'Direito Empresarial', 'Direito Internacional'] },
  SOCIAL: { label: 'Social', color: 'bg-orange-600', textColor: 'text-white', subjects: ['Direito do Trabalho', 'Direito Processual do Trabalho', 'Direitos Humanos', 'Direito Ambiental', 'Direito do Consumidor', 'Direito Previdenciário'] },
  BASE: { label: 'Base', color: 'bg-slate-600', textColor: 'text-white', subjects: ['Filosofia do Direito'] }
};

const getCategoryConfig = (materia: string) => {
  const entry = Object.entries(CATEGORIES).find(([_, cat]) => cat.subjects.includes(materia));
  return entry ? entry[1] : { color: 'bg-slate-600', textColor: 'text-white' };
};

interface QuestoesListProps {
  onCorrectAnswer: () => void;
}

export default function QuestoesList({ onCorrectAnswer }: QuestoesListProps) {
  const [questoes, setQuestoes] = useState<any[]>([]);
  const [userChoices, setUserChoices] = useState<Record<string, number>>({});
  const [filtroMateria, setFiltroMateria] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data } = await supabase.from("questoes_oab").select("*");
      if (data) setQuestoes(data);
      setIsLoading(false);
    };
    load();
  }, []);

  // Filtra sem reordenar
  const exibidas = useMemo(() => {
    return filtroMateria 
      ? questoes.filter(q => (q.materia || "").trim() === filtroMateria) 
      : questoes;
  }, [questoes, filtroMateria]);

  return (
    <div className="w-full">
      {/* HEADER STICKY (Fixa no topo do mobile e desktop) */}
      <div className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 p-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          
          <div className="flex-1 overflow-x-auto scrollbar-hide flex gap-2 pb-1">
            <button 
              onClick={() => setFiltroMateria(null)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold ${!filtroMateria ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'}`}
            >
              Todas
            </button>
            {Object.values(CATEGORIES).flatMap(c => c.subjects).map(sub => (
              <button
                key={sub}
                onClick={() => setFiltroMateria(sub)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold ${filtroMateria === sub ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400'}`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LISTA DE QUESTÕES */}
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-500" size={40} /></div>
        ) : (
          exibidas.map((q: any) => {
            const answered = userChoices[q.id] !== undefined;
            const selected = userChoices[q.id];
            const correct = Number(q.gabarito);
            const catConfig = getCategoryConfig(q.materia || ''); 
            
            return (
              <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <span className={`inline-block ${catConfig.color} ${catConfig.textColor} text-[10px] uppercase font-bold px-2 py-1 rounded-md mb-4`}>
                    {q.materia || 'Matéria'}
                </span>
                <h2 className="text-lg text-white mb-6 leading-relaxed">{q.enunciado}</h2>
                <div className="space-y-3">
                  {q.alternativas.map((alt: string, i: number) => (
                    <button 
                      key={i} 
                      disabled={answered} 
                      onClick={() => {
                          setUserChoices(prev => ({...prev, [q.id]: i}));
                          if (i === correct) onCorrectAnswer();
                      }} 
                      className={`w-full text-left p-4 rounded-xl border transition-all ${answered ? (i === correct ? 'bg-emerald-900/40 border-emerald-500' : i === selected ? 'bg-red-900/40 border-red-500' : 'opacity-40 border-slate-800') : 'bg-slate-950 border-slate-800 hover:border-slate-500'}`}
                    >
                      {alt}
                    </button>
                  ))}
                </div>
                
                {answered && (
                  <div className="mt-6 p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 animate-in fade-in slide-in-from-top-2">
                    <p className="font-bold mb-2">{selected === correct ? "✅ Correto!" : "❌ Incorreto."}</p>
                    <p className="text-sm italic">{q.comentario}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}