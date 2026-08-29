-- Per-user notification channel preferences (client portal)

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  channel           client_notification_channel NOT NULL DEFAULT 'in_app',
  chatbot_platform  messenger_platform,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
