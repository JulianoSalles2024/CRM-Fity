-- Adiciona colunas que faltam na tabela notifications
-- (CREATE TABLE IF NOT EXISTS na migration 014 pode ter pulado se a tabela já existia)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS message     text        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id   uuid,
  ADD COLUMN IF NOT EXISTS read_at     timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at  timestamptz;

-- Recarrega cache do PostgREST para reconhecer as novas colunas
NOTIFY pgrst, 'reload schema';
