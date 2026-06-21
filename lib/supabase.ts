import {
  createBrowserClient,
  createServerClient,
} from '@supabase/ssr';
import type { Database } from '@/types/supabase'; // opcional, se você tiver gerado tipos

/*────────────────────────── Variáveis .env ──────────────────────────*/
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/*────────────────────────── Browser singleton ───────────────────────
  ‣ Mantém uma única instância entre hot-reloads em dev                */
const _browser =
  typeof window !== 'undefined'
    ? (globalThis as any).__sbBrowser ??
      createBrowserClient<Database>(url, key)
    : null;

if (typeof window !== 'undefined') {
  (globalThis as any).__sbBrowser = _browser;
}

/* Export compatível com componentes client já existentes */
export const supabase = _browser!;
export const supabaseBrowser = _browser;

/*────────────────────────── Server helper ────────────────────────────
  ‣ Use em rotas API ou Server Actions:                                  
      const supabase = getSupabaseServer(headers);                       */
export const getSupabaseServer = (headers: Headers) =>
  createServerClient<Database>(url, key, {
    cookies: {
      get: (name) => {
        const match = headers.get('cookie')?.match(
          new RegExp(`${name}=([^;]+)`)
        );
        return match?.[1];
      },
    },
  });