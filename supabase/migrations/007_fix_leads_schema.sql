-- ============================================================
-- Migration: 007_fix_leads_schema
--
-- Corrige schema drift entre dev e ambientes gerados pelo installer.
-- Idempotente via IF NOT EXISTS / DO $$ ... IF EXISTS.
-- ============================================================

-- ── profiles: colunas ausentes ───────────────────────────────
alter table public.profiles
  add column if not exists first_name  text,
  add column if not exists last_name   text,
  add column if not exists nickname    text,
  add column if not exists email       text,
  add column if not exists phone       text,
  add column if not exists avatar      text,
  add column if not exists is_archived boolean     not null default false,
  add column if not exists archived_at timestamptz;

-- ── boards: colunas ausentes ─────────────────────────────────
alter table public.boards
  add column if not exists description text,
  add column if not exists type        text,
  add column if not exists is_default  boolean not null default false;

-- ── board_stages: rename title→name, position→order, add company_id ──
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='board_stages' and column_name='title'
  ) then
    alter table public.board_stages rename column title to name;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='board_stages' and column_name='position'
  ) then
    alter table public.board_stages rename column position to "order";
  end if;
end $$;

alter table public.board_stages
  add column if not exists company_id uuid references public.companies(id) on delete cascade;

-- ── leads: rename stage_id→column_id + colunas ausentes ─────
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='leads' and column_name='stage_id'
  ) then
    alter table public.leads rename column stage_id to column_id;
  end if;
end $$;

alter table public.leads
  add column if not exists company_name            text,
  add column if not exists email                   text,
  add column if not exists phone                   text,
  add column if not exists source                  text,
  add column if not exists probability             numeric(5,2),
  add column if not exists avatar_url              text,
  add column if not exists tags                    jsonb not null default '[]',
  add column if not exists last_activity           text,
  add column if not exists last_activity_timestamp text,
  add column if not exists due_date                text,
  add column if not exists assigned_to             text,
  add column if not exists description             text,
  add column if not exists segment                 text,
  add column if not exists client_id               text,
  add column if not exists group_info              jsonb,
  add column if not exists active_playbook         jsonb,
  add column if not exists playbook_history        jsonb,
  add column if not exists qualification_status    text,
  add column if not exists disqualification_reason text,
  add column if not exists lost_reason             text,
  add column if not exists reactivation_date       text,
  add column if not exists won_at                  timestamptz,
  add column if not exists lost_at                 timestamptz;

-- ── activities: colunas ausentes + rename description→text ───
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='activities' and column_name='description'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='activities' and column_name='text'
  ) then
    alter table public.activities rename column description to text;
  end if;
end $$;

alter table public.activities
  add column if not exists text        text,
  add column if not exists author_name text;

-- ── tasks: rename assigned_to→user_id + colunas ausentes ─────
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='tasks' and column_name='assigned_to'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='tasks' and column_name='user_id'
  ) then
    alter table public.tasks rename column assigned_to to user_id;
  end if;
end $$;

-- due_date: se for tipo date, muda para text
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='tasks'
      and column_name='due_date' and data_type='date'
  ) then
    alter table public.tasks alter column due_date type text using due_date::text;
  end if;
end $$;

alter table public.tasks
  add column if not exists user_id             uuid references public.profiles(id) on delete set null,
  add column if not exists type                text,
  add column if not exists status              text not null default 'pending',
  add column if not exists playbook_id         text,
  add column if not exists playbook_step_index integer;

-- ── my_role() SECURITY DEFINER (se não existir) ──────────────
create or replace function public.my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

grant execute on function public.my_role() to authenticated;

-- ── accept_invite RPC ─────────────────────────────────────────
create or replace function public.accept_invite(invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite  invites%rowtype;
  v_uid     uuid := auth.uid();
begin
  select * into v_invite from public.invites where id = invite_id;

  if not found then
    raise exception 'Convite não encontrado.' using errcode = 'P0002';
  end if;
  if v_invite.used_at is not null then
    raise exception 'Este convite já foi utilizado.' using errcode = 'P0003';
  end if;
  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    raise exception 'Este convite expirou.' using errcode = 'P0004';
  end if;

  update public.profiles
  set company_id = v_invite.company_id,
      role       = v_invite.role
  where id = v_uid;

  update public.invites
  set used_at = now()
  where id = invite_id;
end;
$$;

grant execute on function public.accept_invite(uuid) to authenticated;

-- ── Corrige policies recursivas de profiles ───────────────────
-- Remove todas as policies existentes de profiles e recria sem recursão.
do $$
declare
  r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', r.policyname);
  end loop;
end $$;

create policy "Profiles: user reads own"
  on public.profiles for select
  using (id = auth.uid());

create policy "Profiles: admin reads company"
  on public.profiles for select
  using (
    public.my_role() = 'admin'
    and company_id = public.my_company_id()
  );

create policy "Profiles: user updates own"
  on public.profiles for update
  using (id = auth.uid());

create policy "Profiles: admin manages company"
  on public.profiles for all
  using (
    public.my_role() = 'admin'
    and company_id = public.my_company_id()
  );
