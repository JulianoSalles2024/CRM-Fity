-- ============================================================
-- Migration: 005_fix_profiles_rls
--
-- Substitui as policies recursivas de profiles por versões
-- seguras usando funções SECURITY DEFINER.
--
-- Problema corrigido:
--   ERROR 42P17: infinite recursion detected in policy for
--   relation "profiles" — causado por subquery em profiles
--   dentro da própria policy de profiles.
--
-- Solução:
--   my_company_id() e my_role() são SECURITY DEFINER:
--   executam como owner (superuser), bypassam RLS,
--   sem disparar recursão.
--
-- Idempotente: seguro para re-execução.
-- ============================================================

-- ── 1. Funções SECURITY DEFINER ──────────────────────────────

create or replace function public.my_company_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create or replace function public.my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

grant execute on function public.my_company_id() to authenticated;
grant execute on function public.my_role()       to authenticated;

-- ── 2. Remove TODAS as policies existentes de profiles ───────
-- Garante que nenhuma policy recursiva sobreviva,
-- independente do nome ou da ordem de criação anterior.

do $$
declare
  r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', r.policyname);
  end loop;
end $$;

-- ── 3. Policies corretas ──────────────────────────────────────

-- Qualquer usuário lê o próprio perfil
create policy "Profiles: user reads own"
  on public.profiles for select
  using (id = auth.uid());

-- Admin lê todos os profiles da sua empresa (sem recursão)
create policy "Profiles: admin reads company"
  on public.profiles for select
  using (
    public.my_role() = 'admin'
    and company_id = public.my_company_id()
  );

-- Qualquer usuário atualiza o próprio perfil
create policy "Profiles: user updates own"
  on public.profiles for update
  using (id = auth.uid());

-- Admin gerencia profiles da sua empresa (sem recursão)
create policy "Profiles: admin manages company"
  on public.profiles for all
  using (
    public.my_role() = 'admin'
    and company_id = public.my_company_id()
  );
