/**
 * Rubika chatbot — temporarily disabled for site demo.
 * Flip to `true` when resuming Rubika Bot API work.
 * Keep implementation under `server/messenger/rubika/` intact.
 */
export const RUBIKA_CHATBOT_ENABLED = false

export type DemoMessengerPlatform = 'telegram' | 'bale' | 'rubika'

/** Platforms exposed in UI / deep-links / notifications while demo gating is on. */
export const DEMO_MESSENGER_PLATFORMS: DemoMessengerPlatform[] =
  RUBIKA_CHATBOT_ENABLED
    ? ['telegram', 'bale', 'rubika']
    : ['telegram', 'bale']

export function isMessengerPlatformEnabled(
  platform: string
): platform is DemoMessengerPlatform {
  return (DEMO_MESSENGER_PLATFORMS as string[]).includes(platform)
}
