
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mcqSetService, attemptService } from '../../../core/storage/services';
import { MCQSet, MCQ, Attempt } from '../../../types';
import PremiumModal from '../../../shared/components/PremiumModal';
import PremiumButton from '../../../shared/components/PremiumButton';
import { generateUUID } from '../../../core/storage/idGenerator';
import { useToast } from '../../../shared/context/ToastContext';

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
        <div className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 sticky top-0 z-20 shadow-md border-b border-slate-800">
            <div className="flex items-center gap-4">
                <button onClick={() => setShowExitConfirm(true)} className="text-slate-400 hover:text-white p-2 -ml-2 transition-colors">✕</button>
                <span className="font-bold tracking-tight">Exam Mode</span>
            </div>
            <div className={`font-mono text-lg font-bold ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                ⏱️ {formatTime(timeLeft)}
            </div>
            <button onClick={() => setShowSubmitConfirm(true)} disabled={isSubmitting} className="text-xs bg-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-500 disabled:opacity-50 font-semibold shadow-lg shadow-emerald-900/20 transition-all active:scale-95">
                {isSubmitting ? '...' : 'Submit'}
            </button>
        </div>

        {/* Question Area */}
        <div className="flex-1 p-5 pb-40 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex justify-between items-center text-sm text-slate-500 font-medium">
                    <span>Question {currentIndex + 1} of {mcqs.length}</span>
                    {isMarked && <span className="text-amber-600 font-bold flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">🚩 Marked</span>}
                </div>

                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                    <h2 className="text-[18px] font-semibold text-slate-800 leading-[1.6]">
                        {currentMCQ.question}
                    </h2>
                </div>

                <div className="space-y-3">
                    {['A', 'B', 'C', 'D'].map((opt) => {
                        const text = currentMCQ[`option${opt}` as keyof MCQ] as string;
                        const isSelected = selectedOption === opt;
                        
                        return (
                            <button
                                key={opt}
                                onClick={() => handleAnswer(opt)}
                                className={`w-full p-4 border rounded-[20px] flex items-start gap-4 text-left transition-all duration-200 ${isSelected ? 'bg-slate-800 border-slate-800 text-white shadow-lg shadow-slate-900/10' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'}`}
                            >
                                <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${isSelected ? 'border-white text-white bg-white/20' : 'border-slate-300 text-slate-400 bg-slate-50'}`}>{opt}</span>
                                <span className="text-[15px] mt-0.5 leading-snug">{text}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* Navigator Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 z-20 pb-safe">
            {/* Quick Nav Strip */}
            <div className="overflow-x-auto whitespace-nowrap p-3 border-b border-slate-100 scrollbar-hide flex gap-2 px-4">
                {mcqs.map((m, i) => {
                    const ans = answers[m.id];
                    const mk = marked.has(m.id);
                    let statusClass = "bg-slate-50 text-slate-400 border-slate-100";
                    
                    if (i === currentIndex) statusClass = "bg-slate-800 text-white border-slate-800 ring-2 ring-slate-200";
                    else if (mk) statusClass = "bg-amber-100 text-amber-600 border-amber-200";
                    else if (ans) statusClass = "bg-emerald-50 text-emerald-600 border-emerald-200";

                    return (
                        <button 
                            key={m.id}
                            onClick={() => setCurrentIndex(i)}
                            className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold border transition-all ${statusClass}`}
                        >
                            {i + 1}
                        </button>
                    );
                })}
            </div>

            <div className="p-4 flex justify-between items-center max-w-2xl mx-auto gap-4">
                <button 
                    onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
                    disabled={currentIndex === 0}
                    className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    ← Prev
                </button>
                
                <button 
                    onClick={toggleMark}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl border transition-colors ${isMarked ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                >
                    {isMarked ? 'Unmark' : 'Mark'}
                </button>

                <button 
                    onClick={() => setCurrentIndex(p => Math.min(mcqs.length - 1, p + 1))}
                    disabled={currentIndex === mcqs.length - 1}
                    className="flex-1 py-3 text-sm font-bold text-white bg-slate-800 rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-slate-900/10"
                >
                    Next →
                </button>
            </div>
        </div>

        {/* Exam Settings Modal */}
        <PremiumModal isOpen={showSettings} onClose={() => navigate(`/live-mcq/set/${setId}`)} title="Exam Settings" size="sm">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">Time Limit (Minutes)</label>
                    <div className="grid grid-cols-4 gap-3">
                        {[10, 15, 20, 30].map(m => (
                            <button 
                                key={m}
                                onClick={() => setTimeLimit(m)}
                                className={`py-3 rounded-xl text-sm font-bold border transition-all ${timeLimit === m ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                            >
                                {m}m
                            </button>
                        ))}
                    </div>
                </div>
                
                <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-bold text-slate-700">Shuffle Questions</span>
                    <div className="relative flex items-center">
                        <input type="checkbox" checked={options.shuffleQuestions} onChange={e => setOptions({...options, shuffleQuestions: e.target.checked})} className="peer sr-only" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </div>
                </label>

                <div className="pt-2">
                    <PremiumButton fullWidth onClick={startExam} className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20">Start Exam</PremiumButton>
                </div>
            </div>
        </PremiumModal>

        {/* Submit Confirmation */}
        <PremiumModal isOpen={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)} title="Submit Exam?" size="sm">
            <div className="space-y-5">
                <div className="bg-slate-50 p-5 rounded-2xl space-y-3 text-sm border border-slate-100">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Answered</span>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{Object.keys(answers).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Marked</span>
                        <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">{marked.size}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-2">
                        <span className="text-slate-500 font-medium">Remaining</span>
                        <span className="font-bold text-slate-900">{mcqs.length - Object.keys(answers).length}</span>
                    </div>
                </div>
                <p className="text-xs text-slate-400 text-center">You cannot change answers after submitting.</p>
                <div className="flex gap-3">
                    <PremiumButton variant="ghost" onClick={() => setShowSubmitConfirm(false)}>Continue</PremiumButton>
                    <PremiumButton onClick={() => finishExam()} className="bg-emerald-600 hover:bg-emerald-500">Submit Now</PremiumButton>
                </div>
            </div>
        </PremiumModal>

        {/* Exit Confirmation */}
        <PremiumModal isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} title="Exit Exam?" size="sm">
            <div className="space-y-4">
                <p className="text-sm text-slate-500">Are you sure? All progress will be lost.</p>
                <div className="flex justify-end gap-3 pt-2">
                    <PremiumButton variant="ghost" onClick={() => setShowExitConfirm(false)}>Cancel</PremiumButton>
                    <PremiumButton variant="danger" onClick={handleExit}>Exit</PremiumButton>
                </div>
            </div>
        </PremiumModal>
    </div>
  );
};

export default ExamSession;
