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

  -- Busca owner: admin ativo da empresa (sem RLS — SECURITY DEFINER roda como postgres)
  SELECT p.id INTO v_owner_id
  FROM public.profiles p
  WHERE p.company_id = p_company_id
  ORDER BY (p.role = 'admin') DESC, p.created_at ASC
  LIMIT 1;

  -- Create new lead
  INSERT INTO public.leads (company_id, name, status, source, owner_id)
  VALUES (
    p_company_id,
    COALESCE(NULLIF(trim(COALESCE(p_contact_name, '')), ''), 'Lead ' || p_identifier),
    'NOVO',
    'omnichannel_inbound',
    v_owner_id
  )
  RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_channel_links (company_id, lead_id, channel, identifier)
  VALUES (p_company_id, v_lead_id, p_channel, p_identifier);

  RETURN QUERY SELECT v_lead_id, true;
END;
$$;
