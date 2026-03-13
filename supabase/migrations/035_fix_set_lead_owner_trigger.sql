-- Corrige set_lead_owner para não sobrescrever owner_id quando já foi fornecido
-- Isso garante que n8n (service_role, sem auth.uid()) possa criar leads com owner_id
CREATE OR REPLACE FUNCTION public.set_lead_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF new.owner_id IS NULL THEN
    new.owner_id := auth.uid();
  END IF;
  RETURN new;
END;
$$;
