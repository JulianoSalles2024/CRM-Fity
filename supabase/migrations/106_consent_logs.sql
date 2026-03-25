-- Migration 106: Consent logs (LGPD compliance)
-- Records when each user accepted the Privacy Policy / Terms of Use.
-- Pre-login consents are stored with user_id = NULL; after login the app
-- inserts a new row linked to auth.users.id.

CREATE TABLE IF NOT EXISTS consent_logs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  policy_version TEXT        NOT NULL DEFAULT 'v1.0',
  accepted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can record their consent
CREATE POLICY "consent_anon_insert"
  ON consent_logs FOR INSERT
  WITH CHECK (true);

-- Authenticated users can view their own consent records
CREATE POLICY "consent_own_select"
  ON consent_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_consent_logs_user_id ON consent_logs (user_id);
