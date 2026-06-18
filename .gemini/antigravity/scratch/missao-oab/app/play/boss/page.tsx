'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useGameState } from '../../../context/GameStateContext';
import { Swords, Trophy, RotateCcw, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function BossPage() {
  const {
    user,
    bossHp,
    playerHp,
    combaterBoss,
    resetarBatalhaBoss,
    buscarQuestaoDificil // Nova função integrada
  } = useGameState();

  const [questaoAtual, setQuestaoAtual] = useState<any | null>(null);
  const [loadingQuestao, setLoadingQuestao] = useState(true);
  const [batalhaTerminou, setBatalhaTerminou] = useState(false);
  const [alternativaSelecionada, setAlternativaSelecionada] = useState<number | null>(null);
  const [respondido, setRespondido] = useState(false);
  const [acertou, setAcertou] = useState<boolean | null>(null);
  
  // Efeito para carregar a primeira questão
  useEffect(() => {
    carregarNovaQuestao();
    resetarBatalhaBoss();
  }, []);

  const carregarNovaQuestao = async () => {
    setLoadingQuestao(true);
    const q = await buscarQuestaoDificil(4); // Busca dificuldade 4 ou 5
    if (q) {
      setQuestaoAtual(q);
      setRespondido(false);
      setAlternativaSelecionada(null);
      setAcertou(null);
    }
    setLoadingQuestao(false);
  };

  const handleAtacar = () => {
    if (alternativaSelecionada === null || !questaoAtual) return;

    const ehCorreto = alternativaSelecionada === questaoAtual.gabarito;
    setRespondido(true);
    setAcertou(ehCorreto);

    // Dano fixo: 20 se acertar, 0 se errar (ou vice-versa)
    combaterBoss(ehCorreto ? 20 : 0);
    
    // Se o Boss chegar a 0, termina batalha
    if (bossHp - 20 <= 0 && ehCorreto) {
      setBatalhaTerminou(true);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <Link href="/dashboard" className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      {/* Condicional de Carregamento ou Fim de Batalha */}
      {batalhaTerminou ? (
         <div className="bg-slate-900 border border-yellow-500/30 rounded-3xl p-8 text-center animate-in zoom-in">
           <h1 className="text-3xl font-bold text-white mb-4">VITÓRIA!</h1>
           <button onClick={() => window.location.reload()} className="px-6 py-3 bg-brand-600 rounded-xl">Reiniciar</button>
         </div>
      ) : loadingQuestao ? (
        <div className="text-center p-10 text-slate-500">Invocando desafio jurídico...</div>
      ) : (
        <div className="space-y-6">
          {/* Barra de Vida Simplificada */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-950 p-4 rounded-xl border border-red-900/30">
               <span className="text-red-400 text-xs font-bold">BOSS HP: {bossHp}</span>
               <div className="w-full bg-slate-900 h-2 mt-2 rounded-full"><div className="bg-red-600 h-full rounded-full" style={{width: `${bossHp}%`}}/></div>
             </div>
             <div className="bg-slate-950 p-4 rounded-xl border border-brand-900/30">
               <span className="text-brand-400 text-xs font-bold">SEU HP: {playerHp}</span>
               <div className="w-full bg-slate-900 h-2 mt-2 rounded-full"><div className="bg-brand-600 h-full rounded-full" style={{width: `${playerHp}%`}}/></div>
             </div>
          </div>

          {/* Questão */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-bold text-lg">{questaoAtual?.enunciado}</h2>
            
            <div className="space-y-2">
              {questaoAtual?.alternativas.map((alt: string, idx: number) => (
                <button
                  key={idx}
                  disabled={respondido}
                  onClick={() => setAlternativaSelecionada(idx)}
                  className={`w-full p-4 rounded-xl text-left border transition-all ${
                    alternativaSelecionada === idx ? 'border-brand-500 bg-brand-500/10' : 'border-slate-800 bg-slate-950'
                  }`}
                >
                  {alt}
                </button>
              ))}
            </div>

            {!respondido ? (
              <button onClick={handleAtacar} disabled={alternativaSelecionada === null} className="w-full py-4 bg-red-600 rounded-xl font-bold hover:bg-red-500">
                Atacar Chefe
              </button>
            ) : (
              <button onClick={carregarNovaQuestao} className="w-full py-4 bg-slate-800 rounded-xl font-bold">
                Próxima Pergunta
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}