export type CallMediaPrefs = {
  mic: boolean
  cam: boolean
}

const PREFIX = 'call-prefs-'

export function saveCallMediaPrefs(eventId: string, prefs: CallMediaPrefs): void {
  sessionStorage.setItem(`${PREFIX}${eventId}`, JSON.stringify(prefs))
}

export function readCallMediaPrefs(eventId: string): CallMediaPrefs | null {
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${eventId}`)
    if (!raw) return null
    return JSON.parse(raw) as CallMediaPrefs
  } catch {
    return null
  }
}

export function clearCallMediaPrefs(eventId: string): void {
  sessionStorage.removeItem(`${PREFIX}${eventId}`)
}

export function consumeCallMediaPrefs(eventId: string): CallMediaPrefs | null {
  const prefs = readCallMediaPrefs(eventId)
  if (prefs) clearCallMediaPrefs(eventId)
  return prefs
}

export const DEFAULT_CALL_MEDIA_PREFS: CallMediaPrefs = { mic: true, cam: true }
