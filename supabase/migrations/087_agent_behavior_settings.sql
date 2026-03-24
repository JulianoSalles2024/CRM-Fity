-- Migration 087: Agent behavior settings (Phase A)
-- Adds use_emojis, sign_messages, restrict_topics columns to ai_agents.
-- All defaults are non-breaking — existing agents keep current behavior.

ALTER TABLE ai_agents
  ADD COLUMN IF NOT EXISTS use_emojis      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sign_messages   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restrict_topics boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN ai_agents.use_emojis      IS 'Allow agent to use emojis in responses';
COMMENT ON COLUMN ai_agents.sign_messages   IS 'Agent appends its name signature at end of each message';
COMMENT ON COLUMN ai_agents.restrict_topics IS 'Strict guardrail: agent refuses off-topic questions';
