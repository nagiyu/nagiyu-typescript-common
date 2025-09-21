interface CacheType {
  value: any;
  timestamp: number;
}

export default class CacheUtil {
  private static cache: Record<string, CacheType> = {};

  private static readonly CACHE_TTL = 10 * 60 * 1000;

  public static get<T>(key: string): T | null {
    const cacheData = this.cache[key];

    if (cacheData && (Date.now() - cacheData.timestamp < this.CACHE_TTL)) {
      return cacheData.value as T;
    }

    return null;
  }

  public static set(key: string, value: any): void {
    this.cache[key] = { value, timestamp: Date.now() };
  }

  public static clear(key: string): void {
    delete this.cache[key];
  }
}
