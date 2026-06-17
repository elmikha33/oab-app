'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { supabase } from "@/lib/supabase";
import { RefreshCcw, ArrowLeft, Star, AlertCircle, Loader2 } from 'lucide-react';

const CATEGORIES = {
  PRIORIDADE: { label: 'Prioridade Máxima', color: 'bg-amber-500', textColor: 'text-black', subjects: ['Ética Profissional'] },
  PUBLICO: { label: 'Direito Público', color: 'bg-blue-600', textColor: 'text-white', subjects: ['Direito Constitucional', 'Direito Administrativo', 'Direito Tributário', 'Direito Penal', 'Direito Processual Penal'] },
  PRIVADO: { label: 'Direito Privado', color: 'bg-emerald-600', textColor: 'text-white', subjects: ['Direito Civil', 'Direito Processual Civil', 'Direito Empresarial', 'Direito Internacional'] },
  SOCIAL: { label: 'Social & Especial', color: 'bg-orange-600', textColor: 'text-white', subjects: ['Direito do Trabalho', 'Direito Processual do Trabalho', 'Direitos Humanos', 'Direito Ambiental', 'Direito do Consumidor', 'Direito Previdenciário'] },
  BASE: { label: 'Fundamentos', color: 'bg-slate-600', textColor: 'text-white', subjects: ['Filosofia do Direito'] }
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
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data } = await supabase.from("questoes_oab").select("*");
      if (data) setQuestoes(data);
      setIsLoading(false);
    };
    load();
  }, []);

  // Lógica corrigida: Sem o .sort() para as questões ficarem fixas
  const exibidas = useMemo(() => {
    return filtroMateria 
      ? questoes.filter(q => (q.materia || "").trim() === filtroMateria) 
      : questoes;
  }, [questoes, filtroMateria]);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 bg-slate-900 w-fit px-4 py-2 rounded-xl border border-slate-800">
        <ArrowLeft size={16} /> Voltar
      </Link>

      <div ref={listaRef} className="space-y-6 pt-4">
        {exibidas.map((q: any) => {
          const answered = userChoices[q.id] !== undefined;
          const selected = userChoices[q.id];
          const correct = Number(q.gabarito);
          const catConfig = getCategoryConfig(q.materia || ''); 
          
          return (
            <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
               <div className="flex gap-2 mb-3">
                 <span className={`inline-block ${catConfig.color} ${catConfig.textColor} text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md border border-white/10`}>
                    {q.materia || 'Matéria'}
                 </span>
               </div>
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
                <div className="mt-6 p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                  <p className="font-bold mb-2">
                       {selected === correct ? "✅ Correto!" : "❌ Incorreto."}
                  </p>
                  <p className="text-sm italic">{q.comentario}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}