
import { Redis } from 'ioredis'

// In-memory store for development, Redis for production
class RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map()
  private redis: Redis | null = null

  constructor() {
    // Initialize Redis if available
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL)
    }
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    if (this.redis) {
      const data = await this.redis.get(key)
      return data ? JSON.parse(data) : null
    }
    
    return this.store.get(key) || null
  }

  async set(key: string, value: { count: number; resetTime: number }, ttl: number): Promise<void> {
    if (this.redis) {
      await this.redis.setex(key, ttl, JSON.stringify(value))
    } else {
      this.store.set(key, value)
      // Clean up expired entries in memory store
      setTimeout(() => {
        const now = Date.now()
        if (value.resetTime <= now) {
          this.store.delete(key)
        }
      }, ttl * 1000)
    }
  }

  async increment(key: string, ttl: number): Promise<number> {
    if (this.redis) {
      const pipeline = this.redis.pipeline()
      pipeline.incr(key)
      pipeline.expire(key, ttl)
      const results = await pipeline.exec()
      return results?.[0]?.[1] as number || 1
    }
    
    const current = this.store.get(key)
    const now = Date.now()
    
    if (!current || current.resetTime <= now) {
      const newValue = { count: 1, resetTime: now + (ttl * 1000) }
      this.store.set(key, newValue)
      return 1
    }
    
    current.count++
    this.store.set(key, current)
    return current.count
  }
}

const store = new RateLimitStore()

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export async function rateLimit(
  identifier: string,
  limit: number = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  windowMs: number = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') // 15 minutes
): Promise<RateLimitResult> {
  const key = `rate_limit:${identifier}`
  const windowSeconds = Math.floor(windowMs / 1000)
  const now = Date.now()
  const resetTime = now + windowMs

  try {
    const current = await store.get(key)
    
    if (!current || current.resetTime <= now) {
      // First request or window expired
      await store.set(key, { count: 1, resetTime }, windowSeconds)
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: resetTime
      }
    }

    if (current.count >= limit) {
      // Rate limit exceeded
      return {
        success: false,
        limit,
        remaining: 0,
        reset: current.resetTime
      }
    }

    // Increment counter
    const newCount = await store.increment(key, windowSeconds)
    
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - newCount),
      reset: current.resetTime
    }
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Fail open - allow request if rate limiting fails
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: resetTime
    }
  }
}

// Rate limit for different endpoints
export const rateLimitConfigs = {
  api: { limit: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  auth: { limit: 5, windowMs: 15 * 60 * 1000 },  // 5 auth attempts per 15 minutes
  upload: { limit: 10, windowMs: 60 * 60 * 1000 }, // 10 uploads per hour
  chat: { limit: 50, windowMs: 15 * 60 * 1000 },  // 50 chat messages per 15 minutes
}

export async function rateLimitByType(identifier: string, type: keyof typeof rateLimitConfigs): Promise<RateLimitResult> {
  const config = rateLimitConfigs[type]
  return rateLimit(`${type}:${identifier}`, config.limit, config.windowMs)
}
