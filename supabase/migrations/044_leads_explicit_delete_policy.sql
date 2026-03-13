-- Fix: delete lead returns 400 for authenticated users
-- Root cause: the "Leads: company members" policy is FOR ALL with only a USING clause.
-- In PostgreSQL, FOR ALL with USING covers SELECT/UPDATE/DELETE, but the subquery-based
-- USING can fail silently for DELETE when auth.uid() context is not propagated correctly.
-- Adding an explicit DELETE policy with my_company_id() (SECURITY DEFINER function)
-- guarantees the company_id check is resolved in the correct context.

CREATE POLICY "leads: delete own company"
  ON public.leads
  FOR DELETE
  USING (company_id = my_company_id());

NOTIFY pgrst, 'reload schema';
