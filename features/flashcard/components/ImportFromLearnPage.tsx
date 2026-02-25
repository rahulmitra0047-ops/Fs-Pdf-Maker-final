import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../shared/components/Icon';
import { lessonService, flashcardService, vocabService } from '../../../core/storage/services';
import { Lesson } from '../../../types';
import toast from 'react-hot-toast';

const ImportFromLearnPage: React.FC = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  
  const [stats, setStats] = useState({
    totalSelected: 0,
    alreadyImported: 0,
    newWords: 0
  });

  useEffect(() => {
    loadLessons();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [selectedLessons]);

  const loadLessons = async () => {
    try {
      const all = await lessonService.getAll();
      setLessons(all.sort((a, b) => (a.order || 0) - (b.order || 0)));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load lessons");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
    if (selectedLessons.length === 0) {
      setStats({ totalSelected: 0, alreadyImported: 0, newWords: 0 });
      return;
    }

    try {
      const existingWords = await flashcardService.getFlashcardWords();
      const existingSet = new Set(existingWords.map(w => w.word.toLowerCase()));
      
      let total = 0;
      let existing = 0;

      const allVocab = await vocabService.getAll();
      
      for (const lessonId of selectedLessons) {
        const lessonVocab = allVocab.filter(v => v.lessonId === lessonId);
        total += lessonVocab.length;
        
        for (const v of lessonVocab) {
          if (existingSet.has(v.word.toLowerCase())) {
            existing++;
          }
        }
      }

      setStats({
        totalSelected: total,
        alreadyImported: existing,
        newWords: total - existing
      });

    } catch (e) {
      console.error(e);
    }
  };

  const toggleLesson = (id: string) => {
    setSelectedLessons(prev => 
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const handleImport = async () => {
    if (stats.newWords === 0) return;
    setImporting(true);
    
    try {
      let totalImported = 0;
      for (const lessonId of selectedLessons) {
        const res = await flashcardService.importFromLesson(lessonId);
        totalImported += res.imported;
      }
      
      toast.success(`${totalImported} words imported successfully!`);
      navigate('/flashcards');
    } catch (e) {
      console.error(e);
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return <div className="p-5 text-center">Loading lessons...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Top Bar */}
      <header className="px-5 py-4 flex items-center gap-3 bg-white sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => navigate('/flashcards/add')} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-600">
          <Icon name="arrow-left" size="sm" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Import from Learn</h1>
      </header>

      <main className="p-5 space-y-5">
        
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3">Select Lessons:</h3>
          <div className="space-y-2">
            {lessons.map(lesson => (
              <div 
                key={lesson.id}
                onClick={() => toggleLesson(lesson.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]
                  ${selectedLessons.includes(lesson.id) 
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center
                    ${selectedLessons.includes(lesson.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}
                  `}>
                    {selectedLessons.includes(lesson.id) && <Icon name="check" size="xs" className="text-white" />}
                  </div>
                  <span className={`text-sm font-medium ${selectedLessons.includes(lesson.id) ? 'text-indigo-900' : 'text-gray-700'}`}>
                    {lesson.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 shadow-sm">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Selected Words</span>
            <span className="font-bold text-gray-900">{stats.totalSelected}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Already Imported</span>
            <span className="font-bold text-orange-500">{stats.alreadyImported}</span>
          </div>
          <div className="h-px bg-gray-100 my-1"></div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-800 font-medium">New Words to Import</span>
            <span className="font-bold text-indigo-600">{stats.newWords}</span>
          </div>
        </div>

      </main>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 pb-safe">
        <button 
          onClick={handleImport}
          disabled={importing || stats.newWords === 0}
          className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
            ${importing || stats.newWords === 0 
              ? 'bg-gray-300 cursor-not-allowed shadow-none' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 active:scale-[0.98]'}
          `}
        >
          {importing ? 'Importing...' : `Import ${stats.newWords} Words`}
          {!importing && stats.newWords > 0 && <Icon name="check" size="sm" />}
        </button>
      </div>

    </div>
  );
};

export default ImportFromLearnPage;
