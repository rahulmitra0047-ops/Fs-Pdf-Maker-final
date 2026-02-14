
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { mcqSetService, attemptService, mcqStatsService } from '../../../core/storage/services';
import { MCQSet, MCQ, Attempt } from '../../../types';
import PremiumModal from '../../../shared/components/PremiumModal';
import PremiumButton from '../../../shared/components/PremiumButton';
import { generateUUID } from '../../../core/storage/idGenerator';
import { useToast } from '../../../shared/context/ToastContext';
import CheckmarkIcon from '../../../shared/components/CheckmarkIcon';
import Icon from '../../../shared/components/Icon';
import { aiManager } from '../../../core/ai/aiManager';

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
  
  // AI State
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Custom Session Info
  const customState = location.state as { mcqIds?: string[]; source?: string; sourceName?: string; customMCQs?: MCQ[] } | undefined;

  useEffect(() => {
    const initSession = async () => {
        if (customState?.customMCQs && customState.customMCQs.length > 0) {
             setSessionMCQs(customState.customMCQs);
             setLoading(false);
        } else if (customState?.mcqIds && customState.mcqIds.length > 0) {
             const allSets = await mcqSetService.getAll();
             const allMcqs = allSets.flatMap(s => s.mcqs);
             const filtered = allMcqs.filter(m => customState.mcqIds!.includes(m.id));
             setSessionMCQs(filtered);
             setLoading(false);
        } else if (setId) {
            const s = await mcqSetService.getById(setId);
            if (s) {
                setSet(s);
                setSessionMCQs(s.mcqs);
            } else {
                toast.error("Set not found");
                navigate('/live-mcq/topics');
            }
            setLoading(false);
        } else {
            toast.error("No questions provided");
            navigate('/live-mcq/topics');
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

  const handleAiExplain = async () => {
    const currentMCQ = sessionMCQs[currentIndex];
    if (aiExplanations[currentMCQ.id]) return;

    setIsAiLoading(true);
    
    try {
        // Stricter prompt
        const prompt = `
        প্রশ্ন: ${currentMCQ.question}
        অপশন: A) ${currentMCQ.optionA}, B) ${currentMCQ.optionB}, C) ${currentMCQ.optionC}, D) ${currentMCQ.optionD}
        সঠিক উত্তর: ${currentMCQ.answer}

        সরাসরি বাংলায় উত্তর দাও। নিজেকে পরিচয় দেবে না।

        ### ✅ সঠিক উত্তরের ব্যাখ্যা
        (কেন এটি সঠিক তার মূল কারণ)

        ### ❌ ভুল অপশনগুলোর বিশ্লেষণ
        (সংক্ষিপ্ত পয়েন্ট)

        ### 💡 প্রো-টিপ
        (মনে রাখার কৌশল)
        `;

        const response = await aiManager.generateContent(
            'gemini-3-flash-preview', 
            prompt, 
            { systemInstruction: "You are a concise Bengali educational assistant. Do NOT introduce yourself." }
        );

        if (response.error) {
            toast.error(response.error);
        } else if (response.text) {
            setAiExplanations(prev => ({ ...prev, [currentMCQ.id]: response.text || '' }));
        }
    } catch (e: any) {
        toast.error("Explanation failed");
    } finally {
        setIsAiLoading(false);
    }
  };

  const handleAnswer = (optionKey: string) => {
      const currentMCQ = sessionMCQs[currentIndex];
      if (answers[currentMCQ.id]) return;

      const isCorrect = currentMCQ.answer === optionKey;
      setAnswers(prev => ({ ...prev, [currentMCQ.id]: optionKey }));
      setResults(prev => ({ ...prev, [currentMCQ.id]: isCorrect }));

      if (!isCorrect && options.vibrationEnabled && navigator.vibrate) {
          navigator.vibrate(200);
      }
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
          const total = sessionMCQs.length;
          const correctCount = Object.values(results).filter(Boolean).length;
          const score = correctCount;
          const percentage = Math.round((score / total) * 100);
          const timeSpent = Math.round((Date.now() - startTime) / 1000);

          const attempt: Attempt = {
              id: generateUUID(),
              setId: setId,
              mode: 'practice',
              score,
              total,
              percentage,
              timeSpent,
              answers,
              completedAt: Date.now()
          };

          await attemptService.create(attempt);
          navigate(`/live-mcq/result/${attempt.id}`, { replace: true });
      } catch (error) {
          toast.error("Failed to save result.");
          setIsFinished(false);
      }
  };

  const handleExit = () => {
      if (setId) navigate(`/live-mcq/set/${setId}`, { replace: true });
      else navigate(-1);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const currentMCQ = sessionMCQs[currentIndex];
  if (!currentMCQ) return <div className="p-10 text-center">No questions available. <button onClick={handleExit} className="text-blue-500">Go Back</button></div>;

  const hasAnswered = !!answers[currentMCQ?.id];
  const selectedOption = answers[currentMCQ?.id];
  const aiExplanation = aiExplanations[currentMCQ?.id];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
        {/* Header */}
        <div className="h-[60px] bg-white border-b border-gray-100 flex items-center justify-between px-5 sticky top-0 z-20">
            <button onClick={() => setShowExitConfirm(true)} className="text-[#6B7280] p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors active:scale-95">
                <Icon name="x" size="md" />
            </button>
            <div className="font-semibold text-[16px] text-[#111827]">
                Practice <span className="text-[#6366F1]">{currentIndex + 1}</span><span className="text-[#9CA3AF]">/{sessionMCQs.length}</span>
            </div>
            <div className="w-[22px]"></div>
        </div>

        {/* Progress Bar */}
        <div className="h-[3px] bg-[#F3F4F6] w-full">
            <div className="h-full bg-[#6366F1] rounded-r-[4px] transition-all duration-300 ease-out" style={{ width: `${((currentIndex + 1) / sessionMCQs.length) * 100}%` }}></div>
        </div>

        {/* Question Area */}
        <div className="flex-1 p-5 pb-32 overflow-y-auto">
            {currentMCQ && (
                <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300" key={currentMCQ.id}>
                    <div className="bg-[#F9FAFB] rounded-[18px] p-[22px] mb-6">
                        <h2 className="text-[17px] font-semibold text-[#111827] leading-[1.6]">
                            {currentMCQ.question}
                        </h2>
                    </div>

                    <div className="flex flex-col gap-[10px]">
                        {['A', 'B', 'C', 'D'].map((opt) => {
                            const text = currentMCQ[`option${opt}` as keyof MCQ] as string;
                            let containerClass = "bg-white border-[1.5px] border-[#F3F4F6]";
                            let circleClass = "bg-[#F3F4F6] text-[#6B7280]";
                            let textClass = "text-[#374151]";

                            if (hasAnswered) {
                                if (opt === currentMCQ.answer) {
                                    containerClass = "bg-[#ECFDF5] border-[#059669]";
                                    circleClass = "bg-[#059669] text-white";
                                } else if (opt === selectedOption) {
                                    containerClass = "bg-[#FEF2F2] border-[#EF4444]";
                                    circleClass = "bg-[#EF4444] text-white";
                                } else {
                                    containerClass = "bg-white border-[#F3F4F6] opacity-60";
                                }
                            }

                            return (
                                <button
                                    key={opt}
                                    onClick={() => handleAnswer(opt)}
                                    disabled={hasAnswered}
                                    className={`w-full rounded-[16px] p-[16px] px-[18px] flex items-center text-left transition-all duration-150 ease-out ${containerClass} ${!hasAnswered ? 'active:scale-[0.98]' : ''}`}
                                >
                                    <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center text-[14px] font-semibold flex-shrink-0 ${circleClass}`}>
                                        {hasAnswered && opt === currentMCQ.answer ? <CheckmarkIcon size={16} color="white" className="ml-0" /> : hasAnswered && opt === selectedOption ? <span className="text-[14px]">✕</span> : opt}
                                    </div>
                                    <span className={`text-[16px] font-normal ml-[14px] leading-snug ${textClass}`}>{text}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Standard Explanation & AI Trigger */}
                    {hasAnswered && (
                        <div className="mt-8 space-y-4">
                            {/* AI Action Row */}
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[13px] font-bold text-[#9CA3AF] uppercase tracking-wider">Solution</span>
                                {!aiExplanation && (
                                    <button 
                                        onClick={handleAiExplain}
                                        disabled={isAiLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-xs font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        <Icon name="sparkles" size="sm" className={isAiLoading ? 'animate-spin' : ''} />
                                        {isAiLoading ? 'Analyzing...' : 'Explain with AI'}
                                    </button>
                                )}
                            </div>

                            {/* Standard Explanation */}
                            {options.showExplanation && currentMCQ.explanation && (
                                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-5 rounded-[20px]">
                                    <p className="text-[15px] text-[#475569] leading-relaxed italic">{currentMCQ.explanation}</p>
                                </div>
                            )}

                            {/* AI Premium Explanation Box */}
                            {(isAiLoading || aiExplanation) && (
                                <div className={`relative overflow-hidden rounded-[24px] p-[2px] transition-all duration-500 animate-in fade-in slide-in-from-top-4`}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-20 animate-pulse"></div>
                                    <div className="relative bg-white/70 backdrop-blur-xl border border-white/50 rounded-[22px] p-6 shadow-xl">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                                <Icon name="sparkles" size="sm" />
                                            </div>
                                            <h4 className="font-bold text-[16px] text-gray-900">Detailed AI Analysis</h4>
                                        </div>
                                        
                                        {isAiLoading ? (
                                            <div className="space-y-3">
                                                <div className="h-4 bg-gray-200/50 rounded w-3/4 animate-pulse"></div>
                                                <div className="h-4 bg-gray-200/50 rounded w-full animate-pulse"></div>
                                                <div className="h-4 bg-gray-200/50 rounded w-5/6 animate-pulse"></div>
                                            </div>
                                        ) : (
                                            <div className="text-[15px] text-gray-700 leading-relaxed space-y-4 whitespace-pre-wrap ai-content">
                                                {aiExplanation}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Footer Controls */}
        <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-white z-20 border-t border-gray-50">
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

        {/* Settings Modal */}
        {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px] transition-opacity" onClick={() => setShowSettings(false)} />
                <div className="relative w-full max-w-[360px] bg-white rounded-[24px] p-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-[24px]">
                        <h3 className="text-[20px] font-bold text-[#111827]">Practice Settings</h3>
                        <button onClick={() => setShowSettings(false)} className="text-[#9CA3AF] hover:text-[#6B7280] p-1"><Icon name="x" size="md" /></button>
                    </div>
                    <div className="space-y-[10px]">
                        <label className="flex items-center justify-between p-[16px] bg-[#F9FAFB] border border-[#F3F4F6] rounded-[14px] cursor-pointer group select-none transition-colors">
                            <span className="text-[15px] font-medium text-[#374151]">Shuffle Questions</span>
                            <div className="relative flex items-center">
                                <input type="checkbox" checked={options.shuffleQuestions} onChange={e => setOptions({...options, shuffleQuestions: e.target.checked})} className="peer sr-only" />
                                <div className="w-[22px] h-[22px] bg-white border-2 border-[#D1D5DB] rounded-[6px] transition-all peer-checked:bg-[#6366F1] peer-checked:border-[#6366F1] flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                            </div>
                        </label>
                        <label className="flex items-center justify-between p-[16px] bg-[#F9FAFB] border border-[#F3F4F6] rounded-[14px] cursor-pointer group select-none transition-colors">
                            <span className="text-[15px] font-medium text-[#374151]">Show Solution</span>
                            <div className="relative flex items-center">
                                <input type="checkbox" checked={options.showExplanation} onChange={e => setOptions({...options, showExplanation: e.target.checked})} className="peer sr-only" />
                                <div className="w-[22px] h-[22px] bg-white border-2 border-[#D1D5DB] rounded-[6px] transition-all peer-checked:bg-[#6366F1] peer-checked:border-[#6366F1] flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                            </div>
                        </label>
                    </div>
                    <button onClick={startSession} className="w-full mt-[20px] bg-[#6366F1] text-white font-semibold text-[16px] py-[16px] rounded-[16px] active:scale-[0.98] transition-transform shadow-[0_4px_12px_rgba(99,102,241,0.2)]">Start Practice</button>
                </div>
            </div>
        )}

        <PremiumModal isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} title="Exit Practice?" size="sm">
            <div className="space-y-4">
                <p className="text-sm text-gray-500">Your progress will not be saved.</p>
                <div className="flex justify-end gap-3 pt-2">
                    <PremiumButton variant="ghost" onClick={() => setShowExitConfirm(false)}>Cancel</PremiumButton>
                    <PremiumButton variant="danger" onClick={handleExit}>Exit</PremiumButton>
                </div>
            </div>
        </PremiumModal>
        
        <style>{`
            .ai-content h3 { font-size: 1.1rem; font-weight: 800; color: #1E1B4B; margin-top: 1.5rem; margin-bottom: 0.75rem; border-left: 4px solid #6366F1; padding-left: 0.75rem; }
            .ai-content b, .ai-content strong { color: #4338CA; font-weight: 700; }
            .ai-content ul { list-style: type: none; padding-left: 0; margin-top: 0.5rem; }
            .ai-content li { margin-bottom: 10px; position: relative; padding-left: 22px; line-height: 1.5; }
            .ai-content li::before { content: '•'; position: absolute; left: 0; color: #818CF8; font-weight: bold; font-size: 1.2rem; top: -2px; }
            .ai-content p { margin-bottom: 1rem; }
        `}</style>
    </div>
  );
};

export default PracticeSession;
