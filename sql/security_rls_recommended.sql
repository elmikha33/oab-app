-- OAPlay security baseline for Supabase.
-- Review and execute manually in Supabase SQL Editor before launch.
-- This file is additive and does not delete data.

alter table if exists public.profiles enable row level security;
alter table if exists public.premium_orders enable row level security;
alter table if exists public.questoes_oab enable row level security;
alter table if exists public.respostas enable row level security;
alter table if exists public.progresso enable row level security;
alter table if exists public.revisoes enable row level security;
alter table if exists public.usuario_conquistas enable row level security;

alter table if exists public.profiles
  add column if not exists is_premium boolean not null default false,
  add column if not exists premium_ate timestamptz,
  add column if not exists plano text not null default 'free',
  add column if not exists subscription_status text,
  add column if not exists mercado_pago_subscription_id text,
  add column if not exists mercado_pago_customer_id text,
  add column if not exists is_admin boolean not null default false;

create or replace function public.is_oaplay_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'mi.psy.trance@gmail.com';
$$;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if coalesce(new.is_premium, false) is true
      or new.premium_ate is not null
      or coalesce(new.plano, 'free') <> 'free'
      or new.subscription_status is not null
      or new.mercado_pago_subscription_id is not null
      or new.mercado_pago_customer_id is not null
      or coalesce(new.is_admin, false) is true then
      raise exception 'protected profile fields cannot be set by client';
    end if;

    return new;
  end if;

  if new.id is distinct from old.id
    or new.email is distinct from old.email
    or new.is_premium is distinct from old.is_premium
    or new.premium_ate is distinct from old.premium_ate
    or new.plano is distinct from old.plano
    or new.subscription_status is distinct from old.subscription_status
    or new.mercado_pago_subscription_id is distinct from old.mercado_pago_subscription_id
    or new.mercado_pago_customer_id is distinct from old.mercado_pago_customer_id
    or new.is_admin is distinct from old.is_admin then
    raise exception 'protected profile fields cannot be changed by client';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_prevent_privilege_escalation on public.profiles;
create trigger trg_profiles_prevent_privilege_escalation
before insert or update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_oaplay_admin());

drop policy if exists "profiles_insert_own_safe_fields" on public.profiles;
create policy "profiles_insert_own_safe_fields"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own_safe_fields" on public.profiles;
create policy "profiles_update_own_safe_fields"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "premium_orders_select_own_or_admin" on public.premium_orders;
create policy "premium_orders_select_own_or_admin"
on public.premium_orders
for select
to authenticated
using (user_id = auth.uid() or public.is_oaplay_admin());

drop policy if exists "questoes_oab_select_active_authenticated" on public.questoes_oab;
create policy "questoes_oab_select_active_authenticated"
on public.questoes_oab
for select
to authenticated
using (
  coalesce(ativa, true) = true
  and coalesce(inativa, false) = false
);

drop policy if exists "respostas_select_own" on public.respostas;
create policy "respostas_select_own"
on public.respostas
for select
to authenticated
using (usuario_id = auth.uid());

drop policy if exists "respostas_insert_own" on public.respostas;
create policy "respostas_insert_own"
on public.respostas
for insert
to authenticated
with check (usuario_id = auth.uid());

-- If a public.progresso table exists, create equivalent policies using the
-- actual owner column used by that table, usually user_id or usuario_id.

drop policy if exists "revisoes_manage_own" on public.revisoes;
create policy "revisoes_manage_own"
on public.revisoes
for all
to authenticated
using (usuario_id = auth.uid())
with check (usuario_id = auth.uid());

drop policy if exists "usuario_conquistas_select_own" on public.usuario_conquistas;
create policy "usuario_conquistas_select_own"
on public.usuario_conquistas
for select
to authenticated
using (usuario_id = auth.uid());

-- No client insert/update/delete policies are created for premium_orders or questoes_oab.
-- Checkout, webhook and admin writes must use SUPABASE_SERVICE_ROLE_KEY on the server.
