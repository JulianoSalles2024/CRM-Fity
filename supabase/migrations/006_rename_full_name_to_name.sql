-- ============================================================
-- Migration: 006_rename_full_name_to_name
--
-- Renomeia profiles.full_name → profiles.name para alinhar
-- o schema do installer com o ambiente de desenvolvimento.
--
-- Idempotente: só executa se full_name ainda existir.
-- ============================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'profiles'
      and column_name  = 'full_name'
  ) then
    alter table public.profiles rename column full_name to name;
  end if;
end $$;

-- Atualiza o trigger handle_new_user para usar a coluna correta.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do update
    set name = excluded.name,
        role = excluded.role;
  return new;
end;
$$;
