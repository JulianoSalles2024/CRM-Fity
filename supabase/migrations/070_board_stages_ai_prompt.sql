-- Migration 070 — Add ai_prompt column to board_stages
--
-- PURPOSE: Enable per-stage AI prompts so the AI agent can adapt its
--          behaviour as a lead moves through the funnel.
--
-- ZERO-BREAK: Column is nullable with no default.
--   - Existing stages get NULL → WF-05 fallback to board.ai_prompt (unchanged behaviour)
--   - Frontend PipelineAIModal reads/writes this column per stage
--   - WF-05 V2 reads stage_prompt first, falls back to board_prompt, then default

ALTER TABLE board_stages ADD COLUMN IF NOT EXISTS ai_prompt text;

NOTIFY pgrst, 'reload schema';
