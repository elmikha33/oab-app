import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!secretKey) {
    return NextResponse.json({ error: 'STRIPE_SECRET_KEY ausente.' }, { status: 500 });
  }

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id ausente.' }, { status: 400 });
  }

  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  const session = await response.json();

  if (!response.ok) {
    return NextResponse.json({ error: session?.error?.message || 'Pagamento nao encontrado.' }, { status: 400 });
  }

  const premium = session.status === 'complete' && session.payment_status === 'paid';

  return NextResponse.json({
    premium,
    status: session.status,
    paymentStatus: session.payment_status,
    subscriptionId: session.subscription || null,
  });
}
