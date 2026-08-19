interface RateLimitEntry {
  count: number
  windowStart: number
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>()

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Returns true if the key is within the limit, false if exceeded. */
  check(key: string): boolean {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || now - entry.windowStart >= this.windowMs) {
      this.store.set(key, { count: 1, windowStart: now })
      return true
    }

    if (entry.count >= this.limit) return false

    entry.count++
    return true
  }

  /** Seconds remaining until the window resets for this key. */
  retryAfter(key: string): number {
    const entry = this.store.get(key)
    if (!entry) return 0
    const remaining = this.windowMs - (Date.now() - entry.windowStart)
    return Math.ceil(remaining / 1000)
  }
}

// 100 requests per user per minute
export const apiLimiter = new RateLimiter(100, 60 * 1000)
