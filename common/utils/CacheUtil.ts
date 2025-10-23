interface CacheType {
  value: any;
  timestamp: number;
  ttl?: number;
}

export default class CacheUtil {
  private static cache: Record<string, CacheType> = {};

  private static readonly CACHE_TTL = 10 * 60 * 1000;

  public static get<T>(key: string): T | null {
    const cacheData = this.cache[key];

    if (!cacheData) {
      return null;
    }

    const ttl = cacheData.ttl !== undefined ? cacheData.ttl * 1000 : this.CACHE_TTL;
    if (Date.now() - cacheData.timestamp < ttl) {
      return cacheData.value as T;
    }

    delete this.cache[key];
    return null;
  }

  public static set(key: string, value: any, ttl?: number): void {
    this.cache[key] = { 
      value, 
      timestamp: Date.now(),
      ...(ttl !== undefined && { ttl })
    };
  }

  public static clear(key: string): void {
    delete this.cache[key];
  }

  public static delete(key: string): void {
    delete this.cache[key];
  }

  public static clearByPrefix(prefix: string): void {
    Object.keys(this.cache).forEach(key => {
      if (key.startsWith(prefix)) {
        delete this.cache[key];
      }
    });
  }
}
