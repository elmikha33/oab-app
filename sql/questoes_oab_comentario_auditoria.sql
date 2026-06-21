-- Hotfix: campos da auditoria semantica de comentarios.
-- Use este arquivo se o Supabase acusar coluna ausente como:
-- column questoes_oab.comentario_auditado does not exist

alter table public.questoes_oab
  add column if not exists comentario_auditado boolean not null default false,
  add column if not exists comentario_auditado_em timestamp with time zone,
  add column if not exists comentario_auditoria_motivo text;

alter table public.questoes_revisoes
  add column if not exists comentario_auditado boolean not null default false,
  add column if not exists comentario_auditado_em timestamp with time zone,
  add column if not exists comentario_auditoria_motivo text;

create index if not exists idx_questoes_oab_comentario_auditado
  on public.questoes_oab (comentario_auditado, comentario_auditado_em);

notify pgrst, 'reload schema';
