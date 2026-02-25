import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../shared/components/Icon';
import { flashcardService, vocabService } from '../../core/storage/services';
import { FlashcardWord, VocabWord } from '../../types';
import { useToast } from '../../shared/context/ToastContext';

const ImportFromLearnPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<{ id: string, count: number, imported: number }[]>([]);
  const [importingId, setImportingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vocabWords, flashcardWords] = await Promise.all([
        vocabService.getAll(),
        flashcardService.getAll()
      ]);

      // Group vocab by lesson
      const lessonMap = new Map<string, VocabWord[]>();
      vocabWords.forEach(w => {
        const lessonId = w.lessonId || 'general';
        if (!lessonMap.has(lessonId)) {
          lessonMap.set(lessonId, []);
        }
        lessonMap.get(lessonId)?.push(w);
      });

      // Check existing
      const existingSet = new Set(flashcardWords.map(w => w.word.toLowerCase().trim()));

      const lessonStats = Array.from(lessonMap.entries()).map(([id, words]) => {
        const importedCount = words.filter(w => existingSet.has(w.word.toLowerCase().trim())).length;
        return {
          id,
          count: words.length,
          imported: importedCount
        };
      });

      setLessons(lessonStats.sort((a, b) => a.id.localeCompare(b.id)));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load lessons");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (lessonId: string) => {
    setImportingId(lessonId);
    try {
      const { imported, skipped } = await flashcardService.importFromLesson(lessonId);
      toast.success(`Imported ${imported} words! (${skipped} skipped)`);
      
      // Update local state
      setLessons(prev => prev.map(l => 
        l.id === lessonId ? { ...l, imported: l.imported + imported } : l
      ));
    } catch (e) {
      console.error(e);
      toast.error("Failed to import");
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#F8FAFC]/80 backdrop-blur-md px-5 h-[60px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/flashcards/add')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 active:scale-95 transition-transform">
            <Icon name="arrow-left" size="sm" />
          </button>
          <h1 className="text-[18px] font-bold text-gray-900">Import from Learn</h1>
        </div>
      </header>

      <main className="px-5 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C63FF]"></div>
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>No lessons found in Learn module.</p>
          </div>
        ) : (
          lessons.map(lesson => {
            const isFullyImported = lesson.imported >= lesson.count;
            const progress = Math.round((lesson.imported / lesson.count) * 100);

            return (
              <div key={lesson.id} className="bg-white rounded-[14px] border border-gray-200 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-800 capitalize">
                      {lesson.id === 'general' ? 'General Vocabulary' : `Lesson ${lesson.id}`}
                    </h3>
                    <p className="text-[12px] text-gray-500">
                      {lesson.imported} / {lesson.count} imported
                    </p>
                  </div>
                  {isFullyImported ? (
                    <span className="bg-green-100 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full">
                      Done
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleImport(lesson.id)}
                      disabled={importingId === lesson.id}
                      className="bg-[#6C63FF] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {importingId === lesson.id ? '...' : 'Import'}
                    </button>
                  )}
                </div>

                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isFullyImported ? 'bg-[#4CAF50]' : 'bg-[#6C63FF]'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};

export default ImportFromLearnPage;
