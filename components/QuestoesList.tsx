'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from "@/lib/supabase";
import { RefreshCcw, ArrowLeft, Loader2 } from 'lucide-react';

const CATEGORIES = {
  PRIORIDADE: { label: 'Prioridade', color: 'bg-amber-500', text: 'text-black', subjects: ['Ética Profissional'] },
  PUBLICO: { label: 'Público', color: 'bg-blue-600', text: 'text-white', subjects: ['Direito Constitucional', 'Direito Administrativo', 'Direito Tributário', 'Direito Penal', 'Direito Processual Penal'] },
  PRIVADO: { label: 'Privado', color: 'bg-emerald-600', text: 'text-white', subjects: ['Direito Civil', 'Direito Processual Civil', 'Direito Empresarial', 'Direito Internacional'] },
  SOCIAL: { label: 'Social', color: 'bg-orange-600', text: 'text-white', subjects: ['Direito do Trabalho', 'Direito Processual do Trabalho', 'Direitos Humanos', 'Direito Ambiental', 'Direito do Consumidor', 'Direito Previdenciário'] },
  BASE: { label: 'Base', color: 'bg-slate-600', text: 'text-white', subjects: ['Filosofia do Direito'] }
};

interface QuestoesListProps { onCorrectAnswer: () => void; }

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

  const resetar = (e: React.MouseEvent, materia: string | null) => {
    e.stopPropagation();
    if (!materia) setUserChoices({});
    else {
      const next = { ...userChoices };
      questoes.forEach(q => { if ((q.materia || "").trim() === materia) delete next[q.id]; });
      setUserChoices(next);
    }
  };

  const exibidas = useMemo(() => 
    filtroMateria ? questoes.filter(q => (q.materia || "").trim() === filtroMateria) : questoes, 
    [questoes, filtroMateria]
  );

  return (
    <div className="w-full">
      {/* HEADER COMPACTO E STICKY */}
      <div className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 p-2">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <Link href="/dashboard" className="p-2 bg-slate-900 rounded-lg text-slate-400 border border-slate-800">
            <ArrowLeft size={18} />
          </Link>
          
          <div className="flex-1 overflow-x-auto flex gap-2 pb-1 scrollbar-hide">
            <button onClick={() => setFiltroMateria(null)} className={`flex items-center gap-1 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold ${!filtroMateria ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
              Todas <RefreshCcw size={10} onClick={(e) => resetar(e, null)} />
            </button>
            
            {Object.values(CATEGORIES).flatMap(c => c.subjects.map(s => ({name: s, color: c.color, text: c.text}))).map((item) => (
              <button key={item.name} onClick={() => setFiltroMateria(item.name)} 
                className={`flex items-center gap-1 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold border ${filtroMateria === item.name ? `${item.color} ${item.text} border-transparent` : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                {item.name}
                <RefreshCcw size={10} onClick={(e) => resetar(e, item.name)} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LISTA DE QUESTÕES */}
      <div className="max-w-3xl mx-auto p-3 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-500" size={40} /></div>
        ) : (
          exibidas.map((q: any) => {
            const answered = userChoices[q.id] !== undefined;
            const selected = userChoices[q.id];
            const correct = Number(q.gabarito);
            
            return (
              <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
                <span className="text-[9px] uppercase font-bold text-slate-500 mb-2 block">{q.materia}</span>
                <h2 className="text-sm text-white mb-4 leading-relaxed">{q.enunciado}</h2>
                <div className="space-y-2">
                  {q.alternativas.map((alt: string, i: number) => (
                    <button key={i} disabled={answered} onClick={() => {
                        setUserChoices(prev => ({...prev, [q.id]: i}));
                        if (i === correct) onCorrectAnswer();
                    }} className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${answered ? (i === correct ? 'bg-emerald-900/40 border-emerald-500' : i === selected ? 'bg-red-900/40 border-red-500' : 'opacity-40 border-slate-800') : 'bg-slate-950 border-slate-800 hover:border-slate-500'}`}>
                      {alt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}