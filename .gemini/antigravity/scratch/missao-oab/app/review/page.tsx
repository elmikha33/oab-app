'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGameState } from '../../context/GameStateContext';
import { BookOpen, Star, Sparkles, HelpCircle, CheckCircle, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function ReviewPage() {
  const { user, questoes, responderQuestao, alternarFavoritoRevisao } = useGameState();
  const [sessaoAtiva, SetSessaoAtiva] = useState(false);
  const [indexAtual, SetIndexAtual] = useState(0);
  const [alternativaSelecionada, SetAlternativaSelecionada] = useState<number | null>(null);
  const [respondido, SetRespondido] = useState(false);
  const [feedback, SetFeedback] = useState<{ correta: boolean; xpGanho: number; moedasGanhas: number } | null>(null);

  if (!user) return null;

  // Filtrar as questões que estão na lista de revisão do usuário
  const questoesRevisao = questoes.filter(q => user.revisaoIds.includes(q.id));

  const iniciarRevisao = () => {
    if (questoesRevisao.length === 0) return;
    SetSessaoAtiva(true);
    SetIndexAtual(0);
    SetAlternativaSelecionada(null);
    SetRespondido(false);
    SetFeedback(null);
  };

  const questaoAtual = questoesRevisao[indexAtual];

  const handleResponder = () => {
    if (alternativaSelecionada === null || respondido || !questaoAtual) return;

    const res = responderQuestao(questaoAtual.id, alternativaSelecionada);
    SetRespondido(true);
    SetFeedback({
      correta: res.correta,
      xpGanho: res.xpGanho,
      moedasGanhas: res.moedasGanhas
    });
  };

  const proximaQuestao = () => {
    // Caso o usuário tenha acertado, a questão pode ser removida dinamicamente da fila.
    // Então, precisamos apenas prosseguir.
    if (indexAtual + 1 < questoesRevisao.length) {
      // Se acertou, a lista pode ter encolhido. Mas para manter o fluxo coerente:
      SetIndexAtual(indexAtual + 1);
      SetAlternativaSelecionada(null);
      SetRespondido(false);
      SetFeedback(null);
    } else {
      SetSessaoAtiva(false);
    }
  };

  const letraAlternativa = (index: number) => ['A', 'B', 'C', 'D', 'E'][index];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      
      {/* 1. TELA DE SESSÃO ATIVA */}
      {sessaoAtiva && questaoAtual && (
        <div className="space-y-5">
          {/* Header da Revisão */}
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4">
            <div>
              <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider">Treinamento de Revisão</span>
              <h2 className="font-heading font-extrabold text-md text-white mt-0.5">Questão {indexAtual + 1} de {questoesRevisao.length}</h2>
            </div>
            <button
              onClick={() => SetSessaoAtiva(false)}
              className="text-xs font-bold text-red-400 hover:text-red-300"
            >
              Encerrar Revisão
            </button>
          </div>

          {/* Card da Questão */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800/80">
              <span className="text-slate-400 font-medium">Matéria: <strong className="text-slate-300">{questaoAtual.materia}</strong></span>
              <span className="bg-brand-500/10 text-brand-400 border border-brand-500/25 px-2 py-0.5 rounded font-extrabold text-[10px] uppercase">
                Repetição Espaçada
              </span>
            </div>

            <p className="text-slate-200 text-sm md:text-base leading-relaxed whitespace-pre-line">
              {questaoAtual.enunciado}
            </p>

            {/* Alternativas */}
            <div className="space-y-3">
              {questaoAtual.alternativas.map((alt: string, index: number) => {
                const isSelected = alternativaSelecionada === index;
                const isCorrect = questaoAtual.gabarito === index;
                
                let btnStyle = 'border-slate-800 hover:bg-slate-950 hover:border-slate-700 bg-slate-950/40 text-slate-300';
                let circleStyle = 'border-slate-700 text-slate-500';

                if (isSelected && !respondido) {
                  btnStyle = 'border-brand-500 bg-brand-500/5 text-brand-400';
                  circleStyle = 'border-brand-500 bg-brand-500 text-white';
                }

                if (respondido) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400';
                    circleStyle = 'border-emerald-500 bg-emerald-500 text-slate-950 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'border-red-500/50 bg-red-500/10 text-red-400';
                    circleStyle = 'border-red-500 bg-red-500 text-slate-950 font-bold';
                  } else {
                    btnStyle = 'border-slate-900 bg-slate-950/20 opacity-55 text-slate-500';
                  }
                }

                return (
                  <button
                    key={index}
                    disabled={respondido}
                    onClick={() => SetAlternativaSelecionada(index)}
                    className={`w-full border rounded-xl p-4 text-left flex items-start gap-3 transition-all text-xs md:text-sm ${btnStyle}`}
                  >
                    <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 ${circleStyle}`}>
                      {respondido ? (isCorrect ? '✓' : isSelected ? '✗' : letraAlternativa(index)) : letraAlternativa(index)}
                    </span>
                    <span className="leading-relaxed">{alt}</span>
                  </button>
                );
              })}
            </div>

            {/* Ações */}
            {!respondido && (
              <button
                onClick={handleResponder}
                disabled={alternativaSelecionada === null}
                className="w-full py-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <span>Confirmar Resposta</span>
              </button>
            )}
          </div>

          {/* Feedback e Explicação */}
          {respondido && feedback && (
            <div className="space-y-4">
              <div className={`border rounded-2xl p-5 flex items-center justify-between ${
                feedback.correta 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                <div className="flex items-center gap-3">
                  {feedback.correta ? (
                    <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-heading font-extrabold text-sm md:text-md">
                      {feedback.correta ? 'Domado! Fila atualizada' : 'De volta à masmorra de estudos'}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {feedback.correta 
                        ? 'Você acertou e a questão foi movida para ciclos futuros no sistema.' 
                        : 'A questão permanecerá em sua lista de revisão ativa.'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-yellow-500 block">+{feedback.moedasGanhas} Moedas</span>
                  <span className="text-[10px] text-slate-400 font-semibold">+{feedback.xpGanho} XP</span>
                </div>
              </div>

              {/* Explicação Jurídica */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4.5 w-4.5 text-brand-400" />
                    <h3 className="font-heading font-bold text-sm text-slate-200">Explicação do Tema</h3>
                  </div>

                  <button
                    onClick={() => alternarFavoritoRevisao(questaoAtual.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-500/30 bg-brand-500/20 text-brand-400 text-xs font-semibold"
                  >
                    <Star className="h-3.5 w-3.5 fill-brand-400" />
                    <span>Remover da Revisão</span>
                  </button>
                </div>

                <p className="text-xs md:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {questaoAtual.explicacao}
                </p>
              </div>

              {/* Botão de Prosseguir */}
              <button
                onClick={proximaQuestao}
                className="w-full py-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <span>Avançar</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. TELA DE SESSÃO PREPARATÓRIA (Fila de questões para revisar) */}
      {!sessaoAtiva && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-white">Painel de Revisão</h1>
            <p className="text-slate-400 text-sm">Pratique questões com base na repetição espaçada. Questões erradas vêm para cá automaticamente.</p>
          </div>

          {questoesRevisao.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-white text-lg">Tudo sob controle!</h3>
                <p className="text-xs text-slate-400">
                  Sua masmorra de erros está vazia. Continue respondendo questões no módulo principal para alimentar seu algoritmo inteligente.
                </p>
              </div>
              <Link
                href="/play"
                className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-all inline-block"
              >
                Ir Praticar Questões
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Painel com Botão de Ação */}
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                <div className="space-y-2">
                  <h3 className="font-heading font-bold text-lg text-white">Sua Fila de Treino</h3>
                  <p className="text-xs text-slate-400">
                    Você tem <strong className="text-brand-400 font-bold">{questoesRevisao.length} questões</strong> aguardando revisão. O algoritmo prioriza os erros mais recentes.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Estudo Pendente</span>
                    <span className="font-heading font-extrabold text-xl text-white">{questoesRevisao.length}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Nível do Algoritmo</span>
                    <span className="font-heading font-extrabold text-xl text-brand-400">SM-2</span>
                  </div>
                </div>

                <button
                  onClick={iniciarRevisao}
                  className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all glow-purple"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>Iniciar Sessão de Revisão</span>
                </button>
              </div>

              {/* Lista Detalhada das Questões na Fila */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="font-heading font-bold text-sm text-white">Questões na Fila</h4>
                
                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {questoesRevisao.map((q) => (
                    <div key={q.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[9px] text-brand-400 font-bold block truncate">{q.materia}</span>
                        <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">{q.enunciado}</p>
                      </div>
                      <button
                        onClick={() => alternarFavoritoRevisao(q.id)}
                        className="text-red-400 hover:text-red-300 text-xs shrink-0 pl-1"
                        title="Remover da revisão"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
