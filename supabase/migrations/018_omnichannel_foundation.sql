-- ============================================================================
-- 018_omnichannel_foundation.sql
-- Omnichannel Foundation — core tables for multi-channel messaging
-- Multi-tenant: every table has company_id + RLS + composite FKs
-- ============================================================================

BEGIN;

-- ─── Extend existing tables with UNIQUE(company_id, id) ───────────────────────
-- Required so downstream tables can use composite FKs — database-enforced
-- tenant safety that cannot be bypassed even by service_role.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_leads_company_id_id'
      AND conrelid = 'public.leads'::regclass
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT uq_leads_company_id_id UNIQUE (company_id, id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_profiles_company_id_id'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT uq_profiles_company_id_id UNIQUE (company_id, id);
  END IF;
END $$;

-- ─── Helper trigger function (idempotent) ─────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ─── 1. channel_connections ───────────────────────────────────────────────────
-- One row per connected channel per company (e.g. one WhatsApp number).
-- external_id = Evolution API instance_name.

CREATE TABLE IF NOT EXISTS channel_connections (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  channel     text        NOT NULL CHECK (channel IN ('whatsapp','email','instagram','telegram','webchat')),
  name        text        NOT NULL,
  status      text        NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','error')),
  external_id text,
  config      jsonb       NOT NULL DEFAULT '{}',
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id),           -- composite FK anchor
  UNIQUE (company_id, external_id)   -- one instance name per company
);

ALTER TABLE channel_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "channel_connections_company_isolation" ON channel_connections
  USING (company_id = my_company_id());

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_channel_connections_updated_at') THEN
    CREATE TRIGGER trg_channel_connections_updated_at
      BEFORE UPDATE ON channel_connections
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ─── 2. lead_channel_links ────────────────────────────────────────────────────
-- Maps a lead to its identifier on each channel (phone, email, etc.).

CREATE TABLE IF NOT EXISTS lead_channel_links (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id     uuid        NOT NULL,
  channel     text        NOT NULL,
  identifier  text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_lcl_lead
    FOREIGN KEY (company_id, lead_id)
    REFERENCES leads(company_id, id) ON DELETE CASCADE,
  UNIQUE (company_id, channel, identifier)
);

ALTER TABLE lead_channel_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_channel_links_company_isolation" ON lead_channel_links
  USING (company_id = my_company_id());

-- ─── 3. conversations ─────────────────────────────────────────────────────────
-- One active conversation per (channel_connection, contact_identifier).
-- Partial unique index prevents race-condition duplicates.

CREATE TABLE IF NOT EXISTS conversations (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id               uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  channel_connection_id    uuid        NOT NULL,
  lead_id                  uuid,
  contact_identifier       text        NOT NULL,
  contact_name             text,
  contact_jid              text,
  external_conversation_id text,
  status                   text        NOT NULL DEFAULT 'open'
                           CHECK (status IN ('open','pending','resolved','snoozed')),
  assigned_to              uuid,
  last_message_at          timestamptz,
  last_message_preview     text,
  unread_count             int         NOT NULL DEFAULT 0,
  metadata                 jsonb       NOT NULL DEFAULT '{}',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id),           -- composite FK anchor
  CONSTRAINT fk_conv_channel_connection
    FOREIGN KEY (company_id, channel_connection_id)
    REFERENCES channel_connections(company_id, id) ON DELETE RESTRICT,
  CONSTRAINT fk_conv_lead
    FOREIGN KEY (company_id, lead_id)
    REFERENCES leads(company_id, id) ON DELETE SET NULL,
  CONSTRAINT fk_conv_assigned_to
    FOREIGN KEY (company_id, assigned_to)
    REFERENCES profiles(company_id, id) ON DELETE SET NULL
);

-- Prevents duplicate active conversations per contact (race-condition safe)
CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_active_contact
  ON conversations(channel_connection_id, contact_identifier)
  WHERE status NOT IN ('resolved');

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_company_isolation" ON conversations
  USING (company_id = my_company_id());

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_conversations_updated_at') THEN
    CREATE TRIGGER trg_conversations_updated_at
      BEFORE UPDATE ON conversations
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ─── 4. messages ──────────────────────────────────────────────────────────────
-- ai_agent_run_id / automation_execution_id: plain UUID here;
-- FK constraints added at end of 019 after those tables exist.

CREATE TABLE IF NOT EXISTS messages (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id              uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  conversation_id         uuid        NOT NULL,
  external_message_id     text,
  direction               text        NOT NULL DEFAULT 'inbound'
                          CHECK (direction IN ('inbound','outbound')),
  sender_type             text        NOT NULL DEFAULT 'lead'
                          CHECK (sender_type IN ('lead','agent','bot','system')),
  sender_id               uuid,
  content                 text,
  content_type            text        NOT NULL DEFAULT 'text'
                          CHECK (content_type IN ('text','image','audio','video','document','template','unknown')),
  status                  text        DEFAULT 'delivered'
                          CHECK (status IN ('pending','sent','delivered','read','failed')),
  metadata                jsonb       NOT NULL DEFAULT '{}',
  sent_at                 timestamptz NOT NULL DEFAULT now(),
  ai_agent_run_id         uuid,         -- FK added in 019
  automation_execution_id uuid,         -- FK added in 019
  created_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, id),             -- composite FK anchor
  CONSTRAINT fk_msg_conversation
    FOREIGN KEY (company_id, conversation_id)
    REFERENCES conversations(company_id, id) ON DELETE CASCADE
);

-- Deduplication scoped to company — catches cross-conversation routing errors
CREATE UNIQUE INDEX IF NOT EXISTS uq_messages_external_id
  ON messages(company_id, external_message_id)
  WHERE external_message_id IS NOT NULL;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_company_isolation" ON messages
  USING (company_id = my_company_id());

-- ─── 5. message_attachments ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS message_attachments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  message_id  uuid        NOT NULL,
  file_url    text        NOT NULL,
  file_name   text,
  file_type   text,
  file_size   bigint,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_attach_message
    FOREIGN KEY (company_id, message_id)
    REFERENCES messages(company_id, id) ON DELETE CASCADE
);

ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "message_attachments_company_isolation" ON message_attachments
  USING (company_id = my_company_id());

-- ─── 6. webhook_events ────────────────────────────────────────────────────────
-- WRITE ACCESS: service_role only (n8n workflows).
-- No INSERT/UPDATE RLS policy for authenticated users — by design.
-- Authenticated users can only SELECT resolved events (for audit UI).

CREATE TABLE IF NOT EXISTS webhook_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid        REFERENCES companies(id) ON DELETE CASCADE,
  source       text        NOT NULL,
  external_id  text        NOT NULL,
  status       text        NOT NULL DEFAULT 'received'
               CHECK (status IN ('received','processed','failed','duplicate')),
  payload      jsonb       NOT NULL DEFAULT '{}',
  error        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  UNIQUE (source, external_id)   -- global deduplication key
);

COMMENT ON TABLE webhook_events IS
  'Write access: service_role only (n8n). '
  'No INSERT/UPDATE RLS policy for authenticated users — intentional.';

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_events_read_processed" ON webhook_events
  FOR SELECT USING (status = 'processed' AND company_id = my_company_id());

-- ─── 7. escalation_logs ───────────────────────────────────────────────────────
-- ai_agent_run_id: plain UUID here; FK added in 019.

CREATE TABLE IF NOT EXISTS escalation_logs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  conversation_id uuid        NOT NULL,
  escalated_by    text        NOT NULL DEFAULT 'ai'
                  CHECK (escalated_by IN ('ai','automation','user')),
  reason          text,
  assigned_to     uuid,
  ai_agent_run_id uuid,         -- FK added in 019
  resolved_at     timestamptz,
  metadata        jsonb       NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_esc_conversation
    FOREIGN KEY (company_id, conversation_id)
    REFERENCES conversations(company_id, id) ON DELETE CASCADE
);

ALTER TABLE escalation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escalation_logs_company_isolation" ON escalation_logs
  USING (company_id = my_company_id());

-- ─── 8. contact_profiles ──────────────────────────────────────────────────────
-- Extended contact info enriched over time (avatar, extra data).

CREATE TABLE IF NOT EXISTS contact_profiles (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id      uuid,
  channel      text        NOT NULL,
  identifier   text        NOT NULL,
  display_name text,
  avatar_url   text,
  extra        jsonb       NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_cp_lead
    FOREIGN KEY (company_id, lead_id)
    REFERENCES leads(company_id, id) ON DELETE SET NULL,
  UNIQUE (company_id, channel, identifier)
);

ALTER TABLE contact_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_profiles_company_isolation" ON contact_profiles
  USING (company_id = my_company_id());

-- ─── 9. conversation_labels ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversation_labels (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  conversation_id uuid        NOT NULL,
  label           text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_cl_conversation
    FOREIGN KEY (company_id, conversation_id)
    REFERENCES conversations(company_id, id) ON DELETE CASCADE,
  UNIQUE (company_id, conversation_id, label)
);

ALTER TABLE conversation_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversation_labels_company_isolation" ON conversation_labels
  USING (company_id = my_company_id());

-- ─── 10. omni_templates ───────────────────────────────────────────────────────
-- Reusable message templates per channel.

CREATE TABLE IF NOT EXISTS omni_templates (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  channel     text        NOT NULL,
  name        text        NOT NULL,
  content     text        NOT NULL,
  variables   text[]      NOT NULL DEFAULT '{}',
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);

ALTER TABLE omni_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "omni_templates_company_isolation" ON omni_templates
  USING (company_id = my_company_id());

COMMIT;
