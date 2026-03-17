-- Migration 067 — Ensure 5-param resolve_or_create_lead exists + reload PostgREST schema cache
--
-- PROBLEM: n8n WF-01 calls resolve_or_create_lead with named param p_owner_id (5-param version).
-- Migration 029 added this overload, but migrations 030 and 034 re-created the 4-param version
-- using CREATE OR REPLACE — in Postgres, CREATE OR REPLACE only replaces the EXACT same signature,
-- so the 5-param version from 029 should still exist in theory. However, PostgREST's schema cache
-- may be stale (PGRST202: "Could not find the function"). This migration re-creates the 5-param
-- function (idempotent) and forces a schema reload so PostgREST picks it up immediately.
--
-- BEHAVIOUR: When p_owner_id is provided (from n8n via channel_connection.owner_id), the lead is
-- created with that seller as owner, so the seller sees the lead via RLS (owner_id = auth.uid()).
-- When p_owner_id is NULL (legacy/fallback calls), falls back to admin of the company.

CREATE OR REPLACE FUNCTION resolve_or_create_lead(
  p_company_id   uuid,
  p_channel      text,
  p_identifier   text,
  p_contact_name text DEFAULT NULL,
  p_owner_id     uuid DEFAULT NULL   -- seller who owns the channel_connection (from WF-01)
)
RETURNS TABLE(lead_id uuid, is_new boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id  uuid;
  v_owner_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL AND p_company_id != my_company_id() THEN
    RAISE EXCEPTION 'unauthorized: company_id mismatch' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext(p_company_id::text || ':' || p_channel),
    hashtext(p_identifier)
  );

  -- Fast path: existing link
  SELECT lcl.lead_id INTO v_lead_id
  FROM lead_channel_links lcl
  WHERE lcl.company_id = p_company_id
    AND lcl.channel    = p_channel
    AND lcl.identifier = p_identifier;

  IF v_lead_id IS NOT NULL THEN
    RETURN QUERY SELECT v_lead_id, false;
    RETURN;
  END IF;

  -- Resolve owner: use explicit param first (seller), fall back to company admin
  v_owner_id := p_owner_id;

  IF v_owner_id IS NULL THEN
    SELECT p.id INTO v_owner_id
    FROM profiles p
    WHERE p.company_id = p_company_id
      AND p.role       = 'admin'
      AND p.is_active  = true
    ORDER BY p.created_at
    LIMIT 1;
  END IF;

  IF v_owner_id IS NULL THEN
    SELECT p.id INTO v_owner_id
    FROM profiles p
    WHERE p.company_id = p_company_id
      AND p.is_active  = true
    ORDER BY p.created_at
    LIMIT 1;
  END IF;

  INSERT INTO leads (company_id, name, status, source, owner_id)
  VALUES (
    p_company_id,
    COALESCE(NULLIF(trim(COALESCE(p_contact_name, '')), ''), 'Lead ' || p_identifier),
    'NOVO',
    'omnichannel_inbound',
    v_owner_id
  )
  RETURNING id INTO v_lead_id;

  INSERT INTO lead_channel_links (company_id, lead_id, channel, identifier)
  VALUES (p_company_id, v_lead_id, p_channel, p_identifier);

  RETURN QUERY SELECT v_lead_id, true;
END;
$$;

REVOKE ALL  ON FUNCTION resolve_or_create_lead(uuid, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION resolve_or_create_lead(uuid, text, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION resolve_or_create_lead(uuid, text, text, text, uuid) TO authenticated;

-- Force PostgREST to reload schema cache so the 5-param overload is immediately discoverable
NOTIFY pgrst, 'reload schema';
