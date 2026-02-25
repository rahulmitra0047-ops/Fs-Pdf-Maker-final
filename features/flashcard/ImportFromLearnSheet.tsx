import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { lessonService, vocabService, flashcardService } from '../../core/storage/services';
import { Lesson, VocabWord, FlashcardNewWord } from '../../types';
import toast from 'react-hot-toast';
import { Check, BookOpen } from 'lucide-react';

interface ImportFromLearnSheetProps {
  onClose: () => void;
  onImportComplete: () => void;
}

const ImportFromLearnSheet: React.FC<ImportFromLearnSheetProps> = ({ onClose, onImportComplete }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ selected: 0, exists: 0, new: 0 });
  const [importing, setImporting] = useState(false);
  const [vocabMap, setVocabMap] = useState<Record<string, VocabWord[]>>({});

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    setLoading(true);
    try {
      const allLessons = await lessonService.getLessons();
      setLessons(allLessons);
      
      // Pre-fetch vocab counts or data?
      // Fetching all vocab might be heavy. Let's fetch on selection or just fetch all if not too many.
      // For accurate "Selected: 35 words" count, we need to know how many words in each lesson.
      // Let's fetch all vocab for now, assuming dataset isn't huge.
      const allVocab = await vocabService.getAll();
      const map: Record<string, VocabWord[]> = {};
      allVocab.forEach(v => {
        if (!map[v.lessonId]) map[v.lessonId] = [];
        map[v.lessonId].push(v);
      });
      setVocabMap(map);
    } catch (error) {
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateStats();
  }, [selectedLessons, vocabMap]);

  const calculateStats = async () => {
    let totalSelected = 0;
    const allSelectedWords: string[] = [];

    selectedLessons.forEach(lessonId => {
      const words = vocabMap[lessonId] || [];
      totalSelected += words.length;
      words.forEach(w => allSelectedWords.push(w.word));
    });

    if (allSelectedWords.length === 0) {
      setStats({ selected: 0, exists: 0, new: 0 });
      return;
    }

    // Check duplicates
    const status = await flashcardService.getBulkDuplicateStatus(allSelectedWords);
    const existsCount = status.filter(s => s.status !== null).length;

    setStats({
      selected: totalSelected,
      exists: existsCount,
      new: totalSelected - existsCount
    });
  };

  const toggleLesson = (id: string) => {
    const newSet = new Set(selectedLessons);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedLessons(newSet);
  };

  const handleImport = async () => {
    if (stats.new === 0) return;
    setImporting(true);

    try {
      const wordsToImport: FlashcardNewWord[] = [];
      
      for (const lessonId of selectedLessons) {
        const vocabList = vocabMap[lessonId] || [];
        for (const v of vocabList) {
           // Map VocabWord to FlashcardNewWord
           const wordData: FlashcardNewWord = {
             id: crypto.randomUUID(),
             word: v.word,
             meaning: v.meaning,
             type: (v.type as any) || 'Other',
             verbForms: v.verbForms || null,
             examples: v.example ? [v.example] : [],
             synonyms: v.synonyms ? v.synonyms.split(',').map(s => s.trim()) : [],
             pronunciation: v.pronunciation || '',
             createdAt: Date.now(),
             updatedAt: Date.now()
           };
           wordsToImport.push(wordData);
        }
      }

      const added = await flashcardService.addBulkNewWords(wordsToImport);
      toast.success(`${added} words imported!`);
      onImportComplete();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        className="bg-white w-full max-w-md rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto flex flex-col"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookOpen size={20} className="text-[#6C63FF]" />
            Import from Learn
          </h2>
          <button onClick={onClose} className="text-gray-500">Close</button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C63FF]"></div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-bold text-gray-700 mb-2">Select Lessons:</p>
              {lessons.map(lesson => {
                const count = (vocabMap[lesson.id] || []).length;
                const isSelected = selectedLessons.has(lesson.id);
                return (
                  <div 
                    key={lesson.id}
                    onClick={() => toggleLesson(lesson.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                      isSelected ? 'border-[#6C63FF] bg-[#6C63FF]/5' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-[#6C63FF] border-[#6C63FF]' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                      <span className="text-gray-800 font-medium">{lesson.title}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-full">
                      {count} words
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-gray-50 p-2 rounded-lg">
              <div className="font-bold text-gray-800">{stats.selected}</div>
              <div className="text-gray-500">Selected</div>
            </div>
            <div className="bg-amber-50 p-2 rounded-lg">
              <div className="font-bold text-amber-600">{stats.exists}</div>
              <div className="text-amber-600/80">Exists</div>
            </div>
            <div className="bg-green-50 p-2 rounded-lg">
              <div className="font-bold text-green-600">{stats.new}</div>
              <div className="text-green-600/80">New</div>
            </div>
          </div>

          <button 
            onClick={handleImport}
            disabled={stats.new === 0 || importing}
            className="w-full py-3 bg-[#6C63FF] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {importing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>Import {stats.new} Words {stats.new > 0 && '✓'}</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ImportFromLearnSheet;
