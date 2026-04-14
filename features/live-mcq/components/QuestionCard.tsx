import React, { memo } from 'react';
import { MCQ } from '../../../types';
import Icon from '../../../shared/components/Icon';
import { MCQAttempt } from '../services/mcqTrackingService';
import { motion, AnimatePresence } from 'framer-motion';

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
            <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-slate-100">
                <h2 className="text-[16px] font-semibold text-slate-800 leading-[1.5]">
                    {mcq.question}
                </h2>
                {attemptData && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium bg-slate-50 px-2.5 py-1 rounded-md w-fit border border-slate-100">
                        <Icon name="clock" size="xs" className="w-3 h-3" />
                        <span>Last attempted: <span className="text-slate-600">{formatLastAttempt(attemptData.lastAttemptedAt).relative}</span></span>
                        <span className="text-slate-300">|</span>
                        <span>{new Date(attemptData.lastAttemptedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-[8px]">
                {['A', 'B', 'C', 'D'].map((opt) => {
                    const text = mcq[`option${opt}` as keyof MCQ] as string;
                    
                    const isSelected = selectedOption === opt;
                    const isCorrect = opt === mcq.answer;
                    
                    let containerClass = "bg-white border-[1.5px] border-slate-100";
                    let circleClass = "bg-slate-50 text-slate-500";
                    let textClass = "text-slate-600";

                    if (hasAnswered) {
                        if (isCorrect) {
                            containerClass = "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-sm";
                            circleClass = "bg-emerald-500 text-white shadow-inner";
                            textClass = "text-emerald-900 font-medium";
                        } else if (isSelected) {
                            containerClass = "bg-rose-50 border-rose-400 ring-1 ring-rose-400 shadow-sm";
                            circleClass = "bg-rose-500 text-white shadow-inner";
                            textClass = "text-rose-900";
                        } else {
                            containerClass = "bg-white border-slate-100 opacity-50 grayscale";
                        }
                    }

                    return (
                        <motion.button
                            key={opt}
                            onClick={() => onAnswer(opt)}
                            disabled={hasAnswered}
                            whileHover={!hasAnswered ? { scale: 0.99, backgroundColor: "#f8fafc", borderColor: "#cbd5e1" } : {}}
                            whileTap={!hasAnswered ? { scale: 0.98 } : {}}
                            initial={false}
                            animate={{
                                backgroundColor: hasAnswered && isCorrect ? "#ecfdf5" : hasAnswered && isSelected ? "#fff1f2" : "#ffffff",
                                borderColor: hasAnswered && isCorrect ? "#10b981" : hasAnswered && isSelected ? "#fb7185" : "#f1f5f9",
                                scale: hasAnswered && (isCorrect || isSelected) ? 1.01 : 1,
                            }}
                            transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                            className={`w-full rounded-xl p-3 px-4 flex items-center text-left transition-colors duration-200 ease-out ${containerClass}`}
                        >
                            <motion.div 
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 transition-colors ${circleClass}`}
                                animate={{
                                    backgroundColor: hasAnswered && isCorrect ? "#10b981" : hasAnswered && isSelected ? "#f43f5e" : "#f8fafc",
                                    color: hasAnswered && (isCorrect || isSelected) ? "#ffffff" : "#64748b"
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    {hasAnswered && isCorrect ? (
                                        <motion.div
                                            key="correct"
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            exit={{ scale: 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        >
                                            <Icon name="check" size="xs" className="text-white w-4 h-4" />
                                        </motion.div>
                                    ) : hasAnswered && isSelected ? (
                                        <motion.div
                                            key="wrong"
                                            initial={{ scale: 0, rotate: 180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            exit={{ scale: 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        >
                                            <Icon name="x" size="xs" className="text-white w-4 h-4" />
                                        </motion.div>
                                    ) : (
                                        <motion.span
                                            key="letter"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            {opt}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                            <span className={`text-[14px] font-normal ml-3 leading-snug ${textClass}`}>{text}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Standard Explanation & AI Trigger */}
            {hasAnswered && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="mt-6 space-y-3"
                >
                    {/* AI Action Row */}
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Solution</span>
                        {!aiExplanation && (
                            <button 
                                onClick={onAiExplain}
                                disabled={isAiLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full text-[11px] font-bold shadow-sm shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50 hover:shadow-indigo-300"
                            >
                                <Icon name="sparkles" size="xs" className={isAiLoading ? 'animate-spin w-3 h-3' : 'w-3 h-3'} />
                                {isAiLoading ? 'Analyzing...' : 'Explain with AI'}
                            </button>
                        )}
                    </div>

                    {/* Standard Explanation */}
                    {showExplanation && mcq.explanation && (
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                            <p className="text-[13px] text-slate-600 leading-relaxed italic">{mcq.explanation}</p>
                        </div>
                    )}

                    {/* AI Premium Explanation Box */}
                    {(isAiLoading || aiExplanation) && (
                        <div className={`relative overflow-hidden rounded-xl p-[2px] transition-all duration-500 animate-in fade-in slide-in-from-top-4`}>
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-violet-400 to-fuchsia-400 opacity-20 animate-pulse"></div>
                            <div className="relative bg-white/80 backdrop-blur-xl border border-white/60 rounded-[10px] p-4 shadow-sm">
                                <div className="flex items-center gap-2.5 mb-3">
                                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                        <Icon name="sparkles" size="xs" className="w-3 h-3" />
                                    </div>
                                    <h4 className="font-bold text-[14px] text-slate-800">Detailed AI Analysis</h4>
                                </div>
                                
                                {isAiLoading ? (
                                    <div className="space-y-2.5">
                                        <div className="h-3 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                                        <div className="h-3 bg-slate-100 rounded w-full animate-pulse"></div>
                                        <div className="h-3 bg-slate-100 rounded w-5/6 animate-pulse"></div>
                                    </div>
                                ) : (
                                    <div className="text-[13px] text-slate-700 leading-relaxed space-y-3 whitespace-pre-wrap ai-content">
                                        {aiExplanation}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
});

export default QuestionCard;
