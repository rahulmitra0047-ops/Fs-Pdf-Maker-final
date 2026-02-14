
import React, { useState, useEffect } from 'react';
import { TranslationItem } from '../../../types';
import PremiumButton from '../../../shared/components/PremiumButton';
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
}

const TranslationView: React.FC<Props> = ({ 
  item, currentIndex, totalItems, onNext, onPrev, onComplete 
}) => {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [review, setReview] = useState<AIReviewData | null>(null);
  const toast = useToast();

  useEffect(() => {
    setUserInput('');
    setReview(null);
    setIsLoading(false);
  }, [item.id]);

  const handleCheck = async (e?: React.MouseEvent) => {
    // Prevent any form submission or default behavior
    if (e) e.preventDefault();

    if (!userInput.trim()) {
      toast.error("আগে অনুবাদ লেখো!");
      return;
    }

    setIsLoading(true);
    try {
      const prompt = `তুমি একজন English teacher। একজন বাংলাভাষী ছাত্র বাংলা থেকে ইংরেজি translate করেছে। তার translation review করো।

বাংলা original: "${item.bengaliText}"
ছাত্রের translation: "${userInput}"

এই JSON format এ response দাও:
{
  "score": 8,
  "good": ["point 1", "point 2"],
  "errors": [
    {
      "wrong": "wrong sentence",
      "correct": "correct sentence",
      "reason": "কেন ভুল বাংলায়"
    }
  ],
  "tips": ["tip 1 বাংলায়"],
  "correctedVersion": "full corrected text"
}

score 0-10 এ দাও। good, errors, tips বাংলায় লেখো। correctedVersion ইংরেজিতে। শুধু JSON দাও।`;

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
      console.error("Translation check error:", e);
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
      {/* Counter & Status */}
      <div className="flex justify-end mb-2">
        <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${item.isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {currentIndex + 1}/{totalItems} {item.isCompleted ? '✅' : ''}
        </span>
      </div>

      {/* Bengali Text */}
      <div className="mb-4">
        <label className="block text-[13px] font-bold text-[#374151] mb-1.5 ml-1">বাংলা:</label>
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[12px] p-3 text-[14px] text-[#111827] leading-relaxed">
          {item.bengaliText}
        </div>
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
          type="button" // Explicitly type as button to prevent submit
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
