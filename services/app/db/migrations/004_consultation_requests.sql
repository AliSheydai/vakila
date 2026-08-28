-- Landing page consultation requests for lawyer CRM

DO $$ BEGIN
  CREATE TYPE consultation_request_status AS ENUM (
    'new', 'in_review', 'contacted', 'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS consultation_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  name                VARCHAR(200) NOT NULL,
  phone               VARCHAR(20) NOT NULL,
  message             TEXT NOT NULL,
  status              consultation_request_status NOT NULL DEFAULT 'new',
  lawyer_notes        TEXT,
  contacted_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultation_requests_owner_status_created
  ON consultation_requests (owner_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_consultation_requests_owner_created
  ON consultation_requests (owner_id, created_at DESC);

DO $$ BEGIN
  CREATE TRIGGER trg_consultation_requests_updated
    BEFORE UPDATE ON consultation_requests
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_notify_consultation_requests
    AFTER INSERT OR UPDATE OR DELETE ON consultation_requests
    FOR EACH ROW EXECUTE FUNCTION notify_table_change();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
