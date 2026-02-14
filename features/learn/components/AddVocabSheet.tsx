
import React, { useState, useEffect } from 'react';
import PremiumInput from '../../../shared/components/PremiumInput';
import Icon from '../../../shared/components/Icon';
import { VocabWord, VocabExample } from '../../../types';
import { generateUUID } from '../../../core/storage/idGenerator';
import { useToast } from '../../../shared/context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (word: VocabWord) => void;
  existingWord?: VocabWord | null;
  lessonId: string;
}

const CollapsibleSection: React.FC<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-[12px] overflow-hidden bg-white mb-3">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-gray-700 text-xs uppercase tracking-wide">{title}</span>
        <div className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
          <Icon name="chevron-right" size="sm" />
        </div>
      </div>
      {isOpen && <div className="p-3 border-t border-gray-100 bg-gray-50/50 animate-in fade-in slide-in-from-top-1">{children}</div>}
    </div>
  );
};

const AddVocabSheet: React.FC<Props> = ({ isOpen, onClose, onSave, existingWord, lessonId }) => {
  const toast = useToast();

  // Basic Fields
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [type, setType] = useState<'Verb' | 'Noun' | 'Adjective' | 'Adverb' | 'Other'>('Verb');

  // Verb Forms
  const [v1, setV1] = useState('');
  const [v2, setV2] = useState('');
  const [v3, setV3] = useState('');
  const [vIng, setVIng] = useState('');

  // Extras
  const [examples, setExamples] = useState<VocabExample[]>([]);
  const [synonyms, setSynonyms] = useState('');
  const [pronunciation, setPronunciation] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (existingWord) {
        setWord(existingWord.word);
        setMeaning(existingWord.meaning);
        setType(existingWord.type);
        setV1(existingWord.v1 || '');
        setV2(existingWord.v2 || '');
        setV3(existingWord.v3 || '');
        setVIng(existingWord.vIng || '');
        setExamples(existingWord.examples || []);
        setSynonyms(existingWord.synonyms || '');
        setPronunciation(existingWord.pronunciation || '');
      } else {
        resetForm();
      }
    }
  }, [isOpen, existingWord]);

  const resetForm = () => {
    setWord('');
    setMeaning('');
    setType('Verb');
    setV1('');
    setV2('');
    setV3('');
    setVIng('');
    setExamples([]);
    setSynonyms('');
    setPronunciation('');
  };

  const handleSave = () => {
    if (!word.trim() || !meaning.trim()) {
      toast.error("Word and Meaning are required");
      return;
    }

    const newWord: VocabWord = {
      id: existingWord?.id || generateUUID(),
      lessonId,
      word: word.trim(),
      meaning: meaning.trim(),
      type,
      v1: type === 'Verb' ? (v1.trim() || word.trim()) : undefined, // Default v1 to word if empty
      v1s: undefined, // Not in UI yet, optional
      v2: type === 'Verb' ? v2.trim() : undefined,
      v3: type === 'Verb' ? v3.trim() : undefined,
      vIng: type === 'Verb' ? vIng.trim() : undefined,
      examples: examples.filter(ex => ex.bengali.trim() || ex.english.trim()),
      synonyms: synonyms.trim(),
      pronunciation: pronunciation.trim(),
      createdAt: existingWord?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    onSave(newWord);
    onClose();
  };

  // Example Management
  const addExample = () => setExamples([...examples, { bengali: '', english: '' }]);
  const updateExample = (index: number, field: keyof VocabExample, val: string) => {
    const newEx = [...examples];
    newEx[index] = { ...newEx[index], [field]: val };
    setExamples(newEx);
  };
  const removeExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[90] transition-opacity backdrop-blur-[1px]" onClick={onClose} />
      
      <div className="fixed bottom-0 left-0 right-0 bg-[#FAFAFA] z-[100] rounded-t-[24px] shadow-2xl h-[90vh] flex flex-col animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] bg-white rounded-t-[24px]">
          <h2 className="text-[18px] font-bold text-[#111827]">{existingWord ? 'Edit Word' : 'Add Word'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-[#6B7280] transition-colors">
            <Icon name="x" size="sm" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-4">
          
          {/* Core Fields */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">English Word <span className="text-red-500">*</span></label>
            <input 
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="e.g. play"
              className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-base outline-none focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/10 transition-all font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Meaning (বাংলা) <span className="text-red-500">*</span></label>
            <input 
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="e.g. খেলা"
              className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-base outline-none focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1">Type</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-sm outline-none focus:border-[#6366F1]"
            >
              <option value="Verb">Verb</option>
              <option value="Noun">Noun</option>
              <option value="Adjective">Adjective</option>
              <option value="Adverb">Adverb</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Verb Forms (Conditional) */}
          {type === 'Verb' && (
            <CollapsibleSection title="Verb Forms" defaultOpen={true}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 mb-1 block">V1 (Base)</label>
                  <input 
                    value={v1} 
                    onChange={(e) => setV1(e.target.value)} 
                    placeholder={word || 'play'}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 mb-1 block">V2 (Past)</label>
                  <input 
                    value={v2} 
                    onChange={(e) => setV2(e.target.value)} 
                    placeholder="played"
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 mb-1 block">V3 (Participle)</label>
                  <input 
                    value={v3} 
                    onChange={(e) => setV3(e.target.value)} 
                    placeholder="played"
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 mb-1 block">V-ing</label>
                  <input 
                    value={vIng} 
                    onChange={(e) => setVIng(e.target.value)} 
                    placeholder="playing"
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* Examples */}
          <CollapsibleSection title="Examples">
            <div className="space-y-3">
              {examples.map((ex, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 relative group">
                  <button onClick={() => removeExample(idx)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500">
                    <Icon name="x" size="sm" />
                  </button>
                  <div className="space-y-2">
                    <input 
                      value={ex.bengali}
                      onChange={(e) => updateExample(idx, 'bengali', e.target.value)}
                      placeholder="বাংলা বাক্য..."
                      className="w-full text-sm border-b border-dashed border-gray-300 pb-1 focus:border-indigo-500 outline-none bg-transparent"
                    />
                    <input 
                      value={ex.english}
                      onChange={(e) => updateExample(idx, 'english', e.target.value)}
                      placeholder="English sentence..."
                      className="w-full text-sm border-b border-dashed border-gray-300 pb-1 focus:border-indigo-500 outline-none bg-transparent font-medium"
                    />
                  </div>
                </div>
              ))}
              <button 
                onClick={addExample}
                className="w-full py-2.5 border border-dashed border-indigo-200 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="plus" size="sm" /> Add Example
              </button>
            </div>
          </CollapsibleSection>

          {/* Extras */}
          <CollapsibleSection title="Synonyms">
            <input 
              value={synonyms}
              onChange={(e) => setSynonyms(e.target.value)}
              placeholder="e.g. perform, compete"
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
            />
          </CollapsibleSection>

          <CollapsibleSection title="Pronunciation">
            <input 
              value={pronunciation}
              onChange={(e) => setPronunciation(e.target.value)}
              placeholder="e.g. প্লে"
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
            />
          </CollapsibleSection>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#E5E7EB] bg-white pb-safe">
          <button 
            onClick={handleSave}
            className="w-full h-[48px] bg-[#6366F1] text-white font-bold rounded-[14px] active:scale-[0.98] transition-all shadow-lg shadow-indigo-200"
          >
            {existingWord ? 'Update Word' : 'Save Word'}
          </button>
        </div>

      </div>
    </>
  );
};

export default AddVocabSheet;
