
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { mcqSetService, attemptService, mcqStatsService } from '../../../core/storage/services';
import { MCQSet, MCQ, Attempt } from '../../../types';
import PremiumModal from '../../../shared/components/PremiumModal';
import PremiumButton from '../../../shared/components/PremiumButton';
import { generateUUID } from '../../../core/storage/idGenerator';
import { useToast } from '../../../shared/context/ToastContext';
import CheckmarkIcon from '../../../shared/components/CheckmarkIcon';

const PracticeSession: React.FC = () => {
  const { setId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [set, setSet] = useState<MCQSet | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Settings
  const [showSettings, setShowSettings] = useState(true);
  const [options, setOptions] = useState({
      shuffleQuestions: false,
      shuffleOptions: false,
      showExplanation: true,
      soundEnabled: true,
      vibrationEnabled: true
  });

  // Session State
  const [sessionMCQs, setSessionMCQs] = useState<MCQ[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // mcqId -> selected option
  const [results, setResults] = useState<Record<string, boolean>>({}); // mcqId -> isCorrect
  const [startTime, setStartTime] = useState(Date.now());
  const [isFinished, setIsFinished] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // Custom Session Info
  const customState = location.state as { mcqIds?: string[]; source?: string; sourceName?: string; customMCQs?: MCQ[] } | undefined;

  useEffect(() => {
    const initSession = async () => {
        if (customState?.customMCQs && customState.customMCQs.length > 0) {
             // 1. Direct MCQs passed (e.g. from Random Mix)
             setSessionMCQs(customState.customMCQs);
             setLoading(false);
        } else if (customState?.mcqIds && customState.mcqIds.length > 0) {
             // 2. MCQ IDs passed (e.g. from Practice All)
             const allSets = await mcqSetService.getAll();
             const allMcqs = allSets.flatMap(s => s.mcqs);
             const filtered = allMcqs.filter(m => customState.mcqIds!.includes(m.id));
             setSessionMCQs(filtered);
             setLoading(false);
        } else if (setId) {
            // 3. Standard Set Mode
            const s = await mcqSetService.getById(setId);
            if (s) {
                setSet(s);
                setSessionMCQs(s.mcqs);
            } else {
                toast.error("Set not found");
                navigate('/live-mcq');
            }
            setLoading(false);
        } else {
            toast.error("No questions provided");
            navigate('/live-mcq');
        }
    };
    initSession();
  }, [setId, customState]);

  const startSession = () => {
      let mcqs = [...sessionMCQs];
      
      if (options.shuffleQuestions) {
          mcqs = mcqs.sort(() => Math.random() - 0.5);
      }
      
      setSessionMCQs(mcqs);
      setStartTime(Date.now());
      setCurrentIndex(0);
      setAnswers({});
      setResults({});
      setShowSettings(false);
  };

  const handleAnswer = (optionKey: string) => {
      // If already answered, ignore
      const currentMCQ = sessionMCQs[currentIndex];
      if (answers[currentMCQ.id]) return;

      const isCorrect = currentMCQ.answer === optionKey;
      
      setAnswers(prev => ({ ...prev, [currentMCQ.id]: optionKey }));
      setResults(prev => ({ ...prev, [currentMCQ.id]: isCorrect }));

      // Feedback
      if (isCorrect) {
          if (options.soundEnabled) { /* Play ding */ }
      } else {
          if (options.vibrationEnabled && navigator.vibrate) navigator.vibrate(200);
      }
      
      // Update Stats (fire and forget)
      updateStats(currentMCQ.id, isCorrect);
  };
  
  const updateStats = async (mcqId: string, isCorrect: boolean) => {
      try {
          const statsId = `${setId || 'custom'}_${mcqId}`;
          const existing = await mcqStatsService.getById(statsId);
          if (existing) {
              await mcqStatsService.update(statsId, {
                  timesAnswered: existing.timesAnswered + 1,
                  timesCorrect: existing.timesCorrect + (isCorrect ? 1 : 0),
                  accuracy: Math.round(((existing.timesCorrect + (isCorrect ? 1 : 0)) / (existing.timesAnswered + 1)) * 100)
              });
          } else {
              await mcqStatsService.create({
                  id: statsId,
                  mcqId,
                  setId: setId || 'custom',
                  timesAnswered: 1,
                  timesCorrect: isCorrect ? 1 : 0,
                  accuracy: isCorrect ? 100 : 0
              });
          }
      } catch (e) {
          console.error("Failed to update stats", e);
      }
  };

  const nextQuestion = () => {
      if (currentIndex < sessionMCQs.length - 1) {
          setCurrentIndex(prev => prev + 1);
      } else {
          finishSession();
      }
  };

  const finishSession = async () => {
      setIsFinished(true);
      toast.info("Saving results...");
      
      try {
          // Calculate Stats
          const total = sessionMCQs.length;
          const correctCount = Object.values(results).filter(Boolean).length;
          const score = correctCount;
          const percentage = Math.round((score / total) * 100);
          const timeSpent = Math.round((Date.now() - startTime) / 1000);

          const attempt: Attempt = {
              id: generateUUID(),
              setId: setId, // undefined if custom
              mode: 'practice',
              score,
              total,
              percentage,
              timeSpent,
              answers,
              completedAt: Date.now()
          };

          // Await creation to ensure data is in DB before navigation
          await attemptService.create(attempt);
          
          navigate(`/live-mcq/result/${attempt.id}`, { replace: true });
      } catch (error) {
          console.error("Failed to save attempt", error);
          toast.error("Failed to save result. Please try again.");
          setIsFinished(false);
      }
  };

  const handleExit = () => {
      if (setId) {
          // Explicit navigation for sets is safe because structure is /set/:id -> /practice/:id
          navigate(`/live-mcq/set/${setId}`, { replace: true });
      } else {
          // For custom sessions (Topic/Subtopic/Exam Center), we MUST use browser history back
          // because we don't have a stable "parent" URL to reconstruct. 
          // Since these sessions require `location.state` to exist, the user must have navigated 
          // here from within the app, so the history stack is guaranteed to be valid.
          navigate(-1);
      }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const currentMCQ = sessionMCQs[currentIndex];
  
  if (!currentMCQ) return <div className="p-10 text-center">No questions available. <button onClick={handleExit} className="text-blue-500">Go Back</button></div>;

  const hasAnswered = !!answers[currentMCQ?.id];
  const selectedOption = answers[currentMCQ?.id];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
        {/* Header */}
        <div className="h-[60px] bg-white border-b border-gray-100 flex items-center justify-between px-5 sticky top-0 z-20">
            <button 
                onClick={() => setShowExitConfirm(true)} 
                className="text-[#6B7280] p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors active:scale-95"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
            </button>
            <div className="font-semibold text-[16px] text-[#111827]">
                Practice <span className="text-[#6366F1]">{currentIndex + 1}</span><span className="text-[#9CA3AF]">/{sessionMCQs.length}</span>
            </div>
            <div className="w-[22px]"></div> {/* Spacer */}
        </div>

        {/* Custom Progress Bar */}
        <div className="h-[3px] bg-[#F3F4F6] w-full">
            <div 
                className="h-full bg-[#6366F1] rounded-r-[4px] transition-all duration-300 ease-out" 
                style={{ width: `${((currentIndex + 1) / sessionMCQs.length) * 100}%` }}
            ></div>
        </div>

        {/* Question Area */}
        <div className="flex-1 p-5 pb-32 overflow-y-auto">
            {currentMCQ && (
                <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300" key={currentMCQ.id}>
                    {/* Question Card */}
                    <div className="bg-[#F9FAFB] rounded-[18px] p-[22px] mb-6">
                        <h2 className="text-[17px] font-semibold text-[#111827] leading-[1.6]">
                            {currentMCQ.question}
                        </h2>
                    </div>

                    {/* Options */}
                    <div className="flex flex-col gap-[10px]">
                        {['A', 'B', 'C', 'D'].map((opt) => {
                            const text = currentMCQ[`option${opt}` as keyof MCQ] as string;
                            
                            // Visual States
                            let containerClass = "bg-white border-[1.5px] border-[#F3F4F6]";
                            let circleClass = "bg-[#F3F4F6] text-[#6B7280]";
                            let textClass = "text-[#374151]";

                            if (hasAnswered) {
                                if (opt === currentMCQ.answer) {
                                    // Correct
                                    containerClass = "bg-[#ECFDF5] border-[#059669]";
                                    circleClass = "bg-[#059669] text-white";
                                } else if (opt === selectedOption) {
                                    // Wrong Selection
                                    containerClass = "bg-[#FEF2F2] border-[#EF4444]";
                                    circleClass = "bg-[#EF4444] text-white";
                                } else {
                                    // Not selected, not answer
                                    containerClass = "bg-white border-[#F3F4F6] opacity-60";
                                }
                            }

                            return (
                                <button
                                    key={opt}
                                    onClick={() => handleAnswer(opt)}
                                    disabled={hasAnswered}
                                    className={`
                                        w-full rounded-[16px] p-[16px] px-[18px] 
                                        flex items-center text-left
                                        transition-all duration-150 ease-out
                                        ${containerClass}
                                        ${!hasAnswered ? 'active:scale-[0.98]' : ''}
                                    `}
                                >
                                    <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center text-[14px] font-semibold flex-shrink-0 ${circleClass}`}>
                                        {hasAnswered && opt === currentMCQ.answer ? (
                                            <CheckmarkIcon size={16} color="white" className="ml-0" />
                                        ) : hasAnswered && opt === selectedOption ? (
                                            <span className="text-[14px]">✕</span>
                                        ) : (
                                            opt
                                        )}
                                    </div>
                                    <span className={`text-[16px] font-normal ml-[14px] leading-snug ${textClass}`}>
                                        {text}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Explanation */}
                    {hasAnswered && options.showExplanation && currentMCQ.explanation && (
                        <div className="mt-6 bg-blue-50 border border-blue-100 p-5 rounded-[18px] animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold text-xs uppercase tracking-wide">
                                <span>💡</span> Explanation
                            </div>
                            <p className="text-[15px] text-blue-900 leading-relaxed whitespace-pre-wrap">
                                {currentMCQ.explanation}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Footer Controls */}
        <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-white z-20">
            <div className="max-w-xl mx-auto">
                {hasAnswered ? (
                    <PremiumButton fullWidth onClick={nextQuestion} disabled={isFinished} size="lg">
                        {isFinished ? 'Saving...' : (currentIndex === sessionMCQs.length - 1 ? 'Finish Practice' : 'Next Question →')}
                    </PremiumButton>
                ) : (
                    <div className="text-center text-[14px] font-normal text-[#D1D5DB] pb-[20px]">
                        Select an answer to continue
                    </div>
                )}
            </div>
        </div>

        {/* Settings Modal (Custom Design) */}
        {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-black/40 backdrop-blur-[4px] transition-opacity"
                    onClick={() => setShowSettings(false)} 
                />
                
                {/* Modal Container */}
                <div className="relative w-full max-w-[360px] bg-white rounded-[24px] p-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-200">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-[24px]">
                        <h3 className="text-[20px] font-bold text-[#111827]">Practice Settings</h3>
                        <button 
                            onClick={() => setShowSettings(false)}
                            className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors p-1"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6 18M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    {/* Options */}
                    <div className="space-y-[10px]">
                        {/* Shuffle Row */}
                        <label className="flex items-center justify-between p-[16px] bg-[#F9FAFB] border border-[#F3F4F6] rounded-[14px] cursor-pointer group select-none transition-colors">
                            <span className="text-[15px] font-medium text-[#374151]">Shuffle Questions</span>
                            <div className="relative flex items-center">
                                <input 
                                    type="checkbox" 
                                    checked={options.shuffleQuestions} 
                                    onChange={e => setOptions({...options, shuffleQuestions: e.target.checked})}
                                    className="peer sr-only" 
                                />
                                <div className="w-[22px] h-[22px] bg-white border-2 border-[#D1D5DB] rounded-[6px] transition-all peer-checked:bg-[#6366F1] peer-checked:border-[#6366F1] flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                            </div>
                        </label>

                        {/* Explanation Row */}
                        <label className="flex items-center justify-between p-[16px] bg-[#F9FAFB] border border-[#F3F4F6] rounded-[14px] cursor-pointer group select-none transition-colors">
                            <span className="text-[15px] font-medium text-[#374151]">Show Explanation</span>
                            <div className="relative flex items-center">
                                <input 
                                    type="checkbox" 
                                    checked={options.showExplanation} 
                                    onChange={e => setOptions({...options, showExplanation: e.target.checked})}
                                    className="peer sr-only" 
                                />
                                <div className="w-[22px] h-[22px] bg-white border-2 border-[#D1D5DB] rounded-[6px] transition-all peer-checked:bg-[#6366F1] peer-checked:border-[#6366F1] flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                            </div>
                        </label>
                    </div>

                    {/* Start Button */}
                    <button 
                        onClick={startSession}
                        className="w-full mt-[20px] bg-[#6366F1] text-white font-semibold text-[16px] py-[16px] rounded-[16px] active:scale-[0.98] transition-transform shadow-[0_4px_12px_rgba(99,102,241,0.2)] hover:bg-[#5a5dd9]"
                    >
                        Start Practice
                    </button>

                </div>
            </div>
        )}

        {/* Exit Confirmation (Standard Modal) */}
        <PremiumModal isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} title="Exit Practice?" size="sm">
            <div className="space-y-4">
                <p className="text-sm text-gray-500">Your progress will not be saved.</p>
                <div className="flex justify-end gap-3 pt-2">
                    <PremiumButton variant="ghost" onClick={() => setShowExitConfirm(false)}>Cancel</PremiumButton>
                    <PremiumButton variant="danger" onClick={handleExit}>Exit</PremiumButton>
                </div>
            </div>
        </PremiumModal>
    </div>
  );
};

export default PracticeSession;
