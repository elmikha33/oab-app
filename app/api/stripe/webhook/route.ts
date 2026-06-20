import crypto from 'crypto';
import { NextResponse } from 'next/server';

function isValidStripeSignature(payload: string, signature: string | null, secret: string) {
  if (!signature) return false;

  const timestamp = signature.match(/t=([^,]+)/)?.[1];
  const expected = signature.match(/v1=([^,]+)/)?.[1];
  if (!timestamp || !expected) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const digest = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

  if (digest.length !== expected.length) return false;

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(expected));
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = await request.text();

  if (!webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET ausente.' }, { status: 500 });
  }

  if (!isValidStripeSignature(payload, request.headers.get('stripe-signature'), webhookSecret)) {
    return NextResponse.json({ error: 'Assinatura invalida.' }, { status: 400 });
  }

  const event = JSON.parse(payload);

  if (event.type === 'checkout.session.completed') {
    console.log('Checkout premium pago:', event.data.object.id);
  }

  return NextResponse.json({ received: true });
}
