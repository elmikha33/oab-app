'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Crown, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useGameState } from '@/context/GameStateContext';

function formatarData(data?: string | null) {
  if (!data) return null;

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(data));
  } catch {
    return null;
  }
}

export default function PremiumPage() {
  const { user, loading, refreshUser } = useGameState();

  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const premiumAteFormatado = useMemo(() => formatarData(user?.premium_ate), [user?.premium_ate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('mp') === 'success') {
      setSucesso(true);
      void refreshUser();
    }
  }, [refreshUser]);

  async function handleAssinar() {
    setCarregando(true);
    setErro('');

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        window.location.href = '/auth';
        return;
      }

      const response = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const checkout = await response.json();

      if (!response.ok || !checkout.url) {
        throw new Error(checkout.error || 'Erro ao abrir checkout Mercado Pago.');
      }

      window.location.href = checkout.url;
    } catch (err: any) {
      setErro(err.message || 'Erro ao abrir checkout.');
      setCarregando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-emerald-300">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-8 text-center">
        <h1 className="font-heading text-2xl font-black text-white">Entre para assinar</h1>
        <p className="mt-2 text-sm text-slate-400">
          Voce precisa criar uma conta ou entrar com Google antes de ativar o Premium.
        </p>
        <Link
          href="/auth"
          className="mt-6 inline-flex rounded-2xl bg-emerald-300 px-6 py-3 text-sm font-black text-emerald-950"
        >
          Fazer login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-10 pt-4 md:px-0">
      {sucesso && (
        <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-5 text-center text-sm font-bold text-emerald-100">
          Recebemos seu retorno do Mercado Pago. A liberacao final acontece quando o webhook confirmar o pagamento.
        </div>
      )}

      <header className="space-y-3 py-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
          <Crown className="h-3.5 w-3.5 fill-yellow-500/20" />
          OAPlay Premium
        </span>

        <h1 className="font-heading text-3xl font-extrabold text-white md:text-5xl">
          Sua aprovacao expressa, sem limites
        </h1>

        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-400 md:text-base">
          Assinatura trimestral recorrente. Voce paga R$ 99,90 a cada 3 meses e pode cancelar quando quiser.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_0.9fr]">
        <div className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/20">
          <h3 className="font-heading text-xl font-bold text-white">O que voce ganha no Premium?</h3>

          <ul className="space-y-5 text-sm text-slate-300">
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <span className="block font-bold text-white">Questoes ilimitadas</span>
                <span className="text-xs leading-relaxed text-slate-400">
                  Estude sem limite diario e avance no seu ritmo.
                </span>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <span className="block font-bold text-white">Ciclo completo de 3 meses</span>
                <span className="text-xs leading-relaxed text-slate-400">
                  Ideal para manter constancia ate a prova.
                </span>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <span className="block font-bold text-white">Gamificacao completa</span>
                <span className="text-xs leading-relaxed text-slate-400">
                  Continue evoluindo com ranking, revisao e progresso salvo.
                </span>
              </div>
            </li>
          </ul>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-yellow-400/20 bg-gradient-to-br from-slate-900 via-slate-900 to-yellow-950/30 p-6 shadow-2xl shadow-black/20">
          {user.isPremium ? (
            <div className="space-y-5 py-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-400/10 text-emerald-300">
                <ShieldCheck className="h-8 w-8" />
              </div>

              <div>
                <h3 className="font-heading text-2xl font-black text-white">
                  Premium ativo
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Seu acesso Premium esta liberado
                  {premiumAteFormatado ? ` ate ${premiumAteFormatado}` : ''}.
                </p>
              </div>

              <Link
                href="/dashboard"
                className="inline-flex rounded-2xl bg-emerald-300 px-6 py-3 text-sm font-black text-emerald-950"
              >
                Voltar ao painel
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-yellow-300">
                  Assinatura trimestral
                </span>

                <div className="flex items-end gap-2">
                  <span className="font-heading text-5xl font-extrabold text-white">
                    R$ 99,90
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-300">
                  Cobrado automaticamente a cada 3 meses.
                </p>

                <p className="text-xs leading-relaxed text-slate-500">
                  Pagamento seguro pelo Mercado Pago. Cancele quando quiser.
                </p>
              </div>

              {erro && (
                <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                  {erro}
                </div>
              )}

              <button
                onClick={handleAssinar}
                disabled={carregando}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 py-4 text-sm font-black text-slate-950 shadow-lg shadow-yellow-500/20 transition hover:bg-yellow-300 disabled:opacity-50"
              >
                {carregando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Abrindo Mercado Pago...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4" />
                    Assinar Premium trimestral
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}