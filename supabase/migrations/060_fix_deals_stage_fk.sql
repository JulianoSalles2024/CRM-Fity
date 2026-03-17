-- ============================================================================
-- 060_fix_deals_stage_fk.sql
-- Corrige FK deals_stage_id_fkey que bloqueia deleção de board_stages
--
-- A tabela legada "deals" tem FKs sem ON DELETE SET NULL para:
--   - boards      → corrigido na 059
--   - board_stages → corrigido aqui
-- Também recria quaisquer outros FKs conhecidos da tabela deals
-- para evitar novos bloqueios em cascata.
-- ============================================================================

BEGIN;

-- FK para board_stages
ALTER TABLE public.deals
  DROP CONSTRAINT IF EXISTS deals_stage_id_fkey;

ALTER TABLE public.deals
  ADD CONSTRAINT deals_stage_id_fkey
  FOREIGN KEY (stage_id) REFERENCES public.board_stages(id) ON DELETE SET NULL;

-- FK alternativo (column_id) caso exista
ALTER TABLE public.deals
  DROP CONSTRAINT IF EXISTS deals_column_id_fkey;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'column_id'
  ) THEN
    ALTER TABLE public.deals
      ADD CONSTRAINT deals_column_id_fkey
      FOREIGN KEY (column_id) REFERENCES public.board_stages(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
