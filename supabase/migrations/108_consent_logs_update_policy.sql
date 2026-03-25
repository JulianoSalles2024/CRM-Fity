-- Migration 108: Allow authenticated users to link their user_id to a consent record
CREATE POLICY "consent_self_link"
  ON consent_logs FOR UPDATE
  TO authenticated
  USING (user_id IS NULL)
  WITH CHECK (user_id = auth.uid());
