import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function normalizarEmail(email?: string | null) {
  return String(email || '').trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizarEmail(body?.email);

    if (!email || !email.includes('@')) {
      return NextResponse.json({ exists: false, checked: false });
    }

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ exists: false, checked: false });
    }

    const supabase = createClient(supabaseUrl, serviceKey || anonKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .limit(1);

    if (error) {
      console.warn('Nao foi possivel verificar email.', error.message);
      return NextResponse.json({ exists: false, checked: false });
    }

    return NextResponse.json({
      exists: Boolean(data?.length),
      checked: true,
    });
  } catch (error) {
    console.warn('Erro ao verificar email.', error);
    return NextResponse.json({ exists: false, checked: false });
  }
}
