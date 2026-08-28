-- In-app notifications for lawyer ↔ client activity

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'case_created',
    'case_updated',
    'case_status_changed',
    'client_info_updated',
    'event_scheduled',
    'event_updated',
    'event_cancelled',
    'payment_recorded',
    'payment_deleted',
    'fee_updated',
    'lawyer_comment',
    'lawyer_document',
    'case_created_by_client',
    'client_comment',
    'client_document',
    'client_comment_with_files',
    'session_cancelled_by_client'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  type          notification_type NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  href          TEXT,
  case_id       UUID REFERENCES cases(id) ON DELETE CASCADE,
  client_id     UUID REFERENCES clients(id) ON DELETE SET NULL,
  event_id      UUID REFERENCES events(id) ON DELETE SET NULL,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
  ON notifications (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON notifications (recipient_id, created_at DESC)
  WHERE read_at IS NULL;

DO $$ BEGIN
  CREATE TRIGGER trg_notify_notifications
    AFTER INSERT OR UPDATE OR DELETE ON notifications
    FOR EACH ROW EXECUTE FUNCTION notify_table_change();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
