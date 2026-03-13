-- Torna owner_id nullable para suportar leads criados via omnichannel
-- (lead sem dono até ser atribuído manualmente)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads'
      AND column_name = 'owner_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE leads ALTER COLUMN owner_id DROP NOT NULL;
  END IF;
END $$;
