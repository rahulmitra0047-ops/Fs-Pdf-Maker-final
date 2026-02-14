import React from 'react';
import Icon from '../../../shared/components/Icon';
import { useToast } from '../../../shared/context/ToastContext';

export interface AIReviewData {
  score: number;
  good: string[];
  errors: { wrong: string; correct: string; reason: string }[];
  tips: string[];
  correctedVersion: string;
}

interface Props {
  review: AIReviewData;
}

const ReviewBox: React.FC<Props> = ({ review }) => {
  const toast = useToast();

  const getScoreLabel = (score: number) => {
    if (score >= 9) return "Excellent! 🌟";
    if (score >= 7) return "Very Good! 👏";
    if (score >= 5) return "Good, কিন্তু আরো practice করো 💪";
    return "আরো চেষ্টা করো 📚";
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(review.correctedVersion);
    toast.success("Copied!");
  };

  return (
    <div className="mt-4 rounded-[14px] border border-[#6366F1]/15 bg-[#6366F1]/[0.04] p-[14px] animate-in slide-in-from-bottom-2 duration-300">
      {/* Score */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-dashed border-[#6366F1]/20">
        <span className="text-[15px] font-bold text-[#6366F1]">📊 {review.score}/10</span>
        <span className="text-[14px] font-medium text-[#4B5563]">- {getScoreLabel(review.score)}</span>
      </div>

      {/* Good Points */}
      {review.good && review.good.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[13px] font-bold text-[#059669] mb-1.5 flex items-center gap-1.5">
            <Icon name="check-circle" size="sm" /> ভালো হয়েছে:
          </h4>
          <ul className="pl-1 space-y-0.5">
            {review.good.map((point, idx) => (
              <li key={idx} className="text-[12px] text-[#374151] flex items-start gap-1.5">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-[#059669] flex-shrink-0"></span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors */}
      {review.errors && review.errors.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[13px] font-bold text-[#DC2626] mb-2 flex items-center gap-1.5">
            <Icon name="alert-triangle" size="sm" /> ভুলগুলো:
          </h4>
          <div className="space-y-1.5">
            {review.errors.map((err, idx) => (
              <div key={idx} className="bg-red-50 rounded-[8px] p-2 border border-red-100">
                <div className="text-[12px] text-[#DC2626] line-through decoration-red-400 opacity-80 mb-0.5">
                  {err.wrong}
                </div>
                <div className="text-[12px] text-[#059669] font-medium mb-1">
                  {err.correct}
                </div>
                {err.reason && (
                  <div className="text-[11px] text-[#6B7280] italic">
                    💡 {err.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {review.tips && review.tips.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[13px] font-bold text-[#D97706] mb-1.5 flex items-center gap-1.5">
            <Icon name="sparkles" size="sm" /> পরামর্শ:
          </h4>
          <ul className="pl-1 space-y-0.5">
            {review.tips.map((tip, idx) => (
              <li key={idx} className="text-[12px] text-[#374151] flex items-start gap-1.5">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-[#D97706] flex-shrink-0"></span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Divider */}
      {(review.good?.length || review.errors?.length || review.tips?.length) && (
        <div className="h-px bg-[#6366F1]/10 border-t border-dashed border-[#6366F1]/20 my-3"></div>
      )}

      {/* Corrected Version */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <h4 className="text-[13px] font-bold text-[#111827]">📝 সঠিক Version:</h4>
          <button 
            onClick={handleCopy}
            className="text-[10px] font-bold text-[#6366F1] bg-white border border-[#6366F1]/20 px-2 py-0.5 rounded-[4px] hover:bg-[#EEF2FF] active:scale-95 transition-all"
          >
            Copy
          </button>
        </div>
        <div className="bg-white rounded-[8px] p-2.5 border border-gray-200 text-[12px] text-[#374151] leading-relaxed">
          {review.correctedVersion}
        </div>
      </div>
    </div>
  );
};

export default ReviewBox;