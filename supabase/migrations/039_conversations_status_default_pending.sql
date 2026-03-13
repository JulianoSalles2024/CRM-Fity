-- Novas conversas criadas via omnichannel devem iniciar em 'pending' (Em espera)
-- para que o vendedor precise "assumir" o atendimento antes de responder.
ALTER TABLE public.conversations
  ALTER COLUMN status SET DEFAULT 'pending';

-- Atualiza conversas existentes que estão 'open' sem assignee (criadas via n8n)
-- para 'pending' — forçam o fluxo de assumir atendimento.
UPDATE public.conversations
SET status = 'pending'
WHERE status = 'open'
  AND assigned_to IS NULL;

NOTIFY pgrst, 'reload schema';
