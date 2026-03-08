-- ============================================================
-- Migration: 008_seller_scores
--
-- Adds the seller_scores table for the Painel 360 Score tab.
-- Safe for existing databases: CREATE TABLE IF NOT EXISTS.
-- ============================================================

create table if not exists public.seller_scores (
  id             uuid        primary key default gen_random_uuid(),
  seller_id      uuid        not null references public.profiles(id)  on delete cascade,
  company_id     uuid                    references public.companies(id) on delete cascade,
  score          numeric(5,2) not null default 0 check (score between 0 and 100),
  period         text        not null,
  breakdown_json jsonb       not null default '{}',
  created_at     timestamptz          default now(),
  updated_at     timestamptz          default now(),
  unique (seller_id, period)
);

create index if not exists idx_seller_scores_seller  on public.seller_scores (seller_id);
create index if not exists idx_seller_scores_period  on public.seller_scores (period);
create index if not exists idx_seller_scores_company on public.seller_scores (company_id);

alter table public.seller_scores enable row level security;

create policy "seller_scores: own or same company"
  on public.seller_scores for select
  using (
    seller_id  = auth.uid()
    or company_id = public.my_company_id()
  );

create policy "seller_scores: insert own"
  on public.seller_scores for insert
  with check (seller_id = auth.uid());

create policy "seller_scores: update own"
  on public.seller_scores for update
  using (seller_id = auth.uid());
