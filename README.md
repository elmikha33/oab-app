# OAPlay

## Setup rapido

1. Instale as dependencias:
   ```bash
   pnpm install
   ```

2. Crie o `.env.local` a partir do exemplo:
   ```bash
   copy .env.example .env.local
   ```

3. Configure as variaveis obrigatorias para Premium com Mercado Pago:
   ```bash
   NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
   MERCADO_PAGO_ACCESS_TOKEN=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

4. Rode localmente:
   ```bash
   pnpm.cmd run dev
   ```

5. Build de producao:
   ```bash
   pnpm.cmd run build
   ```
