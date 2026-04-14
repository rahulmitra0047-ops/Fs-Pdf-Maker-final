import { WordCluster } from '../../../types';
import localforage from 'localforage';

const STORAGE_KEY = 'saved_word_universes';

export const universeService = {
  getAllSaved: async (): Promise<WordCluster[]> => {
    try {
      const data = await localforage.getItem<WordCluster[]>(STORAGE_KEY);
      return data || [];
    } catch (e) {
      console.error("Failed to load saved universes", e);
      return [];
    }
  },

  saveUniverse: async (cluster: WordCluster): Promise<void> => {
    try {
      const all = await universeService.getAllSaved();
      const existingIndex = all.findIndex(c => c.id === cluster.id);
      if (existingIndex >= 0) {
        all[existingIndex] = cluster;
      } else {
        all.push(cluster);
      }
      await localforage.setItem(STORAGE_KEY, all);
    } catch (e) {
      console.error("Failed to save universe", e);
      throw new Error("Failed to save universe");
    }
  },

  deleteUniverse: async (id: string): Promise<void> => {
    try {
      const all = await universeService.getAllSaved();
      const filtered = all.filter(c => c.id !== id);
      await localforage.setItem(STORAGE_KEY, filtered);
    } catch (e) {
      console.error("Failed to delete universe", e);
      throw new Error("Failed to delete universe");
    }
  }
};
