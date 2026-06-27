import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Fluxo Stripe desativado. Use Mercado Pago.' },
    { status: 410 }
  );
}
