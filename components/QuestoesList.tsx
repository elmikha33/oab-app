'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { supabase } from "@/lib/supabase";
import { RefreshCcw, ArrowLeft, Star, AlertCircle, Loader2 } from 'lucide-react';

const CATEGORIES = {
  PRIORIDADE: { 
    label: 'Prioridade Máxima', 
    color: 'bg-amber-500', 
    textColor: 'text-black', 
    subjects: ['Ética Profissional'] 
  },
  PUBLICO: { 
    label: 'Direito Público', 
    color: 'bg-blue-600', 
    textColor: 'text-white',
    subjects: ['Direito Constitucional', 'Direito Administrativo', 'Direito Tributário', 'Direito Penal', 'Direito Processual Penal'] 
  },
  PRIVADO: { 
    label: 'Direito Privado', 
    color: 'bg-emerald-600', 
    textColor: 'text-white',
    subjects: ['Direito Civil', 'Direito Processual Civil', 'Direito Empresarial', 'Direito Internacional'] 
  },
  SOCIAL: { 
    label: 'Social & Especial', 
    color: 'bg-orange-600', 
    textColor: 'text-white',
    subjects: ['Direito do Trabalho', 'Direito Processual do Trabalho', 'Direitos Humanos', 'Direito Ambiental', 'Direito do Consumidor', 'Direito Previdenciário'] 
  },
  BASE: { 
    label: 'Fundamentos', 
    color: 'bg-slate-600', 
    textColor: 'text-white',
    subjects: ['Filosofia do Direito'] 
  }
};

const getCategoryConfig = (materia: string) => {
  const entry = Object.entries(CATEGORIES).find(([_, cat]) =>
    cat.subjects.includes(materia)
  );
  return entry ? entry[1] : { color: 'bg-slate-600', textColor: 'text-white' };
};

export default function QuestoesList() {
  const [questoes, setQuestoes] = useState<any[]>([]);
  const [userChoices, setUserChoices] = useState<Record<string, number>>({});
  const [filtroMateria, setFiltroMateria] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const listaRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true); 

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data } = await supabase.from("questoes_oab").select("*");
      if (data) setQuestoes(data);
      setIsLoading(false);
    };
    load();
  }, []);

  const scrollToQuestions = () => {
    listaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    scrollToQuestions();
  }, [filtroMateria]); 

  const resetar = (materia: string | null, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!materia) {
        setUserChoices({});
        setMensagem("Progresso total resetado!");
    } else {
        const next = { ...userChoices };
        questoes.forEach(q => { 
            if ((q.materia || "").trim() === materia) delete next[q.id]; 
        });
        setUserChoices(next);
        setMensagem(`${materia} resetada!`);
    }
    setTimeout(() => setMensagem(null), 2000);
  };

  const groupedData = useMemo(() => {
    const counts: Record<string, number> = {};
    questoes.forEach(q => {
      const mat = (q.materia || "Outros").trim();
      counts[mat] = (counts[mat] || 0) + 1;
    });

    const groups: Record<string, any[]> = {};
    Object.keys(CATEGORIES).forEach(catKey => {
        CATEGORIES[catKey as keyof typeof CATEGORIES].subjects.forEach(materia => {
            if (counts[materia]) {
                if (!groups[catKey]) groups[catKey] = [];
                groups[catKey].push({ name: materia, count: counts[materia] });
            }
        });
    });
    return groups;
  }, [questoes]);

  const sortedExibidas = useMemo(() => {
    const filtradas = filtroMateria ? questoes.filter(q => (q.materia || "").trim() === filtroMateria) : questoes;
    
    return [...filtradas].sort((a, b) => {
      const aAnswered = userChoices[a.id] !== undefined;
      const bAnswered = userChoices[b.id] !== undefined;
      return aAnswered === bAnswered ? 0 : aAnswered ? 1 : -1;
    });
  }, [questoes, filtroMateria]); 

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      
      <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 bg-slate-900 w-fit px-4 py-2 rounded-xl border border-slate-800">
        <ArrowLeft size={16} /> Voltar
      </Link>

      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-bold text-lg">Selecione a Matéria</h3>
            {mensagem && <span className="text-emerald-400 text-xs font-bold animate-pulse">{mensagem}</span>}
        </div>
        
        <div className="flex items-center gap-2 mb-8 bg-purple-600 border border-purple-500 rounded-xl p-1 shadow-lg shadow-purple-900/30">
            <button 
                onClick={() => { setFiltroMateria(null); scrollToQuestions(); }} 
                className="flex-1 text-left px-4 py-3 text-white font-bold text-sm hover:bg-purple-700 rounded-lg transition-all"
            >
                Todas as questões ({questoes.length})
            </button>
            <button onClick={(e) => resetar(null, e)} className="p-3 text-white hover:bg-purple-700 rounded-lg transition-all" title="Resetar tudo">
                <RefreshCcw size={18}/>
            </button>
        </div>

        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Loader2 className="animate-spin mb-3" size={40} />
                <p className="text-sm font-medium animate-pulse">Carregando matérias...</p>
            </div>
        ) : (
            <div className="space-y-8">
            {Object.entries(CATEGORIES).map(([key, cat]) => (
                groupedData[key] && (
                <div key={key}>
                    <h4 className="text-slate-500 text-xs uppercase font-bold mb-3 tracking-widest">{cat.label}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {groupedData[key].map((item: any) => (
                        <div 
                          key={item.name} 
                          onClick={() => setFiltroMateria(item.name)}
                          className={`group flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                            filtroMateria === item.name 
                            ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/50' 
                            : `${cat.color} ${cat.textColor} hover:bg-emerald-600 hover:border-emerald-500 hover:text-white border-transparent`
                          }`}
                        >
                            <span className="font-bold text-sm flex items-center gap-2">
                                {item.name === 'Ética Profissional' && <Star size={14} className="fill-current" />}
                                {item.name} ({item.count})
                            </span>
                            <button 
                                onClick={(e) => resetar(item.name, e)} 
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/20 rounded-full transition-opacity"
                            >
                                <RefreshCcw size={14}/>
                            </button>
                        </div>
                    ))}
                    </div>
                    {key === 'PRIORIDADE' && (
                        <div className="mt-3 flex items-center gap-2 text-amber-500 text-xs font-bold animate-pulse">
                            <AlertCircle size={14} /> Ética Profissional é decisiva para sua aprovação. Foque aqui!
                        </div>
                    )}
                </div>
                )
            ))}
            </div>
        )}
      </div>

      <div ref={listaRef} className="space-y-6 pt-4">
        {sortedExibidas.map((q: any) => {
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
                    onClick={() => setUserChoices(prev => ({...prev, [q.id]: i}))} 
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