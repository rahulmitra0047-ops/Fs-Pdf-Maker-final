
import React, { useState, useEffect } from 'react';
import { PracticeTopic } from '../../../types';
import ReviewBox, { AIReviewData } from './ReviewBox';
import { useToast } from '../../../shared/context/ToastContext';
import Icon from '../../../shared/components/Icon';
import { aiManager } from '../../../core/ai/aiManager';

interface Props {
  item: PracticeTopic;
  currentIndex: number;
  totalItems: number;
  onNext: () => void;
  onPrev: () => void;
  onComplete: (id: string) => void;
}

const TopicView: React.FC<Props> = ({ 
  item, currentIndex, totalItems, onNext, onPrev, onComplete 
}) => {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [review, setReview] = useState<AIReviewData | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const toast = useToast();

  useEffect(() => {
    setUserInput('');
    setReview(null);
    setIsLoading(false);
    setWordCount(0);
  }, [item.id]);

  useEffect(() => {
    const count = userInput.trim() ? userInput.trim().split(/\s+/).length : 0;
    setWordCount(count);
  }, [userInput]);

  const handleCheck = async (e?: React.MouseEvent) => {
    // Prevent defaults
    if (e) e.preventDefault();

    if (!userInput.trim()) {
      toast.error("আগে কিছু লেখো!");
      return;
    }

    setIsLoading(true);
    try {
      const prompt = `তুমি একজন IELTS writing examiner। একজন বাংলাভাষী ছাত্র একটা topic এ ইংরেজিতে লিখেছে। তার writing review করো।

Topic: "${item.title}"
Instruction: "${item.instruction || ''}"
Student's writing: "${userInput}"

এই JSON format এ response দাও:
{
  "score": 7,
  "good": ["point 1 বাংলায়", "point 2"],
  "errors": [
    {
      "wrong": "wrong part",
      "correct": "correct version",
      "reason": "কেন ভুল বাংলায়"
    }
  ],
  "tips": ["tip 1 বাংলায়"],
  "correctedVersion": "full corrected text"
}

score 0-10 এ দাও। good, errors, tips বাংলায়। correctedVersion ইংরেজিতে। grammar, vocabulary, coherence, task response সব বিবেচনা করো। শুধু JSON দাও।`;

      const response = await aiManager.generateContent(
          'gemini-2.5-flash', 
          prompt, 
          { responseMimeType: 'application/json' }
      );
      
      if (response.error) {
          toast.error(response.error);
          return;
      }

      if (response.text) {
          const json = JSON.parse(response.text);
          setReview(json);
          onComplete(item.id);
      }
      
    } catch (e: any) {
      console.error("Topic check error:", e);
      toast.error("Review failed.");
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
      {/* Counter */}
      <div className="flex justify-end mb-2">
        <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${item.isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {currentIndex + 1}/{totalItems} {item.isCompleted ? '✅' : ''}
        </span>
      </div>

      {/* Topic Display */}
      <div className="mb-4">
        <label className="block text-[13px] font-bold text-[#374151] mb-1.5 ml-1">📝 Topic:</label>
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[12px] p-4">
          <h3 className="text-[16px] font-bold text-[#111827] mb-1">{item.title}</h3>
          {item.instruction && (
            <p className="text-[12px] text-[#6B7280] italic flex items-start gap-1">
              <span>💡</span> {item.instruction}
            </p>
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
        <div className="text-right text-[11px] text-[#9CA3AF] mt-1 font-medium">
          Words: {wordCount}
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
          type="button" // Explicitly type as button
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
