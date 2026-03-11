-- ============================================================
-- Migration 017: Phase 5 entities — playbooks, group_analyses,
--                tags, crm_conversations, crm_messages
-- ============================================================

-- ── playbooks ──────────────────────────────────────────────
create table if not exists public.playbooks (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  stages      jsonb not null default '[]',
  steps       jsonb not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists playbooks_company_id_idx on public.playbooks (company_id);
alter table public.playbooks enable row level security;
create policy "company_access" on public.playbooks for all
  using (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

-- ── group_analyses ─────────────────────────────────────────
create table if not exists public.group_analyses (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  group_id    uuid not null references public.groups(id) on delete cascade,
  content     text not null default '',
  status      text not null default 'draft' check (status in ('saved', 'draft')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (group_id)
);
create index if not exists group_analyses_company_id_idx on public.group_analyses (company_id);
create index if not exists group_analyses_group_id_idx on public.group_analyses (group_id);
alter table public.group_analyses enable row level security;
create policy "company_access" on public.group_analyses for all
  using (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

-- ── tags ───────────────────────────────────────────────────
create table if not exists public.tags (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  color       text not null default '#6366f1',
  created_at  timestamptz not null default now(),
  unique (company_id, name)
);
create index if not exists tags_company_id_idx on public.tags (company_id);
alter table public.tags enable row level security;
create policy "company_access" on public.tags for all
  using (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

-- ── crm_conversations ──────────────────────────────────────
create table if not exists public.crm_conversations (
  id                      uuid primary key default gen_random_uuid(),
  company_id              uuid not null references public.companies(id) on delete cascade,
  lead_id                 uuid references public.leads(id) on delete set null,
  last_message            text,
  last_message_timestamp  timestamptz,
  unread_count            int not null default 0,
  status                  text not null default 'open',
  last_message_channel    text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index if not exists crm_conversations_company_id_idx on public.crm_conversations (company_id);
alter table public.crm_conversations enable row level security;
create policy "company_access" on public.crm_conversations for all
  using (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());

-- ── crm_messages ───────────────────────────────────────────
create table if not exists public.crm_messages (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  conversation_id  uuid not null references public.crm_conversations(id) on delete cascade,
  sender_id        text,
  text             text not null,
  timestamp        timestamptz not null default now(),
  channel          text,
  created_at       timestamptz not null default now()
);
create index if not exists crm_messages_conversation_id_idx on public.crm_messages (conversation_id);
alter table public.crm_messages enable row level security;
create policy "company_access" on public.crm_messages for all
  using (company_id = public.my_company_id())
  with check (company_id = public.my_company_id());
