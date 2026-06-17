'use client';

import React from 'react';
import { useGameState } from '../../context/GameStateContext';
import { MATERIAS } from '../../lib/mockData';
import { TrendingUp, Award, ThumbsUp, ThumbsDown, BookOpen, BarChart3, AlertCircle } from 'lucide-react';

export default function StatsPage() {
  const { user } = useGameState();

  if (!user) return null;

  // Processar estatísticas
  const totalRespondidas = user.questoesRespondidas;
  const totalCorretas = user.questoesCorretas;
  const taxaAcertoGeral = totalRespondidas > 0 
    ? Math.round((totalCorretas / totalRespondidas) * 100) 
    : 0;

  // Calcular estatísticas por matéria
  const statsPorMateria = MATERIAS.map(materia => {
    const acertos = user.acertosPorMateria[materia] || 0;
    const erros = user.errosPorMateria[materia] || 0;
    const total = acertos + erros;
    const taxa = total > 0 ? Math.round((acertos / total) * 100) : 0;

    return { materia, acertos, erros, total, taxa };
  });

  // Filtrar matérias que possuem respostas
  const materiasRespondidas = statsPorMateria.filter(s => s.total > 0);

  // Ordenar para achar a mais forte e mais fraca
  const materiasOrdenadas = [...materiasRespondidas].sort((a, b) => b.taxa - a.taxa);
  const materiaMaisForte = materiasOrdenadas[0] || null;
  const materiaMaisFraca = materiasOrdenadas[materiasOrdenadas.length - 1] || null;

  return (
    <div className="space-y-6 pb-10">
      
      {/* Cabeçalho */}
      <div className="space-y-1.5">
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-white flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-brand-400" />
          <span>Estatísticas de Evolução</span>
        </h1>
        <p className="text-slate-400 text-sm">
          Analise o seu progresso de aprendizado com inteligência de dados de forma simples e direta.
        </p>
      </div>

      {/* Destaques (Cards Superiores) */}
      <div className="grid sm:grid-cols-3 gap-4">
        
        {/* Card Geral */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="bg-brand-500/10 border border-brand-500/20 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-brand-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Taxa de Acerto Geral</span>
            <span className="font-heading font-extrabold text-2xl text-white">{taxaAcertoGeral}%</span>
            <span className="text-[10px] text-slate-500 block">{totalRespondidas} questões resolvidas</span>
          </div>
        </div>

        {/* Matéria Mais Forte */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-emerald-400">
            <ThumbsUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Ponto Mais Forte</span>
            <span className="font-heading font-extrabold text-md text-white truncate max-w-[150px] block">
              {materiaMaisForte ? materiaMaisForte.materia : 'Sem dados ainda'}
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold block">
              {materiaMaisForte ? `${materiaMaisForte.taxa}% de acertos` : 'Responda questões para calibrar'}
            </span>
          </div>
        </div>

        {/* Matéria Mais Fraca */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="bg-red-500/10 border border-red-500/20 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-red-400">
            <ThumbsDown className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Precisa de Atenção</span>
            <span className="font-heading font-extrabold text-md text-white truncate max-w-[150px] block">
              {materiaMaisFraca ? materiaMaisFraca.materia : 'Sem dados ainda'}
            </span>
            <span className="text-[10px] text-red-400 font-semibold block">
              {materiaMaisFraca ? `${materiaMaisFraca.taxa}% de acertos` : 'Identificamos seus pontos fracos'}
            </span>
          </div>
        </div>

      </div>

      {/* Grid Inferior: Gráficos e Detalhamento por Disciplina */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Desempenho Detalhado por Disciplina (Largura 2/3) */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-heading font-bold text-lg text-white">Desempenho por Disciplina</h3>
          
          <div className="space-y-4">
            {statsPorMateria.map((stat) => (
              <div key={stat.materia} className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-200">{stat.materia}</span>
                  <span className="text-slate-400">{stat.taxa}% ({stat.acertos} acertos / {stat.total} resolvidas)</span>
                </div>
                
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      stat.taxa >= 70 
                        ? 'bg-emerald-500' 
                        : stat.taxa >= 50
                          ? 'bg-yellow-500'
                          : stat.total === 0 
                            ? 'bg-slate-800'
                            : 'bg-red-500'
                    }`}
                    style={{ width: `${stat.total > 0 ? stat.taxa : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de Evolução de Aprendizado (Largura 1/3) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-lg text-white">Evolução Mensal</h3>
            <p className="text-slate-500 text-[10px]">Evolução estimada da taxa de acertos nos últimos 5 meses.</p>
          </div>

          {/* Gráfico SVG de Alto Desempenho */}
          <div className="my-6 flex justify-center">
            <svg viewBox="0 0 200 100" className="w-full max-w-[250px] overflow-visible">
              {/* Linhas de Grade de Fundo */}
              <line x1="0" y1="20" x2="200" y2="20" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
              <line x1="0" y1="50" x2="200" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
              <line x1="0" y1="80" x2="200" y2="80" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
              
              {/* Caminho da Linha de Evolução */}
              <path
                d="M 10,80 Q 50,60 100,55 T 190,30"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2.5"
                className="drop-shadow-[0_2px_4px_rgba(139,92,246,0.3)]"
              />

              {/* Pontos de Dados */}
              <circle cx="10" cy="80" r="3" fill="#8b5cf6" />
              <circle cx="50" cy="65" r="3" fill="#8b5cf6" />
              <circle cx="100" cy="55" r="3" fill="#8b5cf6" />
              <circle cx="150" cy="40" r="3" fill="#8b5cf6" />
              <circle cx="190" cy="30" r="4" fill="#fbbf24" className="animate-pulse" />

              {/* Rótulos dos Pontos */}
              <text x="10" y="93" fill="#64748b" fontSize="8" textAnchor="middle">M1</text>
              <text x="50" y="93" fill="#64748b" fontSize="8" textAnchor="middle">M2</text>
              <text x="100" y="93" fill="#64748b" fontSize="8" textAnchor="middle">M3</text>
              <text x="150" y="93" fill="#64748b" fontSize="8" textAnchor="middle">M4</text>
              <text x="190" y="93" fill="#fbbf24" fontSize="8" fontWeight="bold" textAnchor="middle">Hoje</text>

              {/* Rótulo de Valor Máximo */}
              <text x="190" y="22" fill="#fbbf24" fontSize="7" fontWeight="bold" textAnchor="middle">{taxaAcertoGeral}%</text>
            </svg>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Dica: Mantenha a constância! Alunos que treinam diariamente aumentam a curva de retenção de conteúdo jurídico em até 37% nas primeiras 4 semanas.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
