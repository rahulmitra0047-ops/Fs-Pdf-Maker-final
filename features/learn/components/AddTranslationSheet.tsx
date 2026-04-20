import React, { useState, useEffect } from 'react';
import Icon from '../../../shared/components/Icon';
import { TranslationItem, TranslationHint, GrammarRule, VocabWord } from '../../../types';
import { generateUUID } from '../../../core/storage/idGenerator';
import { useToast } from '../../../shared/context/ToastContext';
import { aiManager } from '../../../core/ai/aiManager';
import { grammarService, vocabService } from '../../../core/storage/services';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: TranslationItem) => void;
  lessonId: string;
  existingItem?: TranslationItem | null;
}

const AddTranslationSheet: React.FC<Props> = ({ isOpen, onClose, onSave, lessonId, existingItem }) => {
  const [text, setText] = useState('');
  const [direction, setDirection] = useState<'B2E' | 'E2B'>('B2E');
  const [hints, setHints] = useState<TranslationHint[]>([]);
  const [showHints, setShowHints] = useState(true);
  const toast = useToast();

  // AI Generation States
  const [showAIArea, setShowAIArea] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState<'Easy' | 'Moderate' | 'Hard'>('Moderate');
  const [aiWordCount, setAiWordCount] = useState<string>('20');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingItem) {
        setText(existingItem.bengaliText);
        setDirection(existingItem.direction || 'B2E');
        setHints(existingItem.hints || []);
        setShowAIArea(false);
      } else {
        setText('');
        setDirection('B2E');
        setHints([]);
        setShowHints(true);
        setShowAIArea(false);
      }
    }
  }, [isOpen, existingItem]);

  const handleSave = () => {
    if (!text.trim()) {
      toast.error("Text cannot be empty.");
      return;
    }

    const validHints = hints.filter(h => h.bengaliWord.trim() && h.englishHint.trim());

    const newItem: TranslationItem = {
      id: existingItem?.id || generateUUID(),
      lessonId,
      bengaliText: text.trim(), // acts as source text
      direction: direction,
      hints: validHints,
      isCompleted: existingItem?.isCompleted || false,
      createdAt: existingItem?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    onSave(newItem);
    setText('');
    setHints([]);
    onClose();
  };

  const addHint = () => {
    setHints([...hints, { bengaliWord: '', englishHint: '' }]);
  };

  const updateHint = (index: number, field: keyof TranslationHint, value: string) => {
    const newHints = [...hints];
    newHints[index] = { ...newHints[index], [field]: value };
    setHints(newHints);
  };

  const removeHint = (index: number) => {
    setHints(hints.filter((_, i) => i !== index));
  };

  const handleGenerateWithAI = async () => {
    const wordCountNum = parseInt(aiWordCount, 10);
    if (!wordCountNum || wordCountNum <= 0) {
      toast.error("Please provide a valid word count.");
      return;
    }

    setIsGenerating(true);
    try {
      const [rules, vocab] = await Promise.all([
        grammarService.getRules(lessonId),
        vocabService.getWords(lessonId)
      ]);

      const rulesList = rules.length ? rules.map(r => r.rule).join(', ') : 'No specific rules.';
      const vocabList = vocab.length ? vocab.map(v => `${v.word} (${v.bengaliMeaning})`).join(', ') : 'No specific vocabulary.';

      const prompt = `
You are an expert English teacher creating translation exercises for a Bengali speaker.
Based on the current lesson, use these grammar concepts:
${rulesList}

And these vocabulary words:
${vocabList}

Create a translation exercise with the following parameters:
- Difficulty: ${aiDifficulty}
- Approximate Word Length: ${wordCountNum} words
- Type: ${direction === 'B2E' ? 'Bengali source sentence/paragraph' : 'English source sentence/paragraph'}

Include useful hints for any difficult words or grammar specific to the lesson. Ensure the result is strictly valid JSON format exactly mapping this schema:
{
  "sourceText": "The ${direction === 'B2E' ? 'Bengali' : 'English'} text snippet here",
  "hints": [
    { "bengaliWord": "বাংলা শব্দ or phrase", "englishHint": "English equivalent or hint" }
  ]
}
`;

      const response = await aiManager.generateContent('gemini-3-flash-preview', prompt, {
        responseMimeType: 'application/json',
        timeout: 45000,
      });

      const parsedJSON = JSON.parse(response);
      if (parsedJSON.sourceText) {
        setText(parsedJSON.sourceText);
      }
      if (parsedJSON.hints && Array.isArray(parsedJSON.hints)) {
        setHints(parsedJSON.hints);
      }
      toast.success("Generated successfully!");
      setShowAIArea(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate translation.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-text-primary/50 z-[90] transition-opacity backdrop-blur-sm" onClick={onClose} />
      
      <div className="fixed bottom-0 left-0 right-0 bg-background z-[100] rounded-t-[24px] shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-full duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-surface rounded-t-[24px]">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 flex items-center justify-center bg-background border border-border">
                <Icon name="refresh-cw" size="sm" className="text-primary" />
             </div>
             <h2 className="text-lg font-serif text-text-primary leading-none mt-1">{existingItem ? 'Edit Translation' : 'Add Translation'}</h2>
          </div>
          <div className="flex items-center gap-3">
             {!existingItem && (
               <button 
                  onClick={() => setShowAIArea(!showAIArea)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-bold uppercase tracking-wider transition-colors"
               >
                  <Icon name="sparkles" size="sm" /> AI Generate
               </button>
             )}
             <button onClick={onClose} className="p-2 hover:bg-background text-text-secondary transition-colors border border-transparent hover:border-border">
               <Icon name="x" size="sm" />
             </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          
          {/* AI Settings Area */}
          {showAIArea && (
             <div className="bg-surface border border-primary/30 p-4 relative mb-4 animate-in fade-in slide-in-from-top-2">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                    <Icon name="sparkles" size="sm" /> Configure AI Generator
                 </h3>
                 <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-text-secondary mb-1.5">Difficulty</label>
                        <select 
                           value={aiDifficulty}
                           onChange={(e) => setAiDifficulty(e.target.value as any)}
                           className="w-full bg-background border border-border px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
                        >
                           <option value="Easy">Easy</option>
                           <option value="Moderate">Moderate</option>
                           <option value="Hard">Hard</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-text-secondary mb-1.5">Word Count</label>
                        <input 
                           type="number"
                           value={aiWordCount}
                           onChange={(e) => setAiWordCount(e.target.value)}
                           className="w-full bg-background border border-border px-3 py-2 text-sm text-text-primary outline-none focus:border-primary font-mono"
                           placeholder="e.g. 20"
                        />
                    </div>
                 </div>
                 <button 
                     onClick={handleGenerateWithAI}
                     disabled={isGenerating}
                     className="w-full py-2.5 bg-primary text-white text-[13px] font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                     {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Icon name="zap" size="sm" />}
                     {isGenerating ? 'Generating...' : 'Get Content'}
                 </button>
             </div>
          )}

          <div>
             <div className="flex items-center justify-between mb-2">
                 <label className="block text-xs font-bold uppercase tracking-widest text-text-secondary">Source Text <span className="text-error">*</span></label>
                 <div className="flex border border-border bg-surface overflow-hidden">
                    <button 
                       onClick={() => setDirection('B2E')}
                       className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest transition-colors ${direction === 'B2E' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-background'}`}
                    >
                       Ban → Eng
                    </button>
                    <button 
                       onClick={() => setDirection('E2B')}
                       className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest transition-colors ${direction === 'E2B' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-background border-l border-border'}`}
                    >
                       Eng → Ban
                    </button>
                 </div>
             </div>
             <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={direction === 'B2E' ? "বাংলায় লিখুন..." : "Enter English text..."}
              rows={4}
              className="w-full bg-surface border border-border px-4 py-3 text-base text-text-primary outline-none focus:border-primary transition-all resize-none shadow-sm"
             />
          </div>

          {/* Hints Section */}
          <div className="border border-border bg-surface shadow-sm">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-background transition-colors"
              onClick={() => setShowHints(!showHints)}
            >
              <div className="flex items-center gap-2">
                <Icon name="help-circle" size="sm" className="text-text-secondary" />
                <span className="font-bold text-[13px] uppercase tracking-wider text-text-primary">Hints & Clues</span>
              </div>
              <div className={`text-text-secondary transition-transform duration-200 ${showHints ? 'rotate-180' : ''}`}>
                <Icon name="chevron-left" size="sm" className="-rotate-90" />
              </div>
            </div>
            
            {showHints && (
              <div className="p-4 border-t border-border animate-in fade-in slide-in-from-top-2 space-y-3 bg-background/50">
                {hints.map((hint, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-[45%]">
                      <input 
                        value={hint.bengaliWord}
                        onChange={(e) => updateHint(index, 'bengaliWord', e.target.value)}
                        placeholder="Source Phrase"
                        className="w-full h-9 bg-background border border-border px-2 text-sm text-text-primary outline-none focus:border-primary"
                      />
                    </div>
                    <span className="text-text-secondary"><Icon name="arrow-right" size="sm" className="opacity-50" /></span>
                    <div className="w-[45%]">
                      <input 
                        value={hint.englishHint}
                        onChange={(e) => updateHint(index, 'englishHint', e.target.value)}
                        placeholder="Hint"
                        className="w-full h-9 bg-background border border-border px-2 text-sm text-text-primary outline-none focus:border-primary"
                      />
                    </div>
                    <button 
                      onClick={() => removeHint(index)}
                      className="w-[10%] flex justify-center text-error hover:opacity-80"
                    >
                      <Icon name="x" size="sm" />
                    </button>
                  </div>
                ))}
                
                <button 
                  onClick={addHint}
                  className="text-[11px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 px-2 py-1.5 transition-colors flex items-center gap-1.5 mt-2 border border-transparent hover:border-primary/20"
                >
                  <Icon name="plus" size="sm" /> Add Hint
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-surface pb-safe flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 h-12 bg-background border border-border text-text-primary font-bold text-[13px] uppercase tracking-widest hover:border-text-secondary transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 h-12 bg-primary text-white font-bold text-[13px] uppercase tracking-widest hover:bg-primary/95 transition-all shadow-sm"
          >
            {existingItem ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
};

export default AddTranslationSheet;