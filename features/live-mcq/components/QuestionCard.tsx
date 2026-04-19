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
        <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 font-serif">
            <div className="bg-surface p-6 mb-8 border border-border">
                <h2 className="text-xl font-medium text-text-primary leading-[1.6] tracking-tight">
                    {mcq.question}
                </h2>
                {attemptData && (
                    <div className="mt-4 flex items-center gap-2 font-sans text-[10px] text-text-secondary uppercase tracking-widest border-t border-border/50 pt-4">
                        <Icon name="clock" size="xs" className="w-3 h-3" />
                        <span>Last attempted: {formatLastAttempt(attemptData.lastAttemptedAt).relative}</span>
                        <span className="text-border">|</span>
                        <span>{new Date(attemptData.lastAttemptedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3">
                {['A', 'B', 'C', 'D'].map((opt) => {
                    const text = mcq[`option${opt}` as keyof MCQ] as string;
                    
                    const isSelected = selectedOption === opt;
                    const isCorrect = opt === mcq.answer;
                    
                    let containerClass = "bg-surface border border-border";
                    let circleClass = "bg-background text-text-secondary";
                    let textClass = "text-text-primary";

                    if (hasAnswered) {
                        if (isCorrect) {
                            containerClass = "bg-background border-text-primary";
                            circleClass = "bg-text-primary text-surface";
                            textClass = "text-text-primary font-medium";
                        } else if (isSelected) {
                            containerClass = "bg-surface border-[#8A4F3A]";
                            circleClass = "bg-[#8A4F3A] text-surface border-[#8A4F3A]";
                            textClass = "text-text-primary";
                        } else {
                            containerClass = "bg-surface border-border opacity-60 grayscale";
                            circleClass = "bg-background text-text-secondary border-border/50";
                        }
                    }

                    return (
                        <motion.button
                            key={opt}
                            onClick={() => onAnswer(opt)}
                            disabled={hasAnswered}
                            whileHover={!hasAnswered ? { backgroundColor: "var(--color-surface-hover)", borderColor: "var(--color-text-primary)" } : {}}
                            whileTap={!hasAnswered ? { scale: 0.99 } : {}}
                            initial={false}
                            className={`w-full p-4 px-5 flex items-center text-left transition-colors duration-200 ease-out min-h-[64px] ${containerClass}`}
                        >
                            <div 
                                className={`w-8 h-8 flex items-center justify-center font-sans text-xs font-semibold flex-shrink-0 transition-colors border border-border/50 ${circleClass}`}
                            >
                                <AnimatePresence mode="wait">
                                    {hasAnswered && isCorrect ? (
                                        <motion.div
                                            key="correct"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <Icon name="check" size="sm" className="text-surface" strokeWidth={1.5} />
                                        </motion.div>
                                    ) : hasAnswered && isSelected ? (
                                        <motion.div
                                            key="wrong"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <Icon name="x" size="sm" className="text-surface" strokeWidth={1.5} />
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
                            </div>
                            <span className={`text-[17px] ml-4 leading-relaxed tracking-tight ${textClass}`}>{text}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Standard Explanation & AI Trigger */}
            {hasAnswered && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="mt-8 space-y-4"
                >
                    {/* AI Action Row */}
                    <div className="flex items-center justify-between pb-3 border-b border-border/50">
                        <span className="font-sans text-[11px] font-semibold text-text-primary uppercase tracking-[0.1em]">Solution & Analysis</span>
                        {!aiExplanation && (
                            <button 
                                onClick={onAiExplain}
                                disabled={isAiLoading}
                                className="flex items-center gap-2 border border-border text-text-primary px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-widest hover:bg-surface-hover hover:border-text-primary transition-all disabled:opacity-50 group"
                            >
                                <Icon name="sparkles" size="xs" strokeWidth={1.5} className={`text-text-secondary group-hover:text-text-primary transition-colors ${isAiLoading ? 'animate-spin' : ''}`} />
                                {isAiLoading ? 'Analyzing...' : 'AI Explain'}
                            </button>
                        )}
                    </div>

                    {/* Standard Explanation */}
                    {showExplanation && mcq.explanation && (
                        <div className="bg-surface border border-border p-5">
                            <p className="font-serif text-[15px] text-text-secondary leading-[1.6]">{mcq.explanation}</p>
                        </div>
                    )}

                    {/* AI Premium Explanation Box */}
                    {(isAiLoading || aiExplanation) && (
                        <div className={`mt-4 relative transition-all duration-500 animate-in fade-in slide-in-from-top-4`}>
                            <div className="bg-surface border border-text-primary p-6 relative overflow-hidden">
                                {/* Subtle decorative background for AI box */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-text-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                                <div className="flex items-center gap-3 mb-5 relative z-10">
                                    <div className="p-1.5 bg-background border border-border">
                                        <Icon name="sparkles" size="xs" className="text-text-primary w-3.5 h-3.5" strokeWidth={1.5} />
                                    </div>
                                    <h4 className="font-sans font-semibold text-[11px] text-text-primary uppercase tracking-[0.1em]">AI Analysis</h4>
                                </div>
                                
                                {isAiLoading ? (
                                    <div className="space-y-4 relative z-10">
                                        <div className="h-2 bg-text-secondary/20 w-3/4 animate-pulse"></div>
                                        <div className="h-2 bg-text-secondary/20 w-full animate-pulse"></div>
                                        <div className="h-2 bg-text-secondary/20 w-5/6 animate-pulse"></div>
                                        <div className="h-2 bg-text-secondary/20 w-1/2 animate-pulse mt-4"></div>
                                    </div>
                                ) : (
                                    <div className="font-serif text-[15px] text-text-primary leading-[1.7] space-y-4 whitespace-pre-wrap ai-content relative z-10">
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
