type Bucket = { timestamps: number[] }

const buckets = new Map<string, Bucket>()

/** Simple in-memory sliding-window rate limit. Returns true if allowed. */
export function allowRate(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now()
  const bucket = buckets.get(key) ?? { timestamps: [] }
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs)
  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket)
    return false
  }
  bucket.timestamps.push(now)
  buckets.set(key, bucket)
  return true
}
