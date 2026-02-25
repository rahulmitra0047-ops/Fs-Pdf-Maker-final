import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Clipboard, Dice5, Trash2, Check, BookOpen } from 'lucide-react';
import { flashcardService } from '../../core/storage/services';
import { FlashcardNewWord } from '../../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ImportFromLearnSheet from './ImportFromLearnSheet';

const NewWordsPage: React.FC = () => {
  const navigate = useNavigate();
  const [words, setWords] = useState<FlashcardNewWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showBulkSheet, setShowBulkSheet] = useState(false);
  const [showLearnSheet, setShowLearnSheet] = useState(false);
  const [showDiceOptions, setShowDiceOptions] = useState(false);

  // Form State
  const [newWord, setNewWord] = useState({
    word: '',
    meaning: '',
    type: 'Noun',
    v1: '', v1s: '', v2: '', v3: '', vIng: '',
    example: '',
    synonyms: '',
    pronunciation: ''
  });

  // Bulk Import State
  const [bulkText, setBulkText] = useState('');
  const [parsedCount, setParsedCount] = useState(0);
  const [previewItems, setPreviewItems] = useState<{ word: string, status: 'new' | 'daily' | 'mastered' | null }[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    setLoading(true);
    try {
      const data = await flashcardService.getNewWords();
      setWords(data.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      toast.error('Data load হচ্ছে না');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = async () => {
    if (!newWord.word || !newWord.meaning) {
      toast.error('Word এবং Meaning আবশ্যক!');
      return;
    }

    try {
      const wordData: FlashcardNewWord = {
        id: crypto.randomUUID(),
        word: newWord.word,
        meaning: newWord.meaning,
        type: newWord.type as any,
        verbForms: newWord.type === 'Verb' ? {
          v1: newWord.v1 || newWord.word,
          v1s: newWord.v1s,
          v2: newWord.v2,
          v3: newWord.v3,
          vIng: newWord.vIng
        } : null,
        examples: newWord.example ? [newWord.example] : [],
        synonyms: newWord.synonyms ? newWord.synonyms.split(',').map(s => s.trim()) : [],
        pronunciation: newWord.pronunciation,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await flashcardService.addNewWord(wordData);
      toast.success('Word added!');
      setShowAddSheet(false);
      setNewWord({
        word: '', meaning: '', type: 'Noun',
        v1: '', v1s: '', v2: '', v3: '', vIng: '',
        example: '', synonyms: '', pronunciation: ''
      });
      loadWords();
    } catch (error: any) {
      if (error.message.startsWith('Duplicate:')) {
        const type = error.message.split(':')[1].trim();
        toast.error(`এই word আগে থেকে আছে! (${type === 'new' ? 'New Words' : type === 'daily' ? 'Daily Words' : 'Mastered'} এ)`);
      } else {
        toast.error('Error adding word');
      }
    }
  };

  const parseBulkText = async (text: string) => {
    const entries = text.split('---');
    const wordsToCheck: string[] = [];
    
    entries.forEach(entry => {
      const lines = entry.split('\n');
      let word = '';
      lines.forEach(line => {
        if (line.trim().startsWith('#')) word = line.trim().substring(1).trim();
      });
      if (word) wordsToCheck.push(word);
    });

    if (wordsToCheck.length > 0) {
      const status = await flashcardService.getBulkDuplicateStatus(wordsToCheck);
      setPreviewItems(status);
      setParsedCount(status.filter(s => s.status === null).length);
      setDuplicateCount(status.filter(s => s.status !== null).length);
    } else {
      setPreviewItems([]);
      setParsedCount(0);
      setDuplicateCount(0);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setBulkText(text);
        parseBulkText(text);
        toast.success('Pasted from clipboard');
      }
    } catch (err) {
      toast.error('Clipboard access দাও');
    }
  };

  const handleBulkImport = async () => {
    if (!bulkText) return;

    const entries = bulkText.split('---');
    const newWords: FlashcardNewWord[] = [];

    entries.forEach(entry => {
      const lines = entry.split('\n');
      const wordData: any = {
        id: crypto.randomUUID(),
        type: 'Other',
        examples: [],
        synonyms: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('#')) wordData.word = line.substring(1).trim();
        else if (line.startsWith('@')) wordData.meaning = line.substring(1).trim();
        else if (line.startsWith('^')) wordData.type = line.substring(1).trim();
        else if (line.startsWith('>')) wordData.examples.push(line.substring(1).trim());
        else if (line.startsWith('~')) wordData.synonyms = line.substring(1).trim().split(',').map((s: string) => s.trim());
        else if (line.startsWith('$')) wordData.pronunciation = line.substring(1).trim();
      });

      if (wordData.word && wordData.meaning) {
        newWords.push(wordData);
      }
    });

    try {
      const added = await flashcardService.addBulkNewWords(newWords);
      toast.success(`${added} words imported!`);
      setShowBulkSheet(false);
      setBulkText('');
      setPreviewItems([]);
      loadWords();
    } catch (error) {
      toast.error('Import failed');
    }
  };

  const [confirmWord, setConfirmWord] = useState<FlashcardNewWord | null>(null);

  const handleMoveClick = (e: React.MouseEvent, word: FlashcardNewWord) => {
    e.stopPropagation();
    setConfirmWord(word);
  };

  const confirmMove = async () => {
    if (!confirmWord) return;
    
    try {
      await flashcardService.moveToDaily(confirmWord.id);
      toast.success('Moved to Daily Words');
      setConfirmWord(null);
      loadWords();
    } catch (error) {
      console.error("Service call failed", error);
      toast.error('Operation failed');
    }
  };

  const handleRandomMove = async (count: number) => {
    if (words.length === 0) {
      toast.error('কোনো word নেই!');
      return;
    }
    if (count > words.length) {
      toast.error(`মাত্র ${words.length} টি word আছে!`);
      return;
    }

    try {
      const moved = await flashcardService.moveRandomToDaily(count);
      toast.success(`${moved} words moved to Daily!`);
      setShowDiceOptions(false);
      loadWords();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Top Bar */}
      <div className="bg-white px-4 py-3 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold ml-2 text-gray-800">New Words</h1>
        <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
          {words.length}
        </span>
      </div>

      {/* Word List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : words.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <span className="text-4xl mb-2">📥</span>
            <p>কোনো word নেই!</p>
          </div>
        ) : (
          words.map(word => (
            <motion.div 
              key={word.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between items-center shadow-sm"
            >
              <div>
                <div className="font-bold text-gray-800 text-[15px]">
                  {word.word} <span className="text-gray-400 font-normal mx-1">→</span> {word.meaning}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex gap-2">
                  <span className="bg-gray-100 px-1.5 rounded">{word.type}</span>
                  {word.pronunciation && <span>/{word.pronunciation}/</span>}
                </div>
              </div>
              <button 
                onClick={(e) => handleMoveClick(e, word)}
                className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 active:bg-blue-200 transition-colors"
              >
                <Plus size={18} />
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmWord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-2">Daily Words এ নিবে?</h3>
            <p className="text-gray-600 mb-6">
              "{confirmWord.word}" কে Daily Words list এ move করা হবে।
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmWord(null)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl"
              >
                না
              </button>
              <button 
                onClick={confirmMove}
                className="flex-1 py-2.5 bg-[#6C63FF] text-white font-bold rounded-xl"
              >
                হ্যাঁ
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating Dice Button */}
      <div className="fixed bottom-24 right-4 flex flex-col items-end gap-2">
        <AnimatePresence>
          {showDiceOptions && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col gap-2 mb-2"
            >
              {[5, 10, 15, 20].map(num => (
                <button
                  key={num}
                  onClick={() => handleRandomMove(num)}
                  disabled={loading}
                  className="bg-white border border-blue-500 text-blue-600 font-bold py-1 px-3 rounded-full shadow-md hover:bg-blue-50 disabled:opacity-50"
                >
                  {num}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        {words.length > 0 && (
          <button
            onClick={() => setShowDiceOptions(!showDiceOptions)}
            disabled={loading}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-[#6C63FF] to-[#48B6FF] text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-50"
          >
            <Dice5 size={28} />
          </button>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setShowAddSheet(true)}
          className="flex-1 py-3 border border-[#6C63FF] text-[#6C63FF] font-bold rounded-xl active:bg-blue-50 flex items-center justify-center gap-1"
        >
          <Plus size={18} /> Single
        </button>
        <button 
          onClick={() => setShowBulkSheet(true)}
          className="flex-1 py-3 bg-[#6C63FF] text-white font-bold rounded-xl active:bg-blue-700 flex items-center justify-center gap-1"
        >
          <Clipboard size={18} /> Bulk
        </button>
        <button 
          onClick={() => setShowLearnSheet(true)}
          className="flex-1 py-3 border border-[#6C63FF] text-[#6C63FF] font-bold rounded-xl active:bg-blue-50 flex items-center justify-center gap-1"
        >
          <BookOpen size={18} /> Import
        </button>
      </div>

      {/* Add Single Sheet (Modal) */}
      {showAddSheet && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-white w-full max-w-md rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Add New Word</h2>
              <button onClick={() => setShowAddSheet(false)} className="text-gray-500">Close</button>
            </div>
            
            <div className="space-y-3">
              <input 
                placeholder="Word (English)" 
                className="w-full p-3 border rounded-xl"
                value={newWord.word}
                onChange={e => setNewWord({...newWord, word: e.target.value})}
              />
              <input 
                placeholder="Meaning (Bengali)" 
                className="w-full p-3 border rounded-xl"
                value={newWord.meaning}
                onChange={e => setNewWord({...newWord, meaning: e.target.value})}
              />
              
              <div className="flex gap-2">
                <select 
                  className="p-3 border rounded-xl flex-1"
                  value={newWord.type}
                  onChange={e => setNewWord({...newWord, type: e.target.value})}
                >
                  <option value="Noun">Noun</option>
                  <option value="Verb">Verb</option>
                  <option value="Adjective">Adjective</option>
                  <option value="Adverb">Adverb</option>
                  <option value="Other">Other</option>
                </select>
                <input 
                  placeholder="Pronunciation" 
                  className="flex-1 p-3 border rounded-xl"
                  value={newWord.pronunciation}
                  onChange={e => setNewWord({...newWord, pronunciation: e.target.value})}
                />
              </div>

              {newWord.type === 'Verb' && (
                <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl">
                  <input placeholder="V1" className="p-2 border rounded" value={newWord.v1} onChange={e => setNewWord({...newWord, v1: e.target.value})} />
                  <input placeholder="V2" className="p-2 border rounded" value={newWord.v2} onChange={e => setNewWord({...newWord, v2: e.target.value})} />
                  <input placeholder="V3" className="p-2 border rounded" value={newWord.v3} onChange={e => setNewWord({...newWord, v3: e.target.value})} />
                  <input placeholder="V-ing" className="p-2 border rounded" value={newWord.vIng} onChange={e => setNewWord({...newWord, vIng: e.target.value})} />
                  <input placeholder="V-s/es" className="p-2 border rounded" value={newWord.v1s} onChange={e => setNewWord({...newWord, v1s: e.target.value})} />
                </div>
              )}

              <input 
                placeholder="Example Sentence" 
                className="w-full p-3 border rounded-xl"
                value={newWord.example}
                onChange={e => setNewWord({...newWord, example: e.target.value})}
              />
              <input 
                placeholder="Synonyms (comma separated)" 
                className="w-full p-3 border rounded-xl"
                value={newWord.synonyms}
                onChange={e => setNewWord({...newWord, synonyms: e.target.value})}
              />

              <button 
                onClick={handleAddWord}
                className="w-full py-3 bg-[#6C63FF] text-white font-bold rounded-xl mt-4"
              >
                Save Word
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bulk Import Sheet */}
      {showBulkSheet && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-white w-full max-w-md rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Bulk Import</h2>
              <button onClick={() => setShowBulkSheet(false)} className="text-gray-500">Close</button>
            </div>

            <button 
              onClick={handlePaste}
              className="w-full mb-3 py-2 border border-[#6C63FF] text-[#6C63FF] text-xs font-bold rounded-lg flex items-center justify-center gap-2 active:bg-blue-50"
            >
              <Clipboard size={14} /> Paste from Clipboard
            </button>

            <div className="bg-gray-100 p-3 rounded-lg text-xs text-gray-600 mb-4 font-mono">
              <p># Word</p>
              <p>@ Meaning</p>
              <p>^ Type (Verb/Noun...)</p>
              <p>&gt; Example</p>
              <p>--- (Separator)</p>
            </div>

            <textarea 
              className="w-full h-32 p-3 border rounded-xl font-mono text-sm mb-3"
              placeholder={`# Apple\n@ আপেল\n^ Noun\n---\n# Run\n@ দৌড়ানো`}
              value={bulkText}
              onChange={e => {
                setBulkText(e.target.value);
                parseBulkText(e.target.value);
              }}
            />

            {/* Preview List */}
            {previewItems.length > 0 && (
              <div className="mb-4 max-h-32 overflow-y-auto border rounded-lg p-2 bg-gray-50 space-y-1">
                {previewItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className={item.status ? 'text-amber-600 font-medium' : 'text-gray-800'}>
                      {item.word}
                    </span>
                    {item.status ? (
                      <span className="bg-amber-100 text-amber-700 px-1.5 rounded text-[10px]">
                        Duplicate ({item.status})
                      </span>
                    ) : (
                      <span className="text-green-600">New</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center mt-2 mb-4 text-sm">
              <span className="text-green-600 font-bold">✅ {parsedCount} new words</span>
              {duplicateCount > 0 && (
                <span className="text-amber-600 font-bold">⚠️ {duplicateCount} duplicates</span>
              )}
            </div>

            <button 
              onClick={handleBulkImport}
              className="w-full py-3 bg-[#6C63FF] text-white font-bold rounded-xl disabled:opacity-50"
              disabled={parsedCount === 0}
            >
              Import {parsedCount} New Words {duplicateCount > 0 && `(skip ${duplicateCount})`}
            </button>
          </motion.div>
        </div>
      )}

      {/* Import From Learn Sheet */}
      {showLearnSheet && (
        <ImportFromLearnSheet 
          onClose={() => setShowLearnSheet(false)} 
          onImportComplete={loadWords} 
        />
      )}
    </div>
  );
};

export default NewWordsPage;
