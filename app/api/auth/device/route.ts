import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Variaveis Supabase ausentes.');
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getToken(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  return auth.replace(/^Bearer\s+/i, '').trim();
}

async function getAuthUser(req: NextRequest) {
  const token = getToken(req);

  if (!token) {
    return { user: null, error: 'Token ausente.' };
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { user: null, error: 'Sessao invalida.' };
  }

  return { user: data.user, error: null };
}

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getAuthUser(req);

    if (error || !user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const deviceId = String(body.deviceId || '').trim();
    const deviceName = String(body.deviceName || 'Dispositivo').trim().slice(0, 120);

    if (!deviceId) {
      return NextResponse.json({ error: 'deviceId ausente.' }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        active_device_id: deviceId,
        active_device_name: deviceName,
        active_device_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      active_device_id: deviceId,
      active_device_name: deviceName,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao registrar dispositivo.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAuthUser(req);

    if (error || !user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const deviceId = String(req.nextUrl.searchParams.get('deviceId') || '').trim();

    if (!deviceId) {
      return NextResponse.json({ error: 'deviceId ausente.' }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('active_device_id, active_device_name, active_device_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const activeDeviceId = profile?.active_device_id || null;

    return NextResponse.json({
      ok: true,
      active: !activeDeviceId || activeDeviceId === deviceId,
      active_device_id: activeDeviceId,
      active_device_name: profile?.active_device_name || null,
      active_device_at: profile?.active_device_at || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao verificar dispositivo.' },
      { status: 500 }
    );
  }
}