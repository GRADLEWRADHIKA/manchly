declare module 'ttl-cache' {
  interface TTLCacheOptions {
    ttl?: number;
    checkAgeOnGet?: boolean;
    max?: number;
  }

  class TTLCache<K, V> {
    constructor(options?: TTLCacheOptions);
    set(key: K, value: V): void;
    get(key: K): V | undefined;
    delete(key: K): boolean;
    clear(): void;
    keys(): IterableIterator<K>;
    has(key: K): boolean;
    size: number;
  }

  export = TTLCache;
}

