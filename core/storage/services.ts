
import { db } from './db';
import { Table } from 'dexie';
import { Document, Topic, Subtopic, MCQSet, Attempt, AppSettings, ExamTemplate, MCQStats, AuditLogEntry, MCQ, Lesson, GrammarRule, VocabWord, TranslationItem, PracticeTopic } from '../../types';
import { dbFirestore } from '../firebase';
import { 
  collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, 
  query, where, writeBatch, orderBy, DocumentReference, limit 
} from 'firebase/firestore';
import { getFromCache, saveToCache, cacheDB } from './mcqCache';

// --- Local Dexie Service (unchanged) ---
class BaseService<T extends { id: string | number }> {
  constructor(protected table: Table<T, any>) {}

  async getAll(): Promise<T[]> {
    return await this.table.toArray();
  }

  async getById(id: string | number): Promise<T | undefined> {
    return await this.table.get(id);
  }

  async create(data: T): Promise<string | number> {
    await this.table.add(data);
    return data.id;
  }

  async update(id: string | number, data: Partial<T>): Promise<number> {
    return await this.table.update(id, data);
  }

  async delete(id: string | number): Promise<void> {
    await this.table.delete(id);
  }
  
  async where(index: string, value: any): Promise<T[]> {
      return await this.table.where(index).equals(value).toArray();
  }
}

const isSuppressedError = (e: any): boolean => {
    const msg = e instanceof Error ? e.message.toLowerCase() : String(e).toLowerCase();
    const code = (e as any)?.code;
    return (
        msg.includes('offline') || 
        msg.includes('could not reach') ||
        msg.includes('backend') ||
        code === 'unavailable' || 
        code === 'permission-denied' || 
        msg.includes('permission') ||
        msg.includes('insufficient')
    );
};

// --- Firestore Service for Live MCQ (Updated for Soft Delete) ---
class FirestoreService<T extends { id: string }> {
  constructor(protected collectionName: string) {}

  async getAll(): Promise<T[]> {
    try {
      const q = query(collection(dbFirestore, this.collectionName));
      const snap = await getDocs(q);
      // Filter out soft-deleted items
      return snap.docs.map(d => d.data() as T).filter((i: any) => !i.isDeleted);
    } catch (e: any) {
      if (isSuppressedError(e)) {
        console.warn(`[Firestore] getAll suppressed: ${e.code || e.message}`);
        return [];
      }
      console.error(`Firestore getAll error for ${this.collectionName}:`, e);
      return [];
    }
  }

  async getById(id: string): Promise<T | undefined> {
    if (!id) return undefined;
    try {
      const d = await getDoc(doc(dbFirestore, this.collectionName, id));
      if (!d.exists()) return undefined;
      const data = d.data() as T;
      if ((data as any).isDeleted) return undefined;
      return data;
    } catch (e: any) {
      if (isSuppressedError(e)) return undefined;
      console.error(`Firestore getById error for ${this.collectionName}:`, e);
      return undefined;
    }
  }

  async create(data: T): Promise<string> {
    try {
      await setDoc(doc(dbFirestore, this.collectionName, data.id), data);
      return data.id;
    } catch (e: any) {
      if (isSuppressedError(e)) throw new Error("Operation blocked: Insufficient permissions");
      console.error(`Firestore create error for ${this.collectionName}:`, e);
      throw e; 
    }
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    if (!id) return;
    try {
      await updateDoc(doc(dbFirestore, this.collectionName, id), data);
    } catch (e: any) {
      if (isSuppressedError(e)) throw new Error("Operation blocked: Insufficient permissions");
      console.error(`Firestore update error for ${this.collectionName}:`, e);
      throw e; 
    }
  }

  async delete(id: string): Promise<void> {
    if (!id) return;
    try {
      // Use Soft Delete by default
      await updateDoc(doc(dbFirestore, this.collectionName, id), { 
          isDeleted: true, 
          deletedAt: Date.now() 
      });
    } catch (e: any) {
      if (isSuppressedError(e)) throw new Error("Operation blocked: Insufficient permissions");
      console.error(`Firestore delete error for ${this.collectionName}:`, e);
      throw e; 
    }
  }

  async where(field: string, value: any): Promise<T[]> {
    try {
      const q = query(collection(dbFirestore, this.collectionName), where(field, '==', value));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as T).filter((i: any) => !i.isDeleted);
    } catch (e: any) {
      if (isSuppressedError(e)) return [];
      console.error(`Firestore where error for ${this.collectionName}:`, e);
      return [];
    }
  }
}

// --- Specialized MCQ Set Service ---
class MCQSetFirestoreService extends FirestoreService<MCQSet> {
  constructor() { super('live_sets'); }

  // Optimized to fetch all MCQs in one batch and map them, reducing N+1 queries
  async getAll(): Promise<MCQSet[]> {
    try {
      // 1. Fetch Sets
      const setsPromise = super.getAll();
      
      // 2. Fetch All MCQs (Filtered by isDeleted if possible, or client side)
      // Note: fetching all MCQs might be heavy if dataset is huge (>5k), 
      // but is significantly faster than 50+ sequential requests for lists.
      const mcqsQ = query(collection(dbFirestore, 'live_mcqs'));
      const mcqsPromise = getDocs(mcqsQ);

      const [sets, mcqsSnap] = await Promise.all([setsPromise, mcqsPromise]);

      if (sets.length === 0) return [];

      // 3. Map MCQs to Sets
      const mcqsBySetId: Record<string, MCQ[]> = {};
      mcqsSnap.docs.forEach(doc => {
        const data = doc.data() as any;
        if (data.isDeleted) return;
        
        const setId = data.setId;
        if (setId) {
          if (!mcqsBySetId[setId]) mcqsBySetId[setId] = [];
          mcqsBySetId[setId].push(data as MCQ);
        }
      });

      // 4. Attach MCQs
      sets.forEach(s => {
        s.mcqs = mcqsBySetId[s.id] || [];
        // Sort by creation time to ensure consistent order
        s.mcqs.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));
      });

      return sets;
    } catch (e) {
      console.error("Error in getAll sets", e);
      return [];
    }
  }

  public async fetchMCQs(setId: string): Promise<MCQ[]> {
    try {
      const q = query(collection(dbFirestore, 'live_mcqs'), where('setId', '==', setId));
      const snap = await getDocs(q);
      return snap.docs
        .map(d => d.data() as MCQ)
        .filter((m: any) => !m.isDeleted)
        .sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));
    } catch (e) {
      return [];
    }
  }

  async getById(id: string): Promise<MCQSet | undefined> {
    const set = await super.getById(id);
    if (!set) return undefined;
    set.mcqs = await this.fetchMCQs(id);
    return set;
  }

  async where(field: string, value: any): Promise<MCQSet[]> {
    const sets = await super.where(field, value);
    if (sets.length === 0) return [];
    
    // For 'where' queries, usually returns a small subset, so fetching MCQs for each is acceptable,
    // but parallelizing it is better than sequential await.
    await Promise.all(sets.map(async s => {
      s.mcqs = await this.fetchMCQs(s.id);
    }));
    return sets;
  }

  async create(data: MCQSet): Promise<string> {
    const { mcqs, ...setData } = data;
    await super.create(setData as MCQSet);
    if (mcqs && mcqs.length > 0) {
      const batch = writeBatch(dbFirestore);
      mcqs.forEach(m => {
        const mRef = doc(dbFirestore, 'live_mcqs', m.id);
        batch.set(mRef, { ...m, setId: data.id, topicId: data.subtopicId });
      });
      await batch.commit();
    }
    return data.id;
  }

  async update(id: string, data: Partial<MCQSet>): Promise<void> {
    const { mcqs, ...setData } = data;
    if (Object.keys(setData).length > 0) await super.update(id, setData);
    if (mcqs) {
      const existing = await this.fetchMCQs(id);
      const newIds = new Set(mcqs.map(m => m.id));
      const batch = writeBatch(dbFirestore);
      mcqs.forEach(m => {
        const ref = doc(dbFirestore, 'live_mcqs', m.id);
        batch.set(ref, { ...m, setId: id }, { merge: true });
      });
      existing.forEach(e => {
        if (!newIds.has(e.id)) {
          const ref = doc(dbFirestore, 'live_mcqs', e.id);
          // Soft delete removed MCQs
          batch.update(ref, { isDeleted: true, deletedAt: Date.now() });
        }
      });
      await batch.commit();
    }
  }

  async delete(id: string): Promise<void> {
    if (!id) return;
    await super.delete(id); // Soft delete set
    try {
        const mcqs = await this.fetchMCQs(id);
        if (mcqs.length > 0) {
          const batch = writeBatch(dbFirestore);
          mcqs.forEach(m => batch.update(doc(dbFirestore, 'live_mcqs', m.id), { isDeleted: true, deletedAt: Date.now() }));
          await batch.commit();
        }
    } catch (e) { console.warn(e); }
  }
}

// --- Cached Services Wrapper ---

type SubscribeCallback<T> = (data: T[], source: 'cache' | 'network') => void;

class CachedFirestoreService<T extends { id: string }> extends FirestoreService<T> {
  protected cacheKey: string;

  constructor(collectionName: string, cacheKey: string) {
    super(collectionName);
    this.cacheKey = cacheKey;
  }

  subscribeGetAll(callback: SubscribeCallback<T>): () => void {
    let isSubscribed = true;
    const run = async () => {
      // 1. Instant Cache
      const cached = await getFromCache<T>(this.cacheKey);
      if (cached && isSubscribed) {
          // Filter soft deletes from cache
          callback(cached.filter((i: any) => !i.isDeleted), 'cache');
      }

      // 2. Network Fetch
      try {
        const fresh = await super.getAll(); // super.getAll() handles filtering
        if (isSubscribed) {
          await saveToCache(this.cacheKey, fresh);
          callback(fresh, 'network');
        }
      } catch (e) {
        console.warn(`Background sync failed for ${this.cacheKey}`, e);
      }
    };
    run();
    return () => { isSubscribed = false; };
  }

  subscribeGetById(id: string, callback: (data: T | null, source: 'cache' | 'network') => void): () => void {
      let isSubscribed = true;
      const run = async () => {
          const cachedList = await getFromCache<T>(this.cacheKey);
          const cachedItem = cachedList?.find((i: any) => i.id === id);
          
          if (cachedItem && isSubscribed) {
              if ((cachedItem as any).isDeleted) {
                  callback(null, 'cache');
              } else {
                  callback(cachedItem, 'cache');
              }
          }

          try {
              const fresh = await super.getById(id);
              if (isSubscribed && fresh) {
                  const currentList = (await getFromCache<T>(this.cacheKey)) || [];
                  const newList = currentList.some((i: any) => i.id === fresh.id) 
                      ? currentList.map((i: any) => i.id === fresh.id ? fresh : i)
                      : [...currentList, fresh];
                  
                  await saveToCache(this.cacheKey, newList.filter((i: any) => !i.isDeleted));
                  callback(fresh, 'network');
              } else if (isSubscribed && !fresh && cachedItem) {
                  callback(null, 'network');
              }
          } catch(e) {
              console.warn(`GetById sync failed for ${id}`, e);
          }
      };
      run();
      return () => { isSubscribed = false; };
  }

  async getAll(): Promise<T[]> {
    const cached = await getFromCache<T>(this.cacheKey);
    if (cached) {
      super.getAll().then(fresh => saveToCache(this.cacheKey, fresh)).catch(e => console.warn(e));
      return cached.filter((i: any) => !i.isDeleted);
    }
    const fresh = await super.getAll();
    await saveToCache(this.cacheKey, fresh);
    return fresh;
  }

  async create(data: T): Promise<string> {
    const current = (await getFromCache<T>(this.cacheKey)) || [];
    await saveToCache(this.cacheKey, [...current, data]);
    try { return await super.create(data); } 
    catch (e) { await saveToCache(this.cacheKey, current); throw e; }
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    const current = (await getFromCache<T>(this.cacheKey)) || [];
    const optimistic = current.map((item: any) => item.id === id ? { ...item, ...data } : item);
    const filtered = (data as any).isDeleted ? optimistic.filter((i: any) => i.id !== id) : optimistic;
    
    await saveToCache(this.cacheKey, filtered);
    try { await super.update(id, data); } 
    catch (e) { await saveToCache(this.cacheKey, current); throw e; }
  }

  async delete(id: string): Promise<void> {
    const current = (await getFromCache<T>(this.cacheKey)) || [];
    const optimistic = current.filter((item: any) => item.id !== id);
    await saveToCache(this.cacheKey, optimistic);
    try { await super.delete(id); } 
    catch (e) { await saveToCache(this.cacheKey, current); throw e; }
  }
}

// --- Smart Delta Sync MCQ Set Service ---
class CachedMCQSetService extends MCQSetFirestoreService {
  private cacheKey = 'live_sets_all';

  subscribeGetAll(callback: SubscribeCallback<MCQSet>): () => void {
    let isSubscribed = true;
    const run = async () => {
      // 1. Load Cache
      const cachedSets = await getFromCache<MCQSet>(this.cacheKey) || [];
      if (isSubscribed && cachedSets.length > 0) {
          callback(cachedSets.filter(s => !(s as any).isDeleted), 'cache');
      }

      try {
        // 2. Fetch Network Metadata ONLY
        const q = query(collection(dbFirestore, this.collectionName));
        const snap = await getDocs(q);
        const networkSets = snap.docs
            .map(d => d.data() as MCQSet)
            .filter((s: any) => !s.isDeleted);

        // 3. Delta Sync Logic
        // Identify which sets are stale or missing MCQs
        const idsToFetch = new Set<string>();
        const mergedSets: MCQSet[] = [];

        for (const netSet of networkSets) {
            const cachedSet = cachedSets.find(s => s.id === netSet.id);
            const isStale = !cachedSet || (netSet.updatedAt > (cachedSet.updatedAt || 0));
            const hasMCQs = cachedSet && cachedSet.mcqs && cachedSet.mcqs.length > 0;

            if (isStale || !hasMCQs) {
                idsToFetch.add(netSet.id);
                mergedSets.push(netSet); // Will be populated later
            } else {
                netSet.mcqs = cachedSet!.mcqs;
                mergedSets.push(netSet);
            }
        }

        // 4. Batch Fetch needed MCQs
        if (idsToFetch.size > 0) {
            // Optimization: If many sets need update (e.g. initial load), fetch ALL MCQs
            // If few sets (delta), fetch individually or using 'in' query.
            // Using threshold of 5 for switch.
            
            let fetchedMCQs: MCQ[] = [];
            
            if (idsToFetch.size > 5) {
                // Fetch all active MCQs
                const allMcqsQ = query(collection(dbFirestore, 'live_mcqs'));
                const allSnap = await getDocs(allMcqsQ);
                fetchedMCQs = allSnap.docs.map(d => d.data() as MCQ).filter((m: any) => !m.isDeleted);
            } else {
                // Fetch individually (Promise.all)
                const fetchPromises = Array.from(idsToFetch).map(id => this.fetchMCQs(id));
                const results = await Promise.all(fetchPromises);
                fetchedMCQs = results.flat();
            }

            // Map back to sets
            const mcqsBySetId: Record<string, MCQ[]> = {};
            fetchedMCQs.forEach(m => {
                const sid = (m as any).setId;
                if(sid) {
                    if(!mcqsBySetId[sid]) mcqsBySetId[sid] = [];
                    mcqsBySetId[sid].push(m);
                }
            });

            mergedSets.forEach(s => {
                if (idsToFetch.has(s.id)) {
                    s.mcqs = mcqsBySetId[s.id] || [];
                    s.mcqs.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));
                }
            });
        }

        if (isSubscribed) {
          await saveToCache(this.cacheKey, mergedSets);
          callback(mergedSets, 'network');
        }
      } catch (e) {
        console.warn(`Delta sync failed for sets`, e);
      }
    };
    run();
    return () => { isSubscribed = false; };
  }

  subscribeGetById(id: string, callback: (data: MCQSet | null, source: 'cache' | 'network') => void): () => void {
      let isSubscribed = true;
      const run = async () => {
          const cachedList = await getFromCache<MCQSet>(this.cacheKey);
          const cachedItem = cachedList?.find((i: any) => i.id === id);
          if (cachedItem && isSubscribed) {
              if ((cachedItem as any).isDeleted) callback(null, 'cache');
              else callback(cachedItem, 'cache');
          }

          try {
              const fresh = await super.getById(id);
              if (isSubscribed && fresh) {
                  const currentList = (await getFromCache<MCQSet>(this.cacheKey)) || [];
                  const newList = currentList.some((i: any) => i.id === fresh.id) 
                      ? currentList.map((i: any) => i.id === fresh.id ? fresh : i)
                      : [...currentList, fresh];
                  await saveToCache(this.cacheKey, newList.filter((i: any) => !i.isDeleted));
                  callback(fresh, 'network');
              } else if (isSubscribed && !fresh && cachedItem) {
                  callback(null, 'network');
              }
          } catch(e) {
              console.warn(`GetById sync failed for set ${id}`, e);
          }
      };
      run();
      return () => { isSubscribed = false; };
  }

  // Override operations to handle optimistic cache
  async getAll(): Promise<MCQSet[]> {
    const cached = await getFromCache<MCQSet>(this.cacheKey);
    if (cached) return cached.filter((i: any) => !i.isDeleted);
    // Fallback to optimized N+1 safe super.getAll()
    const fresh = await super.getAll();
    await saveToCache(this.cacheKey, fresh);
    return fresh;
  }

  async getById(id: string): Promise<MCQSet | undefined> {
      const cachedList = await getFromCache<MCQSet>(this.cacheKey);
      const cachedItem = cachedList?.find((i: any) => i.id === id);
      if (cachedItem && !(cachedItem as any).isDeleted) {
          // Silent refresh
          super.getById(id).then(fresh => {
              if(fresh) this.updateCacheItem(fresh);
          }).catch(console.warn);
          return cachedItem;
      }
      return super.getById(id);
  }

  // Helper to update one item in list cache
  private async updateCacheItem(item: MCQSet) {
      const current = await getFromCache<MCQSet>(this.cacheKey) || [];
      const index = current.findIndex(i => i.id === item.id);
      if (index >= 0) current[index] = item;
      else current.push(item);
      await saveToCache(this.cacheKey, current.filter((i: any) => !i.isDeleted));
  }

  async where(field: string, value: any): Promise<MCQSet[]> {
    if (field === 'subtopicId') {
       const cached = await getFromCache<MCQSet>(this.cacheKey);
       if (cached) {
           return cached.filter((s: any) => s[field] === value && !s.isDeleted);
       }
    }
    return super.where(field, value);
  }

  async create(data: MCQSet): Promise<string> {
    const current = (await getFromCache<MCQSet>(this.cacheKey)) || [];
    await saveToCache(this.cacheKey, [...current, data]);
    try { return await super.create(data); } 
    catch (e) { await saveToCache(this.cacheKey, current); throw e; }
  }

  async update(id: string, data: Partial<MCQSet>): Promise<void> {
    const current = (await getFromCache<MCQSet>(this.cacheKey)) || [];
    const optimistic = current.map((item: any) => item.id === id ? { ...item, ...data } : item);
    // Soft delete handling
    const filtered = (data as any).isDeleted ? optimistic.filter((i: any) => i.id !== id) : optimistic;
    
    await saveToCache(this.cacheKey, filtered);
    try { await super.update(id, data); } 
    catch (e) { await saveToCache(this.cacheKey, current); throw e; }
  }

  async delete(id: string): Promise<void> {
    const current = (await getFromCache<MCQSet>(this.cacheKey)) || [];
    const optimistic = current.filter((item: any) => item.id !== id);
    await saveToCache(this.cacheKey, optimistic);
    try { await super.delete(id); } 
    catch (e) { await saveToCache(this.cacheKey, current); throw e; }
  }
}

// --- LEARN MODULE SERVICES (FIRESTORE MIGRATION) ---

const lessonFs = new CachedFirestoreService<Lesson>('learn_lessons', 'learn_lessons_cache');
const grammarFs = new CachedFirestoreService<GrammarRule>('learn_grammar', 'learn_grammar_cache');
const vocabFs = new CachedFirestoreService<VocabWord>('learn_vocab', 'learn_vocab_cache');
const transFs = new CachedFirestoreService<TranslationItem>('learn_translations', 'learn_trans_cache');
const topicFs = new CachedFirestoreService<PracticeTopic>('learn_topics', 'learn_topics_cache');

export const lessonService = {
  getLessons: async (): Promise<Lesson[]> => {
    const items = await lessonFs.getAll();
    return items.sort((a, b) => a.order - b.order);
  },
  getById: (id: string) => lessonFs.getById(id),
  addLesson: (data: Lesson) => lessonFs.create(data),
  updateLesson: (id: string, data: Partial<Lesson>) => lessonFs.update(id, data),
  deleteLesson: async (id: string) => {
    await lessonFs.delete(id);
    // Soft cascade - try to clean up children in background (best effort)
    Promise.all([
        grammarService.getRules(id).then(r => r.forEach(i => grammarFs.delete(i.id))),
        vocabService.getWords(id).then(r => r.forEach(i => vocabFs.delete(i.id))),
        translationService.getTranslations(id).then(r => r.forEach(i => transFs.delete(i.id))),
        practiceTopicService.getTopics(id).then(r => r.forEach(i => topicFs.delete(i.id))),
    ]).catch(console.warn);
  }
};

export const grammarService = {
  getRules: async (lessonId: string): Promise<GrammarRule[]> => {
    const all = await grammarFs.getAll();
    return all.filter(i => i.lessonId === lessonId).sort((a, b) => (a.order || 0) - (b.order || 0));
  },
  addRule: (lessonId: string, data: GrammarRule) => grammarFs.create(data),
  updateRule: (lessonId: string, id: string, data: Partial<GrammarRule>) => grammarFs.update(id, data),
  deleteRule: (lessonId: string, id: string) => grammarFs.delete(id),
  addBulkRules: async (lessonId: string, rules: GrammarRule[]) => {
     for(const r of rules) await grammarFs.create(r);
  }
};

export const vocabService = {
  getWords: async (lessonId: string): Promise<VocabWord[]> => {
    const all = await vocabFs.getAll();
    return all.filter(i => i.lessonId === lessonId).sort((a, b) => (a.order || 0) - (b.order || 0));
  },
  addWord: (lessonId: string, data: VocabWord) => vocabFs.create(data),
  updateWord: (lessonId: string, id: string, data: Partial<VocabWord>) => vocabFs.update(id, data),
  deleteWord: (lessonId: string, id: string) => vocabFs.delete(id),
  addBulkWords: async (lessonId: string, words: VocabWord[]) => {
     for(const w of words) await vocabFs.create(w);
  }
};

export const translationService = {
  getTranslations: async (lessonId: string): Promise<TranslationItem[]> => {
    const all = await transFs.getAll();
    return all.filter(i => i.lessonId === lessonId).sort((a, b) => (a.order || 0) - (b.order || 0));
  },
  addTranslation: (lessonId: string, data: TranslationItem) => transFs.create(data),
  updateTranslation: (lessonId: string, id: string, data: Partial<TranslationItem>) => transFs.update(id, data),
  deleteTranslation: (lessonId: string, id: string) => transFs.delete(id),
  addBulkTranslations: async (lessonId: string, items: TranslationItem[]) => {
     for(const i of items) await transFs.create(i);
  }
};

export const practiceTopicService = {
  getTopics: async (lessonId: string): Promise<PracticeTopic[]> => {
    const all = await topicFs.getAll();
    return all.filter(i => i.lessonId === lessonId).sort((a, b) => (a.order || 0) - (b.order || 0));
  },
  addTopic: (lessonId: string, data: PracticeTopic) => topicFs.create(data),
  updateTopic: (lessonId: string, id: string, data: Partial<PracticeTopic>) => topicFs.update(id, data),
  deleteTopic: (lessonId: string, id: string) => topicFs.delete(id),
  addBulkTopics: async (lessonId: string, items: PracticeTopic[]) => {
     for(const i of items) await topicFs.create(i);
  }
};

export { db };

export const documentService = new BaseService<Document>(db.documents);
export const attemptService = new BaseService<Attempt>(db.attempts);
// Settings migrated to Firestore for API Key sync
export const settingsService = new CachedFirestoreService<AppSettings>('settings', 'settings_cache');
export const examTemplateService = new BaseService<ExamTemplate>(db.examTemplates);
export const mcqStatsService = new BaseService<MCQStats>(db.mcqStats);
export const auditLogService = new BaseService<AuditLogEntry>(db.auditLogs);

export const topicService = new CachedFirestoreService<Topic>('live_topics', 'live_topics_all');
export const subtopicService = new CachedFirestoreService<Subtopic>('live_subtopics', 'live_subtopics_all');
export const mcqSetService = new CachedMCQSetService();

export const logAction = async (action: any, entity: any, entityId?: string, details?: string) => {
  try {
    await auditLogService.create({
      id: crypto.randomUUID(),
      action,
      entity,
      entityId,
      details,
      timestamp: Date.now()
    });
  } catch (e) {
    console.warn("Failed to log action", e);
  }
};
