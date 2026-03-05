-- ============================================================
-- CRM Zenius — Schema inicial
-- Migration: 001_init.sql
-- Executar via: Install Wizard (runMigrations)
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Tracking table ───────────────────────────────────────────
create table if not exists schema_migrations (
  version     text        primary key,
  executed_at timestamptz not null default now()
);

-- ── set_updated_at trigger function ─────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 1. companies ─────────────────────────────────────────────
create table if not exists companies (
  id         uuid        primary key default uuid_generate_v4(),
  name       text        not null,
  slug       text        unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_companies_updated_at on companies;
create trigger set_companies_updated_at
  before update on companies
  for each row execute function set_updated_at();

alter table companies enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'companies' and policyname = 'Companies: members can read own'
  ) then
    create policy "Companies: members can read own"
      on companies for select
      using (
        id in (
          select company_id from profiles
          where id = auth.uid()
        )
      );
  end if;
end $$;

-- ── 2. profiles (users) ──────────────────────────────────────
create table if not exists profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  company_id  uuid        references companies(id) on delete set null,
  full_name   text,
  role        text        not null default 'user' check (role in ('admin','seller','user')),
  is_active   boolean     not null default true,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on profiles;
create trigger set_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

alter table profiles enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles' and policyname = 'Profiles: user reads own'
  ) then
    create policy "Profiles: user reads own"
      on profiles for select
      using (id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles' and policyname = 'Profiles: admin reads company'
  ) then
    create policy "Profiles: admin reads company"
      on profiles for select
      using (
        company_id in (
          select company_id from profiles
          where id = auth.uid() and role = 'admin'
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles' and policyname = 'Profiles: user updates own'
  ) then
    create policy "Profiles: user updates own"
      on profiles for update
      using (id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'profiles' and policyname = 'Profiles: admin manages company'
  ) then
    create policy "Profiles: admin manages company"
      on profiles for all
      using (
        company_id in (
          select company_id from profiles
          where id = auth.uid() and role = 'admin'
        )
      );
  end if;
end $$;

-- ── 3. contacts ──────────────────────────────────────────────
create table if not exists contacts (
  id          uuid        primary key default uuid_generate_v4(),
  company_id  uuid        not null references companies(id) on delete cascade,
  name        text        not null,
  email       text,
  phone       text,
  document    text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists set_contacts_updated_at on contacts;
create trigger set_contacts_updated_at
  before update on contacts
  for each row execute function set_updated_at();

alter table contacts enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'contacts' and policyname = 'Contacts: company members'
  ) then
    create policy "Contacts: company members"
      on contacts for all
      using (
        company_id in (
          select company_id from profiles
          where id = auth.uid()
        )
      );
  end if;
end $$;

-- ── 4. boards (pipelines) ─────────────────────────────────────
create table if not exists boards (
  id          uuid        primary key default uuid_generate_v4(),
  company_id  uuid        not null references companies(id) on delete cascade,
  name        text        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists set_boards_updated_at on boards;
create trigger set_boards_updated_at
  before update on boards
  for each row execute function set_updated_at();

alter table boards enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'boards' and policyname = 'Boards: company members'
  ) then
    create policy "Boards: company members"
      on boards for all
      using (
        company_id in (
          select company_id from profiles
          where id = auth.uid()
        )
      );
  end if;
end $$;

-- ── 5. board_stages (pipeline stages) ───────────────────────
create table if not exists board_stages (
  id                     uuid    primary key default uuid_generate_v4(),
  board_id               uuid    not null references boards(id) on delete cascade,
  title                  text    not null,
  position               integer not null default 0,
  linked_lifecycle_stage text,
  color                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

drop trigger if exists set_board_stages_updated_at on board_stages;
create trigger set_board_stages_updated_at
  before update on board_stages
  for each row execute function set_updated_at();

alter table board_stages enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'board_stages' and policyname = 'BoardStages: company members'
  ) then
    create policy "BoardStages: company members"
      on board_stages for all
      using (
        board_id in (
          select b.id from boards b
          join profiles p on p.company_id = b.company_id
          where p.id = auth.uid()
        )
      );
  end if;
end $$;

-- ── 6. leads (deals) ─────────────────────────────────────────
create table if not exists leads (
  id            uuid        primary key default uuid_generate_v4(),
  company_id    uuid        not null references companies(id) on delete cascade,
  board_id      uuid        references boards(id) on delete set null,
  stage_id      uuid        references board_stages(id) on delete set null,
  owner_id      uuid        references profiles(id) on delete set null,
  contact_id    uuid        references contacts(id) on delete set null,
  name          text        not null,
  value         numeric(14,2),
  status        text        not null default 'Ativo',
  is_archived   boolean     not null default false,
  deleted_at    timestamptz,
  won_at        timestamptz,
  lost_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists set_leads_updated_at on leads;
create trigger set_leads_updated_at
  before update on leads
  for each row execute function set_updated_at();

alter table leads enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'leads' and policyname = 'Leads: company members'
  ) then
    create policy "Leads: company members"
      on leads for all
      using (
        company_id in (
          select company_id from profiles
          where id = auth.uid()
        )
      );
  end if;
end $$;

-- ── 7. activities ─────────────────────────────────────────────
create table if not exists activities (
  id          uuid        primary key default uuid_generate_v4(),
  company_id  uuid        not null references companies(id) on delete cascade,
  lead_id     uuid        references leads(id) on delete cascade,
  user_id     uuid        references profiles(id) on delete set null,
  type        text        not null,
  description text,
  occurred_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists set_activities_updated_at on activities;
create trigger set_activities_updated_at
  before update on activities
  for each row execute function set_updated_at();

alter table activities enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'activities' and policyname = 'Activities: company members'
  ) then
    create policy "Activities: company members"
      on activities for all
      using (
        company_id in (
          select company_id from profiles
          where id = auth.uid()
        )
      );
  end if;
end $$;

-- ── 8. tasks ─────────────────────────────────────────────────
create table if not exists tasks (
  id          uuid        primary key default uuid_generate_v4(),
  company_id  uuid        not null references companies(id) on delete cascade,
  lead_id     uuid        references leads(id) on delete cascade,
  assigned_to uuid        references profiles(id) on delete set null,
  title       text        not null,
  description text,
  due_date    date,
  is_done     boolean     not null default false,
  done_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists set_tasks_updated_at on tasks;
create trigger set_tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();

alter table tasks enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'tasks' and policyname = 'Tasks: company members'
  ) then
    create policy "Tasks: company members"
      on tasks for all
      using (
        company_id in (
          select company_id from profiles
          where id = auth.uid()
        )
      );
  end if;
end $$;

-- ── 9. goals ──────────────────────────────────────────────────
create table if not exists goals (
  id          uuid        primary key default uuid_generate_v4(),
  company_id  uuid        not null references companies(id) on delete cascade,
  user_id     uuid        references profiles(id) on delete cascade,
  target      numeric(14,2) not null,
  start_date  date        not null,
  end_date    date        not null,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists set_goals_updated_at on goals;
create trigger set_goals_updated_at
  before update on goals
  for each row execute function set_updated_at();

alter table goals enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'goals' and policyname = 'Goals: company members'
  ) then
    create policy "Goals: company members"
      on goals for all
      using (
        company_id in (
          select company_id from profiles
          where id = auth.uid()
        )
      );
  end if;
end $$;

-- ── 10. sales ─────────────────────────────────────────────────
create table if not exists sales (
  id               uuid        primary key default uuid_generate_v4(),
  company_id       uuid        not null references companies(id) on delete cascade,
  lead_id          uuid        references leads(id) on delete set null,
  seller_id        uuid        references profiles(id) on delete set null,
  amount           numeric(14,2) not null,
  data_fechamento  date        not null,
  product_type     text,
  bank             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists set_sales_updated_at on sales;
create trigger set_sales_updated_at
  before update on sales
  for each row execute function set_updated_at();

alter table sales enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'sales' and policyname = 'Sales: company members'
  ) then
    create policy "Sales: company members"
      on sales for all
      using (
        company_id in (
          select company_id from profiles
          where id = auth.uid()
        )
      );
  end if;
end $$;

-- ── Trigger: handle_new_user ──────────────────────────────────
-- Cria perfil automaticamente ao registrar usuário no Supabase Auth
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        role      = excluded.role;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Trigger: bootstrap_company_for_new_user ──────────────────
-- Quando o primeiro admin é criado sem company_id,
-- cria uma empresa padrão e associa o perfil.
create or replace function bootstrap_company_for_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_company_id uuid;
begin
  -- Only bootstrap for admin without a company
  if new.role = 'admin' and new.company_id is null then
    insert into companies (name)
    values ('Minha Empresa')
    returning id into v_company_id;

    update profiles
    set company_id = v_company_id
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_bootstrap_company on profiles;
create trigger on_profile_bootstrap_company
  after insert on profiles
  for each row execute function bootstrap_company_for_new_user();

-- ── Performance indexes ───────────────────────────────────────
create index if not exists idx_profiles_company  on profiles(company_id);
create index if not exists idx_contacts_company  on contacts(company_id);
create index if not exists idx_leads_company     on leads(company_id);
create index if not exists idx_tasks_company     on tasks(company_id);
create index if not exists idx_activities_company on activities(company_id);
create index if not exists idx_sales_company     on sales(company_id);

create index if not exists idx_leads_stage       on leads(stage_id);
create index if not exists idx_leads_owner       on leads(owner_id);

-- ── Record this migration ─────────────────────────────────────
insert into schema_migrations (version)
values ('001_init')
on conflict (version) do nothing;
