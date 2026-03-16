-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 056 — API Keys + Outgoing Webhooks
-- Tabelas de persistência para a aba Integrações (admin)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── api_keys ──────────────────────────────────────────────────────────────────
-- key_hash  : SHA-256 do token bruto (gerado no backend, nunca decriptável)
-- key_preview: "sk_live_ab12cd34ef56...xyz9" — exibido na UI após criação
CREATE TABLE IF NOT EXISTS api_keys (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name         text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  key_hash     text        NOT NULL UNIQUE,
  key_preview  text        NOT NULL,
  last_used_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Admin da empresa vê e gerencia apenas as próprias chaves
CREATE POLICY "api_keys_company_rls"
  ON api_keys FOR ALL
  USING  (company_id = my_company_id())
  WITH CHECK (company_id = my_company_id());

-- ── outgoing_webhooks ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outgoing_webhooks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  url         text        NOT NULL CHECK (url ~ '^https?://'),
  events      text[]      NOT NULL DEFAULT '{}',
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE outgoing_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outgoing_webhooks_company_rls"
  ON outgoing_webhooks FOR ALL
  USING  (company_id = my_company_id())
  WITH CHECK (company_id = my_company_id());

-- ── Realtime publication ──────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE api_keys;
ALTER PUBLICATION supabase_realtime ADD TABLE outgoing_webhooks;
