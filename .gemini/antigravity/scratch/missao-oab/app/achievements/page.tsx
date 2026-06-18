'use client';

import React from 'react';
import { useGameState } from '../../context/GameStateContext';
import { 
  Flame, 
  Target, 
  BookOpen, 
  Calendar, 
  Shield, 
  Scale, 
  Globe, 
  Lock, 
  CheckCircle2,
  Award
} from 'lucide-react';

export default function AchievementsPage() {
  const { user, conquistas } = useGameState();

  if (!user) return null;

  // Mapa de nomes de ícones para componentes do Lucide
  const mapaIcones: Record<string, React.ComponentType<any>> = {
    Flame: Flame,
    Target: Target,
    BookOpen: BookOpen,
    Calendar: Calendar,
    Shield: Shield,
    Scale: Scale,
    Globe: Globe
  };

  const totalConquistas = conquistas.length;
  const conquistasDesbloqueadasCount = user.conquistasDesbloqueadas.length;
  const progressoPercent = totalConquistas > 0 
    ? Math.round((conquistasDesbloqueadasCount / totalConquistas) * 100) 
    : 0;

  return (
    <div className="space-y-6 pb-10">
      
      {/* Cabeçalho e Progresso Geral */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 glass-premium">
        <div className="space-y-1">
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-white flex items-center gap-2">
            <Award className="h-8 w-8 text-brand-400" />
            <span>Sala de Conquistas</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Seus marcos e conquistas heroicas na preparação OAB. Complete desafios para destravar insígnias.
          </p>
        </div>

        {/* Card de Progresso */}
        <div className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 shrink-0">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span>Desbloqueado</span>
            <span>{conquistasDesbloqueadasCount} / {totalConquistas} ({progressoPercent}%)</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-brand-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${progressoPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid de Medalhas */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {conquistas.map((badge) => {
          const desbloqueado = user.conquistasDesbloqueadas.includes(badge.id);
          const IconeComp = mapaIcones[badge.icone] || Award;

          return (
            <div
              key={badge.id}
              className={`border rounded-2xl p-5 flex gap-4 transition-all relative ${
                desbloqueado
                  ? 'bg-slate-900 border-brand-500/20 glow-purple'
                  : 'bg-slate-900/40 border-slate-900/80 opacity-60'
              }`}
            >
              {/* Ícone da Medalha */}
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                desbloqueado
                  ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                  : 'bg-slate-950 border-slate-850 text-slate-600'
              }`}>
                {desbloqueado ? (
                  <IconeComp className="h-6 w-6 animate-pulse" />
                ) : (
                  <Lock className="h-5 w-5" />
                )}
              </div>

              {/* Detalhes */}
              <div className="space-y-1 min-w-0 pr-6">
                <h3 className={`font-heading font-bold text-sm truncate ${desbloqueado ? 'text-white' : 'text-slate-400'}`}>
                  {badge.titulo}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {badge.descricao}
                </p>

                {/* Recompensa */}
                <div className="flex items-center gap-3 text-[10px] font-semibold pt-1 text-yellow-500/80">
                  <span>Recompensa: +{badge.xpRecompensa} XP</span>
                  <span>🪙 +{badge.moedasRecompensa}</span>
                </div>
              </div>

              {/* Selo Desbloqueado */}
              {desbloqueado && (
                <div className="absolute top-3 right-3 text-emerald-500" title="Conquistado!">
                  <CheckCircle2 className="h-5 w-5 fill-emerald-500/10" />
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
