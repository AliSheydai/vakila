const WINDOW_MS = 10 * 60_000
const MAX_REQUESTS = 30

const buckets = new Map<string, number[]>()

export function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const timestamps = buckets.get(userId) ?? []
  const recent = timestamps.filter((t) => now - t < WINDOW_MS)

  if (recent.length >= MAX_REQUESTS) {
    buckets.set(userId, recent)
    return false
  }

  recent.push(now)
  buckets.set(userId, recent)
  return true
}
