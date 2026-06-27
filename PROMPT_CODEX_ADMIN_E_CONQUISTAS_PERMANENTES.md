Você está trabalhando no projeto OAPlay.

Projeto:
- Next.js 14 + React + Tailwind + Supabase.
- Caminho:
  C:\Users\Miche\.gemini\antigravity\scratch\oab-app
- Usuário usa Windows + PowerShell.

MISSÃO:
Corrigir dois problemas importantes:
1. O usuário dono/admin quer aparecer no app como "Admin", não como "Michel Giulian".
2. Conquistas/badges NÃO podem sumir quando o usuário reseta questões.

NÃO FAZER:
- NÃO fazer commit.
- NÃO fazer push.
- NÃO mexer em Mercado Pago.
- NÃO refatorar o app inteiro.
- NÃO apagar dados do banco.
- NÃO remover sistema de conquistas.
- NÃO remover Premium.
- NÃO voltar moedas, XP ou nível para a UI.
- NÃO trazer de volta Legl/Missão OAB.

PROBLEMA 1 — NOME DO ADMIN:
Mesmo após alterar Supabase, o app continua mostrando "Michel Giulian".

Objetivo:
Para o usuário com email:
  mi.psy.trance@gmail.com

O app deve exibir o nome:
  Admin

em todos os lugares da UI.

Locais prováveis:
- Sidebar desktop
- MobileNav
- Dashboard
- qualquer card de usuário
- qualquer área que mostre nome de perfil

Requisitos:
- Corrigir na origem da leitura do usuário, preferencialmente em context/GameStateContext.tsx ou função que monta o user.
- Se o email for mi.psy.trance@gmail.com, `user.nome` ou nome exibido deve ser "Admin".
- Também evitar mostrar "Michel Giulian" vindo de:
  - Supabase profiles.nome
  - auth.user.user_metadata.full_name
  - auth.user.user_metadata.name
  - raw_user_meta_data
  - localStorage/cache antigo
- Se existir cache local persistindo nome antigo, criar lógica para sobrescrever/normalizar na hidratação.
- Não precisa mexer no banco agora.
- Não esconder com CSS.
- Não trocar email.
- Não quebrar login.

Busca obrigatória:
Procurar por:
- Michel
- Giulian
- full_name
- display_name
- user_metadata
- raw_user_meta_data
- nome
- email

Corrigir onde o nome é definido/montado.

Critério de aceite:
- Em qualquer tela privada, o usuário mi.psy.trance@gmail.com aparece como "Admin".
- Não aparece mais "Michel Giulian" na UI.

PROBLEMA 2 — CONQUISTAS SUMINDO AO RESETAR QUESTÕES:
As conquistas/badges estão sumindo quando o usuário reseta questões. Isso NÃO pode acontecer.

Objetivo:
Conquistas são permanentes. Resetar questões deve resetar progresso de questões respondidas, mas NÃO pode apagar:
- conquistas desbloqueadas
- coleção de badges
- histórico permanente necessário para conquistas
- lifetime stats usados por conquistas

Arquivos prováveis:
- context/GameStateContext.tsx
- components/Sidebar.tsx
- app/achievements/page.tsx
- components/QuestoesList.tsx
- qualquer função de reset:
  - resetarTudo
  - resetarMateria
  - resetarQuestoes
  - resetProgress
  - clearProgress
  - localStorage.removeItem
  - localStorage.clear
  - setUser
  - salvarUsuario
  - salvarEstado
  - conquistasDesbloqueadas

Requisitos:
1. Resetar questões NÃO pode limpar:
   - conquistasDesbloqueadas
   - lifetimeQuestions
   - lifetimeCorrect
   - lifetimeReview
   - lifetimeReviewed
   - lifetimeActiveDays
   - reviewedQuestionIds
   - qualquer lista permanente de badges
2. Resetar questões pode limpar:
   - respondidas
   - erradas
   - revisão atual, se essa for a regra do app
   - progresso diário, se fizer sentido
3. Se as conquistas são calculadas apenas por métricas atuais, corrigir para usar métricas lifetime/permanentes.
4. Se não houver persistência robusta, criar/preservar chaves separadas no localStorage para conquistas.
5. Não usar número de revisão como destaque no Dashboard/sidebar.
6. Sidebar deve continuar mostrando mini conquistas/badges.
7. Página /achievements deve continuar mostrando conquistas desbloqueadas mesmo após reset.
8. Reset não pode chamar localStorage.clear().
9. Reset não pode remover todas as chaves do OAPlay indiscriminadamente.
10. Se reset precisar limpar localStorage, deve limpar apenas chaves de progresso temporário, nunca chaves permanentes.

Conquistas esperadas:
- Primeira questão
- Sequência inicial / 10 acertos
- Ritmo de prova / 50 acertos
- Maratonista OAB / 100 acertos
- Revisou 33 Questões
- Caçador de erros / 25 erros para revisar
- 7 dias ativos
- Premium

Regras:
- Uma conquista desbloqueada fica desbloqueada para sempre.
- Resetar questões não pode bloquear de novo uma conquista já liberada.
- O contador visual da sidebar deve refletir as conquistas permanentes.
- A página de conquistas deve usar a mesma fonte lógica da sidebar.

BUSCAS OBRIGATÓRIAS:
Rodar busca por:
- reset
- resetar
- resetarTudo
- resetarMateria
- resetarQuestoes
- localStorage.clear
- removeItem
- conquistasDesbloqueadas
- lifetimeQuestions
- lifetimeCorrect
- lifetimeReview
- lifetimeReviewed
- reviewedQuestionIds
- achievements
- badges
- Michel
- Giulian
- raw_user_meta_data
- user_metadata
- full_name
- display_name

TESTES OBRIGATÓRIOS:
1. Rodar:
   pnpm.cmd run build

2. Se falhar, corrigir até passar.

3. Verificar pelo código:
   - resetar questões não limpa conquistas.
   - resetar matéria não limpa conquistas.
   - resetar tudo não limpa conquistas.
   - usuário mi.psy.trance@gmail.com aparece como Admin.

4. Se possível, criar uma simulação mental/rápida:
   - usuário tem uma conquista desbloqueada
   - chama reset
   - conquista continua no estado/localStorage
   - sidebar e achievements ainda mostram badge desbloqueada

AO FINAL RESPONDER:
- Build passou ou não.
- Arquivos alterados.
- Como o nome Admin foi garantido.
- Como as conquistas foram protegidas contra reset.
- Quais chaves/estados de conquistas são preservados.
- Confirmar que não fez commit nem push.

NÃO FAÇA COMMIT.
NÃO FAÇA PUSH.
