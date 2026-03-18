-- ============================================================
-- Migration 075 — Exército Comercial de IA: RPCs para n8n
-- ============================================================

-- ── 1. get_agent_lead_queue ─────────────────────────────────────────────────
-- Retorna leads pendentes para um agente:
-- a) Leads com next_action_at vencido neste agente
-- b) Leads novos no CRM da empresa sem memória para este agente ainda
-- Ambos com conversa ativa (status='waiting') ou sem conversa ainda.

DROP FUNCTION IF EXISTS public.get_agent_lead_queue(uuid, int);

CREATE OR REPLACE FUNCTION public.get_agent_lead_queue(
  p_agent_id uuid,
  p_limit    int DEFAULT 20
)
RETURNS TABLE (
  lead_id         uuid,
  lead_name       text,
  lead_phone      text,
  column_id       uuid,
  conversation_id uuid,
  conv_status     text,
  memory_stage    text,
  next_action_at  timestamptz,
  approach_count  integer,
  followup_count  integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  SELECT company_id INTO v_company_id
  FROM public.ai_agents
  WHERE id = p_agent_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'agent not found: %', p_agent_id;
  END IF;

  RETURN QUERY
  SELECT
    l.id                          AS lead_id,
    l.name                        AS lead_name,
    l.phone                       AS lead_phone,
    l.column_id                   AS column_id,
    c.id                          AS conversation_id,
    c.status                      AS conv_status,
    COALESCE(m.stage, 'new')      AS memory_stage,
    m.next_action_at              AS next_action_at,
    COALESCE(m.approach_count, 0) AS approach_count,
    COALESCE(m.followup_count, 0) AS followup_count
  FROM public.leads l
  -- Join com conversa ativa (se existir)
  LEFT JOIN public.conversations c
    ON  c.lead_id      = l.id
    AND c.company_id   = v_company_id
    AND c.status       NOT IN ('resolved')
  -- Join com memória do agente (se existir)
  LEFT JOIN public.agent_lead_memory m
    ON  m.agent_id   = p_agent_id
    AND m.lead_id    = l.id
  WHERE
    l.company_id = v_company_id
    AND (l.is_archived IS NULL OR l.is_archived = false)
    AND (l.deleted_at IS NULL)
    -- Inclui leads sem memória (novos) OU com next_action_at vencido
    AND (
      m.id IS NULL
      OR (m.next_action_at IS NOT NULL AND m.next_action_at <= now())
    )
    -- Não inclui leads já ganhos/perdidos
    AND COALESCE(m.stage, 'new') NOT IN ('closed_won','closed_lost','inactive')
    -- Conversa deve estar aguardando (ou não existir — para abordagem inicial)
    AND (c.id IS NULL OR c.status = 'waiting')
  ORDER BY
    -- Leads com next_action_at vencido têm prioridade
    CASE WHEN m.next_action_at IS NOT NULL AND m.next_action_at <= now() THEN 0 ELSE 1 END,
    m.next_action_at ASC NULLS LAST,
    l.created_at ASC
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_agent_lead_queue(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_agent_lead_queue(uuid, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_agent_lead_queue(uuid, int) TO authenticated;


-- ── 2. upsert_agent_lead_memory ─────────────────────────────────────────────
-- Cria ou atualiza a memória comercial de um lead para um agente.
-- Usa advisory lock para evitar race condition (WF-06 pode disparar paralelo).

DROP FUNCTION IF EXISTS public.upsert_agent_lead_memory(uuid, uuid, uuid, jsonb);

CREATE OR REPLACE FUNCTION public.upsert_agent_lead_memory(
  p_agent_id   uuid,
  p_lead_id    uuid,
  p_company_id uuid,
  p_updates    jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Advisory lock para evitar race condition entre execuções paralelas
  PERFORM pg_advisory_xact_lock(
    ('x' || md5(p_agent_id::text || p_lead_id::text))::bit(64)::bigint
  );

  INSERT INTO public.agent_lead_memory (
    agent_id, lead_id, company_id,
    stage, interest_level, detected_objections,
    presented_product_id, budget_detected, decision_maker,
    timeline_detected, last_action, last_action_at,
    next_action, next_action_at, next_action_type,
    approach_count, followup_count, response_count, notes
  )
  VALUES (
    p_agent_id, p_lead_id, p_company_id,
    COALESCE(p_updates->>'stage', 'new'),
    p_updates->>'interest_level',
    COALESCE((SELECT array_agg(x) FROM jsonb_array_elements_text(p_updates->'detected_objections') x), '{}'),
    (p_updates->>'presented_product_id')::uuid,
    (p_updates->>'budget_detected')::numeric,
    (p_updates->>'decision_maker')::boolean,
    p_updates->>'timeline_detected',
    p_updates->>'last_action',
    CASE WHEN p_updates->>'last_action_at' IS NOT NULL
         THEN (p_updates->>'last_action_at')::timestamptz
         ELSE now() END,
    p_updates->>'next_action',
    (p_updates->>'next_action_at')::timestamptz,
    p_updates->>'next_action_type',
    COALESCE((p_updates->>'approach_count')::integer, 0),
    COALESCE((p_updates->>'followup_count')::integer, 0),
    COALESCE((p_updates->>'response_count')::integer, 0),
    p_updates->>'notes'
  )
  ON CONFLICT ON CONSTRAINT uq_agent_lead_memory DO UPDATE SET
    stage                = COALESCE(EXCLUDED.stage,              agent_lead_memory.stage),
    interest_level       = COALESCE(EXCLUDED.interest_level,     agent_lead_memory.interest_level),
    detected_objections  = CASE
                             WHEN array_length(EXCLUDED.detected_objections, 1) > 0
                             THEN agent_lead_memory.detected_objections || EXCLUDED.detected_objections
                             ELSE agent_lead_memory.detected_objections
                           END,
    presented_product_id = COALESCE(EXCLUDED.presented_product_id, agent_lead_memory.presented_product_id),
    budget_detected      = COALESCE(EXCLUDED.budget_detected,    agent_lead_memory.budget_detected),
    decision_maker       = COALESCE(EXCLUDED.decision_maker,     agent_lead_memory.decision_maker),
    timeline_detected    = COALESCE(EXCLUDED.timeline_detected,  agent_lead_memory.timeline_detected),
    last_action          = COALESCE(EXCLUDED.last_action,        agent_lead_memory.last_action),
    last_action_at       = COALESCE(EXCLUDED.last_action_at,     agent_lead_memory.last_action_at),
    next_action          = EXCLUDED.next_action,
    next_action_at       = EXCLUDED.next_action_at,
    next_action_type     = EXCLUDED.next_action_type,
    -- Contadores sempre somam (não substituem)
    approach_count       = agent_lead_memory.approach_count + COALESCE(EXCLUDED.approach_count, 0),
    followup_count       = agent_lead_memory.followup_count + COALESCE(EXCLUDED.followup_count, 0),
    response_count       = agent_lead_memory.response_count + COALESCE(EXCLUDED.response_count, 0),
    notes                = COALESCE(EXCLUDED.notes, agent_lead_memory.notes),
    updated_at           = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_agent_lead_memory(uuid,uuid,uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_agent_lead_memory(uuid,uuid,uuid,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_agent_lead_memory(uuid,uuid,uuid,jsonb) TO authenticated;


-- ── 3. aggregate_agent_performance ─────────────────────────────────────────
-- Agrega runs do dia anterior e faz upsert em agent_performance.
-- Chamado pelo WF-09 (cron diário às 00:05).

DROP FUNCTION IF EXISTS public.aggregate_agent_performance(uuid, date);

CREATE OR REPLACE FUNCTION public.aggregate_agent_performance(
  p_company_id uuid,
  p_date       date DEFAULT (current_date - interval '1 day')::date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.agent_performance (
    agent_id, company_id, period_date,
    approaches, responses, qualified, meetings, sales, escalations,
    revenue, tokens_used
  )
  SELECT
    r.agent_id,
    p_company_id,
    p_date,
    COUNT(*) FILTER (WHERE r.run_type = 'approach')                           AS approaches,
    COUNT(*) FILTER (WHERE r.outcome  = 'responded')                          AS responses,
    COUNT(*) FILTER (WHERE r.outcome  = 'qualified')                          AS qualified,
    COUNT(*) FILTER (WHERE r.outcome  = 'meeting_scheduled')                  AS meetings,
    COUNT(*) FILTER (WHERE r.outcome  = 'sale')                               AS sales,
    COUNT(*) FILTER (WHERE r.outcome  = 'escalated')                          AS escalations,
    0                                                                         AS revenue,
    COALESCE(SUM(r.tokens_input + r.tokens_output), 0)                        AS tokens_used
  FROM public.agent_runs r
  WHERE r.company_id = p_company_id
    AND r.created_at >= p_date::timestamptz
    AND r.created_at <  (p_date + interval '1 day')::timestamptz
  GROUP BY r.agent_id
  ON CONFLICT ON CONSTRAINT uq_agent_performance_day DO UPDATE SET
    approaches  = EXCLUDED.approaches,
    responses   = EXCLUDED.responses,
    qualified   = EXCLUDED.qualified,
    meetings    = EXCLUDED.meetings,
    sales       = EXCLUDED.sales,
    escalations = EXCLUDED.escalations,
    tokens_used = EXCLUDED.tokens_used;
END;
$$;

REVOKE ALL ON FUNCTION public.aggregate_agent_performance(uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aggregate_agent_performance(uuid, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.aggregate_agent_performance(uuid, date) TO authenticated;


-- ── 4. get_agent_ranking ────────────────────────────────────────────────────
-- Ranking dos agentes por período. Usado na Central de Comando.

DROP FUNCTION IF EXISTS public.get_agent_ranking(uuid, date, date);

CREATE OR REPLACE FUNCTION public.get_agent_ranking(
  p_company_id uuid,
  p_start      date DEFAULT (date_trunc('month', current_date))::date,
  p_end        date DEFAULT current_date
)
RETURNS TABLE (
  agent_id        uuid,
  agent_name      text,
  function_type   text,
  avatar_color    text,
  is_active       boolean,
  total_approaches integer,
  total_responses  integer,
  total_qualified  integer,
  total_meetings   integer,
  total_sales      integer,
  total_escalations integer,
  total_revenue    numeric,
  total_tokens     integer,
  response_rate    numeric,
  conversion_rate  numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id                                                            AS agent_id,
    a.name                                                          AS agent_name,
    a.function_type,
    a.avatar_color,
    a.is_active,
    COALESCE(SUM(p.approaches)::integer,   0)                       AS total_approaches,
    COALESCE(SUM(p.responses)::integer,    0)                       AS total_responses,
    COALESCE(SUM(p.qualified)::integer,    0)                       AS total_qualified,
    COALESCE(SUM(p.meetings)::integer,     0)                       AS total_meetings,
    COALESCE(SUM(p.sales)::integer,        0)                       AS total_sales,
    COALESCE(SUM(p.escalations)::integer,  0)                       AS total_escalations,
    COALESCE(SUM(p.revenue),               0)                       AS total_revenue,
    COALESCE(SUM(p.tokens_used)::integer,  0)                       AS total_tokens,
    CASE
      WHEN COALESCE(SUM(p.approaches), 0) = 0 THEN 0
      ELSE ROUND(SUM(p.responses)::numeric / SUM(p.approaches) * 100, 1)
    END                                                             AS response_rate,
    CASE
      WHEN COALESCE(SUM(p.meetings), 0) = 0 THEN 0
      ELSE ROUND(SUM(p.sales)::numeric / NULLIF(SUM(p.meetings), 0) * 100, 1)
    END                                                             AS conversion_rate
  FROM public.ai_agents a
  LEFT JOIN public.agent_performance p
    ON  p.agent_id    = a.id
    AND p.period_date >= p_start
    AND p.period_date <= p_end
  WHERE a.company_id  = p_company_id
    AND a.is_archived = false
  GROUP BY a.id, a.name, a.function_type, a.avatar_color, a.is_active
  ORDER BY total_revenue DESC, total_sales DESC, total_meetings DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_agent_ranking(uuid, date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_agent_ranking(uuid, date, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_agent_ranking(uuid, date, date) TO authenticated;


NOTIFY pgrst, 'reload schema';
