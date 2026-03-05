/**
 * runMigrations — executa migrations pendentes via Supabase Management API.
 *
 * Requer: Personal Access Token do Supabase (PAT), obtido em
 * https://supabase.com/dashboard/account/tokens
 *
 * Fluxo:
 *  1. Extrai o ref do projeto a partir da supabaseUrl
 *  2. Checa schema_migrations para saber quais já rodaram
 *  3. Executa as pendentes em ordem via Management API
 *  4. Registra cada migration executada em schema_migrations
 *
 * Não-fatal: erros são logados mas não interrompem o installer.
 */

interface Migration {
  version: string;
  sql: string;
}

// ── Migrations embutidas (mesma ordem que supabase/migrations/) ──────────────
// Para adicionar novas migrations: insira no final do array, incrementando a versão.
const MIGRATIONS: Migration[] = [
  {
    version: '001_init',
    sql: `
-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Tracking
create table if not exists schema_migrations (
  version     text        primary key,
  executed_at timestamptz not null default now()
);

-- set_updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- companies
create table if not exists companies (
  id         uuid        primary key default uuid_generate_v4(),
  name       text        not null,
  slug       text        unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists set_companies_updated_at on companies;
create trigger set_companies_updated_at
  before update on companies for each row execute function set_updated_at();
alter table companies enable row level security;

-- profiles
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
  before update on profiles for each row execute function set_updated_at();
alter table profiles enable row level security;

-- contacts
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
  before update on contacts for each row execute function set_updated_at();
alter table contacts enable row level security;

-- boards
create table if not exists boards (
  id          uuid        primary key default uuid_generate_v4(),
  company_id  uuid        not null references companies(id) on delete cascade,
  name        text        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists set_boards_updated_at on boards;
create trigger set_boards_updated_at
  before update on boards for each row execute function set_updated_at();
alter table boards enable row level security;

-- board_stages
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
  before update on board_stages for each row execute function set_updated_at();
alter table board_stages enable row level security;

-- leads
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
  before update on leads for each row execute function set_updated_at();
alter table leads enable row level security;

-- activities
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
  before update on activities for each row execute function set_updated_at();
alter table activities enable row level security;

-- tasks
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
  before update on tasks for each row execute function set_updated_at();
alter table tasks enable row level security;

-- goals
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
  before update on goals for each row execute function set_updated_at();
alter table goals enable row level security;

-- sales
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
  before update on sales for each row execute function set_updated_at();
alter table sales enable row level security;

-- Trigger: handle_new_user
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
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();

-- Trigger: bootstrap_company_for_new_user
create or replace function bootstrap_company_for_new_user()
returns trigger language plpgsql security definer as $$
declare v_company_id uuid;
begin
  if new.role = 'admin' and new.company_id is null then
    insert into companies (name) values ('Minha Empresa') returning id into v_company_id;
    update profiles set company_id = v_company_id where id = new.id;
  end if;
  return new;
end; $$;
drop trigger if exists on_profile_bootstrap_company on profiles;
create trigger on_profile_bootstrap_company
  after insert on profiles for each row execute function bootstrap_company_for_new_user();

-- Record migration
insert into schema_migrations (version) values ('001_init') on conflict (version) do nothing;
    `.trim(),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractProjectRef(supabaseUrl: string): string | null {
  // https://<ref>.supabase.co  →  <ref>
  const match = supabaseUrl.trim().match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

async function runSql(
  projectRef: string,
  supabasePatToken: string,
  sql: string,
): Promise<void> {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabasePatToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.message ?? body?.error ?? `HTTP ${res.status} ao executar SQL`,
    );
  }
}

async function getExecutedVersions(
  projectRef: string,
  supabasePatToken: string,
): Promise<Set<string>> {
  try {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabasePatToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'select version from schema_migrations order by executed_at',
        }),
      },
    );
    if (!res.ok) return new Set(); // table may not exist yet
    const data = await res.json();
    const rows: Array<{ version: string }> = Array.isArray(data) ? data : (data?.rows ?? []);
    return new Set(rows.map(r => r.version));
  } catch {
    return new Set();
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Executa todas as migrations pendentes.
 *
 * @param supabaseUrl      URL do projeto (ex: https://xyzref.supabase.co)
 * @param supabasePatToken Personal Access Token (não o service_role key)
 *                         Obtido em: https://supabase.com/dashboard/account/tokens
 * @returns { ran: string[], skipped: string[], error?: string }
 */
export async function runMigrations(
  supabaseUrl: string,
  supabasePatToken: string,
): Promise<{ ran: string[]; skipped: string[]; error?: string }> {
  const ref = extractProjectRef(supabaseUrl);
  if (!ref) {
    return { ran: [], skipped: [], error: 'URL do Supabase inválida para migrations.' };
  }

  const executed = await getExecutedVersions(ref, supabasePatToken);
  const ran: string[] = [];
  const skipped: string[] = [];

  for (const migration of MIGRATIONS) {
    if (executed.has(migration.version)) {
      skipped.push(migration.version);
      continue;
    }

    try {
      await runSql(ref, supabasePatToken, migration.sql);
      ran.push(migration.version);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ran, skipped, error: `Migration ${migration.version} falhou: ${msg}` };
    }
  }

  return { ran, skipped };
}
