-- Migration 048: Enable Supabase Realtime for leads table
-- Fixes: new leads created by n8n (WF-01) only appear after page refresh

ALTER TABLE public.leads REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  END IF;
END $$;
