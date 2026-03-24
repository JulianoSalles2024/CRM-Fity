-- Migration 095: Excluir conversas gerenciadas por IA do auto-close
-- WF-04 fechava conversas com ai_agent_id preenchido, interrompendo o ciclo de
-- follow-up do WF-06 (que depende de conversation_id ativo para rotear o lead).
-- Fix: adicionar AND c.ai_agent_id IS NULL no WHERE do get_expired_conversations.

CREATE OR REPLACE FUNCTION public.get_expired_conversations()
RETURNS TABLE (
  conversation_id  uuid,
  lead_id          uuid,
  company_id       uuid,
  contact_name     text,
  hours_inactive   numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id                                                                          AS conversation_id,
    c.lead_id,
    c.company_id,
    COALESCE(c.contact_name, c.contact_identifier)                               AS contact_name,
    ROUND(EXTRACT(EPOCH FROM (now() - c.last_message_at)) / 3600, 1)             AS hours_inactive
  FROM conversations c
  JOIN company_settings cs ON cs.company_id = c.company_id
  WHERE
    c.status           = 'in_progress'
    AND c.ai_agent_id  IS NULL          -- conversas de IA nunca expiram por inatividade
    AND cs.auto_close_hours IS NOT NULL
    AND c.last_message_at  IS NOT NULL
    AND c.last_message_at  < now() - make_interval(hours => cs.auto_close_hours)
  ORDER BY c.last_message_at ASC;
$$;

REVOKE ALL ON FUNCTION public.get_expired_conversations() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_expired_conversations() TO service_role;
