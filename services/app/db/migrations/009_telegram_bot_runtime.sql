-- Telegram bot runtime: webhook metadata, account links, conversation FSM

ALTER TABLE messenger_platform_settings
  ADD COLUMN IF NOT EXISTS webhook_secret_cipher TEXT,
  ADD COLUMN IF NOT EXISTS bot_username TEXT,
  ADD COLUMN IF NOT EXISTS webhook_set_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS messenger_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform    messenger_platform NOT NULL,
  chat_id     TEXT NOT NULL,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone       TEXT NOT NULL,
  linked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at  TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT messenger_links_platform_chat_unique UNIQUE (platform, chat_id)
);

CREATE INDEX IF NOT EXISTS messenger_links_user_id_idx
  ON messenger_links (user_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS messenger_links_active_platform_user_idx
  ON messenger_links (platform, user_id)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS messenger_conversations (
  platform    messenger_platform NOT NULL,
  chat_id     TEXT NOT NULL,
  state       TEXT NOT NULL DEFAULT 'idle',
  context     JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (platform, chat_id)
);
