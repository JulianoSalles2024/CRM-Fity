-- Migration 097: Fechar conversas que esgotaram todos os passos de follow-up
--
-- Problema: depois que o último passo de follow-up é enviado, a conversa
-- não entra mais em get_pending_followups() (não existe próxima regra),
-- mas também não é fechada automaticamente — fica aberta indefinidamente.
--
-- Solução: nova função get_exhausted_followup_conversations() que retorna
-- conversas onde não existe mais regra de follow-up para o próximo passo
-- E o último follow-up foi enviado há mais de N horas (configurável via
-- company_settings.auto_close_hours, com fallback de 24h).
--
-- O WF-04 (ou um novo nó no WF-03) deve chamar essa função e fechar
-- as conversas retornadas da mesma forma que já faz hoje.
-- Função é purely additive — não altera nenhuma função existente.

CREATE OR REPLACE FUNCTION public.get_exhausted_followup_conversations()
RETURNS TABLE (
  conversation_id  uuid,
  lead_id          uuid,
  company_id       uuid,
  contact_name     text,
  hours_since_last_followup numeric
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
    ROUND(
      EXTRACT(EPOCH FROM (now() - COALESCE(c.last_followup_sent_at, c.last_message_at))) / 3600,
      1
    )                                                                             AS hours_since_last_followup
  FROM conversations c
  LEFT JOIN company_settings cs ON cs.company_id = c.company_id
  WHERE
    -- Conversa ativa (aguardando ou em atendimento)
    c.status IN ('in_progress', 'waiting')

    -- Não é conversa de IA (essas fecham por conta própria)
    AND c.ai_agent_id IS NULL

    -- Já passou pelo menos 1 passo de follow-up
    AND c.current_followup_step > 0

    -- Não existe mais nenhuma regra de follow-up para o próximo passo
    AND NOT EXISTS (
      SELECT 1
      FROM   public.followup_rules r
      WHERE  r.company_id     = c.company_id
        AND  r.sequence_order = c.current_followup_step + 1
    )

    -- Último follow-up enviado há mais tempo que o threshold configurado
    -- (usa auto_close_hours da empresa, com fallback de 24h)
    AND COALESCE(c.last_followup_sent_at, c.last_message_at) IS NOT NULL
    AND COALESCE(c.last_followup_sent_at, c.last_message_at)
        < now() - make_interval(hours => COALESCE(cs.auto_close_hours, 24))

  ORDER BY c.last_followup_sent_at ASC NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.get_exhausted_followup_conversations() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_exhausted_followup_conversations() TO service_role;
