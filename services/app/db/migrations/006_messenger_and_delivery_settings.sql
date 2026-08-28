-- Messenger bot tokens and client notification delivery preferences

DO $$ BEGIN
  CREATE TYPE messenger_platform AS ENUM ('telegram', 'bale', 'rubika');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE client_notification_channel AS ENUM ('in_app', 'sms', 'chatbot');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS messenger_bot_tokens (
  platform     messenger_platform PRIMARY KEY,
  token_cipher TEXT NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by   UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notification_delivery_settings (
  id                      SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  client_channel          client_notification_channel NOT NULL DEFAULT 'in_app',
  client_chatbot_platform messenger_platform,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by              UUID REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO notification_delivery_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
