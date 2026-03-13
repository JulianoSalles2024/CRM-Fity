-- PATCH: alinha schema com nomenclatura correta do NextSale
-- 1. Renomear assigned_to → assignee_id
-- 2. Atualizar CHECK de status para os valores corretos
-- 3. Migrar dados existentes
-- 4. Tornar messages.direction nullable (eventos de sistema não têm direção)

-- 1. Renomear coluna
ALTER TABLE public.conversations RENAME COLUMN assigned_to TO assignee_id;

-- 2. Remover CHECK constraint antiga e adicionar nova
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_status_check;

ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_status_check
  CHECK (status IN ('waiting', 'in_progress', 'resolved', 'blocked'));

-- 3. Migrar dados existentes
UPDATE public.conversations SET status = 'waiting'     WHERE status = 'pending';
UPDATE public.conversations SET status = 'in_progress' WHERE status = 'open';

-- 4. Ajustar default
ALTER TABLE public.conversations
  ALTER COLUMN status SET DEFAULT 'waiting';

-- 5. messages.direction pode ser NULL para eventos de sistema
ALTER TABLE public.messages
  ALTER COLUMN direction DROP NOT NULL;

NOTIFY pgrst, 'reload schema';
