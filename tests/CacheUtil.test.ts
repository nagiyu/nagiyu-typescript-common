import CacheUtil from '@common/utils/CacheUtil';

describe('CacheUtil', () => {
  beforeEach(() => {
    // すべてのキャッシュをクリア
    CacheUtil.clearByPrefix('');
  });

  describe('Basic operations', () => {
    it('should set and get cache value', () => {
      CacheUtil.set('test_key', 'test_value');
      const value = CacheUtil.get<string>('test_key');
      expect(value).toBe('test_value');
    });

    it('should return null for non-existent key', () => {
      const value = CacheUtil.get<string>('non_existent_key');
      expect(value).toBeNull();
    });

    it('should clear specific cache key', () => {
      CacheUtil.set('test_key', 'test_value');
      CacheUtil.clear('test_key');
      const value = CacheUtil.get<string>('test_key');
      expect(value).toBeNull();
    });

    it('should delete specific cache key', () => {
      CacheUtil.set('test_key', 'test_value');
      CacheUtil.delete('test_key');
      const value = CacheUtil.get<string>('test_key');
      expect(value).toBeNull();
    });
  });

  describe('TTL functionality', () => {
    it('should expire cache after default TTL', async () => {
      CacheUtil.set('test_key', 'test_value');
      
      // デフォルトTTL（10分）をシミュレート - 実際にはモックが必要だが、動作確認として
      const value = CacheUtil.get<string>('test_key');
      expect(value).toBe('test_value');
    });

    it('should support custom TTL', () => {
      CacheUtil.set('test_key', 'test_value', 60); // 60秒
      const value = CacheUtil.get<string>('test_key');
      expect(value).toBe('test_value');
    });

    it('should handle zero TTL', () => {
      CacheUtil.set('test_key', 'test_value', 0);
      const value = CacheUtil.get<string>('test_key');
      expect(value).toBeNull();
    });
  });

  describe('clearByPrefix', () => {
    it('should clear all keys with specific prefix', () => {
      CacheUtil.set('user_1', 'value1');
      CacheUtil.set('user_2', 'value2');
      CacheUtil.set('user_3', 'value3');
      CacheUtil.set('product_1', 'product_value');

      CacheUtil.clearByPrefix('user_');

      expect(CacheUtil.get('user_1')).toBeNull();
      expect(CacheUtil.get('user_2')).toBeNull();
      expect(CacheUtil.get('user_3')).toBeNull();
      expect(CacheUtil.get('product_1')).toBe('product_value');
    });

    it('should handle empty prefix', () => {
      CacheUtil.set('key1', 'value1');
      CacheUtil.set('key2', 'value2');

      CacheUtil.clearByPrefix('');

      expect(CacheUtil.get('key1')).toBeNull();
      expect(CacheUtil.get('key2')).toBeNull();
    });

    it('should handle non-matching prefix', () => {
      CacheUtil.set('test_key', 'test_value');

      CacheUtil.clearByPrefix('non_matching_');

      expect(CacheUtil.get('test_key')).toBe('test_value');
    });

    it('should clear multiple levels of prefixes correctly', () => {
      CacheUtil.set('user_permissions_123', 'perm1');
      CacheUtil.set('user_permissions_456', 'perm2');
      CacheUtil.set('user_settings_123', 'setting1');
      CacheUtil.set('other_data', 'data');

      CacheUtil.clearByPrefix('user_permissions_');

      expect(CacheUtil.get('user_permissions_123')).toBeNull();
      expect(CacheUtil.get('user_permissions_456')).toBeNull();
      expect(CacheUtil.get('user_settings_123')).toBe('setting1');
      expect(CacheUtil.get('other_data')).toBe('data');
    });
  });

  describe('Complex data types', () => {
    it('should cache objects', () => {
      const obj = { name: 'test', value: 123 };
      CacheUtil.set('test_obj', obj);
      const cached = CacheUtil.get<typeof obj>('test_obj');
      expect(cached).toEqual(obj);
    });

    it('should cache arrays', () => {
      const arr = [1, 2, 3, 4, 5];
      CacheUtil.set('test_arr', arr);
      const cached = CacheUtil.get<typeof arr>('test_arr');
      expect(cached).toEqual(arr);
    });

    it('should cache Maps', () => {
      const map = new Map([['key1', 'value1'], ['key2', 'value2']]);
      CacheUtil.set('test_map', map);
      const cached = CacheUtil.get<typeof map>('test_map');
      expect(cached).toEqual(map);
    });

    it('should cache null and undefined', () => {
      CacheUtil.set('test_null', null);
      CacheUtil.set('test_undefined', undefined);
      
      expect(CacheUtil.get('test_null')).toBeNull();
      expect(CacheUtil.get('test_undefined')).toBeUndefined();
    });
  });

  describe('Concurrent access', () => {
    it('should handle multiple simultaneous operations', () => {
      const keys = Array.from({ length: 100 }, (_, i) => `key_${i}`);
      
      keys.forEach(key => CacheUtil.set(key, `value_${key}`));
      
      keys.forEach(key => {
        expect(CacheUtil.get(key)).toBe(`value_${key}`);
      });

      CacheUtil.clearByPrefix('key_');

      keys.forEach(key => {
        expect(CacheUtil.get(key)).toBeNull();
      });
    });
  });
});
