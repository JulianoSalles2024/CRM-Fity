-- Migration: 055_auto_assign_lead_to_first_stage.sql
-- Auto-assign new leads to the first stage of the first board when column_id is NULL.
-- Covers any insertion path: n8n (WF-01), frontend, API, imports.

CREATE OR REPLACE FUNCTION auto_assign_lead_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stage_id uuid;
BEGIN
  -- Only act when column_id is not provided
  IF NEW.column_id IS NULL THEN
    SELECT bs.id INTO v_stage_id
    FROM board_stages bs
    JOIN boards b ON b.id = bs.board_id
    WHERE b.company_id = NEW.company_id
    ORDER BY b.created_at ASC, bs."order" ASC
    LIMIT 1;

    -- Assign if found; otherwise leave NULL (no board created yet)
    NEW.column_id := v_stage_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop if already exists to allow re-runs
DROP TRIGGER IF EXISTS trg_auto_assign_lead_column ON leads;

CREATE TRIGGER trg_auto_assign_lead_column
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_lead_column();
