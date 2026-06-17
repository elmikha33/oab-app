'use client';

import { useState, useEffect } from 'react';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function QuestoesList() {
  const [questoes, setQuestoes] = useState<any[]>([]);
  const [userChoices, setUserChoices] = useState<Record<string, number>>({});

  useEffect(() => {
    async function carregarDados() {
      const { data } = await supabase
        .from("questoes_oab")
        .select("*")
        .order("created_at", { ascending: false });
      
      setQuestoes(data || []);
    }
    carregarDados();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      {questoes.map((q) => {
        const hasAnswered = userChoices[q.id] !== undefined;
        const selectedIndex = userChoices[q.id];
        
        // Forçamos a conversão para número para garantir a comparação
        const correctIndex = parseInt(q.gabarito);

        return (
          <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white mb-6">{q.enunciado}</h2>

            <div className="space-y-3">
              {q.alternativas.map((alt: string, index: number) => {
                
                // --- LÓGICA DE CORES EXPLÍCITA ---
                let className = "w-full text-left border p-4 rounded-xl transition-all ";
                
                if (!hasAnswered) {
                  // Estado padrão (antes de responder)
                  className += "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600";
                } else {
                  // Estado após responder
                  if (index === correctIndex) {
                    // Esta é a correta (sempre fica verde)
                    className += "bg-green-900/50 border-green-500 text-green-100";
                  } else if (index === selectedIndex) {
                    // Esta foi a que você errou (fica vermelha)
                    className += "bg-red-900/50 border-red-500 text-red-100";
                  } else {
                    // Outras opções
                    className += "opacity-40 border-slate-800 text-slate-500";
                  }
                }

                return (
                  <button
                    key={index}
                    disabled={hasAnswered}
                    onClick={() => setUserChoices(prev => ({...prev, [q.id]: index}))}
                    className={className}
                  >
                    <span className="font-bold mr-2">{String.fromCharCode(65 + index)})</span>
                    {alt}
                  </button>
                );
              })}
            </div>

            {hasAnswered && (
              <div className="mt-6 space-y-4 animate-in fade-in duration-500 border-t border-slate-700 pt-6">
                <div className={`font-bold ${selectedIndex === correctIndex ? 'text-emerald-400' : 'text-red-400'}`}>
                   {selectedIndex === correctIndex ? "✅ Correto!" : `❌ Incorreto. Gabarito: ${String.fromCharCode(65 + correctIndex)}`}
                </div>
                {q.comentario && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <p className="text-slate-400 font-bold mb-2">🤖 Explicação do Robô:</p>
                    <p className="text-slate-200 text-sm">{q.comentario}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}