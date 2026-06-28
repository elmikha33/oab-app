Você está no projeto OAPlay.

Projeto:
- Next.js 14 + React + Tailwind + Supabase + Mercado Pago.
- Caminho:
  C:\Users\Miche\.gemini\antigravity\scratch\oab-app
- Produto:
  OAPlay Premium Trimestral
  R$ 99,00 por 3 meses
- Para teste, permitir preço temporário R$ 5,00 via variável.

MISSÃO:
Configurar/testar/corrigir Mercado Pago para ativar Premium automaticamente após pagamento aprovado.

NÃO FAZER:
- Não mexer no visual.
- Não mexer em dashboard/sidebar/mobile.
- Não refatorar o app inteiro.
- Não fazer commit.
- Não fazer push.
- Não expor secrets no client.
- Não usar service role no front-end.

ARQUIVOS OBRIGATÓRIOS:
- app/premium/page.tsx
- app/api/mercadopago/checkout/route.ts
- app/api/mercadopago/webhook/route.ts
- app/api/auth/profile/route.ts
- context/GameStateContext.tsx
- lib/supabase.ts
- package.json

OBJETIVO FUNCIONAL:
1. Usuário logado clica no botão Premium.
2. Front chama /api/mercadopago/checkout.
3. Checkout exige usuário autenticado.
4. API cria uma preference do Checkout Pro.
5. Preference deve ter:
   - title: OAPlay Premium Trimestral
   - quantity: 1
   - unit_price: 99.00 por padrão
   - se MERCADO_PAGO_TEST_PRICE existir, usar esse valor
   - external_reference com user_id
   - metadata com:
     - user_id
     - email
     - plano = premium_trimestral
     - premium_dias = 90 ou PREMIUM_TEST_DAYS se existir
   - notification_url = NEXT_PUBLIC_SITE_URL + /api/mercadopago/webhook
   - back_urls para success/failure/pending, usando NEXT_PUBLIC_SITE_URL
6. Retornar init_point ou sandbox_init_point corretamente para o front.
7. Usuário paga no Mercado Pago.
8. Webhook recebe notificação.
9. Webhook NÃO confia cegamente no payload.
10. Webhook busca o pagamento na API do Mercado Pago usando MERCADO_PAGO_ACCESS_TOKEN no servidor.
11. Webhook só ativa Premium se pagamento estiver aprovado.
12. Webhook atualiza public.profiles:
   - is_premium = true
   - premium_ate = now() + premium_dias
   - plano = premium_trimestral
   - subscription_status = active
   - updated_at = now()
13. Webhook deve ser idempotente:
   - se receber o mesmo evento mais de uma vez, não quebrar
   - se existir premium_orders, registrar payment_id/status
   - se não existir tabela, informar SQL recomendado
14. /api/auth/profile precisa ler o Premium real do Supabase.
15. GameState/refreshUser precisa refletir Premium atualizado.
16. Usuário Premium não pode cair no limite diário de 5 questões.

VARIÁVEIS ESPERADAS NA VERCEL:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- MERCADO_PAGO_ACCESS_TOKEN
- NEXT_PUBLIC_SITE_URL=https://oab-app.vercel.app
- MERCADO_PAGO_TEST_PRICE=5.00 opcional, só para teste
- PREMIUM_TEST_DAYS=90 opcional

SEGURANÇA:
- MERCADO_PAGO_ACCESS_TOKEN nunca pode aparecer no client.
- SUPABASE_SERVICE_ROLE_KEY nunca pode aparecer no client.
- Não retornar tokens em response.
- Não permitir que o front envie is_premium/premium_ate para ativar Premium.
- Webhook deve validar pagamento aprovado consultando Mercado Pago.

TESTES:
1. Rodar:
   pnpm.cmd run build

2. Se falhar, corrigir até passar.

3. No relatório final, me diga:
   - build passou ou não
   - arquivos alterados
   - se checkout usa notification_url
   - se webhook valida pagamento buscando no Mercado Pago
   - se Premium é ativado no Supabase
   - SQL necessário, se faltar tabela
   - variáveis que devo configurar na Vercel
   - passo a passo do teste manual

NÃO FAZER COMMIT.
NÃO FAZER PUSH.
