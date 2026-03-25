-- Migration 109: Grant INSERT privilege on consent_logs to anon and authenticated roles
-- RLS policies alone are not enough — Postgres also requires explicit GRANT.
GRANT INSERT ON TABLE public.consent_logs TO anon, authenticated;
GRANT SELECT ON TABLE public.consent_logs TO authenticated;
