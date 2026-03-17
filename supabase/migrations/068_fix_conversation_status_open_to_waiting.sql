-- Migration 068 — Fix resolve_or_create_conversation: 'open' → 'waiting'
--
-- PROBLEM: The INSERT in resolve_or_create_conversation used status='open',
-- but conversations.status CHECK constraint only allows:
--   waiting | in_progress | resolved | blocked
-- 'open' is not a valid value → 23514 check constraint violation on every inbound message.
--
-- FIX: Replace 'open' with 'waiting' (correct initial status for new inbound conversations).

CREATE OR REPLACE FUNCTION resolve_or_create_conversation(
  p_company_id               uuid,
  p_channel_connection_id    uuid,
  p_channel                  text,
  p_contact_identifier       text,
  p_contact_name             text    DEFAULT NULL,
  p_external_conversation_id text    DEFAULT NULL,
  p_lead_id                  uuid    DEFAULT NULL,
  p_assignee_id              uuid    DEFAULT NULL
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

  -- Step 2: match by active contact
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

  -- Step 3: INSERT — use 'waiting' (valid initial status per check constraint)
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
    'waiting'   -- was 'open' in migration 066, which violates check constraint
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

NOTIFY pgrst, 'reload schema';
