-- Atualiza enforce_company_id sem tocar em owner_id (coluna não existe com esse nome)
CREATE OR REPLACE FUNCTION public.enforce_company_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  IF new.company_id IS NULL THEN
    v_company_id := public.my_company_id();
    IF v_company_id IS NULL THEN
      RAISE EXCEPTION
        'Usuário % não possui company_id. Contate o administrador.',
        auth.uid()
        USING ERRCODE = 'P0001';
    END IF;
    new.company_id := v_company_id;
  END IF;
  RETURN new;
END;
$$;

-- Função diagnóstica: retorna colunas reais da tabela leads
CREATE OR REPLACE FUNCTION get_leads_columns()
RETURNS TABLE(column_name text, data_type text, is_nullable text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT column_name::text, data_type::text, is_nullable::text
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'leads'
  ORDER BY ordinal_position;
$$;

GRANT EXECUTE ON FUNCTION get_leads_columns() TO service_role;
