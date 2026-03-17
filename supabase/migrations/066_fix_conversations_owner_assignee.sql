-- Migration 066 — Conversation ownership: assignee_id + RLS isolation
--
-- PROBLEMS FIXED:
-- 1. resolve_or_create_conversation had no assignee_id parameter — every conversation
--    was created with assignee_id = NULL. Sellers filter by assignee_id = auth.uid(),
--    so they saw ZERO conversations from inbound webhooks.
-- 2. conversations RLS policy only checked company_id — Admin could SELECT every
--    conversation in the company, violating the Seller privacy requirement.
-- 3. resolve_or_create_lead (4-param) always assigned owner_id = first admin found.
--    Lead was invisible to the Seller if any owner_id filter existed.

-- ─── 1. resolve_or_create_conversation — add p_assignee_id ───────────────────

CREATE OR REPLACE FUNCTION resolve_or_create_conversation(
  p_company_id               uuid,
  p_channel_connection_id    uuid,
  p_channel                  text,
  p_contact_identifier       text,
  p_contact_name             text    DEFAULT NULL,
  p_external_conversation_id text    DEFAULT NULL,
  p_lead_id                  uuid    DEFAULT NULL,
  p_assignee_id              uuid    DEFAULT NULL   -- NEW: seller who owns the connection
)
RETURNS TABLE(conversation_id uuid, is_new boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv_id     uuid;
  v_assignee_id uuid;
BEGIN
  -- Tenant guard
  IF auth.uid() IS NOT NULL AND p_company_id != my_company_id() THEN
    RAISE EXCEPTION 'unauthorized: company_id mismatch' USING ERRCODE = '42501';
  END IF;

  -- Resolve assignee: use explicit param, or fall back to channel_connection owner_id
  v_assignee_id := p_assignee_id;
  IF v_assignee_id IS NULL THEN
    SELECT owner_id INTO v_assignee_id
    FROM channel_connections
    WHERE id         = p_channel_connection_id
      AND company_id = p_company_id;
  END IF;

  -- Step 1: match by external_conversation_id
  IF p_external_conversation_id IS NOT NULL THEN
    SELECT id INTO v_conv_id
    FROM conversations
    WHERE company_id               = p_company_id
      AND channel_connection_id    = p_channel_connection_id
      AND external_conversation_id = p_external_conversation_id
      AND status NOT IN ('resolved')
    LIMIT 1;

    IF v_conv_id IS NOT NULL THEN
      RETURN QUERY SELECT v_conv_id, false;
      RETURN;
    END IF;
  END IF;

  -- Step 2: match by active contact (partial unique index)
  SELECT id INTO v_conv_id
  FROM conversations
  WHERE company_id            = p_company_id
    AND channel_connection_id = p_channel_connection_id
    AND contact_identifier    = p_contact_identifier
    AND status NOT IN ('resolved')
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    -- If conversation exists but has no assignee, assign now
    IF v_assignee_id IS NOT NULL THEN
      UPDATE conversations
      SET assignee_id = v_assignee_id, updated_at = now()
      WHERE id = v_conv_id AND assignee_id IS NULL;
    END IF;
    RETURN QUERY SELECT v_conv_id, false;
    RETURN;
  END IF;

  -- Step 3: INSERT with assignee_id
  INSERT INTO conversations (
    company_id,
    channel_connection_id,
    lead_id,
    contact_identifier,
    contact_name,
    external_conversation_id,
    assignee_id,
    status
  )
  VALUES (
    p_company_id,
    p_channel_connection_id,
    p_lead_id,
    p_contact_identifier,
    p_contact_name,
    p_external_conversation_id,
    v_assignee_id,
    'open'
  )
  ON CONFLICT (channel_connection_id, contact_identifier)
  WHERE status NOT IN ('resolved')
  DO NOTHING
  RETURNING id INTO v_conv_id;

  -- ON CONFLICT: re-query winner
  IF v_conv_id IS NULL THEN
    SELECT id INTO v_conv_id
    FROM conversations
    WHERE company_id            = p_company_id
      AND channel_connection_id = p_channel_connection_id
      AND contact_identifier    = p_contact_identifier
      AND status NOT IN ('resolved')
    LIMIT 1;

    RETURN QUERY SELECT v_conv_id, false;
    RETURN;
  END IF;

  RETURN QUERY SELECT v_conv_id, true;
END;
$$;

REVOKE ALL ON FUNCTION resolve_or_create_conversation(uuid,uuid,text,text,text,text,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION resolve_or_create_conversation(uuid,uuid,text,text,text,text,uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION resolve_or_create_conversation(uuid,uuid,text,text,text,text,uuid,uuid) TO authenticated;

-- ─── 2. conversations RLS — assignee-based isolation ─────────────────────────
-- New rule: a conversation is visible only to the user it is assigned to.
-- Unassigned conversations (assignee_id IS NULL) are visible to admins only.
-- This ensures Seller A cannot read Seller B's conversations, and Admin cannot
-- read any Seller's assigned conversations.

DROP POLICY IF EXISTS "conversations_company_isolation" ON conversations;

CREATE POLICY "conversations_company_isolation" ON conversations
  AS PERMISSIVE
  FOR ALL
  USING (
    company_id = my_company_id()
    AND (
      assignee_id = auth.uid()              -- assigned to this user (seller or admin)
      OR (assignee_id IS NULL AND is_company_admin())  -- unassigned: admin only
    )
  );

-- ─── 3. Backfill: assign existing conversations without assignee_id ───────────
-- For each conversation, inherit owner_id from its channel_connection.
-- Conversations that have no owner (null owner on connection) remain unassigned.

UPDATE conversations c
SET assignee_id = cc.owner_id,
    updated_at  = now()
FROM channel_connections cc
WHERE c.channel_connection_id = cc.id
  AND c.assignee_id IS NULL
  AND cc.owner_id   IS NOT NULL;

NOTIFY pgrst, 'reload schema';
