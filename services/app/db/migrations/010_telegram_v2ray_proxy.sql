-- Encrypted V2Ray/VLESS share-link used to expose a local SOCKS5 proxy for Telegram Bot API

ALTER TABLE messenger_platform_settings
  ADD COLUMN IF NOT EXISTS proxy_config_cipher TEXT;
