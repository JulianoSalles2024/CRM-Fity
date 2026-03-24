-- Migration 091: Agent split responses
ALTER TABLE ai_agents
  ADD COLUMN IF NOT EXISTS split_responses boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN ai_agents.split_responses IS 'Split long LLM responses into multiple sequential WhatsApp messages';
