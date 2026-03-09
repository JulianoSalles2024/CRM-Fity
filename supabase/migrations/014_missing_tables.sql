-- ============================================================
-- Migration: 014_missing_tables
--
-- Cria 4 tabelas usadas pelo frontend mas ausentes nas migrations:
--
--   notifications    — central de notificações com soft delete
--   ai_conversations — histórico de conversas do Copiloto IA
--   user_settings    — credenciais de IA por usuário (service_role)
--   groups           — grupos de leads multi-tenant
--
-- Safe para re-execução: CREATE TABLE IF NOT EXISTS em todas.
-- ============================================================


-- ── 1. notifications ─────────────────────────────────────────
-- Lida pelo useNotifications.ts via authenticated + realtime.
-- Isolada por recipient_user_id (sem company_id — é pessoal).
-- Soft delete via deleted_at.

create table if not exists public.notifications (
  id                 uuid        primary key default uuid_generate_v4(),
  company_id         uuid        references public.companies(id) on delete cascade,
  recipient_user_id  uuid        not null references public.profiles(id) on delete cascade,
  type               text        not null default 'info',
  title              text        not null default '',
  message            text        not null default '',
  entity_type        text,
  entity_id          uuid,
  is_read            boolean     not null default false,
  read_at            timestamptz,
  deleted_at         timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists idx_notifications_recipient
  on public.notifications (recipient_user_id);
create index if not exists idx_notifications_company
  on public.notifications (company_id);
create index if not exists idx_notifications_created
  on public.notifications (created_at desc);

alter table public.notifications enable row level security;

-- Usuário lê/atualiza apenas suas próprias notificações
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'notifications' and policyname = 'Notifications: own'
  ) then
    create policy "Notifications: own"
      on public.notifications for all
      using (recipient_user_id = auth.uid());
  end if;
end $$;

-- Admin pode inserir notificações para qualquer membro da empresa
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'notifications' and policyname = 'Notifications: admin insert'
  ) then
    create policy "Notifications: admin insert"
      on public.notifications for insert
      with check (company_id = public.my_company_id());
  end if;
end $$;


-- ── 2. ai_conversations ───────────────────────────────────────
-- Lida pelo useAIConversations.ts.
-- Mensagens armazenadas em JSONB. Isolada por user_id.

create table if not exists public.ai_conversations (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  company_id uuid        references public.companies(id) on delete cascade,
  tool_id    text        not null default 'default',
  title      text        not null default 'Nova conversa',
  messages   jsonb       not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_ai_conversations_updated_at on public.ai_conversations;
create trigger set_ai_conversations_updated_at
  before update on public.ai_conversations
  for each row execute function set_updated_at();

create index if not exists idx_ai_conversations_user
  on public.ai_conversations (user_id);
create index if not exists idx_ai_conversations_company
  on public.ai_conversations (company_id);
create index if not exists idx_ai_conversations_tool
  on public.ai_conversations (tool_id);

alter table public.ai_conversations enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'ai_conversations' and policyname = 'AI Conversations: own'
  ) then
    create policy "AI Conversations: own"
      on public.ai_conversations for all
      using (user_id = auth.uid());
  end if;
end $$;


-- ── 3. user_settings ──────────────────────────────────────────
-- Lida pelas Vercel API routes /api/ai/* via service_role.
-- Armazena credenciais de IA por usuário.
-- RLS habilitada mas service_role bypassa — autenticado só lê o próprio.

create table if not exists public.user_settings (
  user_id    uuid  primary key references public.profiles(id) on delete cascade,
  ai_provider text,
  ai_api_key  text,
  model       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
  before update on public.user_settings
  for each row execute function set_updated_at();

alter table public.user_settings enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'user_settings' and policyname = 'UserSettings: own'
  ) then
    create policy "UserSettings: own"
      on public.user_settings for all
      using (user_id = auth.uid());
  end if;
end $$;


-- ── 4. groups ─────────────────────────────────────────────────
-- Lida pelo useGroups.ts.
-- Multi-tenant via company_id. Unique por (company_id, name).

create table if not exists public.groups (
  id          uuid          primary key default uuid_generate_v4(),
  company_id  uuid          not null references public.companies(id) on delete cascade,
  created_by  uuid          references public.profiles(id) on delete set null,
  name        text          not null,
  description text,
  access_link text,
  status      text          not null default 'Ativo',
  member_goal numeric(14,2),
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now(),
  unique (company_id, name)
);

drop trigger if exists set_groups_updated_at on public.groups;
create trigger set_groups_updated_at
  before update on public.groups
  for each row execute function set_updated_at();

create index if not exists idx_groups_company
  on public.groups (company_id);

alter table public.groups enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'groups' and policyname = 'Groups: company members'
  ) then
    create policy "Groups: company members"
      on public.groups for all
      using (company_id = public.my_company_id());
  end if;
end $$;
