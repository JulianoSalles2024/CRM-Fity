-- ============================================================================
-- 020_omnichannel_rpcs.sql
-- Three SECURITY DEFINER RPCs for the n8n omnichannel pipeline
-- Called by n8n workflows via service_role (no user session)
-- Dual-mode tenant guard: rejects cross-tenant calls even from service_role
-- when auth.uid() IS NOT NULL.
-- ============================================================================

-- ─── 1. resolve_or_create_lead ───────────────────────────────────────────────
-- Finds the lead linked to a channel identifier (phone, email, etc.).
-- Creates a new lead + link if none exists.
-- Uses pg_advisory_xact_lock to prevent duplicate creation under concurrency.

CREATE OR REPLACE FUNCTION resolve_or_create_lead(
  p_company_id   uuid,
  p_channel      text,
  p_identifier   text,
  p_contact_name text DEFAULT NULL
)
RETURNS TABLE(lead_id uuid, is_new boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id uuid;
BEGIN
  -- Tenant guard: reject cross-tenant calls when running as authenticated user
  IF auth.uid() IS NOT NULL AND p_company_id != my_company_id() THEN
    RAISE EXCEPTION 'unauthorized: company_id mismatch' USING ERRCODE = '42501';
  END IF;

  -- Serialize workers for the same (company, channel, identifier) triplet
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

  -- Create new lead
  INSERT INTO leads (company_id, name, status, source)
  VALUES (
    p_company_id,
    COALESCE(NULLIF(trim(COALESCE(p_contact_name, '')), ''), 'Lead ' || p_identifier),
    'NOVO',
    'omnichannel_inbound'
  )
  RETURNING id INTO v_lead_id;

  -- Register channel link
  INSERT INTO lead_channel_links (company_id, lead_id, channel, identifier)
  VALUES (p_company_id, v_lead_id, p_channel, p_identifier);

  RETURN QUERY SELECT v_lead_id, true;
END;
$$;

REVOKE ALL ON FUNCTION resolve_or_create_lead(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION resolve_or_create_lead(uuid, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION resolve_or_create_lead(uuid, text, text, text) TO authenticated;

-- ─── 2. resolve_or_create_conversation ───────────────────────────────────────
-- Three-step resolution:
--   1. Match by external_conversation_id (if provided)
--   2. Match by active contact (partial unique index)
--   3. INSERT ON CONFLICT → re-query to get winner
-- The ON CONFLICT maps to: uq_conversations_active_contact
--   (channel_connection_id, contact_identifier) WHERE status NOT IN ('resolved')

CREATE OR REPLACE FUNCTION resolve_or_create_conversation(
  p_company_id               uuid,
  p_channel_connection_id    uuid,
  p_channel                  text,
  p_contact_identifier       text,
  p_contact_name             text    DEFAULT NULL,
  p_external_conversation_id text    DEFAULT NULL,
  p_lead_id                  uuid    DEFAULT NULL
)
RETURNS TABLE(conversation_id uuid, is_new boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv_id uuid;
BEGIN
  -- Tenant guard
  IF auth.uid() IS NOT NULL AND p_company_id != my_company_id() THEN
    RAISE EXCEPTION 'unauthorized: company_id mismatch' USING ERRCODE = '42501';
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

  -- Step 2: match by active contact (uses partial unique index)
  SELECT id INTO v_conv_id
  FROM conversations
  WHERE company_id            = p_company_id
    AND channel_connection_id = p_channel_connection_id
    AND contact_identifier    = p_contact_identifier
    AND status NOT IN ('resolved')
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    RETURN QUERY SELECT v_conv_id, false;
    RETURN;
  END IF;

  -- Step 3: INSERT — ON CONFLICT handles concurrent inserts safely
  INSERT INTO conversations (
    company_id,
    channel_connection_id,
    lead_id,
    contact_identifier,
    contact_name,
    external_conversation_id,
    status
  )
  VALUES (
    p_company_id,
    p_channel_connection_id,
    p_lead_id,
    p_contact_identifier,
    p_contact_name,
    p_external_conversation_id,
    'open'
  )
  ON CONFLICT (channel_connection_id, contact_identifier)
  WHERE status NOT IN ('resolved')
  DO NOTHING
  RETURNING id INTO v_conv_id;

  -- If ON CONFLICT fired (another worker won), re-query to get the winner's id
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

REVOKE ALL ON FUNCTION resolve_or_create_conversation(uuid, uuid, text, text, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION resolve_or_create_conversation(uuid, uuid, text, text, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION resolve_or_create_conversation(uuid, uuid, text, text, text, text, uuid) TO authenticated;

-- ─── 3. insert_message ────────────────────────────────────────────────────────
-- Two-layer idempotency:
--   Layer 1: SELECT check (fast path — avoids write on known duplicates)
--   Layer 2: ON CONFLICT on uq_messages_external_id (catches race residuals)
-- Also updates conversation: last_message_at, last_message_preview, unread_count.

CREATE OR REPLACE FUNCTION insert_message(
  p_company_id          uuid,
  p_conversation_id     uuid,
  p_external_message_id text        DEFAULT NULL,
  p_direction           text        DEFAULT 'inbound',
  p_sender_type         text        DEFAULT 'lead',
  p_sender_id           uuid        DEFAULT NULL,
  p_content             text        DEFAULT NULL,
  p_content_type        text        DEFAULT 'text',
  p_metadata            jsonb       DEFAULT '{}',
  p_sent_at             timestamptz DEFAULT NULL,
  p_status              text        DEFAULT NULL
)
RETURNS TABLE(message_id uuid, is_duplicate boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msg_id     uuid;
  v_is_dup     boolean := false;
  v_preview    text;
  v_sent_at    timestamptz;
BEGIN
  -- Tenant guard
  IF auth.uid() IS NOT NULL AND p_company_id != my_company_id() THEN
    RAISE EXCEPTION 'unauthorized: company_id mismatch' USING ERRCODE = '42501';
  END IF;

  v_sent_at := COALESCE(p_sent_at, now());

  -- Layer 1: fast-path duplicate check
  IF p_external_message_id IS NOT NULL THEN
    SELECT id INTO v_msg_id
    FROM messages
    WHERE company_id           = p_company_id
      AND external_message_id  = p_external_message_id;

    IF v_msg_id IS NOT NULL THEN
      RETURN QUERY SELECT v_msg_id, true;
      RETURN;
    END IF;
  END IF;

  -- Layer 2: insert with ON CONFLICT for race-condition safety
  INSERT INTO messages (
    company_id,
    conversation_id,
    external_message_id,
    direction,
    sender_type,
    sender_id,
    content,
    content_type,
    metadata,
    sent_at,
    status
  )
  VALUES (
    p_company_id,
    p_conversation_id,
    p_external_message_id,
    p_direction,
    p_sender_type,
    p_sender_id,
    p_content,
    p_content_type,
    COALESCE(p_metadata, '{}'),
    v_sent_at,
    COALESCE(p_status, CASE WHEN p_direction = 'inbound' THEN 'delivered' ELSE 'sent' END)
  )
  ON CONFLICT (company_id, external_message_id)
  WHERE external_message_id IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_msg_id;

  IF v_msg_id IS NULL THEN
    -- ON CONFLICT fired — retrieve existing
    v_is_dup := true;
    SELECT id INTO v_msg_id
    FROM messages
    WHERE company_id          = p_company_id
      AND external_message_id = p_external_message_id;
  ELSE
    -- New message — update conversation metadata
    v_preview := CASE
      WHEN p_content_type = 'text'     THEN left(p_content, 120)
      WHEN p_content_type = 'image'    THEN '📷 Imagem'
      WHEN p_content_type = 'audio'    THEN '🎵 Áudio'
      WHEN p_content_type = 'video'    THEN '🎥 Vídeo'
      WHEN p_content_type = 'document' THEN '📎 Documento'
      ELSE '💬 Mensagem'
    END;

    UPDATE conversations
    SET
      last_message_at      = v_sent_at,
      last_message_preview = v_preview,
      unread_count         = CASE
        WHEN p_direction = 'inbound' THEN unread_count + 1
        ELSE 0
      END,
      updated_at = now()
    WHERE company_id = p_company_id
      AND id         = p_conversation_id;
  END IF;

  RETURN QUERY SELECT v_msg_id, v_is_dup;
END;
$$;

REVOKE ALL ON FUNCTION insert_message(uuid, uuid, text, text, text, uuid, text, text, jsonb, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION insert_message(uuid, uuid, text, text, text, uuid, text, text, jsonb, timestamptz, text) TO service_role;
GRANT EXECUTE ON FUNCTION insert_message(uuid, uuid, text, text, text, uuid, text, text, jsonb, timestamptz, text) TO authenticated;
