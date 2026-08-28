-- Vakila / Vokala — initial schema
-- Roles: super_admin (first lawyer), lawyer, client

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'lawyer', 'client');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE case_status AS ENUM (
    'new', 'under_review', 'active', 'awaiting_action', 'closed', 'archived', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE legal_area AS ENUM (
    'civil', 'criminal', 'family', 'commercial', 'labor', 'administrative', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'cash', 'card', 'transfer', 'cheque', 'online', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_source AS ENUM ('manual', 'online');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_record_status AS ENUM (
    'completed', 'pending', 'failed', 'cancelled', 'refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM (
    'court', 'expert', 'travel', 'service', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_type AS ENUM (
    'client_meeting', 'court_hearing', 'online_meeting',
    'legal_deadline', 'reminder', 'other',
    'consultation', 'court', 'online', 'in_person', 'follow_up'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM (
    'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE case_created_by AS ENUM ('lawyer', 'client');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE comment_author_role AS ENUM ('lawyer', 'client');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('available', 'processing', 'restricted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE timeline_event_type AS ENUM (
    'created', 'review', 'document', 'session', 'status', 'payment', 'note'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE citizenship_type AS ENUM ('iranian', 'foreign');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         VARCHAR(20) NOT NULL UNIQUE,
  name          VARCHAR(200),
  email         VARCHAR(255),
  role          user_role NOT NULL DEFAULT 'client',
  avatar_url    TEXT,
  title         VARCHAR(200),
  specialty     VARCHAR(200),
  bar_number    VARCHAR(100),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- ─── auth sessions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    CHAR(64) NOT NULL UNIQUE,
  user_agent    TEXT,
  ip_address    VARCHAR(64),
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);

-- ─── OTP challenges ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_challenges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         VARCHAR(20) NOT NULL,
  code_hash     CHAR(64) NOT NULL,
  attempts      INT NOT NULL DEFAULT 0,
  max_attempts  INT NOT NULL DEFAULT 5,
  expires_at    TIMESTAMPTZ NOT NULL,
  consumed_at   TIMESTAMPTZ,
  ip_address    VARCHAR(64),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone_created ON otp_challenges(phone, created_at DESC);

-- ─── CRM clients (lawyer-managed contacts) ─────────────────
CREATE TABLE IF NOT EXISTS clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linked_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  name            VARCHAR(200) NOT NULL,
  phone           VARCHAR(20) NOT NULL,
  email           VARCHAR(255),
  citizenship     citizenship_type,
  national_id     VARCHAR(50),
  avatar_data_url TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_owner ON clients(owner_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);

-- ─── cases (unified lawyer + portal) ───────────────────────
CREATE TABLE IF NOT EXISTS cases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number       VARCHAR(100) NOT NULL,
  title             VARCHAR(500) NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  description_html  TEXT NOT NULL DEFAULT '',
  legal_area        legal_area NOT NULL DEFAULT 'other',
  status            case_status NOT NULL DEFAULT 'new',
  owner_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id         UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by        case_created_by NOT NULL DEFAULT 'lawyer',
  lawyer_synced     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, case_number)
);

CREATE INDEX IF NOT EXISTS idx_cases_owner ON cases(owner_id);
CREATE INDEX IF NOT EXISTS idx_cases_client ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_client_user ON cases(client_user_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);

-- ─── case fee ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS case_fees (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id       UUID NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
  amount        NUMERIC(18, 0) NOT NULL CHECK (amount >= 0),
  description   TEXT,
  due_date      TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── payments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS case_payments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id                   UUID REFERENCES cases(id) ON DELETE CASCADE,
  owner_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_user_id            UUID REFERENCES users(id) ON DELETE SET NULL,
  title                     VARCHAR(500),
  amount                    NUMERIC(18, 0) NOT NULL CHECK (amount > 0),
  paid_at                   TIMESTAMPTZ,
  method                    payment_method NOT NULL DEFAULT 'other',
  source                    payment_source NOT NULL DEFAULT 'manual',
  status                    payment_record_status NOT NULL DEFAULT 'completed',
  description               TEXT,
  external_transaction_id   VARCHAR(200),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_payments_case ON case_payments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_payments_owner ON case_payments(owner_id);
CREATE INDEX IF NOT EXISTS idx_case_payments_client_user ON case_payments(client_user_id);

-- ─── expenses ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS case_expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id       UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  title         VARCHAR(500) NOT NULL,
  category      expense_category NOT NULL DEFAULT 'other',
  amount        NUMERIC(18, 0) NOT NULL CHECK (amount > 0),
  expense_date  TIMESTAMPTZ NOT NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_expenses_case ON case_expenses(case_id);

-- ─── attachments (cases & clients) ─────────────────────────
CREATE TABLE IF NOT EXISTS attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id       UUID REFERENCES cases(id) ON DELETE CASCADE,
  client_id     UUID REFERENCES clients(id) ON DELETE CASCADE,
  name          VARCHAR(500) NOT NULL,
  mime_type     VARCHAR(200) NOT NULL,
  size_bytes    BIGINT NOT NULL CHECK (size_bytes >= 0),
  status        document_status NOT NULL DEFAULT 'available',
  uploaded_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT attachments_parent_chk CHECK (
    (case_id IS NOT NULL AND client_id IS NULL) OR
    (case_id IS NULL AND client_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_attachments_case ON attachments(case_id);
CREATE INDEX IF NOT EXISTS idx_attachments_client ON attachments(client_id);

-- ─── events / sessions ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  title             VARCHAR(500) NOT NULL,
  type              event_type NOT NULL DEFAULT 'other',
  status            event_status NOT NULL DEFAULT 'scheduled',
  event_date        DATE NOT NULL,
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,
  starts_at         TIMESTAMPTZ,
  duration_minutes  INT CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  location          TEXT NOT NULL DEFAULT '',
  meeting_url       TEXT,
  description       TEXT NOT NULL DEFAULT '',
  client_id         UUID REFERENCES clients(id) ON DELETE SET NULL,
  case_id           UUID REFERENCES cases(id) ON DELETE SET NULL,
  can_cancel        BOOLEAN NOT NULL DEFAULT FALSE,
  can_reschedule    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_owner ON events(owner_id);
CREATE INDEX IF NOT EXISTS idx_events_client_user ON events(client_user_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_case ON events(case_id);

-- ─── case comments ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS case_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id       UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  author_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  author_role   comment_author_role NOT NULL,
  author_name   VARCHAR(200) NOT NULL,
  body_html     TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_comments_case ON case_comments(case_id);

-- ─── case timeline ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS case_timeline (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id       UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type          timeline_event_type NOT NULL,
  title         VARCHAR(500) NOT NULL,
  description   TEXT,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_timeline_case ON case_timeline(case_id);

-- ─── schema migrations bookkeeping ─────────────────────────
CREATE TABLE IF NOT EXISTS schema_migrations (
  id            TEXT PRIMARY KEY,
  applied_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── updated_at helper ─────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_cases_updated BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_case_fees_updated BEFORE UPDATE ON case_fees
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_case_payments_updated BEFORE UPDATE ON case_payments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_case_expenses_updated BEFORE UPDATE ON case_expenses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_events_updated BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── pg NOTIFY for realtime (pgevent → WS) ─────────────────
CREATE OR REPLACE FUNCTION notify_table_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  payload := json_build_object(
    'table', TG_TABLE_NAME,
    'op', TG_OP,
    'id', CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    'row', CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END,
    'ts', NOW()
  );

  PERFORM pg_notify('vakila_changes', payload::TEXT);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_notify_users AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION notify_table_change();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_notify_clients AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION notify_table_change();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_notify_cases AFTER INSERT OR UPDATE OR DELETE ON cases
    FOR EACH ROW EXECUTE FUNCTION notify_table_change();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_notify_case_fees AFTER INSERT OR UPDATE OR DELETE ON case_fees
    FOR EACH ROW EXECUTE FUNCTION notify_table_change();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_notify_case_payments AFTER INSERT OR UPDATE OR DELETE ON case_payments
    FOR EACH ROW EXECUTE FUNCTION notify_table_change();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_notify_case_expenses AFTER INSERT OR UPDATE OR DELETE ON case_expenses
    FOR EACH ROW EXECUTE FUNCTION notify_table_change();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_notify_attachments AFTER INSERT OR UPDATE OR DELETE ON attachments
    FOR EACH ROW EXECUTE FUNCTION notify_table_change();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_notify_events AFTER INSERT OR UPDATE OR DELETE ON events
    FOR EACH ROW EXECUTE FUNCTION notify_table_change();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_notify_case_comments AFTER INSERT OR UPDATE OR DELETE ON case_comments
    FOR EACH ROW EXECUTE FUNCTION notify_table_change();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_notify_case_timeline AFTER INSERT OR UPDATE OR DELETE ON case_timeline
    FOR EACH ROW EXECUTE FUNCTION notify_table_change();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
