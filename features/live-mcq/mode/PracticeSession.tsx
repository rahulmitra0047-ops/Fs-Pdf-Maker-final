
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { mcqSetService, attemptService, mcqStatsService } from '../../../core/storage/services';
import { MCQSet, MCQ, Attempt } from '../../../types';
import PremiumModal from '../../../shared/components/PremiumModal';
import PremiumButton from '../../../shared/components/PremiumButton';
import { generateUUID } from '../../../core/storage/idGenerator';
import { useToast } from '../../../shared/context/ToastContext';
import Icon from '../../../shared/components/Icon';
import { aiManager } from '../../../core/ai/aiManager';
import { getVisitorId, saveMcqAttempts, MCQAttempt } from '../services/mcqTrackingService';
import QuestionCard from '../components/QuestionCard';
import PracticeSettings from '../components/PracticeSettings';

const PracticeSession: React.FC = () => {
  const { setId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [set, setSet] = useState<MCQSet | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Custom Session Info
  const customState = location.state as { 
      mcqIds?: string[]; 
      source?: string; 
      sourceName?: string; 
      customMCQs?: MCQ[];
      settings?: { shuffle: boolean; showSolution: boolean; };
      attempts?: Record<string, MCQAttempt>;
      backPath?: string;
  } | undefined;

  // Resolve Set ID for storage (params > state.source > 'custom')
  const resolvedSetId = setId || (customState?.source && customState.source !== 'custom' ? customState.source : 'custom');

  // Settings
  const [showSettings, setShowSettings] = useState(!customState?.settings);
  const [options, setOptions] = useState({
      shuffleQuestions: customState?.settings?.shuffle ?? false,
      shuffleOptions: false,
      showExplanation: customState?.settings?.showSolution ?? true,
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
  
  // Tracking State
  const sessionAttemptsRef = useRef<Record<string, MCQAttempt>>({});

  // AI State
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Helper for date formatting
  const formatLastAttempt = (isoDate: string) => {
      try {
          const date = new Date(isoDate);
          const now = new Date();
          const diff = now.getTime() - date.getTime();
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          
          let relative = '';
          if (days === 0) relative = 'Today';
          else if (days === 1) relative = 'Yesterday';
          else if (days < 30) relative = `${days} days ago`;
          else relative = date.toLocaleDateString();

          return { relative, exact: date.toLocaleString() };
      } catch (e) {
          return { relative: '', exact: '' };
      }
  };

  useEffect(() => {
    const initSession = async () => {
        if (customState?.customMCQs && customState.customMCQs.length > 0) {
             setSessionMCQs(customState.customMCQs);
             setLoading(false);
        } else if (customState?.mcqIds && customState.mcqIds.length > 0) {
             let sourceMCQs: MCQ[] = [];
             if (setId) {
                 const s = await mcqSetService.getById(setId);
                 sourceMCQs = s?.mcqs || [];
             } else {
                 const allSets = await mcqSetService.getAll();
                 sourceMCQs = allSets.flatMap(s => s.mcqs);
             }
             
             // Map to preserve order and filter
             const ordered = customState.mcqIds
                 .map(id => sourceMCQs.find(m => m.id === id))
                 .filter((m): m is MCQ => !!m);
                 
             setSessionMCQs(ordered);
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

  // Save attempts on unmount or exit
  useEffect(() => {
    const save = async () => {
        const visitorId = getVisitorId();
        await saveMcqAttempts(visitorId, sessionAttemptsRef.current);
    };

    return () => {
        save();
    };
  }, []);

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
      
      console.log(`[PracticeSession] Answered: MCQ=${currentMCQ.id}, Correct=${isCorrect}, SetID=${resolvedSetId}`);
      
      updateStats(currentMCQ.id, isCorrect);
      
      // Track attempt in memory
      sessionAttemptsRef.current[currentMCQ.id] = {
          lastAttemptedAt: new Date().toISOString(),
          attemptCount: 1 // This will be incremented on server side merge
      };
  };
  
  const updateStats = async (mcqId: string, isCorrect: boolean) => {
      try {
          const statsId = `${resolvedSetId}_${mcqId}`;
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
                  setId: resolvedSetId,
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
      
      // Save attempts immediately
      const visitorId = getVisitorId();
      await saveMcqAttempts(visitorId, sessionAttemptsRef.current);
      sessionAttemptsRef.current = {}; // Clear after save

      try {
          const total = sessionMCQs.length;
          const correctCount = Object.values(results).filter(Boolean).length;
          const score = correctCount;
          const percentage = Math.round((score / total) * 100);
          const timeSpent = Math.round((Date.now() - startTime) / 1000);

          const attempt: Attempt = {
              id: generateUUID(),
              setId: resolvedSetId === 'custom' ? undefined : resolvedSetId,
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

  const handleExit = async () => {
      // Save attempts before exit
      const visitorId = getVisitorId();
      await saveMcqAttempts(visitorId, sessionAttemptsRef.current);
      sessionAttemptsRef.current = {};

      if (customState?.backPath) {
          navigate(customState.backPath, { replace: true });
      } else if (setId) {
          navigate(`/live-mcq/set/${setId}`, { replace: true });
      } else {
          // Default to topics list for custom sessions if no history or direct link
          navigate('/live-mcq/topics', { replace: true });
      }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const currentMCQ = sessionMCQs[currentIndex];
  if (!currentMCQ) return <div className="p-10 text-center">No questions available. <button onClick={handleExit} className="text-blue-500">Go Back</button></div>;

  const hasAnswered = !!answers[currentMCQ?.id];
  const selectedOption = answers[currentMCQ?.id];
  const aiExplanation = aiExplanations[currentMCQ?.id];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        {/* Header */}
        <div className="h-[60px] bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-5 sticky top-0 z-20">
            <button onClick={() => setShowExitConfirm(true)} className="text-slate-400 p-2 -ml-2 hover:bg-slate-50 hover:text-slate-700 rounded-full transition-colors active:scale-95">
                <Icon name="x" size="md" />
            </button>
            <div className="font-semibold text-[16px] text-slate-900">
                Practice <span className="text-emerald-600">{currentIndex + 1}</span><span className="text-slate-400">/{sessionMCQs.length}</span>
            </div>
            {/* Date Filter for Review Mode (Task 6) */}
            {customState?.source === 'review' ? (
                <div className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">
                    Review Mode
                </div>
            ) : (
                <div className="w-[22px]"></div>
            )}
        </div>

        {/* Progress Bar */}
        <div className="h-[3px] bg-slate-100 w-full">
            <div className="h-full bg-emerald-500 rounded-r-[4px] transition-all duration-300 ease-out" style={{ width: `${((currentIndex + 1) / sessionMCQs.length) * 100}%` }}></div>
        </div>

        {/* Question Area */}
        <div className="flex-1 p-5 pb-32 overflow-y-auto">
            {currentMCQ && (
                <QuestionCard
                    key={currentMCQ.id}
                    mcq={currentMCQ}
                    currentIndex={currentIndex}
                    totalQuestions={sessionMCQs.length}
                    selectedOption={selectedOption}
                    hasAnswered={hasAnswered}
                    attemptData={customState?.attempts?.[currentMCQ.id]}
                    aiExplanation={aiExplanation}
                    isAiLoading={isAiLoading}
                    showExplanation={options.showExplanation}
                    onAnswer={handleAnswer}
                    onAiExplain={handleAiExplain}
                    formatLastAttempt={formatLastAttempt}
                />
            )}
        </div>

        {/* Footer Controls */}
        <div className="fixed bottom-0 left-0 right-0 px-5 py-4 bg-white/80 backdrop-blur-md z-20 border-t border-slate-100">
            <div className="max-w-xl mx-auto">
                {hasAnswered ? (
                    <PremiumButton fullWidth onClick={nextQuestion} disabled={isFinished} size="lg" className="shadow-lg shadow-emerald-900/10">
                        {isFinished ? 'Saving...' : (currentIndex === sessionMCQs.length - 1 ? 'Finish Practice' : 'Next Question →')}
                    </PremiumButton>
                ) : (
                    <div className="text-center text-[14px] font-medium text-slate-400 pb-[20px]">
                        Select an answer to continue
                    </div>
                )}
            </div>
        </div>

        {/* Settings Modal */}
        <PracticeSettings
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            options={options}
            onOptionChange={(key, value) => setOptions(prev => ({ ...prev, [key]: value }))}
            onStart={startSession}
        />

        <PremiumModal isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} title="Exit Practice?" size="sm">
            <div className="space-y-4">
                <p className="text-sm text-slate-500">Current session progress will be lost, but question attempts will be tracked.</p>
                <div className="flex justify-end gap-3 pt-2">
                    <PremiumButton variant="ghost" onClick={() => setShowExitConfirm(false)}>Cancel</PremiumButton>
                    <PremiumButton variant="danger" onClick={handleExit}>Exit</PremiumButton>
                </div>
            </div>
        </PremiumModal>
        
        <style>{`
            .ai-content h3 { font-size: 1.1rem; font-weight: 800; color: #0F172A; margin-top: 1.5rem; margin-bottom: 0.75rem; border-left: 4px solid #10B981; padding-left: 0.75rem; }
            .ai-content b, .ai-content strong { color: #059669; font-weight: 700; }
            .ai-content ul { list-style: type: none; padding-left: 0; margin-top: 0.5rem; }
            .ai-content li { margin-bottom: 10px; position: relative; padding-left: 22px; line-height: 1.5; }
            .ai-content li::before { content: '•'; position: absolute; left: 0; color: #34D399; font-weight: bold; font-size: 1.2rem; top: -2px; }
            .ai-content p { margin-bottom: 1rem; }
        `}</style>
    </div>
  );
};

export default PracticeSession;
