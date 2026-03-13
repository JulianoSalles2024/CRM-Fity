-- Fix resolve_or_create_conversation: status 'open' → 'waiting' (migration 040 changed CHECK constraint)
-- Also updates "active" filters to exclude all terminal statuses ('resolved','blocked')
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
  v_conv_id    uuid;
  v_company_id uuid;
BEGIN
  -- Resolve company_id: usa p_company_id ou busca do channel_connection como fallback
  v_company_id := p_company_id;
  IF v_company_id IS NULL THEN
    SELECT company_id INTO v_company_id
    FROM channel_connections
    WHERE id = p_channel_connection_id;
  END IF;

  -- Tenant guard
  IF auth.uid() IS NOT NULL AND v_company_id != my_company_id() THEN
    RAISE EXCEPTION 'unauthorized: company_id mismatch' USING ERRCODE = '42501';
  END IF;

  -- Step 1: match by external_conversation_id
  IF p_external_conversation_id IS NOT NULL THEN
    SELECT id INTO v_conv_id
    FROM conversations
    WHERE company_id               = v_company_id
      AND channel_connection_id    = p_channel_connection_id
      AND external_conversation_id = p_external_conversation_id
      AND status NOT IN ('resolved', 'blocked')
    LIMIT 1;

    IF v_conv_id IS NOT NULL THEN
      RETURN QUERY SELECT v_conv_id, false;
      RETURN;
    END IF;
  END IF;

  -- Step 2: match by active contact
  SELECT id INTO v_conv_id
  FROM conversations
  WHERE company_id            = v_company_id
    AND channel_connection_id = p_channel_connection_id
    AND contact_identifier    = p_contact_identifier
    AND status NOT IN ('resolved', 'blocked')
  LIMIT 1;

  IF v_conv_id IS NOT NULL THEN
    RETURN QUERY SELECT v_conv_id, false;
    RETURN;
  END IF;

  -- Step 3: INSERT — status 'waiting' (era 'open', corrigido pela migration 040)
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
    v_company_id,
    p_channel_connection_id,
    p_lead_id,
    p_contact_identifier,
    p_contact_name,
    p_external_conversation_id,
    'waiting'
  )
  ON CONFLICT (channel_connection_id, contact_identifier)
  WHERE status NOT IN ('resolved', 'blocked')
  DO NOTHING
  RETURNING id INTO v_conv_id;

  -- Se ON CONFLICT disparou, busca o vencedor
  IF v_conv_id IS NULL THEN
    SELECT id INTO v_conv_id
    FROM conversations
    WHERE company_id            = v_company_id
      AND channel_connection_id = p_channel_connection_id
      AND contact_identifier    = p_contact_identifier
      AND status NOT IN ('resolved', 'blocked')
    LIMIT 1;

    RETURN QUERY SELECT v_conv_id, false;
    RETURN;
  END IF;

  RETURN QUERY SELECT v_conv_id, true;
END;
$$;

NOTIFY pgrst, 'reload schema';
