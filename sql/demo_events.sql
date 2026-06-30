-- Tracking simples da landing/demo publica do OAPlay.
-- Execute no Supabase SQL Editor se a tabela ainda nao existir.
-- A rota /api/demo-events grava com SUPABASE_SERVICE_ROLE_KEY no servidor.

create extension if not exists pgcrypto;

create table if not exists public.demo_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (
    event_name in (
      'landing_view',
      'demo_cta_click',
      'demo_view',
      'demo_answer',
      'demo_completed',
      'signup_cta_click'
    )
  ),
  path text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now(),
  metadata jsonb
);

create index if not exists demo_events_created_at_idx
  on public.demo_events (created_at desc);

create index if not exists demo_events_event_name_created_at_idx
  on public.demo_events (event_name, created_at desc);

alter table public.demo_events enable row level security;

-- Sem policies de select/update/delete para anon/authenticated.
-- A insercao deve acontecer pela rota API server-side usando service role.
