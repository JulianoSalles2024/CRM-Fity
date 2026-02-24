CREATE OR REPLACE FUNCTION public.validate_invite(p_token text)
RETURNS TABLE(role text, company_id uuid, expires_at timestamptz, used_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role, company_id, expires_at, used_at
  FROM public.invites
  WHERE token = p_token;
$$;

GRANT EXECUTE ON FUNCTION public.validate_invite(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_invite(text) TO authenticated;
