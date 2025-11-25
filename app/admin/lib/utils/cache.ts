interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  getWithExpired<T>(key: string): { data: T; expired: boolean } | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const expired = Date.now() - entry.timestamp > entry.ttl;
    
    return {
      data: entry.data as T,
      expired
    };
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

export const apiCache = new SimpleCache();

export const CACHE_KEYS = {
  COUNTRIES: 'countries_all',
  USER_DATA: 'user_data',
  CAPTIONS: 'captions_all'
} as const;
