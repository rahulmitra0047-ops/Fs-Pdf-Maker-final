import React, { memo } from 'react';
import { MCQ } from '../../../types';
import Icon from '../../../shared/components/Icon';
import CheckmarkIcon from '../../../shared/components/CheckmarkIcon';
import { MCQAttempt } from '../services/mcqTrackingService';

interface QuestionCardProps {
    mcq: MCQ;
    currentIndex: number;
    totalQuestions: number;
    selectedOption?: string;
    hasAnswered: boolean;
    attemptData?: MCQAttempt;
    aiExplanation?: string;
    isAiLoading: boolean;
    showExplanation: boolean;
    onAnswer: (option: string) => void;
    onAiExplain: () => void;
    formatLastAttempt: (isoDate: string) => { relative: string; exact: string };
}

const QuestionCard: React.FC<QuestionCardProps> = memo(({
    mcq,
    selectedOption,
    hasAnswered,
    attemptData,
    aiExplanation,
    isAiLoading,
    showExplanation,
    onAnswer,
    onAiExplain,
    formatLastAttempt
}) => {
    return (
        <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-[24px] p-6 mb-6 shadow-sm border border-slate-100">
                <h2 className="text-[18px] font-semibold text-slate-800 leading-[1.6]">
                    {mcq.question}
                </h2>
                {attemptData && (
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 font-medium bg-slate-50 px-3 py-1.5 rounded-lg w-fit border border-slate-100">
                        <Icon name="clock" size="xs" />
                        <span>Last attempted: <span className="text-slate-600">{formatLastAttempt(attemptData.lastAttemptedAt).relative}</span></span>
                        <span className="text-slate-300">|</span>
                        <span>{new Date(attemptData.lastAttemptedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-[12px]">
                {['A', 'B', 'C', 'D'].map((opt) => {
                    const text = mcq[`option${opt}` as keyof MCQ] as string;
                    let containerClass = "bg-white border-[1.5px] border-slate-100";
                    let circleClass = "bg-slate-50 text-slate-500";
                    let textClass = "text-slate-600";

                    if (hasAnswered) {
                        if (opt === mcq.answer) {
                            containerClass = "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500";
                            circleClass = "bg-emerald-500 text-white";
                            textClass = "text-emerald-900 font-medium";
                        } else if (opt === selectedOption) {
                            containerClass = "bg-red-50 border-red-400 ring-1 ring-red-400";
                            circleClass = "bg-red-500 text-white";
                            textClass = "text-red-900";
                        } else {
                            containerClass = "bg-white border-slate-100 opacity-50 grayscale";
                        }
                    }

                    return (
                        <button
                            key={opt}
                            onClick={() => onAnswer(opt)}
                            disabled={hasAnswered}
                            className={`w-full rounded-[20px] p-4 px-5 flex items-center text-left transition-all duration-200 ease-out ${containerClass} ${!hasAnswered ? 'hover:border-emerald-200 hover:bg-emerald-50/30 active:scale-[0.98]' : ''}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0 transition-colors ${circleClass}`}>
                                {hasAnswered && opt === mcq.answer ? <CheckmarkIcon size={16} color="white" className="ml-0" /> : hasAnswered && opt === selectedOption ? <span className="text-[14px]">✕</span> : opt}
                            </div>
                            <span className={`text-[16px] font-normal ml-4 leading-snug ${textClass}`}>{text}</span>
                        </button>
                    );
                })}
            </div>

            {/* Standard Explanation & AI Trigger */}
            {hasAnswered && (
                <div className="mt-8 space-y-4">
                    {/* AI Action Row */}
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Solution</span>
                        {!aiExplanation && (
                            <button 
                                onClick={onAiExplain}
                                disabled={isAiLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full text-xs font-bold shadow-lg shadow-emerald-200 active:scale-95 transition-all disabled:opacity-50 hover:shadow-emerald-300"
                            >
                                <Icon name="sparkles" size="sm" className={isAiLoading ? 'animate-spin' : ''} />
                                {isAiLoading ? 'Analyzing...' : 'Explain with AI'}
                            </button>
                        )}
                    </div>

                    {/* Standard Explanation */}
                    {showExplanation && mcq.explanation && (
                        <div className="bg-slate-50 border border-slate-100 p-6 rounded-[24px]">
                            <p className="text-[15px] text-slate-600 leading-relaxed italic">{mcq.explanation}</p>
                        </div>
                    )}

                    {/* AI Premium Explanation Box */}
                    {(isAiLoading || aiExplanation) && (
                        <div className={`relative overflow-hidden rounded-[24px] p-[2px] transition-all duration-500 animate-in fade-in slide-in-from-top-4`}>
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 opacity-20 animate-pulse"></div>
                            <div className="relative bg-white/80 backdrop-blur-xl border border-white/60 rounded-[22px] p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                        <Icon name="sparkles" size="sm" />
                                    </div>
                                    <h4 className="font-bold text-[16px] text-slate-800">Detailed AI Analysis</h4>
                                </div>
                                
                                {isAiLoading ? (
                                    <div className="space-y-3">
                                        <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                                        <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
                                        <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse"></div>
                                    </div>
                                ) : (
                                    <div className="text-[15px] text-slate-700 leading-relaxed space-y-4 whitespace-pre-wrap ai-content">
                                        {aiExplanation}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

export default QuestionCard;
