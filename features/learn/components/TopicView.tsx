
import React, { useState, useEffect } from 'react';
import { PracticeTopic, GrammarRule, VocabWord } from '../../../types';
import ReviewBox, { AIReviewData } from './ReviewBox';
import { useToast } from '../../../shared/context/ToastContext';
import Icon from '../../../shared/components/Icon';
import { aiManager } from '../../../core/ai/aiManager';
import { grammarService, vocabService } from '../../../core/storage/services';

interface Props {
  item: PracticeTopic;
  currentIndex: number;
  totalItems: number;
  onNext: () => void;
  onPrev: () => void;
  onComplete: (id: string) => void;
  onEdit?: (item: PracticeTopic) => void;
  onDelete?: (id: string) => void;
}

const TopicView: React.FC<Props> = ({ 
  item, currentIndex, totalItems, onNext, onPrev, onComplete, onEdit, onDelete
}) => {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [review, setReview] = useState<AIReviewData | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  
  // Lesson Context State
  const [contextRules, setContextRules] = useState<GrammarRule[]>([]);
  const [contextVocab, setContextVocab] = useState<VocabWord[]>([]);
  
  const toast = useToast();

  useEffect(() => {
    setUserInput('');
    setReview(null);
    setIsLoading(false);
    setWordCount(0);
    setShowMenu(false);
  }, [item.id]);

  useEffect(() => {
    const count = userInput.trim() ? userInput.trim().split(/\s+/).length : 0;
    setWordCount(count);
  }, [userInput]);

  // Fetch Lesson Context
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowMenu(false);
    if(showMenu) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  const handleCheck = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!userInput.trim()) {
      toast.error("আগে কিছু লেখো!");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Build Prompt Sections from Context State
      let grammarSection = "";
      if (contextRules.length > 0) {
          grammarSection = `\n[grammar rules]\nLearned Rules:\n${contextRules.map((r, i) => `${i+1}. ${r.title} — ${r.formulaAffirmative || r.pattern || ''}`).join('\n')}\n`;
      }

      let vocabSection = "";
      if (contextVocab.length > 0) {
          vocabSection = `\n[vocabulary]\nLearned Vocabulary:\n${contextVocab.map((v) => `${v.word} (${v.meaning})`).join(', ')}\n`;
      }

      let prompt = "";
      
      if (item.type === 'ielts') {
          // IELTS PROMPT
          prompt = `
তুমি একজন IELTS examiner। একজন বাংলাভাষী ছাত্র নির্দিষ্ট grammar rules ও vocabulary শিখে IELTS writing করেছে।

${grammarSection}
${vocabSection}

Task Type: ${item.ieltsTaskType === 'task2' ? 'Task 2' : 'Task 1'}
Topic: "${item.title}"
Instruction: "${item.instruction || ''}"
Student's writing: "${userInput}"

review করো এই JSON format এ:
{
  "bandScore": 6.5, // 0-9, 0.5 increment
  "criteria": {
    "taskResponse": { "band": 7.0, "feedback": "Topic covered well" },
    "coherence": { "band": 6.5, "feedback": "Linking needs improvement" },
    "vocabulary": { "band": 6.0, "feedback": "Feedback..." },
    "grammar": { "band": 6.5, "feedback": "Feedback..." }
  },
  "grammarReview": [
    { "ruleTitle": "rule", "status": "correct"|"incorrect"|"not_used", "found": "text", "correction": "fix", "feedback": "bengali" }
  ],
  "vocabReview": {
    "used": ["word1"],
    "similar": [{ "learned": "word", "usedInstead": "synonym", "ok": true }],
    "notUsed": ["word2"],
    "feedback": "bengali"
  },
  "tips": ["tip1 in Bengali"],
  "correctedVersion": "Full corrected English text"
}

IELTS band score 0-9. 4 criteria আলাদাভাবে score করো.
grammar rules ও vocabulary check করো।
সব feedback বাংলায়। correctedVersion ইংরেজিতে।
শুধু JSON দাও।
`;
      } else {
          // JOB / GENERAL PROMPT
          prompt = `
তুমি একজন English teacher। একজন বাংলাভাষী ছাত্র নির্দিষ্ট grammar rules ও vocabulary শিখে একটা topic এ ইংরেজিতে লিখেছে।

${grammarSection}
${vocabSection}

Topic: "${item.title}"
Instruction: "${item.instruction || ''}"
Student's writing: "${userInput}"

review করো এই JSON format এ:
{
  "score": 7, // 0-10
  "grammarReview": [
    { "ruleTitle": "rule", "status": "correct"|"incorrect"|"not_used", "found": "text", "correction": "fix", "feedback": "bengali" }
  ],
  "vocabReview": {
    "used": ["word1"],
    "similar": [{ "learned": "word", "usedInstead": "synonym", "ok": true }],
    "notUsed": ["word2"],
    "feedback": "bengali"
  },
  "tips": ["tip1 in Bengali"],
  "correctedVersion": "Full corrected English text"
}

score 0-10.
grammar rules ও vocabulary check করো।
সব feedback বাংলায়। correctedVersion ইংরেজিতে।
শুধু JSON দাও।
`;
      }

      const response = await aiManager.generateContent(
          'gemini-3-flash-preview', 
          prompt, 
          { 
            responseMimeType: 'application/json',
            timeout: 90000 
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
              correctedVersion: jsonText
          };
      }

      setReview(json);
      onComplete(item.id);
      
    } catch (e: any) {
      console.error("Topic check error:", e);
      toast.error("Review failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setUserInput('');
    setReview(null);
  };

  const getWordCountColor = () => {
      if (!item.minWords || item.minWords === 0) return 'text-[#9CA3AF]';
      if (wordCount >= item.minWords) return 'text-[#059669] font-bold'; // Green
      if (wordCount >= item.minWords * 0.6) return 'text-[#D97706]'; // Amber
      return 'text-[#DC2626]'; // Red
  };

  const getWordCountText = () => {
      if (!item.minWords || item.minWords === 0) return `Words: ${wordCount}`;
      return `Words: ${wordCount}/${item.minWords}`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Counter */}
      <div className="flex justify-end mb-2">
        <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${item.isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {currentIndex + 1}/{totalItems} {item.isCompleted ? '✅' : ''}
        </span>
      </div>

      {/* Topic Display */}
      <div className="mb-4">
        <div className="flex justify-between items-start mb-1.5 ml-1">
            <label className="text-[13px] font-bold text-[#374151]">📝 Topic:</label>
            <div className="relative">
                {(onEdit && onDelete) && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                        <Icon name="more-vertical" size="sm" />
                    </button>
                )}
                {showMenu && onEdit && onDelete && (
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
        
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[12px] p-4">
          <div className="flex items-start gap-2 mb-1">
              {item.type === 'ielts' && <span className="text-lg">🌍</span>}
              {item.type === 'job' && <span className="text-lg">📋</span>}
              <h3 className="text-[16px] font-bold text-[#111827] leading-snug">{item.title}</h3>
          </div>
          
          {item.instruction && (
            <p className="text-[13px] text-[#6B7280] italic mt-1 leading-relaxed">
              {item.instruction}
            </p>
          )}
          
          {item.type === 'ielts' && item.minWords && item.minWords > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                  <Icon name="file-text" size="sm" className="text-gray-400 w-3 h-3" />
                  <span className="text-[11px] text-gray-400 font-medium">{item.minWords}+ words</span>
              </div>
          )}
        </div>
      </div>

      {/* User Input */}
      <div className="mb-4">
        <textarea 
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="এই topic নিয়ে ইংরেজিতে লেখো..."
          className="w-full min-h-[200px] bg-white border border-[#E5E7EB] rounded-[12px] p-3 text-[14px] outline-none focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/10 transition-all resize-none placeholder:text-gray-400"
        />
        <div className={`text-right text-[11px] mt-1 transition-colors ${getWordCountColor()}`}>
          {getWordCountText()}
        </div>
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

export default TopicView;
