-- ============================================================================
-- APPLY_NOW_followup_setup.sql
-- Cole e execute TODO este script no Supabase Dashboard → SQL Editor
-- Cria: tabela followup_rules + colunas em conversations + RPC get_pending_followups
-- ============================================================================

-- ─── 1. Colunas novas em conversations ───────────────────────────────────────
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS current_followup_step  integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_followup_sent_at  timestamptz          DEFAULT NULL;

-- ─── 2. Tabela followup_rules ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS followup_rules (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by          uuid                 REFERENCES auth.users(id) ON DELETE SET NULL,
  role_scope          text        NOT NULL DEFAULT 'admin'
                        CHECK (role_scope IN ('admin', 'seller')),
  delay_value         integer     NOT NULL CHECK (delay_value > 0),
  delay_unit          text        NOT NULL
                        CHECK (delay_unit IN ('minutes', 'hours', 'days')),
  prompt              text        NOT NULL,
  allowed_days        jsonb                DEFAULT '["monday","tuesday","wednesday","thursday","friday"]'::jsonb,
  allowed_start_time  time        NOT NULL DEFAULT '08:00',
  allowed_end_time    time        NOT NULL DEFAULT '18:00',
  sequence_order      integer     NOT NULL CHECK (sequence_order >= 1),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_followup_rules_company_order UNIQUE (company_id, sequence_order)
);

-- ─── 3. Trigger updated_at ───────────────────────────────────────────────────
CREATE TRIGGER trg_followup_rules_updated_at
  BEFORE UPDATE ON followup_rules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 4. Índices ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_followup_rules_company_order
  ON followup_rules (company_id, sequence_order);

CREATE INDEX IF NOT EXISTS idx_conversations_followup
  ON conversations (company_id, status, last_followup_sent_at)
  WHERE status = 'in_progress';

-- ─── 5. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE followup_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "followup_rules: members can select"
  ON followup_rules FOR SELECT USING (company_id = my_company_id());

CREATE POLICY "followup_rules: members can insert"
  ON followup_rules FOR INSERT WITH CHECK (company_id = my_company_id());

CREATE POLICY "followup_rules: owner can update"
  ON followup_rules FOR UPDATE
  USING (company_id = my_company_id())
  WITH CHECK (company_id = my_company_id());

CREATE POLICY "followup_rules: owner can delete"
  ON followup_rules FOR DELETE USING (company_id = my_company_id());

-- ─── 6. RPC get_pending_followups ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_pending_followups()
RETURNS TABLE (
  conversation_id      uuid,
  company_id           uuid,
  contact_identifier   text,
  contact_name         text,
  agent_name           text,
  company_name         text,
  instance_name        text,
  prompt_rule          text,
  next_followup_step   integer,
  conversation_history jsonb
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  WITH tz_ctx AS (
    SELECT
      now() AT TIME ZONE 'America/Sao_Paulo'                        AS now_sp,
      lower(to_char(now() AT TIME ZONE 'America/Sao_Paulo','FMDay')) AS current_dow,
      (now() AT TIME ZONE 'America/Sao_Paulo')::time                AS current_tod
  )
  SELECT
    c.id,
    c.company_id,
    c.contact_identifier,
    COALESCE(c.contact_name, c.contact_identifier),
    COALESCE(p.name, 'Agente'),
    COALESCE(co.name, ''),
    COALESCE(cc.name, ''),
    r.prompt,
    r.sequence_order,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('direction',hist.direction,'content',hist.content,'created_at',hist.created_at) ORDER BY hist.created_at ASC)
       FROM (SELECT direction,content,created_at FROM public.messages
             WHERE conversation_id=c.id AND company_id=c.company_id
               AND sender_type!='system' AND content IS NOT NULL
             ORDER BY created_at DESC LIMIT 10) hist),
      '[]'::jsonb
    )
  FROM public.conversations c
  JOIN public.followup_rules r
    ON r.company_id=c.company_id AND r.sequence_order=c.current_followup_step+1
  LEFT JOIN public.profiles p ON p.id=c.assignee_id AND p.company_id=c.company_id
  LEFT JOIN public.companies co ON co.id=c.company_id
  LEFT JOIN public.channel_connections cc ON cc.id=c.channel_connection_id AND cc.company_id=c.company_id
  CROSS JOIN tz_ctx
  WHERE c.status='in_progress'
    AND c.last_message_at IS NOT NULL
    AND GREATEST(c.last_message_at, COALESCE(c.last_followup_sent_at,'-infinity'::timestamptz))
        + make_interval(
            mins  := CASE WHEN r.delay_unit='minutes' THEN r.delay_value ELSE 0 END,
            hours := CASE WHEN r.delay_unit='hours'   THEN r.delay_value ELSE 0 END,
            days  := CASE WHEN r.delay_unit='days'    THEN r.delay_value ELSE 0 END)
        <= now()
    AND r.allowed_days ? tz_ctx.current_dow
    AND tz_ctx.current_tod BETWEEN r.allowed_start_time AND r.allowed_end_time;
$$;

REVOKE ALL    ON FUNCTION public.get_pending_followups() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_pending_followups() TO service_role;

NOTIFY pgrst, 'reload schema';
