
import { db } from './db';
import { APP_CONFIG } from '../config/appConfig';

export interface BackupData {
  version: string;
  timestamp: number;
  data: Record<string, any[]>;
}

export const backupService = {
  /**
   * Export all data from IndexedDB to a JSON object
   */
  async exportAllData(): Promise<BackupData> {
    const data: Record<string, any[]> = {};
    const dexieDb = db as any;
    
    await dexieDb.transaction('r', dexieDb.tables, async () => {
      for (const table of dexieDb.tables) {
        data[table.name] = await table.toArray();
      }
    });

    return {
      version: APP_CONFIG.version,
      timestamp: Date.now(),
      data
    };
  },

  /**
   * Import data into IndexedDB
   * @param backup The backup data object
   * @param mode 'merge' to add/update, 'replace' to clear and add
   */
  async importData(backup: BackupData, mode: 'merge' | 'replace' = 'merge'): Promise<void> {
    if (!backup || typeof backup !== 'object') {
        throw new Error("Invalid backup file: Not a JSON object");
    }
    if (!backup.data || typeof backup.data !== 'object') {
        throw new Error("Invalid backup format: Missing data section");
    }

    const dexieDb = db as any;
    const allowedTables = dexieDb.tables.map((t: any) => t.name);

    await dexieDb.transaction('rw', dexieDb.tables, async () => {
      if (mode === 'replace') {
        // Clear all tables first
        for (const table of dexieDb.tables) {
          await table.clear();
        }
      }

      // Import data
      for (const tableName of Object.keys(backup.data)) {
        if (!allowedTables.includes(tableName)) {
            console.warn(`Skipping unknown table: ${tableName}`);
            continue;
        }

        const table = dexieDb.table(tableName);
        if (table) {
          const rows = backup.data[tableName];
          if (!Array.isArray(rows)) {
              console.warn(`Skipping invalid data for table ${tableName}: Not an array`);
              continue;
          }
          
          if (rows.length > 0) {
              if (mode === 'replace') {
                 await table.bulkAdd(rows);
              } else {
                 await table.bulkPut(rows);
              }
          }
        }
      }
    });
  },

  /**
   * Estimate usage in bytes (approximation)
   */
  async estimateUsage(): Promise<{ usage: number; quota: number }> {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0
        };
      } catch (e) {
        console.warn("Storage estimate failed", e);
      }
    }
    return { usage: 0, quota: 0 };
  }
};
