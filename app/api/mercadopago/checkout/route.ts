import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mercadoPagoToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function parseMoney(value: string | undefined, fallback: number) {
  if (!value) return fallback;

  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(2)) : fallback;
}

function parseDays(value: string | undefined, fallback: number) {
  if (!value) return fallback;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getBearerToken(request: Request) {
  const header = request.headers.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function getClients() {
  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error('Variaveis Supabase ausentes.');
  }

  return {
    authClient: createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    }),
    adminClient: createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    }),
  };
}

async function registrarPedidoPendente(adminClient: any, order: Record<string, unknown>) {
  const { error } = await adminClient.from('premium_orders').insert(order);

  if (!error) return;

  if (String(error.message || '').includes('mercado_pago_preference_id')) {
    const { mercado_pago_preference_id: _ignored, ...fallbackOrder } = order;
    const retry = await adminClient.from('premium_orders').insert(fallbackOrder);

    if (!retry.error) return;
  }

  console.warn('premium_orders indisponivel para registrar checkout pendente:', error.message);
}

export async function POST(request: Request) {
  try {
    if (!mercadoPagoToken) {
      return NextResponse.json(
        { error: 'MERCADO_PAGO_ACCESS_TOKEN ausente.' },
        { status: 500 }
      );
    }

    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 });
    }

    const { authClient, adminClient } = getClients();
    const { data: authData, error: authError } = await authClient.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Sessao invalida.' }, { status: 401 });
    }

    const user = authData.user;
    const appUrl = siteUrl();
    const unitPrice = parseMoney(process.env.MERCADO_PAGO_TEST_PRICE, 99);
    const premiumDias = parseDays(process.env.PREMIUM_TEST_DAYS, 90);

    const payload = {
      items: [
        {
          title: 'OAPlay Premium Trimestral',
          quantity: 1,
          unit_price: unitPrice,
          currency_id: 'BRL',
        },
      ],
      payer: {
        email: user.email || undefined,
      },
      external_reference: user.id,
      metadata: {
        user_id: user.id,
        email: user.email || '',
        plano: 'premium_trimestral',
        premium_dias: premiumDias,
      },
      notification_url: `${appUrl}/api/mercadopago/webhook`,
      back_urls: {
        success: `${appUrl}/premium?mp=success`,
        failure: `${appUrl}/premium?mp=failure`,
        pending: `${appUrl}/premium?mp=pending`,
      },
      auto_return: 'approved',
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mercadoPagoToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.message || data?.error || 'Erro ao criar checkout Mercado Pago.',
        },
        { status: 500 }
      );
    }

    await registrarPedidoPendente(adminClient, {
      user_id: user.id,
      email: user.email || null,
      valor: unitPrice,
      moeda: 'BRL',
      status: 'pending',
      tipo: 'checkout_pro',
      premium_dias: premiumDias,
      mercado_pago_preference_id: data.id || null,
      raw_event: data,
    });

    return NextResponse.json({
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
      url: data.init_point || data.sandbox_init_point,
      status: 'pending',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro inesperado.',
      },
      { status: 500 }
    );
  }
}
