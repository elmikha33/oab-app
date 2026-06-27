Você está trabalhando no projeto OAPlay.

Projeto:
- Next.js 14 + React + Tailwind + Supabase.
- App de questões OAB gamificado.
- Usuário usa Windows + PowerShell.
- Caminho:
  C:\Users\Miche\.gemini\antigravity\scratch\oab-app

MISSÃO AGORA:
ARRUMAR A UI DO APP INTEIRO, COM AUDITORIA CIRÚRGICA, SEM REFAZER O PROJETO DO ZERO.

O app foi bagunçado por várias alterações ruins. Quero que você corrija a origem dos problemas e deixe o app bonito, estável e com build passando.

NÃO FAZER:
- NÃO fazer commit.
- NÃO fazer push.
- NÃO mexer no banco.
- NÃO mexer no Mercado Pago.
- NÃO trocar stack.
- NÃO refatorar o app inteiro sem necessidade.
- NÃO criar componentes duplicados.
- NÃO esconder tudo com CSS global agressivo.
- NÃO trazer de volta Legl, Missão OAB, Seja Premium antigo, moedas, carteira, nível ou XP.

OBJETIVO VISUAL:
O app deve voltar a parecer profissional, limpo, bonito, moderno e coerente com a marca OAPlay.

Marca correta:
- OAPlay
- Slogan correto:
  SUA APROVAÇÃO EXPRESSA
- Não usar:
  - Legl
  - Missão OAB
  - Sua aprovação expressa corrompido
  - Logo antigo

PROBLEMAS ATUAIS VISÍVEIS:
1. Textos quebrados/mojibake na UI:
   Exemplos:
   - APROVAÃƒ...
   - COLEÃƒ...
   - QuestÃƒ...
   - RevisÃƒ...
   - questÃµes
   - avanÃ§ar
   - evoluÃ§Ã£o
   - consistÃªncia
   - qualquer texto com Ã, Ãƒ, Â ou \u00 visível na tela.

2. Sidebar desktop ficou feia/quebrada:
   - Logo/slogan com acentos quebrados.
   - Texto "Coleção" quebrado.
   - "Responder Questões" quebrado.
   - "Modo Revisão" quebrado.
   - Tipografia e espaçamento devem ficar bonitos.
   - Desktop sidebar deve continuar parecida com a versão bonita do OAPlay:
     - card do logo no topo
     - card do usuário
     - mini conquistas
     - navegação vertical
     - plano atual/premium/free se existir
     - botão de tema claro/escuro em lugar bonito

3. Mobile ficou bagunçado:
   - Garantir que só exista uma sidebar mobile.
   - Sidebar mobile correta deve ser OAPlay, não Legl.
   - Abrir pela esquerda.
   - Topo mobile deve ter:
     - botão moderno de opções à esquerda
     - logo OAPlay centralizado
     - botão claro/escuro à direita
   - Não pode existir bottom nav antiga.
   - Não pode existir botão "Sair" flutuante sobreposto.
   - "Sair da conta" deve aparecer apenas dentro da sidebar mobile.
   - Não deve haver sidebar antiga por trás.
   - Não usar CSS global agressivo escondendo elementos fixos do app inteiro.

4. Tema claro/escuro sumiu ou ficou quebrado:
   - Restaurar alternância de tema.
   - Deve funcionar no desktop e no mobile.
   - Deve persistir em localStorage.
   - Deve aplicar/remover classe `dark` no document.documentElement.
   - Usar o componente existente ThemeToggle se estiver bom.
   - Se ThemeToggle estiver quebrado, corrigir ele.
   - Não criar botão duplicado se já existir um correto.
   - No desktop, colocar em lugar bonito na Sidebar.
   - No mobile, colocar no topo direito.

5. Dashboard ficou feio:
   Corrigir components/Dashboard.tsx para ficar bonito, limpo e coerente.
   Manter:
   - Bem-vindo, nome do usuário
   - frase motivacional
   - dias ativos
   - questões corretas
   - botão Estudar Agora
   - RankingPreview
   - algum card motivacional útil se precisar preencher espaço

   Remover da UI:
   - moedas
   - carteira
   - Wallet
   - nível
   - Nível
   - XP
   - barra de progresso
   - evolução de nível
   - qualquer sistema de level/nivel

6. O usuário NÃO quer nível nem moedas no app.
   Remover da interface:
   - Nível
   - Nivel
   - nível
   - nivel
   - XP
   - xp
   - xpNecessario
   - user.xp
   - user.nivel
   - moedas
   - moeda
   - Carteira
   - Wallet
   - coins
   - coin

   Pode sobrar internamente no GameState se remover quebrar lógica antiga, mas NÃO pode aparecer na UI.

ARQUIVOS OBRIGATÓRIOS PARA REVISAR:
- components/Dashboard.tsx
- components/Sidebar.tsx
- components/MobileNav.tsx
- components/LayoutShell.tsx
- components/ThemeToggle.tsx
- components/RankingPreview.tsx
- components/QuestoesList.tsx
- app/achievements/page.tsx
- app/dashboard/page.tsx
- app/dashboard/layout.tsx
- app/globals.css
- context/GameStateContext.tsx

BUSCA OBRIGATÓRIA ANTES E DEPOIS:
Procurar nos arquivos .tsx, .ts, .css por:
- Ã
- Ãƒ
- Â
- \\u00
- questÃ
- evoluÃ
- avanÃ
- aprovaÃ
- coleÃ
- revisÃ
- Legl
- MISSÃO OAB
- MISSAO OAB
- Seja Premium
- Carteira
- Wallet
- moedas
- moeda
- coins
- coin
- Nível
- Nivel
- nível
- nivel
- XP
- xpNecessario
- user.xp
- user.nivel
- level
- Level
- NV
- MobileFloatingPremiumCard
- FloatingPremiumCard
- LogoutButton
- fixed bottom
- bottom-4
- bottom-24

REGRAS DE CORREÇÃO DE TEXTO:
Textos devem aparecer em português correto:
- aprovação
- expressa
- coleção
- questões
- revisão
- evolução
- consistência
- avançar
- próxima
- aprovação
- nível NÃO deve aparecer porque o usuário não quer nível
- moedas NÃO deve aparecer porque o usuário não quer moedas

IMPORTANTE:
Não usar strings como `quest\u00f5es` de um jeito que apareça literalmente na UI.
Se usar escapes Unicode, devem ser interpretados corretamente pelo JavaScript, nunca visíveis na tela.
Preferir texto normal em UTF-8 se o arquivo estiver sendo salvo corretamente.

LAYOUTS:
1. LayoutShell:
   - Deve renderizar Sidebar no desktop.
   - Deve renderizar MobileNav no mobile.
   - Não deve renderizar botão sair flutuante.
   - Não deve renderizar premium card flutuante.
   - Não deve travar o app em "Carregando..." para sempre.
   - Rotas públicas: / e /auth.
   - Não criar loop de redirect.

2. Sidebar desktop:
   - OAPlay correto.
   - Sem mojibake.
   - Sem Legl.
   - Sem moedas.
   - Sem nível/XP.
   - Navegação correta:
     - Dashboard
     - Responder Questões
     - Modo Revisão
     - Conquistas
     - Ranking
   - Tema claro/escuro visível.
   - Visual limpo e bonito.

3. MobileNav:
   - OAPlay correto.
   - Sem Legl.
   - Sem bottom nav.
   - Sem sair flutuante.
   - Sidebar esquerda.
   - Botão de opções moderno à esquerda.
   - Logo no centro.
   - Tema claro/escuro à direita.
   - Botão sair só dentro da sidebar.
   - Sem nível/XP/moedas.

4. Dashboard:
   - Visual profissional.
   - Sem card verde gigante tosco.
   - Sem Carteira/moedas.
   - Sem Evolução/Nível/XP.
   - Sem mojibake.
   - Deve ficar bom em dark e light mode.
   - Deve funcionar no mobile e desktop.

5. Globals CSS:
   - Remover CSS agressivo que esconda qualquer elemento fixed/bottom globalmente.
   - Manter apenas estilos realmente necessários.
   - Garantir dark/light funcionando.

CRITÉRIOS DE ACEITE:
- `pnpm.cmd run build` precisa passar.
- UI não pode ter mojibake.
- UI não pode ter moedas.
- UI não pode ter nível/XP.
- UI não pode ter Legl/Missão OAB.
- Tema claro/escuro precisa funcionar.
- Mobile não pode ter sidebar antiga nem bottom nav.
- Desktop precisa ter sidebar bonita.
- Dashboard precisa ficar apresentável.

COMANDOS QUE VOCÊ DEVE RODAR:
1. Buscar problemas:
   Get-ChildItem .\app,.\components,.\context -Recurse -Include *.tsx,*.ts,*.css |
   Select-String -Pattern "Ã","Ãƒ","Â","\\u00","questÃ","evoluÃ","avanÃ","aprovaÃ","coleÃ","revisÃ","Legl","MISSÃO OAB","MISSAO OAB","Seja Premium","Carteira","Wallet","moedas","moeda","coins","coin","Nível","Nivel","nível","nivel","XP","xpNecessario","user.xp","user.nivel","level","Level","NV","MobileFloatingPremiumCard","FloatingPremiumCard","LogoutButton","fixed bottom","bottom-4","bottom-24" |
   Select-Object Path,LineNumber,Line

2. Corrigir arquivos.

3. Rodar:
   pnpm.cmd run build

4. Se falhar, corrigir até passar.

5. Rodar busca final:
   Get-ChildItem .\app,.\components,.\context -Recurse -Include *.tsx,*.ts,*.css |
   Select-String -Pattern "Ã","Ãƒ","Â","\\u00","questÃ","evoluÃ","avanÃ","aprovaÃ","coleÃ","revisÃ","Legl","MISSÃO OAB","MISSAO OAB","Seja Premium","Carteira","Wallet","moedas","moeda","coins","coin","Nível","Nivel","nível","nivel","XP","xpNecessario","user.xp","user.nivel","level","Level","NV","MobileFloatingPremiumCard","FloatingPremiumCard","LogoutButton","fixed bottom","bottom-4","bottom-24" |
   Select-Object Path,LineNumber,Line

AO FINAL RESPONDER:
- Build passou ou não.
- Arquivos alterados.
- O que foi corrigido.
- O que sobrou apenas internamente no GameState, se sobrar.
- Confirmar que não fez commit nem push.

NÃO FAÇA COMMIT.
NÃO FAÇA PUSH.
