
import React, { useState, useEffect } from 'react';
import { TranslationItem, GrammarRule, VocabWord } from '../../../types';
import ReviewBox, { AIReviewData } from './ReviewBox';
import { useToast } from '../../../shared/context/ToastContext';
import Icon from '../../../shared/components/Icon';
import { aiManager } from '../../../core/ai/aiManager';
import { grammarService, vocabService } from '../../../core/storage/services';

interface Props {
  item: TranslationItem;
  currentIndex: number;
  totalItems: number;
  onNext: () => void;
  onPrev: () => void;
  onComplete: (id: string) => void;
  onEdit: (item: TranslationItem) => void;
  onDelete: (id: string) => void;
}

const TranslationView: React.FC<Props> = ({ 
  item, currentIndex, totalItems, onNext, onPrev, onComplete, onEdit, onDelete
}) => {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [review, setReview] = useState<AIReviewData | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  // Lesson Context State
  const [contextRules, setContextRules] = useState<GrammarRule[]>([]);
  const [contextVocab, setContextVocab] = useState<VocabWord[]>([]);
  
  const toast = useToast();

  useEffect(() => {
    setUserInput('');
    setReview(null);
    setIsLoading(false);
    setShowHints(false);
    setShowMenu(false);
  }, [item.id]);

  // Fetch Lesson Context (Grammar & Vocab) for AI
  useEffect(() => {
    const fetchContext = async () => {
      try {
        const [rules, vocab] = await Promise.all([
          grammarService.getRules(item.lessonId),
          vocabService.getWords(item.lessonId)
        ]);
        setContextRules(rules);
        setContextVocab(vocab);
      } catch (e) {
        console.error("Failed to fetch lesson context", e);
      }
    };
    
    if (item.lessonId) {
      fetchContext();
    }
  }, [item.lessonId]);

  // Click outside menu handler
  useEffect(() => {
    const handleClickOutside = () => setShowMenu(false);
    if(showMenu) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  const handleCheck = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!userInput.trim()) {
      toast.error("Please provide a translation first!");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Build Prompt Sections from Context State
      let grammarSection = "";
      if (contextRules.length > 0) {
          grammarSection = `\n[grammar rules]\nLearned Grammar Rules:\n${contextRules.map((r, i) => `${i+1}. ${r.title} — ${r.formulaAffirmative || r.pattern || ''}`).join('\n')}\n`;
      }

      let vocabSection = "";
      if (contextVocab.length > 0) {
          vocabSection = `\n[vocabulary]\nLearned Vocabulary:\n${contextVocab.map((v) => `${v.word} (${v.meaning})`).join(', ')}\n`;
      }

      const isE2B = item.direction === 'E2B';

      const prompt = `
তুমি একজন Language Teacher। একজন ছাত্র নির্দিষ্ট grammar rules ও vocabulary শিখে ${isE2B ? 'ইংরেজি থেকে বাংলা' : 'বাংলা থেকে ইংরেজি'} translate করেছে।

${grammarSection}
${vocabSection}

${isE2B ? 'Original (English)' : 'Original (Bengali)'}: "${item.bengaliText}"
Student's ${isE2B ? 'Bengali' : 'English'} translation: "${userInput}"

review করো এই JSON format এ:
{
  "score": 0, // 0-10
  "grammarReview": [
    {
      "ruleTitle": "rule name",
      "status": "correct" | "incorrect" | "not_used",
      "found": "text segment",
      "correction": "corrected segment (if incorrect)",
      "feedback": "বাংলায় feedback"
    }
  ],
  "vocabReview": {
    "used": ["word1", "word2"],
    "similar": [
      { "learned": "word", "usedInstead": "synonym", "ok": true }
    ],
    "notUsed": ["word3"],
    "feedback": "বাংলায় feedback"
  },
  "tips": ["tip1 in Bengali"],
  "correctedVersion": "Full corrected ${isE2B ? 'Bengali' : 'English'} text"
}

score 0-10 এ দাও।
grammarReview: শেখা rules থেকে কোনটা correct ব্যবহার করেছে, কোনটা incorrect, কোনটা ব্যবহারই করেনি — সব check করো।
vocabReview: শেখা words থেকে কোনটা ব্যবহার করেছে (used), কোনটা করেনি (notUsed)। synonym ব্যবহার করলে similar এ দেখাও।
tips ও feedback সব বাংলায় লেখো (অবশ্যই বাংলা অক্ষরে লিখবে, কোনোভাবেই ইংরেজি অক্ষরে বাংলিশ লিখবে না)। correctedVersion ${isE2B ? 'বাংলায়' : 'ইংরেজিতে'}।
শুধু JSON দাও, অন্য কিছু না।
`;

      const response = await aiManager.generateContent(
          '', 
          prompt, 
          { 
            responseMimeType: 'application/json',
            timeout: 70000 
          }
      );
      
      if (response.error) {
          toast.error(response.error);
          return;
      }

      const jsonText = response.text || "{}";
      let json: AIReviewData;
      try {
          const clean = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
          json = JSON.parse(clean);
      } catch (e) {
          console.warn("JSON parse failed, fallback");
          json = {
              score: 0,
              tips: [],
              correctedVersion: jsonText, // Fallback entire text
              grammarReview: [],
              vocabReview: { used: [], notUsed: [], similar: [] }
          };
      }

      setReview(json);
      onComplete(item.id);
      
    } catch (e: any) {
      console.error("Translation check error:", e);
      toast.error("Review failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setUserInput('');
    setReview(null);
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Counter & Status */}
      <div className="flex justify-end mb-2">
        <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${item.isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {currentIndex + 1}/{totalItems} {item.isCompleted ? '✅' : ''}
        </span>
      </div>

      {/* Bengali Text Card */}
      {/* Content source */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5 ml-1">
            <label className="text-[13px] font-sans tracking-[0.05em] uppercase font-bold text-text-secondary">
                {item.direction === 'E2B' ? 'English:' : 'বাংলা:'}
            </label>
            <div className="relative">
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    className="p-1 rounded-full text-text-secondary hover:bg-background transition-colors"
                >
                    <Icon name="more-vertical" size="sm" />
                </button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                    <div className="absolute right-0 top-6 z-20 bg-surface border border-border shadow-lg overflow-hidden min-w-[120px] animate-in fade-in zoom-in-95 duration-100">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(item); setShowMenu(false); }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-text-primary hover:bg-background border-b border-border flex items-center gap-2"
                        >
                            <Icon name="edit-3" size="sm" /> Edit
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id); setShowMenu(false); }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-error hover:bg-error/10 flex items-center gap-2"
                        >
                            <Icon name="trash-2" size="sm" /> Delete
                        </button>
                    </div>
                  </>
                )}
            </div>
        </div>
        <div className="bg-background border border-border p-3 text-[14px] text-text-primary font-serif leading-relaxed shadow-inner">
          {item.bengaliText}
        </div>
        
        {/* Hint Toggle Button */}
        {item.hints && item.hints.length > 0 && (
            <div className="mt-3">
                <button 
                    onClick={() => setShowHints(!showHints)}
                    className="flex items-center gap-1.5 px-3 py-1 border border-primary text-primary bg-primary/5 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all hover:bg-primary/10"
                >
                    <span>💡 Hints</span>
                </button>
                
                {/* Hint Display Box */}
                {showHints && (
                    <div className="mt-2 bg-surface border border-primary/20 p-3 animate-in slide-in-from-top-1 shadow-sm">
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {item.hints.map((hint, idx) => (
                                <div key={idx} className="flex flex-col text-[12px]">
                                    <span className="font-bold text-text-primary">{hint.bengaliWord}</span>
                                    <span className="text-text-secondary text-[11px] uppercase tracking-wider">{hint.englishHint}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* User Input */}
      <div className="mb-4">
        <label className="block text-[13px] font-sans tracking-[0.05em] uppercase font-bold text-text-secondary mb-1.5 ml-1">
            {item.direction === 'E2B' ? 'তোমার অনুবাদ (বাংলায়):' : 'তোমার অনুবাদ:'}
        </label>
        <textarea 
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={item.direction === 'E2B' ? "বাংলায় অনুবাদ লেখো..." : "ইংরেজিতে অনুবাদ লেখো..."}
          className="w-full min-h-[120px] bg-surface border border-border p-4 text-[14px] font-serif outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none placeholder:font-sans placeholder:text-text-secondary"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button 
          onClick={handleTryAgain}
          disabled={!userInput && !review}
          className="h-10 px-4 border border-border bg-background text-text-primary text-[11px] font-bold uppercase tracking-widest hover:border-text-secondary active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <Icon name="refresh-cw" size="sm" /> Try Again
        </button>
        
        <button 
          onClick={handleCheck}
          disabled={isLoading || !userInput}
          type="button" 
          className="h-10 flex-1 bg-primary text-white text-[11px] font-bold uppercase tracking-widest shadow-sm hover:bg-primary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Icon name="refresh-cw" size="sm" className="animate-spin -ml-1" /> Checking...
            </>
          ) : (
            <>
              <Icon name="check-circle" size="sm" className="-ml-1" /> Check
            </>
          )}
        </button>

        <div className="flex gap-1">
            <button 
            onClick={onPrev}
            disabled={currentIndex === 0}
            className="w-10 h-10 border border-border bg-surface text-text-primary flex items-center justify-center hover:border-text-secondary active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
            <Icon name="chevron-left" size="sm" />
            </button>
            <button 
            onClick={onNext}
            disabled={currentIndex === totalItems - 1}
            className="w-10 h-10 border border-border bg-surface text-text-primary flex items-center justify-center hover:border-text-secondary active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
            <Icon name="chevron-right" size="sm" />
            </button>
        </div>
      </div>

      {/* AI Review */}
      {review && <ReviewBox review={review} />}
    </div>
  );
};

export default TranslationView;
