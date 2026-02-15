import React from 'react';
import Icon from '../../../shared/components/Icon';
import { useToast } from '../../../shared/context/ToastContext';

export interface GrammarReviewItem {
  ruleTitle: string;
  status: 'correct' | 'incorrect' | 'not_used';
  found?: string;
  correction?: string;
  feedback: string;
}

export interface VocabReviewData {
  used: string[];
  similar?: { learned: string; usedInstead: string; ok: boolean }[];
  notUsed: string[];
  feedback?: string;
}

export interface IELTSCriteriaItem {
  band: number;
  feedback: string;
}

export interface IELTSCriteria {
  taskResponse?: IELTSCriteriaItem;
  coherence?: IELTSCriteriaItem;
  vocabulary?: IELTSCriteriaItem;
  grammar?: IELTSCriteriaItem;
}

export interface AIReviewData {
  // Scores
  score?: number; // Job/Translation (0-10)
  bandScore?: number; // IELTS (0-9)
  
  // Sections
  criteria?: IELTSCriteria; // IELTS breakdown
  grammarReview?: GrammarReviewItem[];
  vocabReview?: VocabReviewData;
  tips?: string[];
  correctedVersion?: string;

  // Legacy fallback (optional)
  good?: string[];
  errors?: any[];
}

interface Props {
  review: AIReviewData;
}

const ReviewBox: React.FC<Props> = ({ review }) => {
  const toast = useToast();

  const handleCopy = () => {
    if (review.correctedVersion) {
      navigator.clipboard.writeText(review.correctedVersion);
      toast.success("Copied!");
    }
  };

  // --- Helpers ---

  const getScoreLabel = (score: number) => {
    if (score >= 9) return "Excellent! 🌟";
    if (score >= 7) return "Very Good! 👏";
    if (score >= 5) return "Good 💪";
    return "আরো চেষ্টা করো 📚";
  };

  const getBandLabel = (band: number) => {
    if (band >= 7.0) return "Good! 👏";
    if (band >= 5.5) return "Keep practicing 💪";
    return "Need improvement 📚";
  };

  const getBandColor = (band: number) => {
    if (band >= 7.0) return "text-[#059669]";
    if (band >= 5.5) return "text-[#D97706]";
    return "text-[#DC2626]";
  };

  // --- Render Sections ---

  const renderScoreSection = () => {
    // IELTS Band Score
    if (typeof review.bandScore === 'number') {
      return (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-dashed border-[#6366F1]/20">
          <div className="text-[20px] font-bold text-[#6366F1]">
            📊 Estimated Band: {review.bandScore}
          </div>
          <div className="text-[14px] font-medium text-[#4B5563]">
            {getBandLabel(review.bandScore)}
          </div>
        </div>
      );
    }
    // Job/Standard Score
    if (typeof review.score === 'number') {
      return (
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-dashed border-[#6366F1]/20">
          <span className="text-[15px] font-bold text-[#6366F1]">📊 {review.score}/10</span>
          <span className="text-[14px] font-medium text-[#4B5563]">- {getScoreLabel(review.score)}</span>
        </div>
      );
    }
    return null;
  };

  const renderIELTSCriteria = () => {
    if (!review.criteria) return null;
    const { taskResponse, coherence, vocabulary, grammar } = review.criteria;
    
    const items = [
      { name: 'Task Response', icon: 'target', data: taskResponse },
      { name: 'Coherence & Cohesion', icon: 'link', data: coherence },
      { name: 'Lexical Resource', icon: 'book', data: vocabulary },
      { name: 'Grammar Accuracy', icon: 'check-circle', data: grammar },
    ];

    if (items.every(i => !i.data)) return null;

    return (
      <div className="mb-6 pb-4 border-b border-dashed border-[#6366F1]/20">
        <h4 className="text-[13px] font-bold text-[#374151] mb-3 uppercase tracking-wide">IELTS Criteria Breakdown</h4>
        <div className="flex flex-col gap-3">
          {items.map((item, idx) => item.data ? (
            <div key={idx} className="bg-white rounded-[10px] p-3 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400"><Icon name={item.icon as any} size="sm" /></span>
                  <span className="text-[13px] font-bold text-[#111827]">{item.name}</span>
                </div>
                <span className={`text-[13px] font-bold ${getBandColor(item.data.band)}`}>{item.data.band}</span>
              </div>
              <p className="text-[12px] text-gray-500 leading-relaxed pl-6">{item.data.feedback}</p>
            </div>
          ) : null)}
        </div>
      </div>
    );
  };

  const renderGrammarReview = () => {
    if (!review.grammarReview || review.grammarReview.length === 0) return null;

    const correctCount = review.grammarReview.filter(r => r.status === 'correct').length;
    const totalCount = review.grammarReview.filter(r => r.status !== 'not_used').length;

    return (
      <div className="mb-6 pb-4 border-b border-dashed border-[#6366F1]/20">
        <h4 className="text-[13px] font-bold text-[#374151] mb-3 flex items-center gap-2">
          <span>📐 Grammar Rules</span>
          <span className="text-[11px] font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {correctCount}/{totalCount} correct
          </span>
        </h4>
        
        <div className="space-y-2">
          {review.grammarReview.map((item, idx) => {
            if (item.status === 'correct') {
              return (
                <div key={idx} className="bg-green-50 border border-green-200 rounded-[8px] p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">✅</span>
                    <span className="text-[12px] font-bold text-green-800">{item.ruleTitle}</span>
                  </div>
                  <div className="text-[12px] text-green-900 ml-5">
                    "{item.found}" — <span className="font-medium">{item.feedback || 'সঠিক!'}</span>
                  </div>
                </div>
              );
            }
            if (item.status === 'incorrect') {
              return (
                <div key={idx} className="bg-red-50 border border-red-200 rounded-[8px] p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">❌</span>
                    <span className="text-[12px] font-bold text-red-800">{item.ruleTitle}</span>
                  </div>
                  <div className="ml-5 space-y-1">
                    <div className="text-[12px] text-red-900">
                      <span className="line-through opacity-70 decoration-red-400">{item.found}</span>
                      <span className="mx-2">→</span>
                      <span className="font-bold">{item.correction}</span>
                    </div>
                    {item.feedback && (
                      <div className="text-[11px] text-gray-500 italic">
                        💬 {item.feedback}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            // not_used
            return (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-[8px] p-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">⚪</span>
                  <span className="text-[12px] font-medium text-gray-600">{item.ruleTitle}</span>
                </div>
                <div className="text-[11px] text-gray-400 ml-5 mt-0.5">
                  💡 {item.feedback || 'ব্যবহার করা হয়নি'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderVocabReview = () => {
    if (!review.vocabReview) return null;
    const { used, similar, notUsed, feedback } = review.vocabReview;
    const totalUsed = (used?.length || 0) + (similar?.length || 0);
    const total = totalUsed + (notUsed?.length || 0);

    if (total === 0) return null;

    return (
      <div className="mb-6 pb-4 border-b border-dashed border-[#6366F1]/20">
        <h4 className="text-[13px] font-bold text-[#374151] mb-3 flex items-center gap-2">
          <span>📚 Vocabulary</span>
          <span className="text-[11px] font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {totalUsed}/{total} used
          </span>
        </h4>

        <div className="flex flex-wrap gap-2 mb-3">
          {used?.map((w, i) => (
            <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-green-100 text-green-700 border border-green-200">
              ✅ {w}
            </span>
          ))}
          {similar?.map((s, i) => (
            <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700 border border-blue-200" title={`Learned: ${s.learned}`}>
              👍 {s.usedInstead}
            </span>
          ))}
          {notUsed?.map((w, i) => (
            <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
              ⚪ {w}
            </span>
          ))}
        </div>
        
        {feedback && (
          <p className="text-[12px] text-gray-500 italic leading-relaxed">
            💬 {feedback}
          </p>
        )}
      </div>
    );
  };

  const renderTips = () => {
    if (!review.tips || review.tips.length === 0) return null;
    return (
      <div className="mb-4">
        <h4 className="text-[13px] font-bold text-[#D97706] mb-2 flex items-center gap-1.5">
          <Icon name="sparkles" size="sm" /> পরামর্শ:
        </h4>
        <ul className="pl-1 space-y-1">
          {review.tips.map((tip, idx) => (
            <li key={idx} className="text-[12px] text-[#374151] flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-[#D97706] flex-shrink-0"></span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="mt-4 rounded-[14px] border border-[#6366F1]/15 bg-[#6366F1]/[0.04] p-[16px] animate-in slide-in-from-bottom-2 duration-300">
      {renderScoreSection()}
      {renderIELTSCriteria()}
      {renderGrammarReview()}
      {renderVocabReview()}
      {renderTips()}

      {/* Corrected Version */}
      {review.correctedVersion && (
        <div className="mt-4 pt-4 border-t border-dashed border-[#6366F1]/20">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-[13px] font-bold text-[#111827]">📝 সঠিক Version:</h4>
            <button 
              onClick={handleCopy}
              className="text-[10px] font-bold text-[#6366F1] bg-white border border-[#6366F1]/20 px-2 py-1 rounded-[6px] hover:bg-[#EEF2FF] active:scale-95 transition-all"
            >
              Copy
            </button>
          </div>
          <div className="bg-white rounded-[10px] p-3 border border-gray-200 text-[13px] text-[#374151] leading-relaxed">
            {review.correctedVersion}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewBox;