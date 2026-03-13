-- Fix: deleting a lead causes "null value in column company_id of conversations"
--
-- Root cause: fk_conv_lead is a composite FK on (company_id, lead_id) referencing
-- leads(company_id, id) ON DELETE SET NULL. PostgreSQL's SET NULL applies to ALL
-- columns of the FK — so both lead_id AND company_id are set to NULL, violating
-- the NOT NULL constraint on conversations.company_id.
--
-- Fix: replace with a simple FK on lead_id only → leads(id) ON DELETE SET NULL.
-- This sets only lead_id to NULL when a lead is deleted, leaving company_id intact.

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS fk_conv_lead;

ALTER TABLE public.conversations
  ADD CONSTRAINT fk_conv_lead
    FOREIGN KEY (lead_id)
    REFERENCES public.leads(id)
    ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
