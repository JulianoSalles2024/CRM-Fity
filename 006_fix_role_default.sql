-- ─────────────────────────────────────────────────────────────────────────────
-- 006_fix_role_default.sql
--
-- Problema: o fallback COALESCE(raw_user_meta_data->>'role', 'admin') em Path B
-- fazia signup direto (sem invite_token) resultar em role='admin' silenciosamente.
--
-- Correção: remover o fallback 'admin'. Signup direto só é permitido com
-- role='admin' explícito no metadata (fluxo de admin auto-registro).
-- Qualquer outro caso sem invite_token lança EXCEPTION — nunca promove por padrão.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token         text;
  v_role          text;
  v_company_id    uuid;
  v_invite_found  boolean := false;
BEGIN
  v_token := new.raw_user_meta_data->>'invite_token';

  -- ── Path A: invited user ──────────────────────────────────────────────────
  IF v_token IS NOT NULL THEN
    SELECT role, company_id
      INTO v_role, v_company_id
      FROM public.invites
     WHERE token    = v_token
       AND used_at  IS NULL
       AND (expires_at IS NULL OR expires_at > now())
     LIMIT 1;

    IF FOUND THEN
      v_invite_found := true;
    ELSE
      RAISE EXCEPTION 'Invite token "%" is invalid, expired or already used', v_token;
    END IF;
  END IF;

  -- ── Path B: admin self-signup (no invite token) ───────────────────────────
  -- CORRIGIDO: sem fallback para 'admin'. O role deve ser declarado explicitamente
  -- no metadata. Qualquer valor diferente de 'admin' (incluindo NULL) levanta erro.
  IF v_role IS NULL THEN
    v_role := new.raw_user_meta_data->>'role';

    IF v_role IS DISTINCT FROM 'admin' THEN
      RAISE EXCEPTION
        'Signup direto requer role=admin no metadata ou um invite_token válido (role recebido: "%")',
        COALESCE(v_role, 'null');
    END IF;

    -- Admin auto-registro: cria empresa automaticamente
    INSERT INTO public.companies (name)
    VALUES (
      COALESCE(
        NULLIF(new.raw_user_meta_data->>'company_name', ''),
        NULLIF(new.raw_user_meta_data->>'name', ''),
        new.email
      )
    )
    RETURNING id INTO v_company_id;
  END IF;

  -- ── Guard ─────────────────────────────────────────────────────────────────
  IF v_role IN ('admin', 'seller') AND v_company_id IS NULL THEN
    RAISE EXCEPTION 'company_id não pode ser NULL para role "%"', v_role;
  END IF;

  -- ── Insert profile ────────────────────────────────────────────────────────
  INSERT INTO public.profiles (id, email, name, role, company_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(NULLIF(new.raw_user_meta_data->>'name', ''), new.email),
    v_role,
    v_company_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── Mark invite as used (após insert bem-sucedido) ───────────────────────
  IF v_invite_found THEN
    UPDATE public.invites
    SET used_at = now()
    WHERE token = v_token
      AND used_at IS NULL;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
