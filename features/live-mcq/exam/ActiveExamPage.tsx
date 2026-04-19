import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { mcqSetService, attemptService, examTemplateService } from '../../../core/storage/services';
import { MCQ, Attempt, MCQSet } from '../../../types';
import PremiumModal from '../../../shared/components/PremiumModal';
import PremiumButton from '../../../shared/components/PremiumButton';
import { generateUUID } from '../../../core/storage/idGenerator';
import { useToast } from '../../../shared/context/ToastContext';
import Icon from '../../../shared/components/Icon';
import { motion, AnimatePresence } from 'framer-motion';

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

  if (loading) return <div className="p-10 text-center font-sans tracking-widest uppercase text-xs text-text-secondary bg-background min-h-screen pt-20">Preparing Exam...</div>;

  const currentMCQ = mcqs[currentIndex];
  const selectedOption = answers[currentMCQ?.id];
  const currentConfidence = confidence[currentMCQ?.id];
  const isMarked = marked.has(currentMCQ?.id);

  return (
    <div className="fixed inset-0 bg-background flex flex-col font-serif overflow-hidden">
        {/* 2. Exam Header Bar */}
        <div className="fixed top-0 left-0 right-0 z-[100] bg-surface border-b border-border px-5 py-[12px] flex items-center justify-between shadow-none">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setShowExitConfirm(true)} 
                    className="text-text-secondary hover:text-text-primary transition-colors p-1 -ml-1 rounded-none hover:bg-background"
                >
                    <Icon name="x" size="md" />
                </button>
                <div className="flex flex-col">
                    <span className="text-[12px] font-sans font-semibold uppercase tracking-widest text-text-primary leading-tight">Exam</span>
                    <span className="text-[10px] font-sans font-semibold text-text-secondary tracking-[0.1em] mt-[2px] leading-tight opacity-70">
                        {currentIndex + 1} / {mcqs.length}
                    </span>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <span className="text-text-secondary opacity-70">
                    <Icon name="clock" size="sm" />
                </span>
                <span className={`text-[15px] font-medium font-serif tabular-nums text-text-primary ${timeLeft < 60 ? 'animate-pulse text-primary' : ''}`}>
                    {formatTime(timeLeft)}
                </span>
            </div>

            <button 
                onClick={() => setShowSubmitConfirm(true)} 
                disabled={isSubmitting} 
                className="bg-text-primary border border-text-primary text-surface rounded-none px-4 py-1.5 text-[10px] font-sans uppercase tracking-[0.1em] font-semibold transition-all hover:bg-[#2C2C2B]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-text-primary disabled:opacity-50"
            >
                {isSubmitting ? '...' : 'Submit'}
            </button>
        </div>

        {/* Progress Line */}
        <div className="fixed top-[60px] left-0 right-0 h-[1px] bg-border z-[90]">
            <div 
                className="h-full bg-text-primary transition-all duration-300 ease-out"
                style={{ width: `${((currentIndex + 1) / mcqs.length) * 100}%` }}
            ></div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 mt-[61px] mb-[74px] overflow-y-auto overscroll-contain bg-background">
            <div className="max-w-xl mx-auto pb-4">
                
                {/* 3. Question Number */}
                <div className="flex justify-between items-center my-[24px] px-[24px]">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-sans font-semibold text-text-secondary uppercase tracking-widest">Question</span>
                        <span className="text-[16px] font-serif font-medium text-text-primary">{currentIndex + 1}</span>
                    </div>
                    {isMarked && (
                        <div className="flex items-center gap-1.5 text-primary border border-primary px-3 py-1 bg-surface">
                            <Icon name="flag" size="sm" className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.1em]">Flagged</span>
                        </div>
                    )}
                </div>

                {/* 4. Question Card */}
                <div className="px-[24px] mb-6">
                    <div className="bg-surface border border-border rounded-none p-[24px]">
                        <h2 className="text-[17px] font-serif font-medium text-text-primary leading-[1.6]">
                            {currentMCQ.question}
                        </h2>
                    </div>
                </div>

                {/* 5. Option Cards */}
                <div className="px-[24px] flex flex-col gap-3">
                    {['A', 'B', 'C', 'D'].map((opt) => {
                        const optionKey = `option${opt}` as keyof MCQ;
                        const text = currentMCQ[optionKey] as string;
                        const isSelected = selectedOption === opt;
                        
                        return (
                            <button
                                key={opt}
                                onClick={() => handleAnswer(opt)}
                                className={`
                                    w-full rounded-none p-[16px] min-h-[64px]
                                    flex items-center text-left border
                                    transition-all duration-200 ease-out active:scale-[0.99]
                                    ${isSelected ? 'bg-[#EBE7DF] border-text-primary text-text-primary' : 'bg-surface border-border hover:bg-[#EBE7DF] text-text-primary'}
                                `}
                            >
                                <div 
                                    className={`
                                        w-[32px] h-[32px] border rounded-none flex items-center justify-center text-[12px] font-sans font-semibold flex-shrink-0 transition-colors
                                        ${isSelected ? 'border-text-primary bg-text-primary text-surface' : 'border-border/50 bg-background text-text-secondary'}
                                    `}
                                >
                                    {isSelected ? <Icon name="check" size="sm" strokeWidth={1.5} /> : opt}
                                </div>
                                <span className={`text-[16px] font-serif ml-[16px] leading-[1.5] tracking-tight ${isSelected ? 'text-text-primary font-medium' : 'text-text-primary'}`}>
                                    {text}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* 6. Confidence Level Section */}
                {selectedOption && (
                    <div className="mt-[32px] px-[24px] animate-in fade-in slide-in-from-top-2">
                        <div className="text-[10px] font-sans font-semibold uppercase tracking-widest text-text-secondary mb-[16px] text-center">Confidence Level</div>
                        <div className="flex gap-3 justify-center">
                            <button 
                                onClick={() => handleConfidence('sure')}
                                className={`
                                    flex-1 max-w-[140px] py-[12px] rounded-none border text-[10px] font-sans font-semibold uppercase tracking-[0.1em] transition-all hover:border-text-primary
                                    ${currentConfidence === 'sure' 
                                        ? 'bg-text-primary text-surface border-text-primary' 
                                        : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:bg-[#EBE7DF]'
                                    }
                                `}
                            >
                                Sure
                            </button>
                            <button 
                                onClick={() => handleConfidence('guess')}
                                className={`
                                    flex-1 max-w-[140px] py-[12px] rounded-none border text-[10px] font-sans font-semibold uppercase tracking-[0.1em] transition-all hover:border-text-primary
                                    ${currentConfidence === 'guess' 
                                        ? 'bg-[#8A4F3A] text-surface border-[#8A4F3A]' 
                                        : 'bg-surface border-border text-text-secondary hover:text-[#8A4F3A] hover:bg-[#F9F6F0]'
                                    }
                                `}
                            >
                                Guess
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* 7. Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-surface border-t border-border px-[24px] py-[12px] pb-safe font-sans">
            {/* Map Toggle Area */}
            <div className="absolute top-0 left-0 right-0 h-[20px] -mt-[20px] flex justify-center pointer-events-none">
                 <div 
                    onClick={() => setShowMap(!showMap)}
                    className="w-[80px] h-[20px] bg-surface border-t border-l border-r border-border rounded-t-sm flex items-center justify-center cursor-pointer pointer-events-auto transition-colors hover:bg-[#EBE7DF]"
                 >
                     <div className="w-8 h-0.5 bg-border rounded-full opacity-60"></div>
                 </div>
            </div>

            {showMap && (
                <div className="absolute bottom-full left-0 right-0 bg-surface border-t border-border p-5 shadow-none z-30 max-h-[40vh] overflow-y-auto animate-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-5 sm:grid-cols-8 gap-2.5 max-w-xl mx-auto">
                        {mcqs.map((_, i) => {
                            const ans = answers[mcqs[i].id];
                            const mk = marked.has(mcqs[i].id);
                            let cls = "bg-background border-border text-text-secondary hover:bg-[#EBE7DF] hover:text-text-primary";
                            if (i === currentIndex) cls = "bg-text-primary border-text-primary text-surface font-medium ring-2 ring-text-primary ring-offset-1 ring-offset-surface";
                            else if (mk) cls = "bg-surface border-primary text-primary font-medium";
                            else if (ans) cls = "bg-[#EBE7DF] border-text-primary text-text-primary font-medium";
                            
                            return (
                                <button key={i} onClick={() => { setCurrentIndex(i); setShowMap(false); }} className={`h-10 w-full rounded-none flex items-center justify-center text-[12px] font-sans font-semibold border transition-all ${cls}`}>
                                    {i + 1}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="max-w-xl mx-auto flex items-center gap-3">
                <button 
                    onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
                    disabled={currentIndex === 0}
                    className="flex-1 py-[12px] px-[16px] bg-background border border-border text-text-secondary rounded-none text-[10px] font-sans font-semibold uppercase tracking-widest disabled:opacity-50 active:scale-[0.98] transition-all hover:bg-[#EBE7DF] hover:text-text-primary"
                >
                    Prev
                </button>
                
                <button 
                    onClick={toggleMark}
                    className={`flex-1 py-[12px] px-[16px] border rounded-none text-[10px] font-sans font-semibold uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isMarked ? 'bg-[#F9F6F0] border-[#8A4F3A] text-[#8A4F3A]' : 'bg-background border-border text-text-secondary hover:bg-[#EBE7DF] hover:text-[#8A4F3A]'}`}
                >
                    {isMarked ? 'Flagged' : 'Flag'}
                </button>

                <button 
                    onClick={() => setCurrentIndex(p => Math.min(mcqs.length - 1, p + 1))}
                    disabled={currentIndex === mcqs.length - 1}
                    className="flex-[1.2] py-[12px] px-[24px] bg-text-primary text-surface rounded-none text-[10px] font-sans font-semibold uppercase tracking-widest disabled:opacity-50 active:scale-[0.98] transition-transform hover:bg-[#2C2C2B]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-text-primary"
                >
                    Next
                </button>
            </div>
        </div>

        {/* Submit Confirmation */}
        <PremiumModal isOpen={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)} title="Submit Exam" size="sm">
            <div className="space-y-6">
                <div className="bg-surface p-5 rounded-none space-y-3 text-[15px] border border-border">
                    <div className="flex justify-between font-serif">
                        <span className="text-text-secondary">Answered</span>
                        <span className="font-medium text-text-primary tabular-nums">{Object.keys(answers).length} <span className="text-secondary font-normal mx-1">/</span> {mcqs.length}</span>
                    </div>
                    <div className="flex justify-between font-serif">
                        <span className="text-text-secondary">Flagged</span>
                        <span className="font-medium text-primary tabular-nums">{marked.size}</span>
                    </div>
                </div>
                <p className="font-serif text-[14px] text-text-secondary text-center italic">You cannot change your answers after submitting.</p>
                <div className="flex gap-3 justify-end pt-2">
                    <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-3 bg-background border border-border text-text-primary font-sans text-[10px] font-semibold tracking-widest uppercase hover:bg-[#EBE7DF] transition-colors">Continue</button>
                    <button onClick={() => finishExam()} className="flex-1 py-3 bg-text-primary text-surface font-sans text-[10px] font-semibold tracking-widest uppercase hover:bg-[#2C2C2B]/90 transition-colors">Submit Final</button>
                </div>
            </div>
        </PremiumModal>

        {/* Exit Confirmation */}
        <PremiumModal isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} title="Exit Exam" size="sm">
            <div className="space-y-6">
                <p className="font-serif text-[15px] text-text-primary text-center">Are you sure you want to exit? <br/><span className="text-secondary">All progress will be lost.</span></p>
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-3 bg-background border border-border text-text-primary font-sans text-[10px] font-semibold tracking-widest uppercase hover:bg-[#EBE7DF] transition-colors">Cancel</button>
                    <button onClick={handleExit} className="flex-1 py-3 bg-primary text-surface font-sans text-[10px] font-semibold tracking-widest uppercase hover:bg-[#8A4F3A]/90 transition-colors">Exit Exam</button>
                </div>
            </div>
        </PremiumModal>
    </div>
  );
};

export default ActiveExamPage;