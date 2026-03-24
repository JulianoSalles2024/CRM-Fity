-- Migration 096: Incluir status 'waiting' no auto-close por inatividade
--
-- Problema: get_expired_conversations() só fechava conversas 'in_progress'.
-- Conversas em 'waiting' (ninguém assumiu o atendimento) ficavam abertas
-- indefinidamente, nunca sendo capturadas pelo WF-04.
--
-- Fix: adicionar 'waiting' ao filtro de status.
-- Preserva: exclusão de conversas de IA (ai_agent_id IS NULL) da migration 095.

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
    c.status           IN ('in_progress', 'waiting')   -- era apenas 'in_progress'
    AND c.ai_agent_id  IS NULL                         -- conversas de IA nunca expiram (migration 095)
    AND cs.auto_close_hours IS NOT NULL
    AND c.last_message_at  IS NOT NULL
    AND c.last_message_at  < now() - make_interval(hours => cs.auto_close_hours)
  ORDER BY c.last_message_at ASC;
$$;

REVOKE ALL ON FUNCTION public.get_expired_conversations() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_expired_conversations() TO service_role;
