-- Migration 061: Enable Realtime for channel_connections
-- Required for useChannelConnections hook to receive live updates (QR scan → status change)

-- 1. REPLICA IDENTITY FULL allows Supabase Realtime to filter by non-PK columns (company_id, owner_id)
ALTER TABLE public.channel_connections REPLICA IDENTITY FULL;

-- 2. Add to supabase_realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'channel_connections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_connections;
  END IF;
END $$;
