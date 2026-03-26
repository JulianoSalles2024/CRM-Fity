-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 115 · resolve_or_create_conversation — reabre lead fechado
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- PROBLEMA RESOLVIDO:
--   Quando um lead com status 'GANHO' ou 'PERDIDO' (ou conversa previamente
--   encerrada) enviava uma nova mensagem, a função criava uma nova conversa
--   corretamente (is_new=true), mas o lead permanecia com status terminal
--   no Kanban ("encerrada") e agent_lead_memory.stage ficava em 'closed_*'
--   ou 'inactive', impedindo que qualquer agente o processasse novamente.
--
-- SOLUÇÃO:
--   Quando o INSERT de uma nova conversa é bem-sucedido (is_new=true) E o
--   lead associado tem status terminal, a função:
--     1. Limpa leads.status / lost_at / won_at → lead volta ao Kanban ativo
--     2. Reseta agent_lead_memory.stage de todos os agentes → stage='new',
--        next_action_at=NULL → lead volta à fila na próxima rodada dos crons
--
--   Isso garante que um lead que retoma contato seja tratado como um novo ciclo
--   de atendimento, sem forçar posição no Kanban (column_id intocado) nem
--   apagar histórico (conversas anteriores ficam como 'resolved').
--
-- RETORNO:
--   lead_reopened → true se o lead foi reaberto, false caso contrário
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- Drop the old signature (return type change requires DROP + CREATE)
DROP FUNCTION IF EXISTS public.resolve_or_create_conversation(uuid, uuid, text, text, text, text, uuid);

CREATE OR REPLACE FUNCTION public.resolve_or_create_conversation(
  p_company_id               uuid,
  p_channel_connection_id    uuid,
  p_channel                  text,
  p_contact_identifier       text,
  p_contact_name             text    DEFAULT NULL,
  p_external_conversation_id text    DEFAULT NULL,
  p_lead_id                  uuid    DEFAULT NULL
)
RETURNS TABLE(conversation_id uuid, is_new boolean, lead_reopened boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv_id      uuid;
  v_company_id   uuid;
  v_lead_id      uuid;
  v_lead_status  text;
  v_is_new       boolean := false;
  v_reopened     boolean := false;
BEGIN
  -- Resolve company_id: usa p_company_id ou busca do channel_connection como fallback
  v_company_id := p_company_id;
  IF v_company_id IS NULL THEN
    SELECT company_id INTO v_company_id
    FROM public.channel_connections
    WHERE id = p_channel_connection_id;
  END IF;

  -- Tenant guard
  IF auth.uid() IS NOT NULL AND v_company_id != public.my_company_id() THEN
    RAISE EXCEPTION 'unauthorized: company_id mismatch' USING ERRCODE = '42501';
  END IF;

  -- ── Step 1: match by external_conversation_id ──────────────────────────────
  IF p_external_conversation_id IS NOT NULL THEN
    SELECT id INTO v_conv_id
    FROM public.conversations
    WHERE company_id               = v_company_id
      AND channel_connection_id    = p_channel_connection_id
      AND external_conversation_id = p_external_conversation_id
      AND status NOT IN ('resolved', 'blocked')
    LIMIT 1;

    IF v_conv_id IS NOT NULL THEN
      RETURN QUERY SELECT v_conv_id, false, false;
      RETURN;
    END IF;
  END IF;

  -- ── Step 2: match by active contact ────────────────────────────────────────
  SELECT id INTO v_conv_id
  FROM public.conversations
  WHERE company_id            = v_company_id
    AND channel_connection_id = p_channel_connection_id
    AND contact_identifier    = p_contact_identifier
    AND status NOT IN ('resolved', 'blocked')
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    RETURN QUERY SELECT v_conv_id, false, false;
    RETURN;
  END IF;

  -- ── Step 3: resolve lead_id ─────────────────────────────────────────────────
  -- Usa p_lead_id se fornecido, senão tenta buscar pelo contact_identifier
  v_lead_id := p_lead_id;
  IF v_lead_id IS NULL THEN
    SELECT id INTO v_lead_id
    FROM public.leads
    WHERE company_id = v_company_id
      AND phone      = p_contact_identifier
    LIMIT 1;
  END IF;

  -- ── Step 4: INSERT nova conversa ────────────────────────────────────────────
  INSERT INTO public.conversations (
    company_id,
    channel_connection_id,
    lead_id,
    contact_identifier,
    contact_name,
    external_conversation_id,
    status
  )
  VALUES (
    v_company_id,
    p_channel_connection_id,
    v_lead_id,
    p_contact_identifier,
    p_contact_name,
    p_external_conversation_id,
    'waiting'
  )
  ON CONFLICT (channel_connection_id, contact_identifier)
  WHERE status NOT IN ('resolved', 'blocked')
  DO NOTHING
  RETURNING id INTO v_conv_id;

  -- Se ON CONFLICT disparou, busca o vencedor
  IF v_conv_id IS NULL THEN
    SELECT id INTO v_conv_id
    FROM public.conversations
    WHERE company_id            = v_company_id
      AND channel_connection_id = p_channel_connection_id
      AND contact_identifier    = p_contact_identifier
      AND status NOT IN ('resolved', 'blocked')
    LIMIT 1;

    RETURN QUERY SELECT v_conv_id, false, false;
    RETURN;
  END IF;

  -- Nova conversa criada com sucesso
  v_is_new := true;

  -- ── Step 5: Reabrir lead se estiver em status terminal ──────────────────────
  IF v_lead_id IS NOT NULL THEN
    SELECT status INTO v_lead_status
    FROM public.leads
    WHERE id = v_lead_id AND company_id = v_company_id;

    IF v_lead_status IN ('GANHO', 'PERDIDO', 'ENCERRADO') THEN
      -- 5a. Limpa status terminal do lead (volta ao Kanban ativo)
      UPDATE public.leads
      SET
        status     = NULL,
        lost_at    = NULL,
        won_at     = NULL,
        updated_at = now()
      WHERE id         = v_lead_id
        AND company_id = v_company_id
        AND status     IN ('GANHO', 'PERDIDO', 'ENCERRADO');

      -- 5b. Reseta agent_lead_memory de todos os agentes deste lead
      --     para que o SDR/Closer possam processar o lead novamente
      UPDATE public.agent_lead_memory
      SET
        stage            = 'new',
        next_action      = NULL,
        next_action_at   = NULL,
        next_action_type = 'none',
        last_action      = 're_engaged',
        last_action_at   = now(),
        updated_at       = now()
      WHERE lead_id    = v_lead_id
        AND company_id = v_company_id
        AND stage      IN ('closed_won', 'closed_lost', 'inactive', 'transferred');

      v_reopened := true;
    END IF;
  END IF;

  RETURN QUERY SELECT v_conv_id, v_is_new, v_reopened;
END;
$$;

REVOKE ALL    ON FUNCTION public.resolve_or_create_conversation(uuid, uuid, text, text, text, text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.resolve_or_create_conversation(uuid, uuid, text, text, text, text, uuid) TO service_role;
GRANT  EXECUTE ON FUNCTION public.resolve_or_create_conversation(uuid, uuid, text, text, text, text, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
