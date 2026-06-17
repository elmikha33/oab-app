'use client';

import React from 'react';
import { useGameState } from '../../context/GameStateContext';
import { Trophy, Award, ShieldAlert, Zap, Percent, HelpCircle } from 'lucide-react';

export default function RankingPage() {
  const { user, ranking } = useGameState();

  if (!user) return null;

  // Garantir que a lista esteja ordenada por XP semanal
  const rankingOrdenado = [...ranking].sort((a, b) => b.xpSemanal - a.xpSemanal);

  // Separar o Top 3 para exibição em destaque
  const top3 = rankingOrdenado.slice(0, 3);
  const restante = rankingOrdenado.slice(3, 10);

  // Cores de pódio
  const coresPodio = [
    { bg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500', medalha: '🥇', label: '1º Lugar' },
    { bg: 'bg-slate-300/10 border-slate-300/30 text-slate-300', medalha: '🥈', label: '2º Lugar' },
    { bg: 'bg-amber-600/10 border-amber-600/30 text-amber-600', medalha: '🥉', label: '3º Lugar' },
  ];

  return (
    <div className="space-y-6 pb-10">
      
      {/* Cabeçalho */}
      <div className="space-y-1.5">
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-white flex items-center gap-2">
          <Trophy className="h-7 w-7 text-yellow-500" />
          <span>Classificação Semanal</span>
        </h1>
        <p className="text-slate-400 text-sm">
          Compita com outros estudantes de Direito. O ranking zera todo domingo às 23:59. Os top 3 ganham multiplicadores de moedas!
        </p>
      </div>

      {/* Destaque do Top 3 (Pódio) */}
      <div className="grid sm:grid-cols-3 gap-4">
        {top3.map((player, index) => {
          const config = coresPodio[index] || coresPodio[0];
          const ehUsuarioAtual = player.id === user.id;

          return (
            <div 
              key={player.id}
              className={`border rounded-2xl p-5 text-center relative flex flex-col justify-between h-44 transition-all ${config.bg} ${
                ehUsuarioAtual ? 'ring-2 ring-brand-500/30 shadow-lg' : 'bg-slate-900/50'
              }`}
            >
              {/* Medalha flutuante */}
              <span className="text-2xl absolute -top-3 -left-2 transform -rotate-12 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                {config.medalha}
              </span>
              
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
                  {config.label}
                </span>
                <h3 className="font-heading font-extrabold text-md text-white truncate px-2">
                  {player.nome}
                </h3>
                <span className="text-[10px] text-brand-400 font-semibold block">
                  {player.titulo} • Nível {player.nivel}
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl py-2 px-4 mt-2">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">XP Semanal</span>
                <span className="font-heading font-extrabold text-lg text-white">{player.xpSemanal} XP</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabela do Restante do Ranking (Posições 4 a 10) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950/20">
          <h3 className="font-heading font-bold text-sm text-slate-200">Competidores</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 text-center w-16">Posição</th>
                <th className="py-3.5 px-4">Estudante</th>
                <th className="py-3.5 px-4 text-center">Nível</th>
                <th className="py-3.5 px-4 text-right">Questões</th>
                <th className="py-3.5 px-4 text-right">Taxa de Acertos</th>
                <th className="py-3.5 px-4 text-right pr-6">XP Semanal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs">
              {restante.map((player, index) => {
                const posicao = index + 4;
                const ehUsuarioAtual = player.id === user.id;

                return (
                  <tr 
                    key={player.id}
                    className={`transition-colors hover:bg-slate-800/20 ${
                      ehUsuarioAtual ? 'bg-brand-600/10 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-heading font-bold text-slate-400">
                      #{posicao}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="text-slate-200 block">{player.nome}</span>
                        <span className="text-[10px] text-slate-500 block">{player.titulo}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-300">
                      {player.nivel}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300">
                      {player.questoesRespondidas}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300">
                      {Math.round(player.taxaAcerto * 100)}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-heading font-extrabold text-brand-400 pr-6">
                      {player.xpSemanal} XP
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
