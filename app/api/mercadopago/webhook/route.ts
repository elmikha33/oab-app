import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mercadoPagoToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

function webhookLog(message: string, details?: Record<string, unknown>) {
  console.log('[mercadopago:webhook]', message, details || {});
}

function webhookWarn(message: string, details?: Record<string, unknown>) {
  console.warn('[mercadopago:webhook]', message, details || {});
}

function getAdminClient() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Variaveis Supabase ausentes.');
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

function parseDays(value: unknown, fallback = 90) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseMoney(value: string | undefined, fallback: number) {
  const parsed = value ? Number(value) : fallback;

  return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(2)) : fallback;
}

function premiumAteFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function extractPaymentId(body: any, url: URL) {
  const explicitId =
    body?.data?.id ||
    body?.id ||
    url.searchParams.get('data.id') ||
    url.searchParams.get('id');

  if (explicitId) return String(explicitId);

  const resource = String(body?.resource || url.searchParams.get('resource') || '');
  const match = resource.match(/\/payments\/(\d+)/);
  return match?.[1] || null;
}

function isPaymentNotification(body: any, url: URL) {
  const eventType = String(
    body?.type ||
      body?.topic ||
      body?.action ||
      url.searchParams.get('type') ||
      url.searchParams.get('topic') ||
      ''
  ).toLowerCase();

  const resource = String(body?.resource || url.searchParams.get('resource') || '').toLowerCase();

  return eventType.includes('payment') || resource.includes('/payments/');
}

function eventInfo(body: any, url: URL) {
  return {
    type: body?.type || url.searchParams.get('type') || null,
    action: body?.action || null,
    topic: body?.topic || url.searchParams.get('topic') || null,
  };
}

function isSimulatorOrTestPayment(body: any, paymentId: string | null) {
  return paymentId === '123456' || body?.data?.id === '123456' || body?.live_mode === false;
}

function isApprovedPayment(payment: any) {
  const status = String(payment?.status || '').toLowerCase();
  const statusDetail = String(payment?.status_detail || '').toLowerCase();

  return status === 'approved' || statusDetail === 'accredited';
}

function isUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '')
  );
}

function validarPagamentoPremium(payment: any, metadata: any, userId: string) {
  const plano = String(metadata?.plano || '').trim();
  const moeda = String(payment?.currency_id || '').trim().toUpperCase();
  const valorPago = Number(payment?.transaction_amount);
  const valorEsperado = parseMoney(process.env.MERCADO_PAGO_TEST_PRICE, 99);

  if (!isUuid(userId)) {
    return { ok: false, reason: 'invalid_user_id' };
  }

  if (plano !== 'premium_trimestral') {
    return { ok: false, reason: 'invalid_plan' };
  }

  if (moeda !== 'BRL') {
    return { ok: false, reason: 'invalid_currency' };
  }

  if (!Number.isFinite(valorPago) || valorPago + 0.001 < valorEsperado) {
    return { ok: false, reason: 'invalid_amount' };
  }

  return { ok: true, reason: 'valid' };
}

async function readMercadoPagoBody(response: Response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function mercadoPagoGetPayment(paymentId: string) {
  if (!mercadoPagoToken) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN ausente.');
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Bearer ${mercadoPagoToken}`,
    },
  });

  const data = await readMercadoPagoBody(response);

  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      message: data?.message || data?.error || 'Erro ao consultar Mercado Pago.',
      data,
    };
  }

  return { ok: true as const, data };
}

async function paymentAlreadyProcessed(adminClient: any, paymentId: string) {
  const { data, error } = await adminClient
    .from('premium_orders')
    .select('id')
    .eq('mercado_pago_payment_id', paymentId)
    .maybeSingle();

  if (error) {
    console.warn('premium_orders indisponivel para verificar idempotencia:', error.message);
    return false;
  }

  return Boolean(data?.id);
}

async function registrarPedido(adminClient: any, order: Record<string, unknown>) {
  const { error } = await adminClient.from('premium_orders').insert(order);

  if (!error) return;

  if (String(error.message || '').includes('mercado_pago_preference_id')) {
    const { mercado_pago_preference_id: _ignored, ...fallbackOrder } = order;
    const retry = await adminClient.from('premium_orders').insert(fallbackOrder);

    if (!retry.error) return;
  }

  console.warn('premium_orders indisponivel para registrar pagamento:', error.message);
}

async function atualizarPedidoPendente(adminClient: any, preferenceId: string | null, paymentId: string, payment: any) {
  if (!preferenceId) return false;

  const { data, error } = await adminClient
    .from('premium_orders')
    .update({
      status: payment.status || 'approved',
      mercado_pago_payment_id: paymentId,
      raw_event: payment,
      paid_at: new Date().toISOString(),
    })
    .eq('mercado_pago_preference_id', preferenceId)
    .is('mercado_pago_payment_id', null)
    .select('id');

  if (error) {
    console.warn('premium_orders indisponivel para atualizar pedido pendente:', error.message);
    return false;
  }

  return Array.isArray(data) && data.length > 0;
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const info = eventInfo(body, url);
    const eventId = extractPaymentId(body, url);
    const simulatorOrTestPayment = isSimulatorOrTestPayment(body, eventId);

    webhookLog('webhook recebido', {
      type: info.type,
      action: info.action,
      topic: info.topic,
      payment_id: eventId,
      live_mode: body?.live_mode ?? null,
    });

    if (!isPaymentNotification(body, url)) {
      webhookLog('evento ignorado: nao e notificacao de pagamento', {
        type: info.type,
        action: info.action,
        topic: info.topic,
      });

      return NextResponse.json({ ok: true, ignored: true });
    }

    if (!eventId) {
      webhookWarn('evento ignorado: sem payment id', {
        type: info.type,
        action: info.action,
        topic: info.topic,
      });

      return NextResponse.json({ ok: true, ignored: 'sem payment id' });
    }

    let paymentResult: Awaited<ReturnType<typeof mercadoPagoGetPayment>>;

    try {
      paymentResult = await mercadoPagoGetPayment(eventId);
    } catch (error) {
      if (simulatorOrTestPayment) {
        webhookWarn('simulador/teste ignorado: nao foi possivel consultar pagamento real', {
          payment_id: eventId,
          reason: 'simulator_or_test_payment',
          message: error instanceof Error ? error.message : 'Erro ao consultar Mercado Pago.',
        });

        return NextResponse.json({
          ok: true,
          ignored: true,
          reason: 'simulator_or_test_payment',
        });
      }

      throw error;
    }

    if (!paymentResult.ok) {
      const reason = simulatorOrTestPayment
        ? 'simulator_or_test_payment'
        : 'mercado_pago_payment_lookup_failed';

      webhookWarn('pagamento nao encontrado/indisponivel no Mercado Pago', {
        payment_id: eventId,
        mercado_pago_status: paymentResult.status,
        reason,
        message: paymentResult.message,
      });

      return NextResponse.json({ ok: true, ignored: true, reason });
    }

    const payment = paymentResult.data;
    const paymentId = String(payment.id || eventId);
    const metadata = payment.metadata || {};
    const userId =
      payment.external_reference ||
      metadata.user_id ||
      metadata.userId ||
      null;
    const email = metadata.email || payment.payer?.email || null;

    webhookLog('pagamento consultado no Mercado Pago', {
      payment_id: paymentId,
      status: payment.status || null,
      status_detail: payment.status_detail || null,
      user_id: userId,
      email,
    });

    if (!isApprovedPayment(payment)) {
      webhookLog('pagamento ignorado: ainda nao aprovado', {
        payment_id: paymentId,
        status: payment.status || null,
        status_detail: payment.status_detail || null,
      });

      return NextResponse.json({
        ok: true,
        ignored: true,
        status: payment.status || 'unknown',
        status_detail: payment.status_detail || null,
      });
    }

    if (!userId) {
      const adminClient = getAdminClient();

      await registrarPedido(adminClient, {
        user_id: null,
        email,
        valor: payment.transaction_amount || null,
        moeda: payment.currency_id || 'BRL',
        status: payment.status,
        tipo: 'checkout_pro',
        premium_dias: parseDays(metadata.premium_dias || metadata.premiumDias || process.env.PREMIUM_TEST_DAYS),
        mercado_pago_payment_id: paymentId,
        mercado_pago_preference_id: payment.preference_id || null,
        raw_event: payment,
        paid_at: new Date().toISOString(),
      });

      webhookWarn('pagamento aprovado ignorado: sem user_id', {
        payment_id: paymentId,
        status: payment.status || null,
        email,
      });

      return NextResponse.json({ ok: true, ignored: 'pagamento aprovado sem user_id' });
    }

    const validacaoPremium = validarPagamentoPremium(payment, metadata, String(userId));

    if (!validacaoPremium.ok) {
      webhookWarn('pagamento aprovado ignorado: validacao premium falhou', {
        payment_id: paymentId,
        reason: validacaoPremium.reason,
        status: payment.status || null,
        status_detail: payment.status_detail || null,
        user_id: userId,
        email,
      });

      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: validacaoPremium.reason,
      });
    }

    const adminClient = getAdminClient();
    const duplicated = await paymentAlreadyProcessed(adminClient, paymentId);

    if (duplicated) {
      webhookLog('pagamento ignorado: evento duplicado', {
        payment_id: paymentId,
        status: payment.status || 'approved',
      });

      return NextResponse.json({ ok: true, duplicated: true });
    }

    const premiumDias = parseDays(metadata.premium_dias || metadata.premiumDias || process.env.PREMIUM_TEST_DAYS);
    const premiumAte = premiumAteFromNow(premiumDias);

    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        is_premium: true,
        premium_ate: premiumAte,
        plano: 'premium_trimestral',
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    const preferenceId = payment.preference_id || null;

    const updatedPendingOrder = await atualizarPedidoPendente(adminClient, preferenceId, paymentId, payment);

    if (!updatedPendingOrder) {
      await registrarPedido(adminClient, {
        user_id: userId,
        email,
        valor: payment.transaction_amount || 99,
        moeda: payment.currency_id || 'BRL',
        status: 'approved',
        tipo: 'checkout_pro',
        premium_dias: premiumDias,
        mercado_pago_payment_id: paymentId,
        mercado_pago_preference_id: preferenceId,
        raw_event: payment,
        paid_at: new Date().toISOString(),
      });
    }

    webhookLog('premium ativado', {
      payment_id: paymentId,
      status: payment.status || 'approved',
      status_detail: payment.status_detail || null,
      user_id: userId,
      email,
      premium_ate: premiumAte,
    });

    return NextResponse.json({ ok: true, premium: true });
  } catch (error) {
    console.error('[mercadopago:webhook] erro interno inesperado', error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Erro inesperado.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: 'Metodo nao permitido.' },
    {
      status: 405,
      headers: { Allow: 'POST' },
    }
  );
}
