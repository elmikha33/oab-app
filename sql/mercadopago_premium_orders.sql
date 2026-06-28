-- OAPlay Mercado Pago Premium support.
-- Execute manually in Supabase SQL Editor if these columns/table do not exist.
-- This SQL is additive and does not delete data.

alter table if exists public.profiles
  add column if not exists is_premium boolean not null default false,
  add column if not exists premium_ate timestamptz,
  add column if not exists plano text not null default 'free',
  add column if not exists subscription_status text,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.premium_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  valor numeric(10, 2),
  moeda text not null default 'BRL',
  status text not null default 'pending',
  tipo text not null default 'checkout_pro',
  premium_dias integer not null default 90,
  mercado_pago_payment_id text,
  mercado_pago_preference_id text,
  raw_event jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.premium_orders
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists email text,
  add column if not exists valor numeric(10, 2),
  add column if not exists moeda text not null default 'BRL',
  add column if not exists status text not null default 'pending',
  add column if not exists tipo text not null default 'checkout_pro',
  add column if not exists premium_dias integer not null default 90,
  add column if not exists mercado_pago_payment_id text,
  add column if not exists mercado_pago_preference_id text,
  add column if not exists raw_event jsonb,
  add column if not exists paid_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists premium_orders_mercado_pago_payment_id_uidx
  on public.premium_orders (mercado_pago_payment_id)
  where mercado_pago_payment_id is not null;

create index if not exists premium_orders_user_id_idx
  on public.premium_orders (user_id);

alter table public.premium_orders enable row level security;

drop policy if exists "premium_orders_select_own" on public.premium_orders;
create policy "premium_orders_select_own"
on public.premium_orders
for select
to authenticated
using (user_id = auth.uid());

-- Do not create client insert/update/delete policies for premium_orders.
-- Checkout and webhook writes must use SUPABASE_SERVICE_ROLE_KEY on the server.
