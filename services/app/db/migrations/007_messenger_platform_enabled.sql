-- Per-platform chatbot enable/disable toggle

CREATE TABLE IF NOT EXISTS messenger_platform_settings (
  platform   messenger_platform PRIMARY KEY,
  enabled    BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO messenger_platform_settings (platform, enabled) VALUES
  ('telegram', FALSE),
  ('bale', FALSE),
  ('rubika', FALSE)
ON CONFLICT (platform) DO NOTHING;
