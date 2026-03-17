-- Migration 065 — RLS owner isolation for channel_connections
-- PROBLEM: The previous policy only checked company_id, letting any authenticated
-- user in the company read ALL connections (including other sellers' connections).
-- The owner_id filter was applied only at the application layer, which races with
-- the auth context loading cycle and is bypassable by direct queries.
--
-- FIX: Add a database-enforced owner check for non-admin users.
-- Admin role sees all connections in their company (no change).
-- Seller/user role sees ONLY connections where owner_id = auth.uid().
-- All API mutations go through supabaseAdmin (service_role) — RLS does not apply to them.

-- Helper function (idempotent): returns true if the calling user is an admin
CREATE OR REPLACE FUNCTION is_company_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   profiles
    WHERE  id         = auth.uid()
      AND  company_id = my_company_id()
      AND  role       = 'admin'
  );
$$;

-- Replace the broad company-only policy with an owner-aware one
DROP POLICY IF EXISTS "channel_connections_company_isolation" ON channel_connections;

CREATE POLICY "channel_connections_company_isolation" ON channel_connections
  AS PERMISSIVE
  FOR ALL
  USING (
    company_id = my_company_id()
    AND (
      is_company_admin()       -- admin: sees every connection in the company
      OR owner_id = auth.uid() -- seller/user: only their own connection
    )
  );
