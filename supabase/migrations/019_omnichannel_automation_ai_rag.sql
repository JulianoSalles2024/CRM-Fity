-- ============================================================================
-- 019_omnichannel_automation_ai_rag.sql
-- Automation engine, AI agents, RAG knowledge base + pending FKs from 018
-- Depends on: 018_omnichannel_foundation.sql
-- ============================================================================

BEGIN;

-- pgvector for semantic search / RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── 1. automation_rules ──────────────────────────────────────────────────────
-- Business rules that trigger automated actions (e.g. "if no reply in 2h → send follow-up").

CREATE TABLE IF NOT EXISTS automation_rules (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  description   text,
  trigger_type  text        NOT NULL
                CHECK (trigger_type IN (
                  'new_message','new_lead','no_reply','stage_change',
                  'tag_added','manual','scheduled'
                )),
  trigger_config jsonb      NOT NULL DEFAULT '{}',
  conditions    jsonb       NOT NULL DEFAULT '[]',
  actions       jsonb       NOT NULL DEFAULT '[]',
  is_active     boolean     NOT NULL DEFAULT true,
  priority      int         NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id)             -- composite FK anchor
);

ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_rules_company_isolation" ON automation_rules
  USING (company_id = my_company_id());

-- ─── 2. automation_executions ─────────────────────────────────────────────────
-- Log of each rule execution. idempotency_key prevents double-firing.
-- Format: {rule_id}:{lead_id}:{time_window_bucket}

CREATE TABLE IF NOT EXISTS automation_executions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rule_id          uuid        NOT NULL,
  lead_id          uuid,
  conversation_id  uuid,
  status           text        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','running','completed','failed','skipped')),
  idempotency_key  text        NOT NULL,
  result           jsonb       NOT NULL DEFAULT '{}',
  error            text,
  started_at       timestamptz,
  finished_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id),            -- composite FK anchor
  UNIQUE (idempotency_key),           -- prevents double execution
  CONSTRAINT fk_ae_rule
    FOREIGN KEY (company_id, rule_id)
    REFERENCES automation_rules(company_id, id) ON DELETE CASCADE
);

ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_executions_company_isolation" ON automation_executions
  USING (company_id = my_company_id());

-- ─── 3. followup_sequences ────────────────────────────────────────────────────
-- Multi-step follow-up cadences (e.g. Day 1 → Day 3 → Day 7).

CREATE TABLE IF NOT EXISTS followup_sequences (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  channel     text        NOT NULL DEFAULT 'whatsapp',
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE followup_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "followup_sequences_company_isolation" ON followup_sequences
  USING (company_id = my_company_id());

-- ─── 4. followup_steps ────────────────────────────────────────────────────────
-- Individual steps within a sequence.

CREATE TABLE IF NOT EXISTS followup_steps (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sequence_id    uuid        NOT NULL REFERENCES followup_sequences(id) ON DELETE CASCADE,
  step_order     int         NOT NULL DEFAULT 0,
  delay_minutes  int         NOT NULL DEFAULT 1440, -- default: 24h
  message_type   text        NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','template','ai')),
  content        text,
  template_id    uuid,
  ai_prompt      text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE followup_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "followup_steps_company_isolation" ON followup_steps
  USING (company_id = my_company_id());

-- ─── 5. followup_events ───────────────────────────────────────────────────────
-- Scheduled execution of a followup step for a specific lead.
-- Partial unique: only one active event per (sequence, lead) at a time.

CREATE TABLE IF NOT EXISTS followup_events (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sequence_id   uuid        NOT NULL REFERENCES followup_sequences(id) ON DELETE CASCADE,
  step_id       uuid        NOT NULL REFERENCES followup_steps(id) ON DELETE CASCADE,
  lead_id       uuid        NOT NULL,
  status        text        NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','sent','cancelled','failed')),
  scheduled_at  timestamptz NOT NULL,
  executed_at   timestamptz,
  metadata      jsonb       NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Only one active follow-up event per (sequence, lead)
CREATE UNIQUE INDEX IF NOT EXISTS uq_followup_events_active
  ON followup_events(sequence_id, lead_id)
  WHERE status = 'active';

ALTER TABLE followup_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "followup_events_company_isolation" ON followup_events
  USING (company_id = my_company_id());

-- ─── 6. ai_agent_runs ─────────────────────────────────────────────────────────
-- Each invocation of the AI agent for a conversation.

CREATE TABLE IF NOT EXISTS ai_agent_runs (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  conversation_id   uuid        NOT NULL,
  model             text        NOT NULL DEFAULT 'gpt-4o-mini',
  status            text        NOT NULL DEFAULT 'running'
                    CHECK (status IN ('running','completed','failed','escalated')),
  input_tokens      int         NOT NULL DEFAULT 0,
  output_tokens     int         NOT NULL DEFAULT 0,
  total_cost_usd    numeric(10,6) NOT NULL DEFAULT 0,
  escalation_reason text,
  metadata          jsonb       NOT NULL DEFAULT '{}',
  started_at        timestamptz NOT NULL DEFAULT now(),
  finished_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id),             -- composite FK anchor
  CONSTRAINT fk_aar_conversation
    FOREIGN KEY (company_id, conversation_id)
    REFERENCES conversations(company_id, id) ON DELETE CASCADE
);

ALTER TABLE ai_agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_agent_runs_company_isolation" ON ai_agent_runs
  USING (company_id = my_company_id());

-- ─── 7. ai_agent_steps ────────────────────────────────────────────────────────
-- Individual reasoning/action steps within an agent run (ReAct pattern).

CREATE TABLE IF NOT EXISTS ai_agent_steps (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  run_id      uuid        NOT NULL,
  step_order  int         NOT NULL DEFAULT 0,
  step_type   text        NOT NULL DEFAULT 'thought'
              CHECK (step_type IN ('thought','action','observation','answer')),
  content     text,
  tool_name   text,
  tool_input  jsonb,
  tool_output jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_aas_run
    FOREIGN KEY (company_id, run_id)
    REFERENCES ai_agent_runs(company_id, id) ON DELETE CASCADE
);

ALTER TABLE ai_agent_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_agent_steps_company_isolation" ON ai_agent_steps
  USING (company_id = my_company_id());

-- ─── 8. rag_sources ───────────────────────────────────────────────────────────
-- Documents / knowledge base sources for RAG retrieval.

CREATE TABLE IF NOT EXISTS rag_sources (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  source_type  text        NOT NULL DEFAULT 'document'
               CHECK (source_type IN ('document','url','faq','product','policy')),
  source_url   text,
  content      text,
  is_active    boolean     NOT NULL DEFAULT true,
  metadata     jsonb       NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rag_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rag_sources_company_isolation" ON rag_sources
  USING (company_id = my_company_id());

-- ─── 9. rag_chunks ────────────────────────────────────────────────────────────
-- Vector embeddings of knowledge base chunks for semantic search.

CREATE TABLE IF NOT EXISTS rag_chunks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_id   uuid        NOT NULL REFERENCES rag_sources(id) ON DELETE CASCADE,
  chunk_index int         NOT NULL DEFAULT 0,
  content     text        NOT NULL,
  embedding   vector(1536),           -- OpenAI text-embedding-3-small dimension
  token_count int         NOT NULL DEFAULT 0,
  metadata    jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- HNSW index for fast approximate nearest-neighbour search
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding
  ON rag_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Filter by company first, then vector search
CREATE INDEX IF NOT EXISTS idx_rag_chunks_company
  ON rag_chunks(company_id);

ALTER TABLE rag_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rag_chunks_company_isolation" ON rag_chunks
  USING (company_id = my_company_id());

-- ─── Pending composite FKs from 018 ──────────────────────────────────────────
-- These tables (ai_agent_runs, automation_executions) didn't exist in 018,
-- so the FK constraints are added here after both tables are created.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_messages_ai_agent_run'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT fk_messages_ai_agent_run
      FOREIGN KEY (company_id, ai_agent_run_id)
      REFERENCES ai_agent_runs(company_id, id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_messages_automation_execution'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT fk_messages_automation_execution
      FOREIGN KEY (company_id, automation_execution_id)
      REFERENCES automation_executions(company_id, id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_escalation_ai_agent_run'
  ) THEN
    ALTER TABLE escalation_logs
      ADD CONSTRAINT fk_escalation_ai_agent_run
      FOREIGN KEY (company_id, ai_agent_run_id)
      REFERENCES ai_agent_runs(company_id, id)
      ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
