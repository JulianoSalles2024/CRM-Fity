-- Corrige enforce_company_id para também definir owner_id quando não informado
-- Resolve o problema de leads criados via service_role (n8n) sem sessão de usuário

CREATE OR REPLACE FUNCTION public.enforce_company_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_owner_id   uuid;
BEGIN
  -- Preenche company_id se não foi fornecido
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

  -- Preenche owner_id se não foi fornecido (leads criados via n8n/service_role)
  IF new.owner_id IS NULL THEN
    -- Tenta auth.uid() primeiro (chamadas autenticadas normais)
    v_owner_id := auth.uid();

    -- Fallback: primeiro admin da empresa
    IF v_owner_id IS NULL THEN
      SELECT p.id INTO v_owner_id
      FROM profiles p
      WHERE p.company_id = new.company_id AND p.role = 'admin'
      LIMIT 1;
    END IF;

    -- Fallback final: qualquer usuário da empresa
    IF v_owner_id IS NULL THEN
      SELECT p.id INTO v_owner_id
      FROM profiles p
      WHERE p.company_id = new.company_id
      LIMIT 1;
    END IF;

    IF v_owner_id IS NOT NULL THEN
      new.owner_id := v_owner_id;
    END IF;
  END IF;

  RETURN new;
END;
$$;
