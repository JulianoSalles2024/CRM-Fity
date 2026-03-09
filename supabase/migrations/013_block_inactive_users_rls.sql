-- ============================================================
-- Migration: 013_block_inactive_users_rls
--
-- Atualiza my_company_id() para retornar NULL quando o usuário
-- autenticado tem is_active = false.
--
-- Impacto imediato:
--   Todas as RLS policies que usam company_id = my_company_id()
--   passam a retornar FALSE para usuários bloqueados, pois:
--     company_id = NULL → sempre falso no Postgres.
--
-- Isso revoga acesso a dados em todas as tabelas protegidas
-- (leads, boards, tasks, activities, sales, goals, invites, etc.)
-- sem alterar nenhuma policy individualmente.
--
-- A policy "Profiles: user reads own" usa id = auth.uid()
-- (não usa my_company_id), então o AuthContext ainda consegue
-- ler is_active do profile e executar o signOut no frontend.
--
-- Safe para re-execução: CREATE OR REPLACE.
-- ============================================================

create or replace function public.my_company_id()
returns uuid
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_company_id uuid;
begin
  -- Guarda: retorna NULL se a tabela profiles ainda não existir
  -- (segurança durante execução sequencial de migrations).
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name   = 'profiles'
  ) then
    return null;
  end if;

  -- Retorna NULL para usuários bloqueados (is_active = false).
  -- NULL faz company_id = my_company_id() ser FALSE em toda policy,
  -- revogando acesso a dados imediatamente mesmo com JWT ativo.
  select company_id
    into v_company_id
    from public.profiles
   where id        = auth.uid()
     and is_active = true;   -- ← usuários bloqueados não passam aqui

  return v_company_id;       -- retorna NULL se bloqueado ou sem perfil
end;
$$;

grant execute on function public.my_company_id() to authenticated;
