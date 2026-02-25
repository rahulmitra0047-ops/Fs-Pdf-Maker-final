import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../shared/components/Icon';
import { flashcardService } from '../../core/storage/services';
import { FlashcardWord } from '../../types';
import { useToast } from '../../shared/context/ToastContext';

const AddWordsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [loading, setLoading] = useState(false);

  // Single Word State
  const [singleForm, setSingleForm] = useState({
    word: '',
    meaning: '',
    type: 'Noun',
    example: '',
    synonyms: ''
  });

  // Bulk Import State
  const [bulkText, setBulkText] = useState('');

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleForm.word || !singleForm.meaning) {
      toast.error("Word and Meaning are required");
      return;
    }

    setLoading(true);
    try {
      const newWord: FlashcardWord = {
        id: crypto.randomUUID(),
        word: singleForm.word,
        meaning: singleForm.meaning,
        type: singleForm.type as any,
        examples: singleForm.example ? [singleForm.example] : [],
        synonyms: singleForm.synonyms.split(',').map(s => s.trim()).filter(s => s),
        pronunciation: '',
        confidenceLevel: 0,
        nextReviewDate: Date.now(),
        lastReviewedAt: null,
        sourceLessonId: null,
        totalReviews: 0,
        correctCount: 0,
        wrongCount: 0,
        isFavorite: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await flashcardService.addWord(newWord);
      toast.success("Word added successfully!");
      setSingleForm({ word: '', meaning: '', type: 'Noun', example: '', synonyms: '' });
    } catch (e) {
      console.error(e);
      toast.error("Failed to add word");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkText.trim()) {
      toast.error("Please enter some text");
      return;
    }

    setLoading(true);
    try {
      const lines = bulkText.split('\n').filter(l => l.trim());
      const newWords: FlashcardWord[] = [];
      let skipped = 0;

      for (const line of lines) {
        // Format: Word = Meaning [Type] (Example)
        // Regex to parse
        const match = line.match(/^(.+?)\s*=\s*(.+?)(?:\s*\[(.+?)\])?(?:\s*\((.+?)\))?$/);
        
        if (match) {
          const [_, word, meaning, type, example] = match;
          newWords.push({
            id: crypto.randomUUID(),
            word: word.trim(),
            meaning: meaning.trim(),
            type: (type?.trim() as any) || 'Other',
            examples: example ? [example.trim()] : [],
            synonyms: [],
            pronunciation: '',
            confidenceLevel: 0,
            nextReviewDate: Date.now(),
            lastReviewedAt: null,
            sourceLessonId: null,
            totalReviews: 0,
            correctCount: 0,
            wrongCount: 0,
            isFavorite: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        } else {
          skipped++;
        }
      }

      if (newWords.length > 0) {
        await flashcardService.addBulkWords(newWords);
        toast.success(`Imported ${newWords.length} words! ${skipped > 0 ? `Skipped ${skipped} invalid lines.` : ''}`);
        setBulkText('');
      } else {
        toast.error("No valid words found. Check format.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to import words");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[#F8FAFC]/80 backdrop-blur-md px-5 h-[60px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/flashcards')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 active:scale-95 transition-transform">
            <Icon name="arrow-left" size="sm" />
          </button>
          <h1 className="text-[18px] font-bold text-gray-900">Add Words</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-5 mb-6">
        <div className="bg-gray-100 p-1 rounded-[12px] flex">
          <button 
            onClick={() => setActiveTab('single')}
            className={`flex-1 py-2 rounded-[10px] text-[13px] font-medium transition-all ${
              activeTab === 'single' ? 'bg-white text-[#6C63FF] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Single Word
          </button>
          <button 
            onClick={() => setActiveTab('bulk')}
            className={`flex-1 py-2 rounded-[10px] text-[13px] font-medium transition-all ${
              activeTab === 'bulk' ? 'bg-white text-[#6C63FF] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Bulk Import
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="px-5">
        {activeTab === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">Word <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={singleForm.word}
                onChange={e => setSingleForm({...singleForm, word: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#6C63FF]"
                placeholder="e.g. Serendipity"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">Meaning <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={singleForm.meaning}
                onChange={e => setSingleForm({...singleForm, meaning: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#6C63FF]"
                placeholder="e.g. Happy accident"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">Type</label>
              <select 
                value={singleForm.type}
                onChange={e => setSingleForm({...singleForm, type: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#6C63FF]"
              >
                <option value="Noun">Noun</option>
                <option value="Verb">Verb</option>
                <option value="Adjective">Adjective</option>
                <option value="Adverb">Adverb</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">Example (Optional)</label>
              <input 
                type="text" 
                value={singleForm.example}
                onChange={e => setSingleForm({...singleForm, example: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#6C63FF]"
                placeholder="e.g. Finding this app was pure serendipity."
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">Synonyms (Comma separated)</label>
              <input 
                type="text" 
                value={singleForm.synonyms}
                onChange={e => setSingleForm({...singleForm, synonyms: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[14px] focus:outline-none focus:border-[#6C63FF]"
                placeholder="e.g. luck, chance, fortune"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#6C63FF] text-white py-3 rounded-[14px] font-bold shadow-md active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Word'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-[12px] border border-blue-100">
              <h3 className="text-[13px] font-bold text-blue-800 mb-2">Format Guide</h3>
              <p className="text-[12px] text-blue-600 font-mono">
                Word = Meaning [Type] (Example)
              </p>
              <p className="text-[11px] text-blue-500 mt-1">
                Example: <br/>
                Run = দৌড়ানো [Verb] (I run fast)
              </p>
            </div>

            <textarea 
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              className="w-full h-48 bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-[14px] font-mono focus:outline-none focus:border-[#6C63FF]"
              placeholder="Paste your list here..."
            ></textarea>

            <button 
              onClick={handleBulkSubmit}
              disabled={loading}
              className="w-full bg-[#6C63FF] text-white py-3 rounded-[14px] font-bold shadow-md active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import Words'}
            </button>
          </div>
        )}

        {/* Import from Learn Button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button 
            onClick={() => navigate('/flashcards/import-learn')}
            className="w-full bg-white border border-[#6C63FF] text-[#6C63FF] py-3 rounded-[14px] font-bold active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Icon name="book-open" size="sm" />
            Import from Learn
          </button>
          <p className="text-[11px] text-gray-500 text-center mt-2">
            Import words you've already learned in lessons
          </p>
        </div>
      </main>
    </div>
  );
};

export default AddWordsPage;
