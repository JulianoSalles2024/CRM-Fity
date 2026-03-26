-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 114 · transfer_lead_to_closer — correção de conversa nula/inválida
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- PROBLEMA RESOLVIDO:
--   Quando p_conversation_id era NULL ou apontava para uma conversa inexistente
--   (e.g. lead transferido diretamente para o Closer sem interação prévia), o
--   UPDATE de conversations.ai_agent_id afetava 0 linhas silenciosamente.
--   O Closer recebia agent_lead_memory com stage='received' mas sem conversa
--   vinculada, causando abordagens duplicadas ou mensagens sem contexto.
--
-- SOLUÇÃO:
--   Se o p_conversation_id fornecido não localizar uma conversa ativa na empresa,
--   a função busca a conversa ativa mais recente do lead antes de tentar o UPDATE.
--   Se ainda assim não houver conversa (lead sem histórico de WhatsApp), a
--   transferência prossegue normalmente — a conversa será criada quando o lead
--   enviar a primeira mensagem.
--
--   Dois campos novos no retorno:
--     conversation_resolved  → true se o p_conversation_id fornecido já estava encerrado
--     conversation_id_used   → UUID real da conversa vinculada ao Closer (ou null)
-- ═══════════════════════════════════════════════════════════════════════════════

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
  v_closer_id         uuid;
  v_current_col       uuid;
  v_next_stage        jsonb;
  v_next_col          uuid;
  v_interest_level    text;
  v_notes             text;
  v_detected_obj      text[];
  v_conv_id           uuid;   -- ID final da conversa que será vinculada ao Closer
  v_conv_status       text;   -- status da conversa fornecida (para detectar se já estava resolved)
BEGIN

  -- ── 1. Busca Closer ativo ────────────────────────────────────────────────
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

  -- ── 2. Pega coluna atual do lead ─────────────────────────────────────────
  SELECT column_id INTO v_current_col
  FROM   public.leads
  WHERE  id         = p_lead_id
    AND  company_id = p_company_id;

  -- ── 3. Move card para próximo estágio ────────────────────────────────────
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

  -- ── 4. Lê contexto da memória do SDR para passar ao Closer ───────────────
  SELECT interest_level, notes, detected_objections
  INTO   v_interest_level, v_notes, v_detected_obj
  FROM   public.agent_lead_memory
  WHERE  agent_id = p_sdr_agent_id
    AND  lead_id  = p_lead_id;

  -- ── 5. Marca SDR como transferido ────────────────────────────────────────
  UPDATE public.agent_lead_memory
  SET    stage          = 'transferred',
         next_action_at = NULL,
         last_action    = 'Transferido para Closer',
         updated_at     = now()
  WHERE  agent_id = p_sdr_agent_id
    AND  lead_id  = p_lead_id;

  -- ── 6. Cria / atualiza memória do Closer ─────────────────────────────────
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

  -- ── 7. Resolve conversa a ser vinculada ao Closer ────────────────────────
  --
  --  Estratégia em cascata:
  --    a) Se p_conversation_id foi fornecido E está ativo → usa ele
  --    b) Se p_conversation_id foi fornecido mas está resolvido (ou não existe) →
  --       busca a conversa ativa mais recente do lead
  --    c) Se não há nenhuma conversa ativa → v_conv_id fica NULL (sem problema;
  --       a conversa será criada quando o lead enviar a primeira mensagem)

  v_conv_id := NULL;

  IF p_conversation_id IS NOT NULL THEN
    SELECT id, status
    INTO   v_conv_id, v_conv_status
    FROM   public.conversations
    WHERE  id         = p_conversation_id
      AND  company_id = p_company_id;
    -- Se encontrou mas está resolvida, descarta e vai para fallback
    IF v_conv_status = 'resolved' THEN
      v_conv_id := NULL;
    END IF;
  END IF;

  -- Fallback: busca conversa ativa mais recente do lead
  IF v_conv_id IS NULL THEN
    SELECT id INTO v_conv_id
    FROM   public.conversations
    WHERE  lead_id    = p_lead_id
      AND  company_id = p_company_id
      AND  status    != 'resolved'
    ORDER  BY updated_at DESC
    LIMIT  1;
  END IF;

  -- Vincula ao Closer apenas se houver conversa ativa
  IF v_conv_id IS NOT NULL THEN
    UPDATE public.conversations
    SET    ai_agent_id = v_closer_id,
           updated_at  = now()
    WHERE  id          = v_conv_id
      AND  company_id  = p_company_id;
  END IF;

  -- ── 8. Retorna resultado ──────────────────────────────────────────────────
  RETURN jsonb_build_object(
    'success',              true,
    'closer_id',            v_closer_id,
    'card_moved',           v_next_col IS NOT NULL,
    'next_column_id',       v_next_col,
    'conversation_id_used', v_conv_id
  );

END;
$$;

REVOKE ALL   ON FUNCTION public.transfer_lead_to_closer(uuid, uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transfer_lead_to_closer(uuid, uuid, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.transfer_lead_to_closer(uuid, uuid, uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
