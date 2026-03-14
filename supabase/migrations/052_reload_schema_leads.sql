-- Migration 052: Ensure lost_at exists on leads and reload PostgREST schema cache
-- Fixes PGRST204 "Could not find the 'lost_at' column" error in WF-04.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS lost_at timestamptz;

NOTIFY pgrst, 'reload schema';
