-- ═══════════════════════════════════════════════════════════════════
-- Migration 082 · RPC transfer_lead_to_closer
-- Transfere lead do SDR para o Closer ativo da empresa.
-- Executa atomicamente:
--   1. Busca Closer ativo da empresa (LIMIT 1, ORDER BY created_at)
--   2. Move card no pipeline via get_next_stage (board_stages)
--   3. Atualiza conversations.ai_agent_id → Closer
--   4. Marca agent_lead_memory do SDR como 'transferred'
--   5. Cria / atualiza agent_lead_memory do Closer com contexto do SDR
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.transfer_lead_to_closer(
  p_sdr_agent_id    uuid,
  p_lead_id         uuid,
  p_conversation_id uuid,
  p_company_id      uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_closer_id      uuid;
  v_current_col    uuid;
  v_next_stage     jsonb;
  v_next_col       uuid;
  v_interest_level text;
  v_notes          text;
  v_detected_obj   text[];
BEGIN

  -- ── 1. Busca Closer ativo ──────────────────────────────────────────
  SELECT id INTO v_closer_id
  FROM   public.ai_agents
  WHERE  company_id   = p_company_id
    AND  function_type = 'closer'
    AND  is_active     = true
    AND  is_archived   = false
  ORDER  BY created_at ASC
  LIMIT  1;

  IF v_closer_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason',  'no_closer_available'
    );
  END IF;

  -- ── 2. Pega coluna atual do lead ───────────────────────────────────
  SELECT column_id INTO v_current_col
  FROM   public.leads
  WHERE  id         = p_lead_id
    AND  company_id = p_company_id;

  -- ── 3. Move card para próximo estágio ─────────────────────────────
  IF v_current_col IS NOT NULL THEN
    v_next_stage := public.get_next_stage(v_current_col);
    v_next_col   := (v_next_stage->>'next_stage_id')::uuid;

    IF v_next_col IS NOT NULL THEN
      UPDATE public.leads
      SET    column_id  = v_next_col,
             updated_at = now()
      WHERE  id         = p_lead_id
        AND  company_id = p_company_id;
    END IF;
  END IF;

  -- ── 4. Lê contexto da memória do SDR para passar ao Closer ────────
  SELECT interest_level, notes, detected_objections
  INTO   v_interest_level, v_notes, v_detected_obj
  FROM   public.agent_lead_memory
  WHERE  agent_id = p_sdr_agent_id
    AND  lead_id  = p_lead_id;

  -- ── 5. Marca SDR como transferido ─────────────────────────────────
  UPDATE public.agent_lead_memory
  SET    stage          = 'transferred',
         next_action_at = NULL,
         last_action    = 'Transferido para Closer',
         updated_at     = now()
  WHERE  agent_id = p_sdr_agent_id
    AND  lead_id  = p_lead_id;

  -- ── 6. Cria / atualiza memória do Closer ──────────────────────────
  INSERT INTO public.agent_lead_memory (
    agent_id, lead_id, company_id,
    stage, interest_level, detected_objections,
    last_action, notes
  ) VALUES (
    v_closer_id, p_lead_id, p_company_id,
    'received',
    v_interest_level,
    v_detected_obj,
    'Recebido via transferência do SDR — lead qualificado e pronto para fechar',
    v_notes
  )
  ON CONFLICT (agent_id, lead_id) DO UPDATE SET
    stage               = 'received',
    interest_level      = EXCLUDED.interest_level,
    detected_objections = EXCLUDED.detected_objections,
    last_action         = EXCLUDED.last_action,
    updated_at          = now();

  -- ── 7. Reatribui conversa ao Closer ───────────────────────────────
  UPDATE public.conversations
  SET    ai_agent_id = v_closer_id,
         updated_at  = now()
  WHERE  id          = p_conversation_id
    AND  company_id  = p_company_id;

  -- ── 8. Retorna resultado ───────────────────────────────────────────
  RETURN jsonb_build_object(
    'success',        true,
    'closer_id',      v_closer_id,
    'card_moved',     v_next_col IS NOT NULL,
    'next_column_id', v_next_col
  );

END;
$$;

REVOKE ALL   ON FUNCTION public.transfer_lead_to_closer(uuid, uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transfer_lead_to_closer(uuid, uuid, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.transfer_lead_to_closer(uuid, uuid, uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
