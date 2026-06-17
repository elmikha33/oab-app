'use client';

import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase"; 
import { RefreshCcw, CheckCircle2, XCircle, Award } from 'lucide-react';

export default function QuestoesList() {
  const [questoes, setQuestoes] = useState<any[]>([]);
  const [userChoices, setUserChoices] = useState<Record<string, number>>({});
  const [filtroMateria, setFiltroMateria] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    const savedChoices = localStorage.getItem('userChoices');
    const savedFilter = localStorage.getItem('filtroMateria');
    
    if (savedChoices) setUserChoices(JSON.parse(savedChoices));
    if (savedFilter) setFiltroMateria(JSON.parse(savedFilter));

    async function carregarDados() {
      const { data } = await supabase.from("questoes_oab").select("*");
      
      const saved = savedChoices ? JSON.parse(savedChoices) : {};
      const sortedData = (data || []).sort((a: any, b: any) => {
        const aResp = saved[a.id] !== undefined;
        const bResp = saved[b.id] !== undefined;
        if (aResp === bResp) return 0;
        return aResp ? 1 : -1;
      });
      
      setQuestoes(sortedData);
      setIsLoaded(true);
    }
    carregarDados();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('userChoices', JSON.stringify(userChoices));
      localStorage.setItem('filtroMateria', JSON.stringify(filtroMateria));
    }
  }, [userChoices, filtroMateria, isLoaded]);

  const resetarMateria = (materia: string) => {
    const novasEscolhas = { ...userChoices };
    questoes.forEach(q => { if (q.materia === materia) delete novasEscolhas[q.id]; });
    setUserChoices(novasEscolhas);
    setMensagem(`${materia} resetada!`);
    setTimeout(() => setMensagem(null), 2000);
  };

  const stats = questoes.reduce((acc: { acertos: number, erros: number }, q: any) => {
    if (userChoices[q.id] !== undefined) {
      const isCorrect = userChoices[q.id] === Number(q.gabarito);
      isCorrect ? acc.acertos++ : acc.erros++;
    }
    return acc;
  }, { acertos: 0, erros: 0 });

  const summary: Record<string, number> = questoes.reduce((acc: Record<string, number>, q: any) => {
    const mat = q.materia || "Outros";
    acc[mat] = (acc[mat] || 0) + 1;
    return acc;
  }, {});

  const questoesExibidas = filtroMateria 
    ? questoes.filter(q => q.materia === filtroMateria) 
    : questoes;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between">
          <div><p className="text-emerald-400 text-xs uppercase font-bold">Acertos</p><p className="text-2xl font-bold text-white">{stats.acertos}</p></div>
          <CheckCircle2 className="text-emerald-500" size={24} />
        </div>
        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-2xl flex items-center justify-between">
          <div><p className="text-red-400 text-xs uppercase font-bold">Erros</p><p className="text-2xl font-bold text-white">{stats.erros}</p></div>
          <XCircle className="text-red-500" size={24} />
        </div>
        <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between">
          <div><p className="text-indigo-400 text-xs uppercase font-bold">Total</p><p className="text-2xl font-bold text-white">{stats.acertos + stats.erros}</p></div>
          <Award className="text-indigo-500" size={24} />
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-slate-400 font-bold mb-4 uppercase text-xs tracking-widest flex justify-between items-center">
          <span>Sumário</span>
          {mensagem && <span className="text-emerald-400 animate-pulse text-[10px]">{mensagem}</span>}
        </h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFiltroMateria(null)} className={`px-3 py-1 rounded-lg text-sm border ${!filtroMateria ? 'bg-slate-600 border-white' : 'bg-slate-900 border-slate-700'}`}>Todas</button>
          {Object.entries(summary).map(([materia, count]) => (
            <div key={materia} className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
              <button onClick={() => setFiltroMateria(materia)} className={`text-sm ${filtroMateria === materia ? 'text-indigo-400 font-bold' : 'text-slate-300'}`}>
                {materia} ({Number(count)})
              </button>
              <button onClick={() => resetarMateria(materia)} title="Resetar Questões desta matéria" className="text-slate-500 hover:text-slate-200 transition-all duration-200 hover:rotate-180">
                <RefreshCcw size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {questoesExibidas.map((q: any) => {
        const hasAnswered = userChoices[q.id] !== undefined;
        const selectedIndex = userChoices[q.id];
        const correctIndex = Number(q.gabarito);

        return (
          <div key={q.id} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 transition-all duration-300">
            <h2 className="text-lg text-white mb-6">{q.enunciado}</h2>
            <div className="space-y-3">
              {q.alternativas.map((alt: string, index: number) => {
                let baseStyle = "w-full text-left border p-4 rounded-xl transition-all ";
                if (!hasAnswered) baseStyle += "bg-slate-950 border-slate-800 hover:border-slate-500";
                else if (index === correctIndex) baseStyle += "bg-emerald-900/50 border-emerald-500";
                else if (index === selectedIndex) baseStyle += "bg-red-900/50 border-red-500";
                else baseStyle += "opacity-30 border-slate-800";
                
                return (
                  <button key={index} disabled={hasAnswered} onClick={() => setUserChoices(prev => ({...prev, [q.id]: index}))} className={baseStyle}>
                    {alt}
                  </button>
                );
              })}
            </div>
            {hasAnswered && (
              <div className="mt-6 p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                <p className={`font-bold mb-2 ${selectedIndex === correctIndex ? "text-emerald-400" : "text-red-400"}`}>
                   {selectedIndex === correctIndex ? "✅ Correto!" : "❌ Incorreto."}
                </p>
                <p className="text-sm">{q.comentario}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}