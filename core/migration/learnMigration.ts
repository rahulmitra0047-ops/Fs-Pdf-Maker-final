
import { db } from '../storage/db';
import { Lesson, GrammarRule, VocabWord, TranslationItem, PracticeTopic } from '../../types';

const STORAGE_KEY = 'mock_lessons_local';

interface LegacyLesson {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  grammar?: string; 
  vocabulary?: string;
  vocabList?: VocabWord[];
  translations?: TranslationItem[];
  practiceTopics?: PracticeTopic[];
  status: 'new' | 'in-progress' | 'completed';
}

export const migrateLearnData = async () => {
  try {
    // 1. Check if local storage has data
    const localData = localStorage.getItem(STORAGE_KEY);
    if (!localData) {
      console.log('No local Learn data to migrate.');
      return;
    }

    // 2. Check if Dexie is already populated (prevent duplicate migration)
    const count = await db.lessons.count();
    if (count > 0) {
      console.log('Local database already has Learn data. Skipping migration.');
      localStorage.removeItem(STORAGE_KEY); // Clean up
      return;
    }

    console.log('Migrating Learn data to Local DB...');
    const lessons: LegacyLesson[] = JSON.parse(localData);

    await (db as any).transaction('rw', db.lessons, db.grammarRules, db.vocabulary, db.translations, db.practiceTopics, async () => {
        for (const lesson of lessons) {
            const lessonData: Lesson = {
                id: lesson.id,
                title: lesson.title,
                subtitle: lesson.subtitle,
                order: lesson.number, // Use number as order
                status: lesson.status,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            await db.lessons.add(lessonData);

            // --- Grammar Rules ---
            let rules: GrammarRule[] = [];
            if (lesson.grammar) {
                try {
                const parsed = JSON.parse(lesson.grammar);
                if (Array.isArray(parsed)) rules = parsed;
                } catch (e) {
                if (lesson.grammar.trim()) {
                    // Convert legacy string to single rule
                    rules = [{
                    id: crypto.randomUUID(),
                    lessonId: lesson.id,
                    title: 'Overview',
                    explanation: lesson.grammar,
                    examples: [],
                    isFavorite: false,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    order: 0
                    }];
                }
                }
            }

            if (rules.length > 0) {
                const orderedRules = rules.map((r, i) => ({ ...r, order: i }));
                await db.grammarRules.bulkAdd(orderedRules);
            }

            // --- Vocabulary ---
            let words: VocabWord[] = [];
            if (lesson.vocabList && Array.isArray(lesson.vocabList)) {
                words = lesson.vocabList;
            } else if (lesson.vocabulary) {
                // Convert legacy vocabulary string
                const lines = lesson.vocabulary.split('\n').filter(l => l.trim());
                words = lines.map((line) => {
                let parts = line.split(' - ');
                if (parts.length < 2) parts = line.split('=');
                return {
                    id: crypto.randomUUID(),
                    lessonId: lesson.id,
                    word: parts[0]?.trim() || line,
                    meaning: parts[1]?.trim() || '',
                    type: 'Other',
                    examples: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                });
            }

            if (words.length > 0) {
                const orderedWords = words.map((w, i) => ({ ...w, order: i }));
                await db.vocabulary.bulkAdd(orderedWords);
            }

            // --- Translations ---
            if (lesson.translations && Array.isArray(lesson.translations)) {
                const ordered = lesson.translations.map((t, i) => ({ ...t, order: i }));
                await db.translations.bulkAdd(ordered);
            }

            // --- Practice Topics ---
            if (lesson.practiceTopics && Array.isArray(lesson.practiceTopics)) {
                const ordered = lesson.practiceTopics.map((t, i) => ({ ...t, order: i }));
                await db.practiceTopics.bulkAdd(ordered);
            }
        }
    });

    console.log("Migration complete.");
    localStorage.removeItem(STORAGE_KEY);
    
  } catch (e) {
    console.error("Migration failed:", e);
  }
};
