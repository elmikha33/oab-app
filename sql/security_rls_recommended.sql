-- OAPlay security baseline for Supabase.
-- Review and execute manually in Supabase SQL Editor before launch.
-- This file does not delete data.

alter table if exists public.profiles enable row level security;
alter table if exists public.premium_orders enable row level security;
alter table if exists public.questoes_oab enable row level security;

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

  if new.id is distinct from old.id
    or new.email is distinct from old.email
    or new.is_premium is distinct from old.is_premium
    or new.premium_ate is distinct from old.premium_ate
    or new.plano is distinct from old.plano
    or new.subscription_status is distinct from old.subscription_status
    or new.mercado_pago_subscription_id is distinct from old.mercado_pago_subscription_id then
    raise exception 'protected profile fields cannot be changed by client';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_prevent_privilege_escalation on public.profiles;
create trigger trg_profiles_prevent_privilege_escalation
before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_oaplay_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
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

-- No insert/update/delete policies are created for premium_orders or questoes_oab.
-- Server routes using SUPABASE_SERVICE_ROLE_KEY bypass RLS for webhook/admin jobs.
