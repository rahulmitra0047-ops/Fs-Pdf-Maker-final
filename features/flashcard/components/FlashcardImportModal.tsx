
import React, { useState } from 'react';
import PremiumModal from '../../../shared/components/PremiumModal';
import Icon from '../../../shared/components/Icon';
import toast from 'react-hot-toast';
import { flashcardService } from '../../../core/storage/services';
import { FlashcardWord } from '../../../types';
import { collection, doc } from 'firebase/firestore';
import { dbFirestore } from '../../../core/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const FlashcardImportModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<FlashcardWord[]>([]);

  const handleCopyPrompt = () => {
    const prompt = `Generate a list of 10 advanced English vocabulary words in this specific format:

# Word
@ Bengali Meaning
^ Type (Verb/Noun/Adjective/Adverb/Other)
& V1, V1s, V2, V3, V-ing (only if Verb)
> Bengali Example = English Example
~ Synonym1, Synonym2
$ Pronunciation (Bengali)
---

Example:
# Serendipity
@ আকস্মিক প্রাপ্তি
^ Noun
> বইটি পাওয়া ছিল ভাগ্যের ব্যাপার = Finding the book was pure serendipity
~ Chance, Fate
$ সেরেন্ডিপিটি
---
# Run
@ দৌড়ানো
^ Verb
& run, runs, ran, run, running
> সে মাঠে দৌড়ায় = He runs in the field
~ Sprint, Jog
$ রান
---`;
    
    navigator.clipboard.writeText(prompt);
    toast.success("Prompt copied to clipboard!");
  };

  const parseText = (inputText: string) => {
    const words: FlashcardWord[] = [];
    const blocks = inputText.split('---').map(b => b.trim()).filter(b => b);

    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim());
      let word = '', meaning = '', type = 'Other', v1='', v1s='', v2='', v3='', vIng='', pronunciation = '';
      const examples: string[] = [];
      const synonyms: string[] = [];

      for (const line of lines) {
        if (line.startsWith('#')) word = line.substring(1).trim();
        else if (line.startsWith('@')) meaning = line.substring(1).trim();
        else if (line.startsWith('^')) type = line.substring(1).trim();
        else if (line.startsWith('&')) {
          const parts = line.substring(1).split(',').map(p => p.trim());
          if (parts.length >= 5) [v1, v1s, v2, v3, vIng] = parts;
        }
        else if (line.startsWith('>')) examples.push(line.substring(1).trim());
        else if (line.startsWith('~')) synonyms.push(...line.substring(1).split(',').map(s => s.trim()));
        else if (line.startsWith('$')) pronunciation = line.substring(1).trim();
      }

      if (word && meaning) {
        words.push({
          id: doc(collection(dbFirestore, 'flashcard_words')).id,
          word,
          meaning,
          type: type as any,
          verbForms: type === 'Verb' ? { v1, v1s, v2, v3, vIng } : null,
          examples,
          synonyms,
          pronunciation,
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
      }
    }
    setParsedPreview(words);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    parseText(val);
  };

  const handleImport = async () => {
    if (parsedPreview.length === 0) return;
    setLoading(true);

    try {
      // Check for duplicates
      const existing = await flashcardService.getFlashcardWords();
      const existingSet = new Set(existing.map(w => w.word.toLowerCase()));
      
      const toAdd = parsedPreview.filter(w => !existingSet.has(w.word.toLowerCase()));
      const skipped = parsedPreview.length - toAdd.length;

      if (toAdd.length > 0) {
        await flashcardService.addBulkFlashcardWords(toAdd);
        toast.success(`Imported ${toAdd.length} words! ${skipped > 0 ? `Skipped ${skipped} duplicates.` : ''}`);
        setText('');
        setParsedPreview([]);
        onClose();
      } else {
        toast.error(`All ${parsedPreview.length} words already exist!`);
      }

    } catch (e) {
      console.error(e);
      toast.error("Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumModal isOpen={isOpen} onClose={onClose} title="Bulk Import Flashcards">
      <div className="space-y-4">
        
        {/* Guide Box */}
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-indigo-900 text-sm">AI Generation Guide</h4>
            <button 
              onClick={handleCopyPrompt}
              className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-md flex items-center gap-1 hover:bg-indigo-700 transition-colors"
            >
              <Icon name="copy" size="sm" /> Copy Prompt
            </button>
          </div>
          <p className="text-xs text-indigo-700 mb-2">
            Paste this prompt into ChatGPT/Gemini to get compatible data.
          </p>
        </div>

        {/* Input Area */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Paste Data Here</label>
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder={`# Word\n@ Meaning\n...`}
            className="w-full h-40 p-3 rounded-xl border border-gray-200 text-sm font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {parsedPreview.length} words detected
          </p>
        </div>

        {/* Preview */}
        {parsedPreview.length > 0 && (
            <div className="max-h-32 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50">
                {parsedPreview.map((w, i) => (
                    <div key={i} className="text-xs flex justify-between py-1 border-b border-gray-200 last:border-0">
                        <span className="font-bold text-gray-700">{w.word}</span>
                        <span className="text-gray-500">{w.meaning}</span>
                    </div>
                ))}
            </div>
        )}

        {/* Action */}
        <button
          onClick={handleImport}
          disabled={loading || parsedPreview.length === 0}
          className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
            ${loading || parsedPreview.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 active:scale-[0.98]'}
          `}
        >
          {loading ? 'Importing...' : `Import ${parsedPreview.length} Words`}
        </button>

      </div>
    </PremiumModal>
  );
};

export default FlashcardImportModal;
