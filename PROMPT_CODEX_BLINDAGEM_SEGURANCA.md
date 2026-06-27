Você está no projeto OAPlay.

Projeto:
- Next.js 14 + React + Tailwind + Supabase + Mercado Pago.
- Caminho:
  C:\Users\Miche\.gemini\antigravity\scratch\oab-app
- App será vendido como Premium trimestral por R$ 99,00.
- Usuário usa Windows + PowerShell.

MISSÃO PRIORITÁRIA:
FAZER AUDITORIA E BLINDAGEM DE SEGURANÇA ANTES DO LANÇAMENTO.

Objetivo:
Proteger o app contra:
- bypass de Premium
- usuário Free virando Premium pelo console/localStorage
- vazamento de chaves
- endpoint público perigoso
- acesso indevido ao admin
- manipulação de profile
- webhook falso do Mercado Pago
- uso incorreto de service role
- RLS ausente ou fraca no Supabase

NÃO FAZER:
- NÃO mexer em visual/design/copy.
- NÃO refatorar o app inteiro.
- NÃO mexer em dashboard/sidebar/mobile, salvo se for risco de segurança real.
- NÃO fazer commit.
- NÃO fazer push.
- NÃO apagar dados do banco.
- NÃO alterar Mercado Pago sem explicar.
- NÃO expor chaves em logs.
- NÃO colocar service role no client.
- NÃO usar NEXT_PUBLIC para segredo.

ARQUIVOS/PASTAS OBRIGATÓRIOS:
- app/api/**/route.ts
- app/admin/page.tsx
- app/premium/page.tsx
- app/auth/page.tsx
- app/play/page.tsx
- app/review/page.tsx
- components/QuestoesList.tsx
- context/GameStateContext.tsx
- lib/supabase.ts
- lib/**
- middleware.ts, se existir
- .env.example, se existir
- package.json

AUDITORIA 1 — VARIÁVEIS E CHAVES:
Procurar por:
- SUPABASE_SERVICE_ROLE_KEY
- service_role
- MERCADO_PAGO_ACCESS_TOKEN
- ACCESS_TOKEN
- NEXT_PUBLIC
- process.env
- createClient

Regras:
- SUPABASE_SERVICE_ROLE_KEY só pode aparecer em servidor/API route.
- MERCADO_PAGO_ACCESS_TOKEN só pode aparecer em servidor/API route.
- Nenhum segredo pode começar com NEXT_PUBLIC_.
- Client só pode usar Supabase anon key.
- Não logar tokens.
- Não retornar tokens em response JSON.

Se encontrar risco:
- corrigir.
- explicar.

AUDITORIA 2 — PREMIUM:
Procurar por:
- is_premium
- premium_ate
- plano
- subscription_status
- premium
- Premium
- limite
- FREE_DAILY_LIMIT

Regras:
- O front-end NUNCA pode ativar Premium de verdade.
- localStorage não pode ser fonte de verdade para Premium.
- Usuário não pode editar localStorage e ganhar Premium real.
- API/profile deve buscar Premium no Supabase com autenticação.
- Premium deve depender de profile real no banco.
- Se existe email manual premium para mi.psy.trance@gmail.com, manter só para admin/dono se necessário, mas não criar brecha genérica.
- Se houver endpoint que atualiza profile, ele não pode aceitar is_premium vindo do client.
- Usuário Free não deve conseguir burlar limite Premium por request simples.

Corrigir qualquer rota que permita:
- setar is_premium pelo client
- atualizar premium_ate pelo client
- editar plano/subscription_status pelo client

AUDITORIA 3 — MERCADO PAGO:
Auditar:
- app/api/mercadopago/checkout/route.ts
- app/api/mercadopago/webhook/route.ts
- qualquer rota relacionada a pagamento

Regras:
- Checkout precisa exigir usuário autenticado.
- Checkout precisa colocar user_id/email em metadata ou external_reference.
- Webhook NÃO pode confiar cegamente no payload recebido.
- Webhook deve buscar o pagamento no Mercado Pago usando access token servidor.
- Webhook só ativa Premium se status for approved/accredited equivalente.
- Webhook deve usar SUPABASE_SERVICE_ROLE_KEY apenas no servidor.
- Webhook deve atualizar somente o usuário correto.
- Webhook deve evitar duplicidade/idempotência.
- Webhook deve registrar payment_id/order se existir tabela.
- Não retornar informação sensível.
- Validar método HTTP.

Se faltar tabela para idempotência/pedidos, informar SQL exato necessário, mas não executar.

AUDITORIA 4 — ADMIN:
Auditar:
- app/admin/page.tsx
- app/api/admin, se existir
- qualquer isAdmin
- qualquer checagem por email

Regras:
- Página admin não pode depender só de esconder botão.
- Usuário comum não pode acessar /admin e alterar dados.
- Se admin for client component, garantir que as operações sensíveis estejam protegidas no servidor ou por RLS.
- Rotas admin precisam validar user autenticado e autorização.
- Não confiar em localStorage para admin.
- Se admin é identificado por email, isolar em constante segura no servidor quando possível.

AUDITORIA 5 — API ROUTES:
Auditar todas:
- app/api/**/route.ts

Para cada rota:
- validar método HTTP
- validar autenticação quando necessário
- validar payload
- não aceitar campos proibidos
- não retornar dados sensíveis
- não usar anon key para operação privilegiada
- não usar service role sem necessidade
- não permitir CORS aberto perigoso, se existir
- tratar erro sem vazar stack/token

AUDITORIA 6 — SUPABASE/RLS:
Pelo código, identificar tabelas usadas:
- profiles
- premium_orders
- questoes_oab
- respostas/progresso, se existirem
- qualquer tabela de user progress

Verificar se há SQL/policies no repo.
Se não der para confirmar RLS pelo código, responder com SQL recomendado para o Supabase.

Requisitos de RLS:
- profiles:
  - usuário só lê/atualiza o próprio profile em campos seguros
  - usuário NÃO pode atualizar is_premium, premium_ate, plano, subscription_status
  - service role/webhook pode atualizar Premium
- premium_orders:
  - usuário só lê os próprios pedidos, se necessário
  - insert/update privilegiado só no servidor/webhook
- questoes_oab:
  - leitura pública/authenticated se for banco de questões
  - escrita apenas admin/service role
- progresso/respostas:
  - usuário só acessa o próprio progresso

Se faltar SQL, gerar seção "SQL recomendado" com comandos claros.

AUDITORIA 7 — LOCALSTORAGE:
Procurar:
- localStorage
- sessionStorage
- isPremium
- isAdmin
- user
- profile

Regras:
- localStorage pode guardar preferências e progresso local.
- localStorage NÃO pode ser autoridade final para Premium/Admin.
- Se houver cache de user com isPremium, precisa ser sobrescrito por profile real do servidor.
- Se usuário manipular localStorage, no máximo altera UI temporária, mas não deve liberar benefício pago real.

AUDITORIA 8 — PLAY/LIMITE FREE:
Auditar:
- components/QuestoesList.tsx
- context/GameStateContext.tsx
- app/play/page.tsx

Regras:
- Limite Free pode ter parte no front, mas Premium real precisa vir do profile autenticado.
- Se ainda não houver enforcement server-side, informar risco médio/alto.
- Não quebrar a experiência agora.
- Sugerir mitigação mínima segura se possível.

BUSCAS OBRIGATÓRIAS:
Rodar buscas por:
- SUPABASE_SERVICE_ROLE_KEY
- MERCADO_PAGO_ACCESS_TOKEN
- service_role
- NEXT_PUBLIC
- is_premium
- premium_ate
- subscription_status
- isAdmin
- admin
- localStorage
- sessionStorage
- update(
- upsert(
- insert(
- delete(
- profiles
- premium_orders
- mercadopago
- webhook
- checkout

CORREÇÕES PRIORITÁRIAS:
Corrigir imediatamente se encontrar:
1. service role no client
2. access token Mercado Pago no client
3. API aceitando is_premium do client
4. webhook ativando Premium sem validar pagamento no Mercado Pago
5. admin protegido apenas por UI/localStorage
6. endpoint público alterando profile de qualquer usuário
7. logs vazando token/segredo

NÃO QUEBRAR:
- login
- dashboard
- play
- premium page
- webhook
- build

TESTE FINAL:
Rodar:
pnpm.cmd run build

Se falhar, corrigir até passar.

RELATÓRIO FINAL:
Responder com:

1. Build passou?
2. Riscos críticos encontrados e corrigidos.
3. Riscos médios encontrados.
4. Arquivos alterados.
5. Variáveis necessárias na Vercel:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - MERCADO_PAGO_ACCESS_TOKEN
   - NEXT_PUBLIC_SITE_URL
   - outras que encontrar
6. SQL recomendado para Supabase/RLS, se necessário.
7. Checklist antes de vender.
8. Confirmar que NÃO fez commit nem push.

IMPORTANTE:
Não faça commit.
Não faça push.
Priorize segurança real sobre estética.
