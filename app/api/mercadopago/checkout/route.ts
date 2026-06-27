import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mercadoPagoToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
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

    const payload: any = {
      reason: 'OAPlay Premium Trimestral',
      external_reference: user.id,
      payer_email: user.email,
      metadata: {
        user_id: user.id,
        email: user.email || '',
      },
      back_url: `${appUrl}/premium?mp=success`,
      auto_recurring: {
        frequency: 3,
        frequency_type: 'months',
        transaction_amount: 99.9,
        currency_id: 'BRL',
      },
      status: 'pending',
    };

    if (appUrl.startsWith('https://')) {
      payload.notification_url = `${appUrl}/api/mercadopago/webhook`;
    }

    const response = await fetch('https://api.mercadopago.com/preapproval', {
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
          error: data?.message || data?.error || 'Erro ao criar assinatura no Mercado Pago.',
        },
        { status: 500 }
      );
    }

    await adminClient.from('premium_orders').insert({
      user_id: user.id,
      email: user.email || null,
      valor: 99.9,
      moeda: 'BRL',
      status: data.status || 'pending',
      tipo: 'subscription',
      premium_dias: 90,
      mercado_pago_preapproval_id: data.id || null,
      mercado_pago_subscription_id: data.id || null,
      raw_event: data,
    });

    await adminClient
      .from('profiles')
      .update({
        mercado_pago_subscription_id: data.id || null,
        subscription_status: data.status || 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json({
      id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
      url: data.init_point || data.sandbox_init_point,
      status: data.status,
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
