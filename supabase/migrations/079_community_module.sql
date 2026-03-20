-- supabase/migrations/079_community_module.sql

-- Categorias do fórum
create table if not exists community_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  icon text,
  description text,
  "order" int default 0,
  only_admins boolean default false
);

-- Posts
create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references community_categories(id),
  author_id uuid not null references auth.users(id),
  company_id uuid not null default my_company_id(),
  title text not null,
  content text not null,
  upvotes int default 0,
  is_pinned boolean default false,
  is_locked boolean default false,
  is_solved boolean default false,
  hide_company boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Comentários (1 nível de reply)
create table if not exists community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  parent_id uuid references community_comments(id),
  content text not null,
  upvotes int default 0,
  is_solution boolean default false,
  created_at timestamptz default now()
);

-- Votos (constraint unique evita duplicata)
create table if not exists community_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  target_type text not null,
  target_id uuid not null,
  created_at timestamptz default now(),
  unique(user_id, target_type, target_id)
);

-- Bookmarks
create table if not exists community_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  post_id uuid not null references community_posts(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, post_id)
);

-- RLS: community_categories (leitura pública)
alter table community_categories enable row level security;
create policy "authenticated_read_community_categories" on community_categories
  for select using (auth.role() = 'authenticated');

-- RLS: community_posts (leitura cross-empresa; escrita por autenticado)
alter table community_posts enable row level security;
create policy "authenticated_read_posts" on community_posts
  for select using (auth.role() = 'authenticated');
create policy "authenticated_insert_post" on community_posts
  for insert with check (auth.role() = 'authenticated' and author_id = auth.uid());
create policy "author_update_post" on community_posts
  for update using (author_id = auth.uid());
create policy "author_delete_post" on community_posts
  for delete using (author_id = auth.uid());

-- RLS: community_comments
alter table community_comments enable row level security;
create policy "authenticated_read_comments" on community_comments
  for select using (auth.role() = 'authenticated');
create policy "authenticated_insert_comment" on community_comments
  for insert with check (auth.role() = 'authenticated' and author_id = auth.uid());
create policy "author_update_comment" on community_comments
  for update using (author_id = auth.uid());
create policy "author_delete_comment" on community_comments
  for delete using (author_id = auth.uid());

-- RLS: community_votes
alter table community_votes enable row level security;
create policy "authenticated_read_votes" on community_votes
  for select using (auth.role() = 'authenticated');
create policy "authenticated_insert_vote" on community_votes
  for insert with check (auth.role() = 'authenticated' and user_id = auth.uid());
create policy "author_delete_vote" on community_votes
  for delete using (user_id = auth.uid());

-- RLS: community_bookmarks
alter table community_bookmarks enable row level security;
create policy "owner_all_bookmarks" on community_bookmarks
  for all using (user_id = auth.uid());

-- Seed: categorias fixas
insert into community_categories (name, slug, icon, description, "order", only_admins) values
  ('Dúvidas', 'duvidas', 'help-circle', 'Tire suas dúvidas sobre o NextSales', 1, false),
  ('Boas Práticas', 'boas-praticas', 'star', 'Compartilhe técnicas e estratégias de vendas', 2, false),
  ('Novidades NextSales', 'novidades', 'megaphone', 'Atualizações e novos recursos da plataforma', 3, true),
  ('Ideias & Sugestões', 'ideias', 'lightbulb', 'Sugira melhorias para o produto', 4, false)
on conflict (slug) do nothing;
