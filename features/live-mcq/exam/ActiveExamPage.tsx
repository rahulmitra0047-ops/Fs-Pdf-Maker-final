import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { mcqSetService, attemptService, examTemplateService } from '../../../core/storage/services';
import { MCQ, Attempt, MCQSet } from '../../../types';
import PremiumModal from '../../../shared/components/PremiumModal';
import PremiumButton from '../../../shared/components/PremiumButton';
import { generateUUID } from '../../../core/storage/idGenerator';
import { useToast } from '../../../shared/context/ToastContext';
import Icon from '../../../shared/components/Icon';

interface ExamConfig {
    sourceIds: string[];
    settings: {
        totalQuestions: number;
        timeLimit: number;
        negativeMarking: boolean;
        negativePenalty: number;
        passingScore: number;
        shuffleQuestions: boolean;
        shuffleOptions: boolean;
    };
}

const ActiveExamPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  
  const config = (location.state as any)?.config as ExamConfig;
  const template = (location.state as any)?.template; 

  const activeConfig = config || (template ? { sourceIds: template.sourceIds, settings: template.settings } : null);

  const [loading, setLoading] = useState(true);
  const [mcqs, setMCQs] = useState<MCQ[]>([]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); 
  const [confidence, setConfidence] = useState<Record<string, 'sure' | 'guess'>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0); 
  
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!activeConfig) {
        toast.error("Invalid exam configuration");
        navigate('/live-mcq/exam-center');
        return;
    }
    loadAndPrepareExam();
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadAndPrepareExam = async () => {
      try {
          const sets = await Promise.all(activeConfig.sourceIds.map(id => mcqSetService.getById(id)));
          const validSets = sets.filter(s => !!s) as MCQSet[];
          
          let allMCQs: MCQ[] = validSets.flatMap(s => s.mcqs);
          
          if (activeConfig.settings.shuffleQuestions) {
              allMCQs = allMCQs.sort(() => Math.random() - 0.5);
          }
          
          const finalMCQs = allMCQs.slice(0, activeConfig.settings.totalQuestions);
          
          if (finalMCQs.length === 0) {
              toast.error("No MCQs found in selected sources");
              navigate('/live-mcq/exam-center');
              return;
          }

          setMCQs(finalMCQs);
          setTimeLeft(activeConfig.settings.timeLimit * 60);
          setLoading(false);
          startTimer();

      } catch (e) {
          console.error(e);
          toast.error("Failed to start exam");
          navigate('/live-mcq/exam-center');
      }
  };

  const startTimer = () => {
      timerRef.current = window.setInterval(() => {
          setTimeLeft(prev => {
              if (prev <= 1) {
                  if (timerRef.current) clearInterval(timerRef.current);
                  finishExam(true); 
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);
  };

  const handleAnswer = (option: string) => {
      const currentId = mcqs[currentIndex].id;
      setAnswers(prev => ({ ...prev, [currentId]: option }));
  };

  const handleConfidence = (level: 'sure' | 'guess') => {
      const currentId = mcqs[currentIndex].id;
      setConfidence(prev => ({ ...prev, [currentId]: level }));
  };

  const toggleMark = () => {
      const currentId = mcqs[currentIndex].id;
      const newMarked = new Set(marked);
      if (newMarked.has(currentId)) newMarked.delete(currentId);
      else newMarked.add(currentId);
      setMarked(newMarked);
  };

  const finishExam = async (auto = false) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      
      if (timerRef.current) clearInterval(timerRef.current);
      if (!activeConfig) {
          setIsSubmitting(false);
          return;
      }

      if (!auto) toast.info("Submitting exam...");

      try {
          const total = mcqs.length;
          let score = 0;
          
          mcqs.forEach(m => {
              if (answers[m.id] === m.answer) score++;
              else if (answers[m.id] && activeConfig.settings.negativeMarking) {
                  score -= activeConfig.settings.negativePenalty;
              }
          });

          const percentage = Math.round((Math.max(0, score) / total) * 100);
          const timeSpent = (activeConfig.settings.timeLimit * 60) - timeLeft;

          const attempt: Attempt = {
              id: generateUUID(),
              mode: 'custom-exam',
              examTemplateId: template?.id,
              score,
              total,
              percentage,
              timeSpent,
              answers,
              confidence,
              completedAt: Date.now()
          };

          await attemptService.create(attempt);
          
          if (template) {
              await examTemplateService.update(template.id, { usedCount: (template.usedCount || 0) + 1 });
          }

          if (auto) toast.info("Time's up! Exam submitted.");
          navigate(`/live-mcq/exam-center/result/${attempt.id}`, { replace: true });
      } catch (error) {
          console.error("Failed to finish exam", error);
          toast.error("Submission failed. Please try again.");
          setIsSubmitting(false);
      }
  };

  const handleExit = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      navigate('/live-mcq/exam-center');
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) return <div className="p-10 text-center">Preparing Exam...</div>;

  const currentMCQ = mcqs[currentIndex];
  const selectedOption = answers[currentMCQ?.id];
  const currentConfidence = confidence[currentMCQ?.id];
  const isMarked = marked.has(currentMCQ?.id);

  return (
    <div className="fixed inset-0 bg-white flex flex-col font-sans overflow-hidden">
        {/* 2. Exam Header Bar */}
        <div className="fixed top-0 left-0 right-0 z-[100] bg-[#1E1B4B] px-[20px] py-[12px] flex items-center justify-between shadow-md">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setShowExitConfirm(true)} 
                    className="text-white/60 hover:text-white transition-colors p-1 -ml-1"
                >
                    <Icon name="x" size="md" />
                </button>
                <div className="flex flex-col">
                    <span className="text-[16px] font-semibold text-white leading-tight">Exam</span>
                    <span className="text-[14px] font-normal text-white/60 leading-tight">
                        {currentIndex + 1}/{mcqs.length}
                    </span>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <span className="text-white/60">
                    <Icon name="clock" size="sm" />
                </span>
                <span className={`text-[20px] font-bold tabular-nums text-white ${timeLeft < 60 ? 'animate-pulse text-red-300' : ''}`}>
                    {formatTime(timeLeft)}
                </span>
            </div>

            <button 
                onClick={() => setShowSubmitConfirm(true)} 
                disabled={isSubmitting} 
                className="bg-white/15 border border-white/25 text-white rounded-[10px] px-[18px] py-[8px] text-[14px] font-semibold active:scale-95 transition-all hover:bg-white/20 disabled:opacity-50"
            >
                {isSubmitting ? '...' : 'Submit'}
            </button>
        </div>

        {/* Progress Line */}
        <div className="fixed top-[64px] left-0 right-0 h-[3px] bg-[#1E1B4B] z-[90]">
            <div 
                className="h-full bg-[#6366F1] transition-all duration-300 ease-out rounded-r-[2px]"
                style={{ width: `${((currentIndex + 1) / mcqs.length) * 100}%` }}
            ></div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 mt-[67px] mb-[76px] overflow-y-auto overscroll-contain">
            <div className="max-w-xl mx-auto pb-4">
                
                {/* 3. Question Number */}
                <div className="flex justify-between items-center my-[12px] px-[20px]">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-medium text-[#9CA3AF]">Q</span>
                        <span className="text-[14px] font-bold text-[#6366F1]">{currentIndex + 1}</span>
                    </div>
                    {isMarked && (
                        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                            <Icon name="check-circle" size="sm" />
                            <span className="text-[12px] font-bold uppercase tracking-wide">Marked</span>
                        </div>
                    )}
                </div>

                {/* 4. Question Card */}
                <div className="px-[20px] mb-3">
                    <div className="bg-[#F9FAFB] rounded-[16px] p-[16px]">
                        <h2 className="text-[16px] font-semibold text-[#111827] leading-[1.5]">
                            {currentMCQ.question}
                        </h2>
                    </div>
                </div>

                {/* 5. Option Cards */}
                <div className="px-[20px] flex flex-col gap-[8px]">
                    {['A', 'B', 'C', 'D'].map((opt) => {
                        const optionKey = `option${opt}` as keyof MCQ;
                        const text = currentMCQ[optionKey] as string;
                        const isSelected = selectedOption === opt;
                        
                        return (
                            <button
                                key={opt}
                                onClick={() => handleAnswer(opt)}
                                className={`
                                    w-full rounded-[14px] p-[12px] px-[16px] 
                                    flex items-center text-left border-[1.5px]
                                    transition-all duration-150 ease-out
                                    active:scale-[0.98]
                                    ${isSelected 
                                        ? 'bg-[#EEF2FF] border-[#6366F1]' 
                                        : 'bg-white border-[#F3F4F6]'
                                    }
                                `}
                            >
                                <div className={`
                                    w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] font-semibold flex-shrink-0 transition-colors
                                    ${isSelected ? 'bg-[#6366F1] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}
                                `}>
                                    {opt}
                                </div>
                                <span className="text-[15px] font-normal text-[#374151] ml-[12px] leading-snug">
                                    {text}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* 6. Confidence Level Section */}
                {selectedOption && (
                    <div className="mt-[10px] px-[24px] animate-in fade-in slide-in-from-top-2">
                        <div className="text-[13px] font-medium text-[#9CA3AF] mb-[6px] text-center">Confidence Level</div>
                        <div className="flex gap-[8px] justify-center">
                            <button 
                                onClick={() => handleConfidence('sure')}
                                className={`
                                    flex-1 max-w-[140px] py-[8px] rounded-[20px] text-[13px] font-medium transition-all
                                    ${currentConfidence === 'sure' 
                                        ? 'bg-[#6366F1] text-white shadow-sm' 
                                        : 'bg-[#F9FAFB] border border-[#F3F4F6] text-[#6B7280]'
                                    }
                                `}
                            >
                                ✓ Sure
                            </button>
                            <button 
                                onClick={() => handleConfidence('guess')}
                                className={`
                                    flex-1 max-w-[140px] py-[8px] rounded-[20px] text-[13px] font-medium transition-all
                                    ${currentConfidence === 'guess' 
                                        ? 'bg-[#6366F1] text-white shadow-sm' 
                                        : 'bg-[#F9FAFB] border border-[#F3F4F6] text-[#6B7280]'
                                    }
                                `}
                            >
                                ? Guess
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* 7. Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-[#F3F4F6] px-[20px] py-[12px] pb-safe">
            {/* Map Toggle Area */}
            <div className="absolute top-0 left-0 right-0 h-[20px] -mt-[20px] flex justify-center pointer-events-none">
                 <div 
                    onClick={() => setShowMap(!showMap)}
                    className="w-[60px] h-[20px] bg-white rounded-t-[12px] border-t border-l border-r border-[#F3F4F6] flex items-center justify-center cursor-pointer shadow-[0_-2px_4px_rgba(0,0,0,0.02)] pointer-events-auto"
                 >
                     <div className="w-8 h-1 bg-gray-200 rounded-full"></div>
                 </div>
            </div>

            {showMap && (
                <div className="absolute bottom-full left-0 right-0 bg-white border-t border-[#F3F4F6] p-4 shadow-xl z-30 max-h-[40vh] overflow-y-auto animate-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-5 gap-2">
                        {mcqs.map((_, i) => {
                            const ans = answers[mcqs[i].id];
                            const mk = marked.has(mcqs[i].id);
                            let cls = "bg-white border-[#F3F4F6] text-[#6B7280]";
                            if (i === currentIndex) cls = "ring-2 ring-[#6366F1] border-[#6366F1] text-[#6366F1] font-bold";
                            else if (mk) cls = "bg-amber-50 text-amber-600 border-amber-200 font-medium";
                            else if (ans) cls = "bg-[#EEF2FF] text-[#6366F1] border-indigo-100 font-medium";
                            
                            return (
                                <button key={i} onClick={() => { setCurrentIndex(i); setShowMap(false); }} className={`h-10 rounded-[8px] flex items-center justify-center text-[13px] border ${cls}`}>
                                    {i + 1}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="max-w-xl mx-auto flex items-center gap-[10px]">
                <button 
                    onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
                    disabled={currentIndex === 0}
                    className="flex-1 py-[12px] px-[20px] bg-[#F9FAFB] border border-[#F3F4F6] text-[#6B7280] rounded-[14px] text-[15px] font-medium disabled:opacity-50 active:scale-[0.98] transition-all hover:bg-[#F3F4F6]"
                >
                    ← Prev
                </button>
                
                <button 
                    onClick={toggleMark}
                    className={`flex-1 py-[12px] px-[20px] border-[1.5px] rounded-[14px] text-[15px] font-medium active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isMarked ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-[#F3F4F6] text-[#6B7280] hover:bg-gray-50'}`}
                >
                    {isMarked ? 'Unmark' : 'Flag'}
                </button>

                <button 
                    onClick={() => setCurrentIndex(p => Math.min(mcqs.length - 1, p + 1))}
                    disabled={currentIndex === mcqs.length - 1}
                    className="flex-[1.2] py-[12px] px-[24px] bg-[#6366F1] text-white rounded-[14px] text-[15px] font-semibold disabled:opacity-50 active:scale-[0.98] transition-transform shadow-sm hover:bg-[#5a5dd9]"
                >
                    Next →
                </button>
            </div>
        </div>

        {/* Submit Confirmation */}
        <PremiumModal isOpen={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)} title="Submit Exam?" size="sm">
            <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-[16px] space-y-2 text-sm border border-gray-100">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Answered:</span>
                        <span className="font-medium text-[#6366F1]">{Object.keys(answers).length} / {mcqs.length}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Marked:</span>
                        <span className="font-medium text-amber-600">{marked.size}</span>
                    </div>
                </div>
                <p className="text-xs text-gray-500 text-center">You cannot change answers after submitting.</p>
                <div className="flex gap-3 justify-end pt-2">
                    <PremiumButton variant="ghost" onClick={() => setShowSubmitConfirm(false)}>Continue</PremiumButton>
                    <PremiumButton variant="primary" onClick={() => finishExam()}>Submit Now</PremiumButton>
                </div>
            </div>
        </PremiumModal>

        {/* Exit Confirmation */}
        <PremiumModal isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} title="Exit Exam?" size="sm">
            <div className="space-y-4">
                <p className="text-[14px] text-gray-600">Are you sure? All progress will be lost.</p>
                <div className="flex justify-end gap-3 pt-2">
                    <PremiumButton variant="ghost" onClick={() => setShowExitConfirm(false)}>Cancel</PremiumButton>
                    <PremiumButton variant="danger" onClick={handleExit}>Exit</PremiumButton>
                </div>
            </div>
        </PremiumModal>
    </div>
  );
};

export default ActiveExamPage;