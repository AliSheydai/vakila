-- Video call fields on events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS call_status VARCHAR(20) NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS recording_url TEXT,
  ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recording_consent_lawyer BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recording_consent_client BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_call_status_check;

ALTER TABLE events
  ADD CONSTRAINT events_call_status_check
  CHECK (call_status IN ('idle', 'lobby', 'waiting', 'in_call', 'ended'));

CREATE INDEX IF NOT EXISTS idx_events_call_status ON events(call_status)
  WHERE call_status != 'idle';

-- Track event reminders sent
CREATE TABLE IF NOT EXISTS event_reminder_log (
  event_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reminder_type VARCHAR(20) NOT NULL,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, reminder_type)
);
