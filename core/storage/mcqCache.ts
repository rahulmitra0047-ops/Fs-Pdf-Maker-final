
import Dexie, { Table } from 'dexie';

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
}

class MCQCacheDB extends Dexie {
  cache!: Table<CacheEntry, string>;

  constructor() {
    super('MCQCacheDB');
    (this as any).version(1).stores({
      cache: 'key, timestamp'
    });
  }
}

export const cacheDB = new MCQCacheDB();

export const CACHE_TTL_MINUTES = 15;
const MAX_CACHE_AGE_DAYS = 7;

export const getFromCache = async <T>(key: string): Promise<T[] | null> => {
  try {
    const entry = await cacheDB.cache.get(key);
    if (!entry) return null;
    return entry.data as T[];
  } catch (e) {
    console.warn('Cache read error', e);
    return null;
  }
};

export const saveToCache = async (key: string, data: any) => {
  try {
    await cacheDB.cache.put({
      key,
      data,
      timestamp: Date.now()
    });
  } catch (e) {
    console.warn('Cache write error', e);
  }
};

export const pruneCache = async () => {
  try {
    const cutoff = Date.now() - (MAX_CACHE_AGE_DAYS * 24 * 60 * 60 * 1000);
    await cacheDB.cache.where('timestamp').below(cutoff).delete();
  } catch (e) {
    console.warn('Cache prune error', e);
  }
};

// Auto-prune on module load (low priority)
setTimeout(pruneCache, 10000);
