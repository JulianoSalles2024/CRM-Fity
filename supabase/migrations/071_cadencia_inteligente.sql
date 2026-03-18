-- Migration 071: Cadência Inteligente
-- Adiciona gatilhos automáticos por estágio + tabela de notificações para aprovação humana

-- ── 1. Novos campos em board_stages ──────────────────────────────────────────

ALTER TABLE public.board_stages
  ADD COLUMN IF NOT EXISTS auto_triggers     jsonb    NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS auto_playbook_id  uuid     REFERENCES public.playbooks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS requires_approval boolean  NOT NULL DEFAULT false;

-- ── 2. Tabela notifications (cria se não existir) ─────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id          uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  type             text        NOT NULL,
  title            text        NOT NULL,
  body             text,
  lead_id          uuid        REFERENCES public.leads(id) ON DELETE CASCADE,
  metadata         jsonb       NOT NULL DEFAULT '{}',
  read             boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Garante colunas caso a tabela já existia sem elas
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS metadata    jsonb    NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS lead_id     uuid     REFERENCES public.leads(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_id     uuid     REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS body        text,
  ADD COLUMN IF NOT EXISTS read        boolean  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_id  uuid     REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title       text,
  ADD COLUMN IF NOT EXISTS type        text;

-- ── 3. Índices ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS notifications_company_id_idx ON public.notifications (company_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx    ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_lead_id_idx    ON public.notifications (lead_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx       ON public.notifications (company_id, read) WHERE read = false;

-- ── 4. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "company_access" ON public.notifications
    FOR ALL
    USING  (company_id = public.my_company_id())
    WITH CHECK (company_id = public.my_company_id());
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'policy company_access already exists, skipping';
END;
$$;

-- ── 5. Realtime ───────────────────────────────────────────────────────────────

ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'supabase_realtime publication: %', SQLERRM;
END;
$$;

NOTIFY pgrst, 'reload schema';
