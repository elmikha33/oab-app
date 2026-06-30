import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const ALLOWED_EVENTS = new Set([
  'landing_view',
  'demo_cta_click',
  'demo_view',
  'demo_answer',
  'demo_completed',
  'signup_cta_click',
]);

const SENSITIVE_KEY_PATTERN = /(authorization|cookie|email|name|nome|password|senha|phone|telefone|token|cpf)/i;

function ok(extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: true, ...extra });
}

function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function cleanString(value: unknown, maxLength = 500) {
  if (typeof value !== 'string') return null;

  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!cleaned) return null;

  return cleaned.slice(0, maxLength);
}

function cleanPath(value: unknown) {
  const text = cleanString(value, 500);
  if (!text) return null;

  try {
    const url = new URL(text);
    return url.pathname.slice(0, 500);
  } catch {
    const path = text.split('?')[0]?.split('#')[0] || '';
    if (!path) return null;
    return path.startsWith('/') ? path.slice(0, 500) : `/${path.slice(0, 499)}`;
  }
}

function cleanUrlWithoutQuery(value: unknown) {
  const text = cleanString(value, 1000);
  if (!text) return null;

  try {
    const url = new URL(text);
    return `${url.origin}${url.pathname}`.slice(0, 1000);
  } catch {
    return null;
  }
}

function cleanMetadataValue(value: unknown, depth: number): unknown {
  if (typeof value === 'string') return cleanString(value, 240);
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value;
  if (value === null) return null;

  if (Array.isArray(value)) {
    return value.slice(0, 10).map((item) => cleanMetadataValue(item, depth + 1));
  }

  if (typeof value === 'object' && depth < 2) {
    return cleanMetadata(value, depth + 1);
  }

  return null;
}

function cleanMetadata(value: unknown, depth = 0) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const output: Record<string, unknown> = {};

  for (const [rawKey, rawValue] of Object.entries(value).slice(0, 30)) {
    const key = cleanString(rawKey, 80);
    if (!key || SENSITIVE_KEY_PATTERN.test(key)) continue;

    const cleanedValue = cleanMetadataValue(rawValue, depth);
    if (cleanedValue === undefined) continue;

    output[key] = cleanedValue;
  }

  const serialized = JSON.stringify(output);
  if (serialized.length > 4096) {
    return { truncated: true };
  }

  return Object.keys(output).length ? output : null;
}

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);

    return originUrl.host === requestUrl.host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ ok: false, error: 'Origem invalida.' }, { status: 403 });
    }

    const body = await readJson(request);
    const eventName = cleanString((body as { event_name?: unknown } | null)?.event_name, 80);

    if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json({ ok: false, error: 'Evento invalido.' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) return ok({ skipped: true });

    const path = cleanPath((body as { path?: unknown })?.path);
    const referrer =
      cleanUrlWithoutQuery((body as { referrer?: unknown })?.referrer) ||
      cleanUrlWithoutQuery(request.headers.get('referer'));
    const userAgent = cleanString(request.headers.get('user-agent'), 500);
    const metadata = cleanMetadata((body as { metadata?: unknown })?.metadata);

    const { error } = await supabase.from('demo_events').insert({
      event_name: eventName,
      path,
      referrer,
      user_agent: userAgent,
      metadata,
    });

    if (error) {
      console.warn('[api:demo-events] tracking ignorado', error.message);
      return ok({ skipped: true });
    }

    return ok();
  } catch (error) {
    console.warn('[api:demo-events] tracking ignorado', error);
    return ok({ skipped: true });
  }
}
