'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useGameState } from '../../context/GameStateContext';
import { Crown, Check, ShieldCheck } from 'lucide-react';

export default function PremiumPage() {
  const { user, comprarPremium } = useGameState();
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  /* ─────────────────────────── Verificação Stripe ─────────────────────────── */
  useEffect(() => {
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'success') return;

    if (user.isPremium) {
      setSucesso(true);
      return;
    }

    const sessionId = params.get('session_id');
    if (!sessionId || sessionId === '{CHECKOUT_SESSION_ID}') {
      setErro('Pagamento ainda não confirmado pela Stripe.');
      return;
    }

    let cancelled = false;
    (async () => {
      setCarregando(true);
      setErro('');

      try {
        const res = await fetch(`/api/stripe/verify?session_id=${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        if (!res.ok || !data.premium) throw new Error(data.error || 'Pagamento ainda não confirmado.');

        if (!cancelled) {
          comprarPremium();
          setSucesso(true);
        }
      } catch (err: any) {
        if (!cancelled) setErro(err.message || 'Pagamento ainda não confirmado.');
      } finally {
        if (!cancelled) setCarregando(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [comprarPremium, user]);

  /* ─────────────────────────── Inicialização Stripe ─────────────────────────── */
  const handleAssinar = async () => {
    setCarregando(true);
    setErro('');
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: user!.nome,
          email: user!.email || undefined,
          userId: user!.email || user!.nome,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || 'Erro ao abrir checkout.');
      window.location.href = data.url;
    } catch (err: any) {
      setErro(err.message || 'Erro ao abrir checkout.');
      setCarregando(false);
    }
  };

  if (!user) return null;

  /* ─────────────────────────── JSX ─────────────────────────── */
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* 1. Sucesso */}
      {sucesso && (
        <div className="glass-premium glow-purple animate-in zoom-in duration-300 rounded-3xl bg-slate-900 border border-yellow-500/30 p-8 text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-yellow-500/10 text-4xl text-yellow-500">
            👑
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-extrabold text-white">SUA CONTA AGORA É PREMIUM!</h1>
            <p className="mx-auto max-w-md text-sm text-slate-400">
              Parabéns, {user.nome}! Você desbloqueou o poder total do <strong className="text-white">Legl</strong>.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="glow-gold mx-auto inline-block rounded-xl bg-yellow-500 px-8 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-yellow-400"
          >
            Ir para o Dashboard
          </Link>
        </div>
      )}

      {/* 2. Plano */}
      {!sucesso && (
        <div className="space-y-6">
          <header className="space-y-2 py-4 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-500">
              <Crown className="h-3.5 w-3.5 fill-yellow-500/20" />
              Assinatura Premium
            </span>
            <h1 className="font-heading text-3xl font-extrabold text-white">Domine o Exame com Poder Máximo</h1>
            <p className="mx-auto max-w-md text-sm text-slate-400">
              Acelere sua aprovação estudando sem limites diários e com relatórios gerados por inteligência.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Benefícios */}
            <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="font-heading text-lg font-bold text-white">O que você ganha sendo Premium?</h3>

              <ul className="space-y-4 text-xs text-slate-300 md:text-sm">
                {/* 1 */}
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <div>
                    <span className="block font-semibold text-white">Questões Ilimitadas</span>
                    <span className="text-xs text-slate-400">
                      Estude sem limites — responda quantas questões quiser, a qualquer hora.
                    </span>
                  </div>
                </li>
                {/* 2 */}
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <div>
                    <span className="block font-semibold text-white">Acelere seus Estudos</span>
                    <span className="text-xs text-slate-400">
                      Missões extras diárias para acumular XP e subir de nível mais rápido.
                    </span>
                  </div>
                </li>
                {/* 3 */}
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <div>
                    <span className="block font-semibold text-white">Relatórios de Progresso</span>
                    <span className="text-xs text-slate-400">
                      Estatísticas detalhadas de acertos, erros e tempo médio por questão.
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Checkout / Estado */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6">
              {user.isPremium ? (
                <div className="space-y-4 py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-md font-bold text-white">Você já é Assinante Premium!</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Aproveite todos os benefícios liberados no seu painel.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <span className="block text-[10px] font-bold uppercase text-slate-500">Assinatura Mensal</span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-heading text-3xl font-extrabold text-white">R$ 29,90</span>
                      <span className="text-xs text-slate-400">/ por mês</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Cancele quando quiser. Pagamento via Stripe.</p>
                  </div>

                  {erro && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                      {erro}
                    </div>
                  )}

                  <div className="space-y-4 pt-4">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400">
                      O pagamento abre no checkout seguro da Stripe.
                    </div>

                    <button
                      onClick={handleAssinar}
                      disabled={carregando}
                      className="glow-gold flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-500
                                 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-yellow-400 disabled:opacity-50"
                    >
                      {carregando ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-slate-950 border-slate-950/20" />
                          <span>Processando...</span>
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
