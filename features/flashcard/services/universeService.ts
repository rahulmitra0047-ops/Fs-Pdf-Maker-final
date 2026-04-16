import { WordCluster } from '../../../types';
import { dbFirestore } from '../../../core/firebase';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

const COLLECTION_NAME = 'saved_word_universes';

export const universeService = {
  getAllSaved: async (): Promise<WordCluster[]> => {
    try {
      const q = query(collection(dbFirestore, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as WordCluster);
    } catch (e) {
      console.error("Failed to load saved universes from Firestore", e);
      return [];
    }
  },

  getById: async (id: string): Promise<WordCluster | null> => {
    try {
      const docRef = doc(dbFirestore, COLLECTION_NAME, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as WordCluster;
      }
      return null;
    } catch (e) {
      console.error("Failed to load universe by id from Firestore", e);
      return null;
    }
  },

  saveUniverse: async (cluster: WordCluster): Promise<void> => {
    try {
      const docRef = doc(dbFirestore, COLLECTION_NAME, cluster.id);
      await setDoc(docRef, cluster);
    } catch (e) {
      console.error("Failed to save universe to Firestore", e);
      throw new Error("Failed to save universe");
    }
  },

  deleteUniverse: async (id: string): Promise<void> => {
    try {
      const docRef = doc(dbFirestore, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error("Failed to delete universe from Firestore", e);
      throw new Error("Failed to delete universe");
    }
  }
};
