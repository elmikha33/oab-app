'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useGameState } from '../../context/GameStateContext';
import { Crown, Check, ShieldCheck } from 'lucide-react';

export default function PremiumPage() {
  const { user, comprarPremium } = useGameState();
  const [carregando, SetCarregando] = useState(false);
  const [sucesso, SetSucesso] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'success') return;

    if (user.isPremium) {
      SetSucesso(true);
      return;
    }

    const sessionId = params.get('session_id');
    if (!sessionId || sessionId === '{CHECKOUT_SESSION_ID}') {
      setErro('Pagamento ainda nao confirmado pela Stripe.');
      return;
    }

    const confirmedSessionId = sessionId;
    let cancelled = false;

    async function confirmarPagamento() {
      SetCarregando(true);
      setErro('');

      try {
        const response = await fetch(`/api/stripe/verify?session_id=${encodeURIComponent(confirmedSessionId)}`);
        const data = await response.json();

        if (!response.ok || !data.premium) throw new Error(data.error || 'Pagamento ainda nao confirmado.');
        if (cancelled) return;

        comprarPremium();
        SetSucesso(true);
      } catch (error: any) {
        if (!cancelled) setErro(error.message || 'Pagamento ainda nao confirmado.');
      } finally {
        if (!cancelled) SetCarregando(false);
      }
    }

    confirmarPagamento();

    return () => {
      cancelled = true;
    };
  }, [comprarPremium, user]);

  if (!user) return null;

  const handleAssinar = async () => {
    SetCarregando(true);
    setErro('');

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: user.nome,
          email: user.email || undefined,
          userId: user.email || user.nome,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.url) throw new Error(data.error || 'Erro ao abrir checkout.');
      window.location.href = data.url;
    } catch (error: any) {
      setErro(error.message || 'Erro ao abrir checkout.');
      SetCarregando(false);
    }
  };

  return (
    <div className="space-y-6 pb-10 max-w-4xl mx-auto">
      
      {/* 1. TELA DE ASSINATURA REALIZADA COM SUCESSO */}
      {sucesso && (
        <div className="bg-slate-900 border border-yellow-500/30 rounded-3xl p-8 text-center space-y-6 glass-premium glow-purple animate-in zoom-in duration-300">
          <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center mx-auto text-yellow-500 text-4xl animate-bounce">
            👑
          </div>
          <div className="space-y-2">
            <h1 className="font-heading font-extrabold text-3xl text-white">SUA CONTA AGORA É PREMIUM!</h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Parabéns, {user.nome}! Você desbloqueou o poder total do <strong className="text-white">Missão OAB</strong>. Todas as missões, revisões inteligentes e banco de questões ilimitado estão ativos.
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-8 py-3.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-sm transition-all glow-gold"
            >
              Ir para o Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* 2. TELA DE DETALHAMENTO DE PLANOS */}
      {!sucesso && (
        <div className="space-y-6">
          {/* Cabeçalho */}
          <div className="text-center space-y-2 py-4">
            <div className="inline-flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full text-xs font-semibold text-yellow-500">
              <Crown className="h-3.5 w-3.5 fill-yellow-500/20" />
              <span>Assinatura Premium</span>
            </div>
            <h1 className="font-heading font-extrabold text-3xl text-white">Domine o Exame com Poder Máximo</h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Acelere sua aprovação estudando sem limites diários e com estatísticas e revisões geradas por inteligência.
            </p>
          </div>

          {/* Grid de Benefícios e Checkout */}
          <div className="grid md:grid-cols-2 gap-6 items-start">
            
            {/* Benefícios */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <h3 className="font-heading font-bold text-lg text-white">O que você ganha sendo Premium?</h3>
              
              <ul className="space-y-4 text-xs md:text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Questões Ilimitadas</span>
                    <span className="text-slate-400 text-xs">Esqueça o bloqueio de 25 questões por dia. Responda quantas quiser.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Missões Diárias Completas (+4)</span>
                    <span className="text-slate-400 text-xs">Libere missões adicionais para acumular mais XP e subir de nível rápido.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Modo Revisão Inteligente</span>
                    <span className="text-slate-400 text-xs">Algoritmo de repetição espaçada SM-2 que avisa o dia certo de revisar cada tema.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Estatísticas Avançadas</span>
                    <span className="text-slate-400 text-xs">Análise profunda por matéria para identificar seus pontos cegos no edital.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Checkout */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 relative overflow-hidden">
              {user.isPremium ? (
                <div className="text-center space-y-4 py-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-400">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-white text-md">Você já é Assinante Premium!</h3>
                    <p className="text-xs text-slate-400 mt-1">Aproveite todos os benefícios liberados no seu painel.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Assinatura Mensal</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-heading font-extrabold text-3xl text-white">R$ 29,90</span>
                      <span className="text-slate-400 text-xs">/ por mês</span>
                    </div>
                    <p className="text-slate-500 text-[10px]">Cancele quando quiser. Pagamento seguro via Stripe.</p>
                  </div>

                  {erro && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">{erro}</div>}

                  {/* Checkout Stripe */}
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs leading-relaxed text-slate-400">
                      O pagamento abre no checkout seguro da Stripe. Cartao e recibos ficam pela Stripe.
                    </div>

                    <button
                      onClick={handleAssinar}
                      disabled={carregando}
                      className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition-all glow-gold flex items-center justify-center gap-2"
                    >
                      {carregando ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-slate-950/20 border-t-slate-950 animate-spin"></div>
                          <span>Processando Assinatura...</span>
                        </>
                      ) : (
                        <>
                          <Crown className="h-4 w-4" />
                          <span>Assinar Plano Premium</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
