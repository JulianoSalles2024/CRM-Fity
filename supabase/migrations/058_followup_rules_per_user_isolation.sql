-- ============================================================================
-- 058_followup_rules_per_user_isolation.sql
-- Isolamento de regras de follow-up por usuário (vendedor)
--
-- Problemas corrigidos:
--   1. UNIQUE (company_id, sequence_order) impedia múltiplos "Passo 1" por empresa.
--   2. RLS de SELECT expunha as regras de um seller para todos da empresa.
--   3. get_pending_followups() aplicava regras globalmente por company_id,
--      sem verificar se a regra pertencia ao vendedor responsável pela conversa.
-- ============================================================================

BEGIN;

-- ─── 1. Migração de dados: marcar regras existentes com created_by como 'seller'
--
-- Regras criadas por um usuário específico são pessoais (role_scope = 'seller').
-- Regras sem criador (created_by IS NULL) permanecem globais (role_scope = 'admin').
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.followup_rules
SET    role_scope = 'seller'
WHERE  created_by IS NOT NULL
  AND  role_scope  = 'admin';

-- ─── 2. Muda o default de role_scope para 'seller' ───────────────────────────
--
-- Novos inserts via UI (sem role_scope explícito) serão pessoais por padrão.
-- Regras globais de admin devem ser inseridas com role_scope = 'admin' explicitamente.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.followup_rules
  ALTER COLUMN role_scope SET DEFAULT 'seller';

-- ─── 3. Atualiza UNIQUE constraint ───────────────────────────────────────────
--
-- Antes: UNIQUE (company_id, sequence_order)
--   → impedia que Seller A e Seller B tivessem ambos um "Passo 1".
-- Depois: UNIQUE (company_id, created_by, sequence_order)
--   → cada usuário tem sua própria sequência independente.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.followup_rules
  DROP CONSTRAINT IF EXISTS uq_followup_rules_company_order;

ALTER TABLE public.followup_rules
  ADD CONSTRAINT uq_followup_rules_user_order
  UNIQUE (company_id, created_by, sequence_order);

-- ─── 4. Atualiza RLS ─────────────────────────────────────────────────────────
--
-- SELECT: admins veem todas as regras da empresa;
--         sellers veem apenas as próprias + as globais (role_scope = 'admin').
-- UPDATE/DELETE: admins editam qualquer regra; sellers apenas as próprias.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "followup_rules: members can select" ON public.followup_rules;
CREATE POLICY "followup_rules: members can select"
  ON public.followup_rules FOR SELECT
  USING (
    company_id = my_company_id()
    AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
      OR created_by = auth.uid()
      OR role_scope = 'admin'
    )
  );

DROP POLICY IF EXISTS "followup_rules: owner can update" ON public.followup_rules;
CREATE POLICY "followup_rules: owner can update"
  ON public.followup_rules FOR UPDATE
  USING (
    company_id = my_company_id()
    AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
      OR created_by = auth.uid()
    )
  )
  WITH CHECK (
    company_id = my_company_id()
    AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
      OR created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "followup_rules: owner can delete" ON public.followup_rules;
CREATE POLICY "followup_rules: owner can delete"
  ON public.followup_rules FOR DELETE
  USING (
    company_id = my_company_id()
    AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'admin'
      OR created_by = auth.uid()
    )
  );

-- ─── 5. Recria get_pending_followups com isolamento por assignee ──────────────
--
-- Lógica do JOIN em followup_rules:
--   Prioridade 1: regra pessoal do vendedor responsável pela conversa (created_by = assignee_id)
--   Prioridade 2: regra global de admin (role_scope = 'admin'), apenas se o vendedor
--                 não tiver uma regra própria para o mesmo passo da sequência.
--
-- Transparente para o n8n: assinatura da função e colunas retornadas não mudam.
-- Preserva: status IN ('in_progress', 'waiting') e instance_name via external_id.
-- ─────────────────────────────────────────────────────────────────────────────
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
      now() AT TIME ZONE 'America/Sao_Paulo'                           AS now_sp,
      lower(to_char(
        now() AT TIME ZONE 'America/Sao_Paulo', 'FMDay'
      ))                                                               AS current_dow,
      (now() AT TIME ZONE 'America/Sao_Paulo')::time                  AS current_tod
  )

  SELECT
    c.id                                                               AS conversation_id,
    c.company_id,
    c.contact_identifier,
    COALESCE(c.contact_name, c.contact_identifier)                     AS contact_name,
    COALESCE(p.name, 'Agente')                                         AS agent_name,
    COALESCE(co.name, '')                                              AS company_name,
    COALESCE(cc.external_id, cc.name, '')                              AS instance_name,
    r.prompt                                                           AS prompt_rule,
    r.sequence_order                                                   AS next_followup_step,

    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'direction',  hist.direction,
            'content',    hist.content,
            'created_at', hist.created_at
          )
          ORDER BY hist.created_at ASC
        )
        FROM (
          SELECT direction, content, created_at
          FROM   public.messages
          WHERE  conversation_id = c.id
            AND  company_id      = c.company_id
            AND  sender_type    != 'system'
            AND  content        IS NOT NULL
          ORDER BY created_at DESC
          LIMIT 10
        ) hist
      ),
      '[]'::jsonb
    )                                                                  AS conversation_history

  FROM public.conversations c

  -- ── Regra de follow-up com isolamento por vendedor ────────────────────────
  --
  --  Prioridade 1: regra pessoal do vendedor responsável pela conversa.
  --  Prioridade 2: regra global de admin, somente se o vendedor não tiver
  --                uma regra própria neste passo da sequência.
  --
  JOIN public.followup_rules r
    ON  r.company_id     = c.company_id
    AND r.sequence_order = c.current_followup_step + 1
    AND (
          r.created_by = c.assignee_id
          OR (
            r.role_scope = 'admin'
            AND NOT EXISTS (
              SELECT 1
              FROM   public.followup_rules sr
              WHERE  sr.company_id     = c.company_id
                AND  sr.created_by     = c.assignee_id
                AND  sr.sequence_order = c.current_followup_step + 1
            )
          )
        )

  LEFT JOIN public.profiles p
    ON  p.id         = c.assignee_id
    AND p.company_id = c.company_id

  LEFT JOIN public.companies co
    ON  co.id = c.company_id

  LEFT JOIN public.channel_connections cc
    ON  cc.id         = c.channel_connection_id
    AND cc.company_id = c.company_id

  CROSS JOIN tz_ctx

  WHERE
    c.status IN ('in_progress', 'waiting')

    AND c.last_message_at IS NOT NULL

    AND GREATEST(
          c.last_message_at,
          COALESCE(c.last_followup_sent_at, '-infinity'::timestamptz)
        )
        + make_interval(
            mins  := CASE WHEN r.delay_unit = 'minutes' THEN r.delay_value ELSE 0 END,
            hours := CASE WHEN r.delay_unit = 'hours'   THEN r.delay_value ELSE 0 END,
            days  := CASE WHEN r.delay_unit = 'days'    THEN r.delay_value ELSE 0 END
          )
        <= now()

    AND r.allowed_days ? tz_ctx.current_dow

    AND tz_ctx.current_tod BETWEEN r.allowed_start_time AND r.allowed_end_time
  ;

$$;

COMMENT ON FUNCTION public.get_pending_followups() IS
  'Retorna conversas in_progress/waiting que devem receber o próximo follow-up agora.
   Aplica regra pessoal do vendedor responsável (created_by = assignee_id) com
   fallback para regra global de admin (role_scope = admin) caso o vendedor não
   tenha configurado uma regra para o passo atual.
   Chamada pelo cron do n8n via REST com Service Role.';

REVOKE ALL    ON FUNCTION public.get_pending_followups() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pending_followups() TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
