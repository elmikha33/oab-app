import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mercadoPagoToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

function getAdminClient() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Variaveis Supabase ausentes.');
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

async function getData<T = any>(query: PromiseLike<{ data: T; error: any }>) {
  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

async function expectSuccess(query: PromiseLike<{ error: any }>) {
  const { error } = await query;

  if (error) {
    throw error;
  }
}

function addThreeMonthsFrom(baseDate?: string | null) {
  const now = new Date();
  const base =
    baseDate && new Date(baseDate).getTime() > now.getTime()
      ? new Date(baseDate)
      : now;

  base.setMonth(base.getMonth() + 3);
  return base.toISOString();
}

function getPaymentPreapprovalId(payment: any) {
  return (
    payment?.preapproval_id ||
    payment?.point_of_interaction?.transaction_data?.subscription_id ||
    payment?.metadata?.preapproval_id ||
    payment?.metadata?.preapprovalId ||
    null
  );
}

async function mercadoPagoGet(path: string) {
  if (!mercadoPagoToken) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN ausente.');
  }

  const response = await fetch(`https://api.mercadopago.com${path}`, {
    headers: {
      Authorization: `Bearer ${mercadoPagoToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Erro ao consultar Mercado Pago.');
  }

  return data;
}

async function buscarUserIdPorPreapproval(adminClient: any, preapprovalId?: string | null) {
  if (!preapprovalId) return null;

  const order = await getData(
    adminClient
    .from('premium_orders')
    .select('user_id')
    .eq('mercado_pago_preapproval_id', preapprovalId)
    .not('user_id', 'is', null)
    .limit(1)
      .maybeSingle()
  );

  if (order?.user_id) {
    return order.user_id;
  }

  const preapproval = await mercadoPagoGet(`/preapproval/${preapprovalId}`);
  return preapproval?.external_reference || null;
}

async function buscarLiberacaoRecente(adminClient: any, userId: string, preapprovalId?: string | null) {
  if (!preapprovalId) return null;

  const desde = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();

  const data = await getData(
    adminClient
    .from('premium_orders')
    .select('id, paid_at')
    .eq('user_id', userId)
    .eq('mercado_pago_preapproval_id', preapprovalId)
    .in('status', ['authorized', 'approved'])
    .gte('paid_at', desde)
    .limit(1)
      .maybeSingle()
  );

  return data || null;
}

async function ativarPremium(
  adminClient: any,
  userId: string,
  rawEvent: any,
  paymentId?: string | null,
  preapprovalId?: string | null
) {
  const profile = await getData(
    adminClient
    .from('profiles')
    .select('premium_ate')
    .eq('id', userId)
      .maybeSingle()
  );

  const novoPremiumAte = addThreeMonthsFrom(profile?.premium_ate || null);

  await expectSuccess(
    adminClient
    .from('profiles')
    .update({
      is_premium: true,
      premium_ate: novoPremiumAte,
      plano: 'premium_trimestral',
      subscription_status: 'authorized',
      mercado_pago_subscription_id: preapprovalId || rawEvent?.preapproval_id || rawEvent?.id || null,
      updated_at: new Date().toISOString(),
    })
      .eq('id', userId)
  );

  await expectSuccess(adminClient.from('premium_orders').insert({
    user_id: userId,
    email: rawEvent?.payer_email || rawEvent?.payer?.email || null,
    valor: 99.9,
    moeda: 'BRL',
    status: 'approved',
    tipo: 'subscription',
    premium_dias: 90,
    mercado_pago_payment_id: paymentId || rawEvent?.id || null,
    mercado_pago_preapproval_id: preapprovalId || rawEvent?.preapproval_id || rawEvent?.id || null,
    mercado_pago_subscription_id: preapprovalId || rawEvent?.preapproval_id || rawEvent?.id || null,
    raw_event: rawEvent,
    paid_at: new Date().toISOString(),
  }));
}

export async function POST(request: Request) {
  try {
    const adminClient = getAdminClient();
    const url = new URL(request.url);

    const body = await request.json().catch(() => ({}));

    const eventType =
      body?.type ||
      body?.topic ||
      url.searchParams.get('type') ||
      url.searchParams.get('topic') ||
      '';

    const eventId =
      body?.data?.id ||
      body?.id ||
      url.searchParams.get('data.id') ||
      url.searchParams.get('id');

    if (!eventId) {
      return NextResponse.json({ ok: true, ignored: 'sem id' });
    }

    if (String(eventType).includes('preapproval')) {
      const preapproval = await mercadoPagoGet(`/preapproval/${eventId}`);

      const userId = preapproval.external_reference;
      const status = preapproval.status;

      if (userId) {
        await expectSuccess(
          adminClient
          .from('profiles')
          .update({
            mercado_pago_subscription_id: preapproval.id,
            subscription_status: status,
            updated_at: new Date().toISOString(),
          })
            .eq('id', userId)
        );
      }

      await expectSuccess(adminClient.from('premium_orders').insert({
        user_id: userId || null,
        email: preapproval.payer_email || null,
        valor: 99.9,
        moeda: 'BRL',
        status: status || 'unknown',
        tipo: 'subscription',
        premium_dias: 90,
        mercado_pago_preapproval_id: preapproval.id || null,
        mercado_pago_subscription_id: preapproval.id || null,
        raw_event: preapproval,
        paid_at: null,
      }));

      return NextResponse.json({ ok: true });
    }

    if (String(eventType).includes('payment')) {
      const payment = await mercadoPagoGet(`/v1/payments/${eventId}`);

      if (payment.status !== 'approved') {
        return NextResponse.json({ ok: true, status: payment.status });
      }

      const paymentId = String(payment.id);
      const preapprovalId = getPaymentPreapprovalId(payment);

      const existing = await getData(
        adminClient
        .from('premium_orders')
        .select('id')
        .eq('mercado_pago_payment_id', paymentId)
          .maybeSingle()
      );

      if (existing?.id) {
        return NextResponse.json({ ok: true, duplicated: true });
      }

      const userId =
        payment.external_reference ||
        payment.metadata?.user_id ||
        payment.metadata?.userId ||
        (await buscarUserIdPorPreapproval(adminClient, preapprovalId));

      if (userId) {
        const liberacaoRecente = await buscarLiberacaoRecente(adminClient, userId, preapprovalId);

        if (liberacaoRecente?.id) {
          await expectSuccess(
            adminClient
            .from('premium_orders')
            .update({
              status: payment.status || 'approved',
              mercado_pago_payment_id: paymentId,
              raw_event: payment,
            })
              .eq('id', liberacaoRecente.id)
          );

          return NextResponse.json({ ok: true, linked_to_preapproval: true });
        }

        await ativarPremium(adminClient, userId, payment, paymentId, preapprovalId);
      } else {
        await expectSuccess(adminClient.from('premium_orders').insert({
          user_id: null,
          email: payment.payer?.email || null,
          valor: payment.transaction_amount || 99.9,
          moeda: payment.currency_id || 'BRL',
          status: payment.status || 'approved',
          tipo: 'subscription',
          premium_dias: 90,
          mercado_pago_payment_id: paymentId,
          mercado_pago_preapproval_id: preapprovalId || null,
          mercado_pago_subscription_id: preapprovalId || null,
          raw_event: payment,
          paid_at: new Date().toISOString(),
        }));
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, ignored: eventType });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Erro inesperado.',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return NextResponse.json(
    { ok: false, error: 'Metodo nao permitido.' },
    {
      status: 405,
      headers: { Allow: 'POST' },
    }
  );
}
