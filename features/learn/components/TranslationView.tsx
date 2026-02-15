import React, { useState, useEffect } from 'react';
import { TranslationItem } from '../../../types';
import ReviewBox, { AIReviewData } from './ReviewBox';
import { useToast } from '../../../shared/context/ToastContext';
import Icon from '../../../shared/components/Icon';
import { aiManager } from '../../../core/ai/aiManager';

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
  const toast = useToast();

  useEffect(() => {
    setUserInput('');
    setReview(null);
    setIsLoading(false);
    setShowHints(false);
    setShowMenu(false);
  }, [item.id]);

  // Click outside menu handler
  useEffect(() => {
    const handleClickOutside = () => setShowMenu(false);
    if(showMenu) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  // Helper to fetch lesson data
  const getLessonData = (lessonId: string) => {
    try {
        const saved = localStorage.getItem('mock_lessons_local');
        if (!saved) return { rules: [], vocab: [] };
        const lessons = JSON.parse(saved);
        const found = lessons.find((l: any) => l.id === lessonId);
        if (!found) return { rules: [], vocab: [] };

        let rules: any[] = [];
        if (found.grammar) {
            try {
                const parsed = JSON.parse(found.grammar);
                rules = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                if (found.grammar.trim()) rules = [{ title: 'Grammar Rule', explanation: found.grammar }];
            }
        }

        let vocab: any[] = [];
        if (found.vocabList && Array.isArray(found.vocabList)) {
            vocab = found.vocabList;
        } else if (found.vocabulary) {
            vocab = found.vocabulary.split('\n').filter((l:string) => l.trim()).map((l:string) => {
                const parts = l.split(/[-=]/);
                return { word: parts[0]?.trim(), meaning: parts[1]?.trim() || '' };
            });
        }

        return { rules, vocab };
    } catch (e) {
        console.error(e);
        return { rules: [], vocab: [] };
    }
  };

  const handleCheck = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!userInput.trim()) {
      toast.error("আগে অনুবাদ লেখো!");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Fetch Lesson Data
      const { rules, vocab } = getLessonData(item.lessonId);

      // 2. Build Prompt Sections
      let grammarSection = "";
      if (rules.length > 0) {
          grammarSection = `\n[grammar rules]\nLearned Grammar Rules:\n${rules.map((r: any, i: number) => `${i+1}. ${r.title} — ${r.formulaAffirmative || r.pattern || ''}`).join('\n')}\n`;
      }

      let vocabSection = "";
      if (vocab.length > 0) {
          vocabSection = `\n[vocabulary]\nLearned Vocabulary:\n${vocab.map((v: any) => `${v.word} (${v.meaning})`).join(', ')}\n`;
      }

      const prompt = `
তুমি একজন English teacher। একজন বাংলাভাষী ছাত্র নির্দিষ্ট grammar rules ও vocabulary শিখে বাংলা থেকে ইংরেজি translate করেছে।

${grammarSection}
${vocabSection}

বাংলা original: "${item.bengaliText}"
ছাত্রের translation: "${userInput}"

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
  "correctedVersion": "Full corrected English text"
}

score 0-10 এ দাও।
grammarReview: শেখা rules থেকে কোনটা correct ব্যবহার করেছে, কোনটা incorrect, কোনটা ব্যবহারই করেনি — সব check করো।
vocabReview: শেখা words থেকে কোনটা ব্যবহার করেছে (used), কোনটা করেনি (notUsed)। synonym ব্যবহার করলে similar এ দেখাও।
tips ও feedback সব বাংলায় লেখো। correctedVersion ইংরেজিতে।
শুধু JSON দাও, অন্য কিছু না।
`;

      const response = await aiManager.generateContent(
          'gemini-3-flash-preview', 
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
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5 ml-1">
            <label className="text-[13px] font-bold text-[#374151]">বাংলা:</label>
            <div className="relative">
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                >
                    <Icon name="more-vertical" size="sm" />
                </button>
                {showMenu && (
                    <div className="absolute right-0 top-6 z-10 bg-white border border-gray-100 shadow-lg rounded-lg overflow-hidden min-w-[120px] animate-in fade-in zoom-in-95 duration-100">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(item); setShowMenu(false); }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Icon name="edit-3" size="sm" /> Edit
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id); setShowMenu(false); }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                            <Icon name="trash-2" size="sm" /> Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[12px] p-3 text-[14px] text-[#111827] leading-relaxed">
          {item.bengaliText}
        </div>
        
        {/* Hint Toggle Button */}
        {item.hints && item.hints.length > 0 && (
            <div className="mt-2">
                <button 
                    onClick={() => setShowHints(!showHints)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#6366F1] text-[#6366F1] bg-white text-[11px] font-bold active:scale-95 transition-all hover:bg-indigo-50"
                >
                    <span>💡 Hints</span>
                </button>
                
                {/* Hint Display Box */}
                {showHints && (
                    <div className="mt-2 bg-[#FFFBEB] border border-[#FEF3C7] rounded-[10px] p-2.5 animate-in slide-in-from-top-1">
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {item.hints.map((hint, idx) => (
                                <div key={idx} className="text-[12px] text-gray-700">
                                    <span className="font-bold">{hint.bengaliWord}</span>
                                    <span className="text-gray-400 mx-1">→</span>
                                    <span className="text-gray-600">{hint.englishHint}</span>
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
        <label className="block text-[13px] font-bold text-[#374151] mb-1.5 ml-1">তোমার অনুবাদ:</label>
        <textarea 
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="ইংরেজিতে অনুবাদ লেখো..."
          className="w-full min-h-[120px] bg-white border border-[#E5E7EB] rounded-[12px] p-3 text-[14px] outline-none focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/10 transition-all resize-none placeholder:text-gray-400"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button 
          onClick={handleTryAgain}
          disabled={!userInput && !review}
          className="h-[38px] px-3 border border-[#E5E7EB] text-[#6B7280] rounded-[10px] text-[13px] font-medium hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
        >
          🔄 Try Again
        </button>
        
        <button 
          onClick={handleCheck}
          disabled={isLoading || !userInput}
          type="button" 
          className="h-[38px] flex-1 bg-[#6366F1] text-white rounded-[10px] text-[13px] font-bold shadow-md shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Icon name="refresh-cw" size="sm" className="animate-spin" /> Checking...
            </>
          ) : (
            <>
              ✨ Check
            </>
          )}
        </button>

        <div className="flex gap-1">
            <button 
            onClick={onPrev}
            disabled={currentIndex === 0}
            className="h-[38px] px-3 border border-[#E5E7EB] text-[#6366F1] rounded-[10px] text-[13px] font-bold hover:bg-indigo-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
            ←
            </button>
            <button 
            onClick={onNext}
            disabled={currentIndex === totalItems - 1}
            className="h-[38px] px-3 border border-[#6366F1] text-[#6366F1] rounded-[10px] text-[13px] font-bold hover:bg-indigo-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:border-[#E5E7EB] disabled:text-[#9CA3AF]"
            >
            Next →
            </button>
        </div>
      </div>

      {/* AI Review */}
      {review && <ReviewBox review={review} />}
    </div>
  );
};

export default TranslationView;