-- Migration 050: Add is_blocked flag to leads table
-- Used by blockContact action in Inbox to prevent WF-01 from processing
-- future messages from this contact (n8n check to be added in a second moment).

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;
