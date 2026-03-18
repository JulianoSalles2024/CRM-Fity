-- ============================================================
-- Migration 074 — Exército Comercial de IA: Tabelas Core
-- ============================================================
-- Arquitetura suporta TODOS os 6 tipos de agente desde o início:
--   hunter | sdr | closer | followup | curator | supervisor
-- MVP ativa apenas SDR. Os outros ficam disponíveis via function_type.
-- ============================================================

-- ── 1. agent_playbooks ──────────────────────────────────────────────────────
-- Playbooks reutilizáveis por tipo de agente e empresa.
-- Um agente referencia um playbook; múltiplos agentes podem usar o mesmo.

CREATE TABLE IF NOT EXISTS public.agent_playbooks (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name                    text        NOT NULL,
  function_type           text        CHECK (function_type IN
                            ('hunter','sdr','closer','followup','curator','supervisor','generic')),
  -- Scripts de abertura (array para A/B testing futuro)
  opening_scripts         text[]      DEFAULT '{}',
  -- Mapa de objeções: {"É caro": "Entendo, porém...", "Não tenho tempo": "..."}
  objection_map           jsonb       NOT NULL DEFAULT '{}',
  -- Framework de qualificação
  qualification_framework text        DEFAULT 'bant' CHECK (
                            qualification_framework IN ('bant','spin','meddic','custom','none')),
  -- Perguntas de qualificação estruturadas
  qualification_questions jsonb       NOT NULL DEFAULT '[]',
  -- Palavras/sinais que disparam escalada para humano
  escalation_triggers     text[]      DEFAULT '{}',
  -- Notas internas do admin
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_playbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_playbooks_company" ON public.agent_playbooks
  FOR ALL USING (company_id = public.my_company_id());

ALTER TABLE public.agent_playbooks REPLICA IDENTITY FULL;


-- ── 2. ai_agents ────────────────────────────────────────────────────────────
-- Agentes comerciais. Cada tipo tem comportamento diferente no WF-07.
-- curator e supervisor não enviam mensagens — analisam dados e alertam.

CREATE TABLE IF NOT EXISTS public.ai_agents (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Identidade
  name                text        NOT NULL,
  avatar_icon         text        DEFAULT 'bot',           -- nome do ícone lucide-react
  avatar_color        text        DEFAULT '#3B82F6',        -- hex color

  -- Função — define o comportamento no WF-07
  function_type       text        NOT NULL DEFAULT 'sdr' CHECK (function_type IN
                        ('hunter','sdr','closer','followup','curator','supervisor')),

  -- Personalidade
  tone                text        DEFAULT 'consultivo' CHECK (
                        tone IN ('formal','consultivo','descontraido','tecnico','agressivo')),

  -- Missão
  niche               text,                                 -- "Empresas B2B de vendas"
  client_type         text        DEFAULT 'medium' CHECK (
                        client_type IN ('low','medium','high')),
  monthly_goal        integer,
  goal_metric         text        DEFAULT 'meetings' CHECK (
                        goal_metric IN ('leads','meetings','sales','revenue','qualified')),

  -- Território: canais onde opera
  channels            text[]      NOT NULL DEFAULT '{whatsapp}',

  -- Território: fontes de leads
  lead_sources        text[]      NOT NULL DEFAULT '{inbound,crm}',

  -- Horário de operação
  work_hours_start    time        NOT NULL DEFAULT '08:00',
  work_hours_end      time        NOT NULL DEFAULT '22:00',
  timezone            text        NOT NULL DEFAULT 'America/Sao_Paulo',

  -- Playbook
  playbook_id         uuid        REFERENCES public.agent_playbooks(id) ON DELETE SET NULL,
  opening_script      text,                                 -- override do playbook
  escalate_rules      jsonb       NOT NULL DEFAULT '{
    "max_followups": 5,
    "min_ticket_to_escalate": null,
    "keywords": ["falar com humano","quero falar com alguem","atendente"],
    "escalate_on_high_interest": true
  }',

  -- Controle
  is_active           boolean     NOT NULL DEFAULT false,   -- inativo por padrão
  is_archived         boolean     NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_agents_company" ON public.ai_agents
  FOR ALL USING (company_id = public.my_company_id());

ALTER TABLE public.ai_agents REPLICA IDENTITY FULL;

CREATE INDEX IF NOT EXISTS idx_ai_agents_company_active
  ON public.ai_agents (company_id, is_active)
  WHERE is_active = true;


-- ── 3. agent_lead_memory ────────────────────────────────────────────────────
-- Memória comercial por agente × lead.
-- Permite que o agente "lembre" o histórico de cada lead entre execuções.

CREATE TABLE IF NOT EXISTS public.agent_lead_memory (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id                uuid        NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  lead_id                 uuid        NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  company_id              uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Estado comercial (máquina de estados do agente)
  stage                   text        NOT NULL DEFAULT 'new' CHECK (stage IN
                            ('new','approached','responded','qualifying',
                             'qualified','meeting_scheduled','proposal_sent',
                             'negotiating','closed_won','closed_lost','inactive')),

  -- Sinais comerciais
  interest_level          text        CHECK (interest_level IN ('low','medium','high','very_high')),
  detected_objections     text[]      DEFAULT '{}',
  presented_product_id    uuid,        -- offer_catalog.id (Fase 3)
  budget_detected         numeric(12,2),
  decision_maker          boolean,
  timeline_detected       text,        -- "urgente","3 meses","sem prazo"

  -- Última interação
  last_action             text,
  last_action_at          timestamptz,
  next_action             text,
  next_action_at          timestamptz, -- followup agendado
  next_action_type        text        CHECK (next_action_type IN
                            ('followup','call','meeting','proposal','none')),

  -- Contadores (nunca decrementam)
  approach_count          integer     NOT NULL DEFAULT 0,
  followup_count          integer     NOT NULL DEFAULT 0,
  response_count          integer     NOT NULL DEFAULT 0,

  -- Notas livres do agente
  notes                   text,

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT uq_agent_lead_memory UNIQUE (agent_id, lead_id)
);

ALTER TABLE public.agent_lead_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_lead_memory_company" ON public.agent_lead_memory
  FOR ALL USING (company_id = public.my_company_id());

ALTER TABLE public.agent_lead_memory REPLICA IDENTITY FULL;

-- Índices críticos para performance das RPCs
CREATE INDEX IF NOT EXISTS idx_agent_lead_memory_agent
  ON public.agent_lead_memory (agent_id, stage);
CREATE INDEX IF NOT EXISTS idx_agent_lead_memory_next_action
  ON public.agent_lead_memory (next_action_at)
  WHERE next_action_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_lead_memory_lead
  ON public.agent_lead_memory (lead_id);


-- ── 4. agent_runs ───────────────────────────────────────────────────────────
-- Log imutável de cada execução do WF-07. Rastreabilidade total.

CREATE TABLE IF NOT EXISTS public.agent_runs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        uuid        NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  lead_id         uuid        NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  company_id      uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  conversation_id uuid        REFERENCES public.conversations(id) ON DELETE SET NULL,

  -- Tipo de execução
  run_type        text        NOT NULL DEFAULT 'response' CHECK (run_type IN
                    ('approach','response','followup','qualification',
                     'escalation','proactive','analysis')),
  channel         text        NOT NULL DEFAULT 'whatsapp',

  -- Conteúdo
  input_text      text,         -- mensagem recebida (null para proactive)
  output_text     text,         -- resposta gerada
  system_prompt   text,         -- prompt usado (para debug/auditoria)

  -- Decisão do agente
  decision        jsonb,        -- {action, next_stage, interest_level, followup_hours}
  escalated_to    uuid,         -- profiles.id se escalou para humano

  -- Resultado
  outcome         text        CHECK (outcome IN
                    ('sent','no_response','responded','qualified',
                     'meeting_scheduled','sale','escalated','error','skipped')),

  -- Métricas de custo
  tokens_input    integer,
  tokens_output   integer,
  model_used      text        DEFAULT 'gpt-4o-mini',

  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_runs_company" ON public.agent_runs
  FOR ALL USING (company_id = public.my_company_id());

ALTER TABLE public.agent_runs REPLICA IDENTITY FULL;

CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_date
  ON public.agent_runs (agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_lead
  ON public.agent_runs (lead_id, created_at DESC);


-- ── 5. agent_performance ────────────────────────────────────────────────────
-- Agregado diário por agente. Alimentado pelo WF-09 (cron) e upserts do WF-07.
-- id uuid PK + UNIQUE(agent_id, period_date) — NÃO composite PK.

CREATE TABLE IF NOT EXISTS public.agent_performance (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        uuid        NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  company_id      uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_date     date        NOT NULL,

  -- Funil do dia
  leads_found     integer     NOT NULL DEFAULT 0,   -- hunter: leads encontrados
  approaches      integer     NOT NULL DEFAULT 0,   -- abordagens iniciadas
  responses       integer     NOT NULL DEFAULT 0,   -- respostas recebidas
  qualified       integer     NOT NULL DEFAULT 0,   -- leads qualificados
  meetings        integer     NOT NULL DEFAULT 0,   -- reuniões agendadas
  sales           integer     NOT NULL DEFAULT 0,   -- vendas fechadas
  escalations     integer     NOT NULL DEFAULT 0,   -- escaladas para humano

  -- Financeiro
  revenue         numeric(12,2) NOT NULL DEFAULT 0,
  commission      numeric(12,2) NOT NULL DEFAULT 0,

  -- Custo OpenAI
  tokens_used     integer     NOT NULL DEFAULT 0,

  CONSTRAINT uq_agent_performance_day UNIQUE (agent_id, period_date)
);

ALTER TABLE public.agent_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_performance_company" ON public.agent_performance
  FOR ALL USING (company_id = public.my_company_id());

ALTER TABLE public.agent_performance REPLICA IDENTITY FULL;

CREATE INDEX IF NOT EXISTS idx_agent_performance_agent_date
  ON public.agent_performance (agent_id, period_date DESC);
CREATE INDEX IF NOT EXISTS idx_agent_performance_company_date
  ON public.agent_performance (company_id, period_date DESC);


-- ── 6. ADD COLUMN conversations.ai_agent_id ─────────────────────────────────
-- Liga a conversa ao agente comercial responsável.
-- SET NULL quando agente é deletado — conversa não perde histórico.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'conversations'
      AND column_name  = 'ai_agent_id'
  ) THEN
    ALTER TABLE public.conversations
      ADD COLUMN ai_agent_id uuid REFERENCES public.ai_agents(id) ON DELETE SET NULL;

    CREATE INDEX idx_conversations_ai_agent
      ON public.conversations (ai_agent_id)
      WHERE ai_agent_id IS NOT NULL;
  END IF;
END $$;


-- ── 7. Publicar no Realtime ──────────────────────────────────────────────────
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_playbooks;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_agents;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_lead_memory;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_runs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_performance;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

NOTIFY pgrst, 'reload schema';
