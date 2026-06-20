import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3333';

  if (!secretKey || !priceId) {
    return NextResponse.json(
      { error: 'Stripe nao configurado. Preencha STRIPE_SECRET_KEY e STRIPE_PREMIUM_PRICE_ID.' },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const params = new URLSearchParams({
    mode: 'subscription',
    client_reference_id: body.userId || 'local-user',
    success_url: `${siteUrl}/premium?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/premium?checkout=cancelled`,
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    'metadata[userName]': body.nome || '',
  });

  if (body.email) params.set('customer_email', body.email);

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: data?.error?.message || 'Erro ao criar checkout.' }, { status: 500 });
  }

  return NextResponse.json({ url: data.url });
}
