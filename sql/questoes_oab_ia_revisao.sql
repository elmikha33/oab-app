-- Revisao profissional por IA para a tabela existente public.questoes_oab.
-- Rode este arquivo uma vez no SQL Editor do Supabase antes de executar
-- `pnpm validate:questoes`.

alter table public.questoes_oab
  add column if not exists revisado_ia boolean not null default false,
  add column if not exists revisado_em timestamp with time zone,
  add column if not exists confianca_correcao smallint,
  add column if not exists revisao_humana_necessaria boolean not null default false,
  add column if not exists motivo_revisao_humana text,
  add column if not exists modelo_ultima_revisao text,
  add column if not exists problemas_qualidade jsonb not null default '{}'::jsonb,
  add column if not exists prova_codigo text,
  add column if not exists numero_questao integer,
  add column if not exists gabarito_oficial integer,
  add column if not exists fonte_gabarito text,
  add column if not exists validacao_tripla jsonb not null default '{}'::jsonb,
  add column if not exists anulada boolean not null default false,
  add column if not exists ativa boolean not null default true,
  add column if not exists motivo_anulacao text,
  add column if not exists anulada_oficial boolean not null default false,
  add column if not exists inativa boolean not null default false,
  add column if not exists fonte_anulacao text,
  add column if not exists motivo_inativacao text,
  add column if not exists comentario_auditado boolean not null default false,
  add column if not exists comentario_auditado_em timestamp with time zone,
  add column if not exists comentario_auditoria_motivo text;

create table if not exists public.questoes_revisoes (
  id bigserial primary key,
  questao_id text not null,

  enunciado_antes text,
  enunciado_depois text,

  alternativas_antes jsonb,
  alternativas_depois jsonb,

  materia_antes text,
  materia_depois text,

  tema_antes text,
  tema_depois text,

  dificuldade_antes integer,
  dificuldade_depois integer,

  gabarito_antes integer,
  gabarito_depois integer,

  comentario_antes text,
  comentario_depois text,

  motivo_alteracao text,
  motivo_revisao_humana text,
  problemas_qualidade jsonb not null default '{}'::jsonb,
  validacao_tripla jsonb not null default '{}'::jsonb,
  confianca_correcao smallint,
  gabarito_alterado boolean not null default false,
  gabarito_oficial integer,
  fonte_gabarito text,
  anulada boolean not null default false,
  ativa boolean not null default true,
  motivo_anulacao text,
  anulada_oficial boolean not null default false,
  inativa boolean not null default false,
  fonte_anulacao text,
  motivo_inativacao text,
  comentario_auditado boolean not null default false,
  comentario_auditado_em timestamp with time zone,
  comentario_auditoria_motivo text,

  data timestamp with time zone not null default timezone('utc'::text, now()),
  modelo_ia text not null
);

alter table public.questoes_revisoes
  add column if not exists enunciado_antes text,
  add column if not exists enunciado_depois text,
  add column if not exists alternativas_antes jsonb,
  add column if not exists alternativas_depois jsonb,
  add column if not exists materia_antes text,
  add column if not exists materia_depois text,
  add column if not exists tema_antes text,
  add column if not exists tema_depois text,
  add column if not exists dificuldade_antes integer,
  add column if not exists dificuldade_depois integer,
  add column if not exists gabarito_antes integer,
  add column if not exists gabarito_depois integer,
  add column if not exists comentario_antes text,
  add column if not exists comentario_depois text,
  add column if not exists motivo_alteracao text,
  add column if not exists motivo_revisao_humana text,
  add column if not exists problemas_qualidade jsonb not null default '{}'::jsonb,
  add column if not exists validacao_tripla jsonb not null default '{}'::jsonb,
  add column if not exists confianca_correcao smallint,
  add column if not exists gabarito_alterado boolean not null default false,
  add column if not exists gabarito_oficial integer,
  add column if not exists fonte_gabarito text,
  add column if not exists anulada boolean not null default false,
  add column if not exists ativa boolean not null default true,
  add column if not exists motivo_anulacao text,
  add column if not exists anulada_oficial boolean not null default false,
  add column if not exists inativa boolean not null default false,
  add column if not exists fonte_anulacao text,
  add column if not exists motivo_inativacao text,
  add column if not exists comentario_auditado boolean not null default false,
  add column if not exists comentario_auditado_em timestamp with time zone,
  add column if not exists comentario_auditoria_motivo text,
  add column if not exists data timestamp with time zone not null default timezone('utc'::text, now()),
  add column if not exists modelo_ia text not null default 'desconhecido';

create index if not exists idx_questoes_revisoes_questao_id
  on public.questoes_revisoes (questao_id);

create index if not exists idx_questoes_revisoes_data
  on public.questoes_revisoes (data desc);

create index if not exists idx_questoes_oab_ativas
  on public.questoes_oab (ativa, anulada);

create index if not exists idx_questoes_oab_ativa_anulada
  on public.questoes_oab (ativa, anulada);

alter table public.questoes_revisoes enable row level security;

notify pgrst, 'reload schema';
