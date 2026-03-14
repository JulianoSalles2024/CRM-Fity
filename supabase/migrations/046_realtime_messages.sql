-- Migration 046: Enable Supabase Realtime for messages and conversations tables
-- Fixes: messages sent/received not appearing in chat without page refresh

-- 1. Enable REPLICA IDENTITY FULL so Supabase Realtime can filter by non-PK columns
--    (e.g. conversation_id=eq.xxx). Without this, filtered subscriptions silently receive no events.
ALTER TABLE public.messages       REPLICA IDENTITY FULL;
ALTER TABLE public.conversations  REPLICA IDENTITY FULL;

-- 2. Add tables to the supabase_realtime publication (created by Supabase automatically).
--    Using DO block to be idempotent — safe to run even if already added.
DO $$
BEGIN
  -- messages
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  -- conversations
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END $$;
