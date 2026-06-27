Você está trabalhando no projeto OAPlay.

Projeto:
- Next.js 14 + React + Tailwind + Supabase.
- App de questões OAB gamificado.
- Usuário usa Windows + PowerShell.
- Caminho:
  C:\Users\Miche\.gemini\antigravity\scratch\oab-app

MISSÃO:
ARRUMAR A UI ATUAL COM AUDITORIA CIRÚRGICA, SEM REFAZER O APP INTEIRO, MAS USANDO O MÁXIMO DE CUIDADO PARA DEIXAR BONITO, ESTÁVEL E COM BUILD PASSANDO.

NÃO FAZER:
- NÃO fazer commit.
- NÃO fazer push.
- NÃO mexer no banco.
- NÃO mexer no Mercado Pago.
- NÃO trocar stack.
- NÃO criar componentes duplicados.
- NÃO esconder problemas com CSS global agressivo.
- NÃO trazer de volta Legl, Missão OAB, Seja Premium antigo, moedas, carteira, nível ou XP.
- NÃO deixar textos quebrados/mojibake.
- NÃO usar replace cego que coloque \u00 visível na tela.

CONTEXTO VISUAL ATUAL:
O app já melhorou um pouco, mas ainda tem problemas:

1. Sidebar desktop:
   Abaixo do nome "Oliveira" aparece um bloco com métricas:
   - QUEST...
   - CONST...
   - REVISÃO
   Esse bloco deve SAIR.
   
   No lugar dele deve voltar a COLEÇÃO DE CONQUISTAS COM MINIATURAS/BADGES, como antes:
   - grid pequeno de badges
   - 8 conquistas no total
   - mostrar desbloqueadas com emoji/ícone bonito
   - bloqueadas com cadeado
   - contador tipo 1/8, 2/8 etc.
   - NÃO mostrar número de revisão ali
   - NÃO mostrar XP
   - NÃO mostrar moedas
   - NÃO mostrar nível

2. Dashboard:
   Remover o card "em revisão" que aparece no dashboard.
   O usuário NÃO quer que o app fale quantas questões estão em revisão.

   Remover qualquer bloco/card/texto do Dashboard com:
   - em revisão
   - revisão: número
   - questões em revisão
   - progresso baseado em revisão

   Manter no Dashboard:
   - Bem-vindo, nome
   - chamada motivacional
   - dias ativos
   - questões corretas
   - botão Estudar Agora
   - botão Revisar erros, se estiver bonito e não mostrar contador
   - RankingPreview
   - plano atual, se estiver discreto
   - cards motivacionais úteis sem números desmotivadores

   Não mostrar no Dashboard:
   - em revisão com número
   - moedas
   - carteira
   - nível
   - XP
   - evolução de nível
   - barra de XP

3. Página de Conquistas:
   A linha de cards superiores está ruim.
   Remover/ajustar cards que mostrem:
   - "em revisão" com número
   - números desmotivadores
   - excesso de métricas
   
   Manter uma área superior bonita com:
   - "Em movimento" / "cada questão conta"
   - acertos se fizer sentido
   - plano atual se estiver bonito
   - coleção liberada 1/8 etc.
   
   NÃO mostrar "em revisão 3".
   NÃO mostrar moedas.
   NÃO mostrar nível/XP.

4. Sidebar:
   Navegação correta:
   - Dashboard
   - Responder Questões
   - Modo Revisão
   - Conquistas
   - Ranking

   Plano:
   - Se Free, mostrar "Plano Free" e "Conhecer Premium" de modo bonito.
   - Se Premium, mostrar "Plano Premium" e validade se existir.
   - NÃO usar "Seja Premium" antigo.
   - NÃO usar Legl/Missão OAB.

5. Botão "Sair da conta":
   Atualmente funciona no Dashboard, mas NÃO funciona no modo Play.
   Corrigir para funcionar em todas as páginas privadas, especialmente:
   - /dashboard
   - /play
   - /review
   - /achievements
   - /ranking

   Requisitos do logout:
   - deve chamar supabase.auth.signOut()
   - deve limpar estado local do app se existir função logout/setUser
   - deve redirecionar para /auth
   - deve funcionar tanto desktop quanto mobile
   - botão não pode ser flutuante sobreposto
   - botão deve ficar na sidebar
   - no mobile, "Sair da conta" deve ficar dentro da sidebar mobile

6. Tema claro/escuro:
   Garantir que o botão de tema funcione.
   Desktop:
   - botão de tema em lugar bonito na sidebar.
   Mobile:
   - botão claro/escuro no topo direito.
   Persistência:
   - localStorage
   - classe `dark` em document.documentElement

7. Mobile:
   Garantir que não tenha sidebar antiga.
   Garantir que não tenha bottom nav.
   Garantir que não tenha botão sair flutuante.
   Garantir que a sidebar mobile correta abra pela esquerda.
   Não mostrar métricas inúteis no topo/usuário.
   Não mostrar moedas, nível, XP.
   Não mostrar contador de revisão.

8. Mojibake/textos:
   Corrigir qualquer texto quebrado:
   - QuestÃ
   - RevisÃ
   - ColeÃ
   - aprovaÃ
   - evoluÃ
   - avanÃ
   - consistÃ
   - Ã
   - Ãƒ
   - Â
   - \u00 visível na tela

   Textos corretos:
   - OAPlay
   - SUA APROVAÇÃO EXPRESSA
   - Coleção
   - Responder Questões
   - Modo Revisão
   - Conquistas
   - questões
   - revisão
   - aprovação
   - evolução
   - consistência
   - avançar

ARQUIVOS OBRIGATÓRIOS PARA AUDITAR:
- components/Sidebar.tsx
- components/MobileNav.tsx
- components/LayoutShell.tsx
- components/ThemeToggle.tsx
- components/Dashboard.tsx
- components/RankingPreview.tsx
- components/QuestoesList.tsx
- app/achievements/page.tsx
- app/dashboard/page.tsx
- app/dashboard/layout.tsx
- app/play/page.tsx
- app/review/page.tsx
- app/globals.css
- context/GameStateContext.tsx
- lib/supabase.ts

BUSCAS OBRIGATÓRIAS ANTES E DEPOIS:
Rodar busca por:
- "em revisão"
- "em revisao"
- "revisão"
- "revisao"
- "QUEST"
- "CONST"
- "moedas"
- "moeda"
- "Carteira"
- "Wallet"
- "coins"
- "Nível"
- "Nivel"
- "nível"
- "nivel"
- "XP"
- "xpNecessario"
- "user.xp"
- "user.nivel"
- "Legl"
- "MISSÃO OAB"
- "MISSAO OAB"
- "Seja Premium"
- "MobileFloatingPremiumCard"
- "FloatingPremiumCard"
- "LogoutButton"
- "fixed bottom"
- "bottom-4"
- "bottom-24"
- "Ã"
- "Ãƒ"
- "Â"
- "\\u00"

IMPORTANTE SOBRE BUSCAS:
Algumas palavras como "revisão" podem existir corretamente em:
- Modo Revisão
- Revisar erros
- página /review

Isso pode continuar.
O que NÃO pode continuar:
- contador/card "em revisão 3" no Dashboard
- contador "revisão" no card do usuário/sidebar
- métricas de revisão como destaque desmotivador
- textos quebrados

REGRAS SOBRE CONQUISTAS NA SIDEBAR:
A sidebar deve exibir miniaturas de conquistas, não métricas.
Usar as mesmas conquistas da página de conquistas.
Exemplo de miniaturas:
- Primeira questão: 🎯
- 10 acertos: ✅ ou ⚔️
- 50 acertos: 🔥
- 100 acertos: 🏆
- Revisou 33 Questões: 🧠
- Caçador de erros: 🛡️
- 7 dias ativos: 📅
- Premium: 👑

Se usar emoji diretamente e houver risco de encoding, usar string JS com Unicode escape interpretado, mas NÃO deixar \u00 visível na UI.

REGRAS SOBRE REMOVER SISTEMAS:
O usuário NÃO quer:
- moedas
- nível
- XP
- contador de revisão em destaque

Pode sobrar internamente no GameState se remover quebrar o app, mas NÃO pode aparecer na UI.

REGRAS DE QUALIDADE:
- Corrigir a origem, não gambiarra visual.
- Fazer alterações mínimas, mas completas.
- Preservar Supabase/auth.
- Preservar premium.
- Preservar perguntas/play.
- Preservar conquistas.
- Preservar ranking.
- Manter build passando.
- Não fazer commit.
- Não fazer push.

TESTES OBRIGATÓRIOS:
1. Rodar:
   pnpm.cmd run build

2. Se falhar, corrigir até passar.

3. Verificar manualmente no código:
   - /dashboard não mostra "em revisão" com número
   - /achievements não mostra "em revisão 3"
   - Sidebar não mostra métricas QUEST/CONST/REVISÃO; mostra mini conquistas
   - Logout não depende da rota dashboard; funciona em qualquer rota privada
   - MobileNav tem logout funcional
   - Tema claro/escuro funciona

4. Rodar busca final:
   Get-ChildItem .\app,.\components,.\context,.\lib -Recurse -Include *.tsx,*.ts,*.css |
   Select-String -Pattern "Ã","Ãƒ","Â","\\u00","Legl","MISSÃO OAB","MISSAO OAB","Seja Premium","Carteira","Wallet","moedas","moeda","coins","coin","Nível","Nivel","nível","nivel","XP","xpNecessario","user.xp","user.nivel","MobileFloatingPremiumCard","FloatingPremiumCard","fixed bottom","bottom-4","bottom-24" |
   Select-Object Path,LineNumber,Line

5. Se sobrarem resultados:
   - explicar se são internos e seguros
   - corrigir se aparecem na UI

AO FINAL RESPONDER:
- Build passou ou não.
- Arquivos alterados.
- O que foi removido da UI.
- Como o logout foi corrigido.
- Como o tema foi corrigido.
- Confirmar que não fez commit nem push.

NÃO FAZER COMMIT.
NÃO FAZER PUSH.
