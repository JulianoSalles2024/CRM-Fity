-- Migration 096: Proteger estágios terminais de avanço automático pelo agente IA
-- O get_next_stage avançava até "Perdido" porque era o próximo na ordem numérica.
-- Fix: coluna can_auto_advance = false em estágios terminais negativos.

ALTER TABLE public.board_stages
  ADD COLUMN IF NOT EXISTS can_auto_advance boolean NOT NULL DEFAULT true;

-- Marcar todos os estágios "Perdido" / "Lost" como não-avançáveis automaticamente
UPDATE public.board_stages
  SET can_auto_advance = false
  WHERE name ILIKE '%perdido%' OR name ILIKE '%lost%' OR name ILIKE '%perdu%';

-- Atualizar get_next_stage para respeitar can_auto_advance
CREATE OR REPLACE FUNCTION public.get_next_stage(p_current_stage_id uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object('next_stage_id', s2.id)
  FROM   public.board_stages s1
  JOIN   public.board_stages s2
      ON  s2.board_id       = s1.board_id
      AND s2.company_id     = s1.company_id
      AND s2."order"        > s1."order"
      AND s2.can_auto_advance = true
  WHERE  s1.id = p_current_stage_id
  ORDER  BY s2."order" ASC
  LIMIT  1;
$$;

NOTIFY pgrst, 'reload schema';
