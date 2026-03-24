-- Migration 088: Agent response delay
-- 0 = imediatamente, 5, 10, 30, 60 segundos
ALTER TABLE ai_agents
  ADD COLUMN IF NOT EXISTS response_delay_seconds integer NOT NULL DEFAULT 0
    CHECK (response_delay_seconds IN (0, 5, 10, 30, 60));

COMMENT ON COLUMN ai_agents.response_delay_seconds IS 'Seconds to wait before sending response (0=immediate, 5, 10, 30, 60)';
