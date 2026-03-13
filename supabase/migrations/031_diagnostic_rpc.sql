-- Função temporária para diagnóstico — retorna o source da enforce_company_id
CREATE OR REPLACE FUNCTION get_enforce_company_id_source()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT prosrc FROM pg_proc WHERE proname = 'enforce_company_id' LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_enforce_company_id_source() TO service_role;
