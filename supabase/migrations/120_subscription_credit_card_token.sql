-- ============================================================
-- Migration 120: Salvar token de cartão para renovação automática
-- ============================================================

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS credit_card_token      TEXT,
  ADD COLUMN IF NOT EXISTS credit_card_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS credit_card_last_four   TEXT,
  ADD COLUMN IF NOT EXISTS credit_card_brand        TEXT;
