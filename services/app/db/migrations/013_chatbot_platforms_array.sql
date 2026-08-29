-- Allow selecting multiple chatbot platforms for notification delivery

ALTER TABLE notification_delivery_settings
  ADD COLUMN IF NOT EXISTS client_chatbot_platforms messenger_platform[] NOT NULL DEFAULT '{}';

UPDATE notification_delivery_settings
SET client_chatbot_platforms = ARRAY[client_chatbot_platform]
WHERE client_chatbot_platform IS NOT NULL
  AND cardinality(client_chatbot_platforms) = 0;

ALTER TABLE notification_delivery_settings
  DROP COLUMN IF EXISTS client_chatbot_platform;

ALTER TABLE user_notification_preferences
  ADD COLUMN IF NOT EXISTS chatbot_platforms messenger_platform[] NOT NULL DEFAULT '{}';

UPDATE user_notification_preferences
SET chatbot_platforms = ARRAY[chatbot_platform]
WHERE chatbot_platform IS NOT NULL
  AND cardinality(chatbot_platforms) = 0;

ALTER TABLE user_notification_preferences
  DROP COLUMN IF EXISTS chatbot_platform;
