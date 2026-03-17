-- ============================================================================
-- 059_fix_deals_board_fk.sql
-- Corrige FK deals_board_id_fkey que bloqueia deleção de boards
--
-- Problema: tabela legada "deals" tem FK para boards(id) sem ON DELETE SET NULL,
--           causando erro 409 ao tentar deletar um pipeline (board).
-- Solução: recria o FK com ON DELETE SET NULL (igual ao comportamento da
--          tabela "leads" definida em 001_init.sql).
-- ============================================================================

BEGIN;

-- Dropa o FK atual (sem ON DELETE SET NULL)
ALTER TABLE public.deals
  DROP CONSTRAINT IF EXISTS deals_board_id_fkey;

-- Recria com ON DELETE SET NULL
ALTER TABLE public.deals
  ADD CONSTRAINT deals_board_id_fkey
  FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE SET NULL;

COMMIT;
