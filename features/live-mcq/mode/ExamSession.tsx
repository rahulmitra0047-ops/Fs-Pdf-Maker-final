
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mcqSetService, attemptService } from '../../../core/storage/services';
import { MCQSet, MCQ, Attempt } from '../../../types';
import PremiumModal from '../../../shared/components/PremiumModal';
import PremiumButton from '../../../shared/components/PremiumButton';
import { generateUUID } from '../../../core/storage/idGenerator';
import { useToast } from '../../../shared/context/ToastContext';
import Icon from '../../../shared/components/Icon';

const ExamSession: React.FC = () => {
  const { setId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [set, setSet] = useState<MCQSet | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Settings
  const [showSettings, setShowSettings] = useState(true);
  const [timeLimit, setTimeLimit] = useState(15); // minutes
  const [options, setOptions] = useState({
      shuffleQuestions: false,
  });

  // Session State
  const [mcqs, setMCQs] = useState<MCQ[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); 
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (setId) {
        mcqSetService.getById(setId).then(s => {
            if (s) {
                setSet(s);
                setMCQs(s.mcqs);
            } else {
                toast.error("Set not found");
                navigate('/live-mcq/topics');
            }
            setLoading(false);
        });
    }
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [setId]);

  const startExam = () => {
      let sessionMcqs = [...(set?.mcqs || [])];
      if (options.shuffleQuestions) {
          sessionMcqs = sessionMcqs.sort(() => Math.random() - 0.5);
      }
      setMCQs(sessionMcqs);
      setTimeLeft(timeLimit * 60);
      setShowSettings(false);
      
      timerRef.current = window.setInterval(() => {
          setTimeLeft(prev => {
              if (prev <= 1) {
                  if (timerRef.current) clearInterval(timerRef.current);
                  finishExam(true); // Auto submit
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

  const toggleMark = () => {
      const currentId = mcqs[currentIndex].id;
      const newMarked = new Set(marked);
      if (newMarked.has(currentId)) newMarked.delete(currentId);
      else newMarked.add(currentId);
      setMarked(newMarked);
  };

  const finishExam = async (auto = false) => {
      if (!set || isSubmitting) return;
      setIsSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);
      
      if (!auto) toast.info("Submitting exam...");

      try {
          const total = mcqs.length;
          let score = 0;
          
          mcqs.forEach(m => {
              if (answers[m.id] === m.answer) score++;
          });

          const percentage = Math.round((score / total) * 100);
          const timeSpent = (timeLimit * 60) - timeLeft;

          const attempt: Attempt = {
              id: generateUUID(),
              setId: set.id,
              mode: 'exam',
              score,
              total,
              percentage,
              timeSpent,
              answers,
              completedAt: Date.now()
          };

          // Await to ensure saving is complete
          await attemptService.create(attempt);
          
          if (auto) toast.info("Time's up! Exam submitted.");
          navigate(`/live-mcq/result/${attempt.id}`, { replace: true });
      } catch (error) {
          console.error("Failed to submit exam", error);
          toast.error("Submission failed. Please try again.");
          setIsSubmitting(false);
      }
  };

  const handleExit = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      navigate(`/live-mcq/set/${setId}`);
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading || !set) return <div className="p-10 text-center">Loading...</div>;

  const currentMCQ = mcqs[currentIndex];
  const selectedOption = answers[currentMCQ?.id];
  const isMarked = marked.has(currentMCQ?.id);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        {/* Exam Header */}
        <div className="h-16 bg-background border-b border-border/50 flex items-center justify-between px-6 sticky top-0 z-20 font-sans uppercase tracking-widest text-xs">
            <div className="flex items-center gap-4">
                <button onClick={() => setShowExitConfirm(true)} className="text-text-primary p-2 -ml-2 hover:bg-[#EBE7DF] transition-colors"><Icon name="x" size="sm" strokeWidth={1.5} /></button>
                <span className="font-semibold text-text-primary">Exam</span>
            </div>
            <div className={`font-mono text-sm tracking-wider font-semibold ${timeLeft < 60 ? 'text-[#8A4F3A] animate-pulse' : 'text-text-primary'}`}>
                {formatTime(timeLeft)}
            </div>
            <button onClick={() => setShowSubmitConfirm(true)} disabled={isSubmitting} className="border border-primary text-primary px-3 py-1 font-semibold hover:bg-[#EBE7DF] disabled:opacity-50 transition-colors">
                {isSubmitting ? '...' : 'SUMBIT'}
            </button>
        </div>

        {/* Question Area */}
        <div className="flex-1 p-6 pb-48 overflow-y-auto font-serif">
            <div className="max-w-xl mx-auto space-y-6">
                <div className="flex justify-between items-center font-sans text-[10px] text-text-secondary uppercase tracking-widest font-semibold pb-2 border-b border-border/50">
                    <span>Question {currentIndex + 1} of {mcqs.length}</span>
                    {isMarked && <span className="text-[#8A4F3A] flex items-center gap-1">Marked</span>}
                </div>

                <div className="bg-surface p-6 border border-border">
                    <h2 className="text-xl font-medium text-text-primary leading-[1.6]">
                        {currentMCQ.question}
                    </h2>
                </div>

                <div className="space-y-3 pt-2">
                    {['A', 'B', 'C', 'D'].map((opt) => {
                        const text = currentMCQ[`option${opt}` as keyof MCQ] as string;
                        const isSelected = selectedOption === opt;
                        
                        return (
                            <button
                                key={opt}
                                onClick={() => handleAnswer(opt)}
                                className={`w-full p-4 px-5 border flex items-center text-left transition-all duration-200 min-h-[64px] ${isSelected ? 'bg-text-primary border-text-primary text-surface' : 'bg-surface border-border text-text-primary hover:bg-[#EBE7DF]'}`}
                            >
                                <span className={`w-8 h-8 border flex items-center justify-center font-sans text-xs font-semibold flex-shrink-0 transition-colors ${isSelected ? 'border-surface text-surface' : 'border-border/50 text-text-secondary bg-background'}`}>{opt}</span>
                                <span className="text-[17px] ml-4 leading-relaxed tracking-tight">{text}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* Navigator Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/50 z-20 pb-safe font-sans">
            {/* Quick Nav Strip */}
            <div className="overflow-x-auto whitespace-nowrap p-3 border-b border-border/50 scrollbar-hide flex gap-2 px-6">
                {mcqs.map((m, i) => {
                    const ans = answers[m.id];
                    const mk = marked.has(m.id);
                    let statusClass = "bg-surface text-text-secondary border-border/50 opacity-60";
                    
                    if (i === currentIndex) statusClass = "bg-text-primary text-surface border-text-primary opacity-100";
                    else if (mk) statusClass = "bg-[#8A4F3A] text-surface border-[#8A4F3A] opacity-100";
                    else if (ans) statusClass = "bg-[#EBE7DF] text-primary border-primary opacity-100";

                    return (
                        <button 
                            key={m.id}
                            onClick={() => setCurrentIndex(i)}
                            className={`w-10 h-10 flex-shrink-0 flex items-center justify-center text-[11px] font-semibold border transition-all ${statusClass}`}
                        >
                            {i + 1}
                        </button>
                    );
                })}
            </div>

            <div className="p-4 flex justify-between items-center max-w-xl mx-auto gap-4">
                <button 
                    onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
                    disabled={currentIndex === 0}
                    className="flex-1 py-4 text-xs font-semibold text-text-primary border border-border bg-surface hover:bg-[#EBE7DF] disabled:opacity-30 transition-colors uppercase tracking-widest min-w-[30%]"
                >
                    Prev
                </button>
                
                <button 
                    onClick={toggleMark}
                    className={`flex-1 py-4 text-xs font-semibold border transition-colors uppercase tracking-widest min-w-[30%] ${isMarked ? 'bg-[#8A4F3A] text-surface border-[#8A4F3A]' : 'bg-surface text-text-primary border-border hover:bg-[#EBE7DF]'}`}
                >
                    {isMarked ? 'Unmark' : 'Mark'}
                </button>

                <button 
                    onClick={() => setCurrentIndex(p => Math.min(mcqs.length - 1, p + 1))}
                    disabled={currentIndex === mcqs.length - 1}
                    className="flex-1 py-4 text-xs font-semibold text-surface border border-text-primary bg-text-primary hover:bg-[#434342] disabled:opacity-30 transition-colors uppercase tracking-widest min-w-[30%]"
                >
                    Next
                </button>
            </div>
        </div>

        {/* Exam Settings Modal */}
        <PremiumModal isOpen={showSettings} onClose={() => navigate(`/live-mcq/set/${setId}`)} title="Exam Settings" size="sm">
            <div className="space-y-6 font-sans">
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-text-secondary mb-3">Time Limit (Minutes)</label>
                    <div className="grid grid-cols-4 gap-3">
                        {[10, 15, 20, 30].map(m => (
                            <button 
                                key={m}
                                onClick={() => setTimeLimit(m)}
                                className={`py-3 rounded-none text-sm font-semibold border transition-all ${timeLimit === m ? 'bg-text-primary text-surface border-text-primary' : 'bg-surface text-text-primary border-border hover:bg-[#EBE7DF]'}`}
                            >
                                {m}m
                            </button>
                        ))}
                    </div>
                </div>
                
                <label className="flex items-center justify-between p-4 border border-border rounded-none cursor-pointer hover:bg-[#EBE7DF] transition-colors">
                    <span className="text-xs font-semibold uppercase tracking-widest text-text-primary">Shuffle Questions</span>
                    <div className="relative flex items-center">
                        <input type="checkbox" checked={options.shuffleQuestions} onChange={e => setOptions({...options, shuffleQuestions: e.target.checked})} className="peer sr-only" />
                        <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-surface after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-border after:border after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                </label>

                <div className="pt-2">
                    <PremiumButton fullWidth onClick={startExam}>START EXAM</PremiumButton>
                </div>
            </div>
        </PremiumModal>

        {/* Submit Confirmation */}
        <PremiumModal isOpen={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)} title="Submit Exam?" size="sm">
            <div className="space-y-5 font-sans">
                <div className="bg-surface p-5 border border-border space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-text-secondary font-semibold uppercase tracking-widest text-[10px]">Answered</span>
                        <span className="font-bold text-primary">{Object.keys(answers).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-text-secondary font-semibold uppercase tracking-widest text-[10px]">Marked</span>
                        <span className="font-bold text-[#8A4F3A]">{marked.size}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-border/50 pt-3 mt-3">
                        <span className="text-text-secondary font-semibold uppercase tracking-widest text-[10px]">Remaining</span>
                        <span className="font-bold text-text-primary">{mcqs.length - Object.keys(answers).length}</span>
                    </div>
                </div>
                <p className="text-xs text-text-secondary text-center">You cannot change answers after submitting.</p>
                <div className="flex gap-3">
                    <PremiumButton variant="ghost" onClick={() => setShowSubmitConfirm(false)}>Continue</PremiumButton>
                    <PremiumButton onClick={() => finishExam()}>Submit Now</PremiumButton>
                </div>
            </div>
        </PremiumModal>

        {/* Exit Confirmation */}
        <PremiumModal isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} title="Exit Exam?" size="sm">
            <div className="space-y-6">
                <p className="font-serif text-[15px] text-text-secondary">Are you sure? All progress will be lost.</p>
                <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                    <PremiumButton variant="ghost" onClick={() => setShowExitConfirm(false)}>Cancel</PremiumButton>
                    <PremiumButton variant="danger" onClick={handleExit}>Exit</PremiumButton>
                </div>
            </div>
        </PremiumModal>
    </div>
  );
};

export default ExamSession;
