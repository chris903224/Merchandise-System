// src/utils/cache.ts

const CACHE_PREFIX = 'sjcm_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Get data from cache or fetch fresh kung expired
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const cacheKey = `${CACHE_PREFIX}${key}`;

  try {
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const entry: CacheEntry<T> = JSON.parse(cached);
      const age = Date.now() - entry.timestamp;

      if (age < entry.ttl) {
        console.log(`[Cache] HIT: ${key} (${Math.round(age / 1000)}s old)`);
        return entry.data;
      }

      console.log(`[Cache] EXPIRED: ${key} (${Math.round(age / 1000)}s old)`);
    }

    console.log(`[Cache] MISS: ${key} → fetching`);
    const freshData = await fetcher();

    const entry: CacheEntry<T> = {
      data: freshData,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(cacheKey, JSON.stringify(entry));

    return freshData;
  } catch (error) {
    console.error(`[Cache] Error for ${key}:`, error);
    return await fetcher();
  }
}

/**
 * Manual set cache
 */
export function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl,
  };
  localStorage.setItem(cacheKey, JSON.stringify(entry));
}

/**
 * Invalidate specific cache
 */
export function invalidateCache(key: string): void {
  localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  console.log(`[Cache] Invalidated: ${key}`);
}

/**
 * Invalidate all user-specific caches
 */
export function invalidateUserCache(userId: string): void {
  const keys = Object.keys(localStorage).filter(
    (k) => k.startsWith(CACHE_PREFIX) && k.includes(userId)
  );
  keys.forEach((k) => localStorage.removeItem(k));
  console.log(`[Cache] Invalidated ${keys.length} keys for user ${userId}`);
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  const keys = Object.keys(localStorage).filter((k) =>
    k.startsWith(CACHE_PREFIX)
  );
  keys.forEach((k) => localStorage.removeItem(k));
  console.log(`[Cache] Cleared ${keys.length} cache entries`);
}

/**
 * Get cache stats (debugging)
 */
export function getCacheStats(): Record<string, { age: number; size: number }> {
  const stats: Record<string, { age: number; size: number }> = {};
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith(CACHE_PREFIX)) {
      try {
        const entry = JSON.parse(localStorage.getItem(key) ?? '{}');
        stats[key.replace(CACHE_PREFIX, '')] = {
          age: Date.now() - (entry.timestamp ?? 0),
          size: (localStorage.getItem(key) ?? '').length,
        };
      } catch {
        // Skip invalid
      }
    }
  });
  return stats;
}