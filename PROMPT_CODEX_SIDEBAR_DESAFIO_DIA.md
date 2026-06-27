Você está trabalhando no projeto OAPlay.

Projeto:
- Next.js 14 + React + Tailwind + Supabase.
- Caminho:
  C:\Users\Miche\.gemini\antigravity\scratch\oab-app

MISSÃO:
Corrigir dois pontos visuais/funcionais atuais:
1. Sidebar desktop está apertada/confusa com scroll ruim.
2. Card "foco do dia" no dashboard deve virar "Desafio do Dia", sugerindo uma conquista/achievement para o usuário buscar.

NÃO FAZER:
- NÃO fazer commit.
- NÃO fazer push.
- NÃO mexer no banco.
- NÃO mexer no Mercado Pago.
- NÃO trazer de volta moedas, XP, nível, Legl, Missão OAB ou sidebar antiga.
- NÃO usar CSS global agressivo para esconder coisa.
- NÃO refatorar o app inteiro.

PROBLEMA 1 — SIDEBAR DESKTOP:
No desktop, a sidebar esquerda está apertada e com scroll confuso. O card do plano e a navegação estão espremidos. Melhorar visual e usabilidade.

Arquivos prováveis:
- components/Sidebar.tsx
- components/LayoutShell.tsx
- app/globals.css

Requisitos da sidebar:
- Largura desktop pode aumentar um pouco se necessário, por exemplo 320px ou 330px.
- Se aumentar a sidebar, ajustar o `md:ml-[...]` do LayoutShell para o conteúdo não ficar por baixo.
- Evitar scroll interno pequeno/confuso no meio da sidebar.
- Sidebar inteira pode ter scroll vertical natural se a tela for baixa, mas não deve parecer quebrada.
- Navegação precisa ficar respirando melhor.
- Plano Premium/Free não pode ficar enfiado dentro da área da navegação.
- Botão tema e botão sair devem ficar no final, alinhados e bonitos.
- O bloco de conquistas abaixo do usuário deve continuar.
- Não mostrar métricas antigas tipo QUEST/CONST/REVISÃO.
- Não mostrar moedas, XP, nível.
- Não quebrar modo claro/escuro.
- Não quebrar mobile.

Sugestão visual:
- Sidebar com layout flex column.
- Topo: logo.
- Depois: card do usuário + coleção de badges.
- Depois: nav com espaçamento adequado.
- Depois: plano atual.
- Depois: tema e sair.
- Usar `min-h-screen`, `overflow-y-auto`, `gap`, sem container interno com scroll estreito.
- Se precisar, usar `pb-6` e `space-y`.
- No desktop, evitar que uma barra de scroll fina apareça no meio da nav.

PROBLEMA 2 — DASHBOARD: CARD "DESAFIO DO DIA":
No dashboard, existe um card à direita com texto tipo "foco do dia".
Trocar isso para "Desafio do Dia".

Arquivos prováveis:
- components/Dashboard.tsx
- app/achievements/page.tsx se precisar reutilizar lista de conquistas
- components/Sidebar.tsx se existir lista de achievements duplicada

Requisitos do card:
- Título: "Desafio do Dia"
- Deve sugerir uma conquista/achievement que a pessoa ainda não liberou.
- Deve ser motivador, não desmotivador.
- Não mostrar "em revisão 3" nem contador de revisão.
- Não mostrar moedas, XP ou nível.
- Deve mostrar algo como:
  - nome da conquista sugerida
  - descrição curta
  - requisito em texto amigável
  - botão/CTA que leve para a rota adequada
- Exemplos:
  - Primeira questão → botão "Responder agora" → /play
  - Sequência inicial / 10 acertos → /play
  - Ritmo de prova / 50 acertos → /play
  - Maratonista OAB / 100 acertos → /play
  - Revisou 33 Questões → /review
  - Caçador de erros / 25 erros para revisar → /review ou /play, conforme fizer sentido
  - 7 dias ativos → /dashboard ou /play
  - Premium → /premium

Lógica desejada:
- Usar dados do usuário para escolher a primeira conquista ainda bloqueada.
- Se todas estiverem liberadas, mostrar desafio genérico:
  "Mantenha sua sequência"
  "Faça uma rodada de questões hoje"
- Não inventar número negativo.
- Não exibir contadores de revisão no dashboard.
- Pode reutilizar a mesma lista de conquistas da página /achievements, se existir.
- Evitar duplicação ruim: se houver duplicação, extrair um helper simples em arquivo compartilhado apenas se isso for seguro e não virar refactor grande.

Conquistas esperadas:
- Primeira questão
- Sequência inicial / 10 acertos
- Ritmo de prova / 50 acertos
- Maratonista OAB / 100 acertos
- Revisou 33 Questões
- Caçador de erros / 25 erros para revisar
- 7 dias ativos
- Premium

IMPORTANTE:
O usuário quer gamificação com conquistas, mas NÃO quer:
- nível
- XP
- moedas
- contador explícito de revisão no dashboard/sidebar

BUSCAS OBRIGATÓRIAS:
Antes e depois, procurar:
- "foco do dia"
- "Foco do dia"
- "em revisão"
- "em revisao"
- "QUEST"
- "CONST"
- "REVISÃO"
- "REVISAO"
- "moedas"
- "Carteira"
- "Wallet"
- "XP"
- "Nível"
- "Nivel"
- "Legl"
- "MISSÃO OAB"
- "MISSAO OAB"
- "Seja Premium"
- "Ã"
- "Ãƒ"
- "Â"
- "\\u00"

Atenção:
- "Modo Revisão" pode continuar na navegação.
- "Revisou 33 Questões" pode continuar como conquista.
- O que NÃO pode continuar é card/contador "em revisão 3" no dashboard/sidebar.

TESTES:
1. Rodar:
   pnpm.cmd run build

2. Se falhar, corrigir até passar.

3. Conferir:
   - Sidebar desktop mais larga/respirada, sem scroll interno confuso.
   - Conteúdo principal não fica por baixo da sidebar.
   - Mobile continua funcionando.
   - Tema claro/escuro continua funcionando.
   - Dashboard mostra "Desafio do Dia".
   - Dashboard não mostra "foco do dia".
   - Dashboard não mostra "em revisão 3".
   - UI não mostra moeda, nível ou XP.

AO FINAL RESPONDER:
- Build passou ou não.
- Arquivos alterados.
- Como a sidebar foi melhorada.
- Como o Desafio do Dia escolhe a conquista.
- Confirmar que não fez commit nem push.

NÃO FAÇA COMMIT.
NÃO FAÇA PUSH.
