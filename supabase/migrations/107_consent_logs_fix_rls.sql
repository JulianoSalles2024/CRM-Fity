-- Migration 107: Fix consent_logs RLS — grant INSERT explicitly to anon role
DROP POLICY IF EXISTS "consent_anon_insert" ON consent_logs;

CREATE POLICY "consent_anon_insert"
  ON consent_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
