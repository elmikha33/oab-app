Você está trabalhando no projeto OAPlay, um app Next.js 14 + React + Tailwind + Supabase.

Objetivo agora:
FAZER UMA AUDITORIA CIRÚRGICA E CORRIGIR O ESTADO ATUAL DO APP, SEM REFAZER O PROJETO INTEIRO.

Contexto importante:
- O app está em produção na Vercel.
- O usuário usa Windows + PowerShell.
- O projeto atual fica em:
  C:\Users\Miche\.gemini\antigravity\scratch\oab-app
- Marca atual correta: OAPlay.
- NÃO usar mais Legl, Missão OAB, logo antigo ou textos antigos.
- NÃO alterar banco de dados agora.
- NÃO mexer em Mercado Pago agora.
- NÃO refatorar tudo sem necessidade.
- NÃO trocar stack.
- NÃO inventar novas features.

Problemas atuais a corrigir:

1. Dashboard ficou feio e com textos quebrados.
   Procurar por qualquer texto aparecendo como:
   - quest\u00f5es
   - evolu\u00e7\u00e3o
   - consist\u00eancia
   - N\u00edvel
   - questÃµes
   - avanÃ§ar
   - evoluÃ§Ã£o

   Esses textos NÃO podem aparecer na UI. Devem aparecer corretamente em português:
   - questões
   - evolução
   - consistência
   - Nível
   - avançar

2. Verificar e corrigir components/Dashboard.tsx.

   Requisitos:
   - Visual deve ficar profissional, limpo e coerente com o resto do OAPlay.
   - Não deixar card verde gigante tosco.
   - Não deixar textos com \u00 visível na tela.
   - Não deixar textos corrompidos tipo questÃµes.
   - Manter:
     - Bem-vindo, nome do usuário
     - frase motivacional
     - dias ativos
     - questões corretas
     - botão Estudar Agora
     - evolução de nível/XP
     - RankingPreview
   - REMOVER o sistema visual de moedas/carteira do Dashboard.
   - NÃO exibir card "Carteira".
   - NÃO exibir moedas no topo, sidebar, dashboard ou mobile.
   - Não travar em "Carregando..." quando o usuário está logado.
   - Se não houver usuário, redirecionar para /auth de forma segura, sem loop infinito.

3. Remover o sistema de moedas da interface.

   O sistema de moedas é inútil nesta fase e deve sair da UI.

   Procurar por:
   - moedas
   - moeda
   - Carteira
   - Wallet
   - coins
   - coin
   - user.moedas

   Regras:
   - Remover cards, badges, contadores e textos de moedas.
   - Remover import de ícones relacionados, como Wallet, Coins etc.
   - Não precisa alterar banco de dados agora.
   - Não precisa apagar campo `moedas` do GameState se isso causar risco.
   - Se `moedas` estiver muito acoplado ao estado, deixar o campo interno quieto, mas NÃO mostrar na interface.
   - Garantir que o build continue passando.

4. Corrigir mobile.

   Problema:
   - Existe sidebar mobile antiga aparecendo com Legl/Missão OAB/Seja Premium.
   - Essa sidebar antiga deve ser removida/desativada.
   - A sidebar mobile correta deve ser a nova do OAPlay, abrindo pela esquerda.
   - Topo mobile deve ter:
     - botão moderno de opções à esquerda
     - logo OAPlay no centro
     - botão de tema claro/escuro à direita
   - Não pode existir bottom nav antiga.
   - Não pode existir botão sair flutuante sobreposto.
   - O botão "Sair da conta" deve ficar apenas dentro da sidebar.

5. Verificar estes arquivos obrigatoriamente:
   - components/LayoutShell.tsx
   - components/MobileNav.tsx
   - components/Sidebar.tsx
   - components/Dashboard.tsx
   - app/dashboard/layout.tsx
   - app/dashboard/page.tsx
   - app/globals.css
   - context/GameStateContext.tsx

6. Procurar no projeto por estes termos e remover/corrigir onde estiverem causando UI antiga:
   - Legl
   - MISSÃO OAB
   - MISSAO OAB
   - Seja Premium
   - MobileFloatingPremiumCard
   - FloatingPremiumCard
   - LogoutButton
   - fixed bottom
   - bottom-4
   - bottom-24
   - moedas
   - moeda
   - Carteira
   - Wallet
   - coins
   - user.moedas

7. Regras de qualidade:
   - Preservar o funcionamento existente.
   - Não criar componentes duplicados.
   - Não deixar CSS global agressivo escondendo coisas importantes.
   - Preferir corrigir a origem do componente, não esconder tudo com display none.
   - Garantir que `pnpm.cmd run build` passe.
   - Garantir que não exista texto corrompido/mojibake.
   - Usar UTF-8.
   - Fazer alterações mínimas, mas completas.
   - Não mexer no Supabase.
   - Não mexer no Mercado Pago.
   - Não fazer commit.
   - Não fazer push.

8. Ao final:
   - Rode `pnpm.cmd run build`.
   - Se falhar, corrija até passar.
   - Mostre um resumo dos arquivos alterados.
   - Mostre exatamente o que foi corrigido.
   - Informe se ainda sobrou algum uso interno de `moedas` apenas no estado, mas sem aparecer na UI.

Importante:
NÃO faça commit.
NÃO faça push.
Apenas corrija os arquivos e deixe o build passando.
