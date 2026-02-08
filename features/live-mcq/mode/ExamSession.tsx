
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
                navigate('/live-mcq');
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
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
        {/* Exam Header */}
        <div className="h-14 bg-gray-900 text-white flex items-center justify-between px-4 sticky top-0 z-20 shadow-md">
            <div className="flex items-center gap-4">
                <button onClick={() => setShowExitConfirm(true)} className="text-gray-400 hover:text-white p-2 -ml-2">✕</button>
                <span className="font-bold">Exam</span>
            </div>
            <div className={`font-mono text-lg font-bold ${timeLeft < 60 ? 'text-red-400 animate-pulse' : ''}`}>
                ⏱️ {formatTime(timeLeft)}
            </div>
            <button onClick={() => setShowSubmitConfirm(true)} disabled={isSubmitting} className="text-xs bg-green-600 px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50">
                {isSubmitting ? '...' : 'Submit'}
            </button>
        </div>

        {/* Question Area */}
        <div className="flex-1 p-4 pb-32 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex justify-between items-center text-sm text-[var(--text-secondary)]">
                    <span>Question {currentIndex + 1} of {mcqs.length}</span>
                    {isMarked && <span className="text-amber-600 font-medium flex items-center gap-1">🚩 Marked for review</span>}
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-medium text-[var(--text-primary)] leading-relaxed">
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
                                className={`w-full p-4 border rounded-xl flex items-start gap-4 text-left transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                            >
                                <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${isSelected ? 'border-white text-white' : 'border-gray-300 text-gray-500'}`}>{opt}</span>
                                <span className="text-sm mt-0.5">{text}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* Navigator Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--border)] z-20">
            {/* Quick Nav Strip */}
            <div className="overflow-x-auto whitespace-nowrap p-2 border-b border-gray-100 scrollbar-hide flex gap-2">
                {mcqs.map((m, i) => {
                    const ans = answers[m.id];
                    const mk = marked.has(m.id);
                    let statusClass = "bg-gray-100 text-gray-400 border-gray-200";
                    if (i === currentIndex) statusClass = "bg-blue-600 text-white border-blue-600";
                    else if (mk) statusClass = "bg-amber-100 text-amber-600 border-amber-300";
                    else if (ans) statusClass = "bg-blue-50 text-blue-600 border-blue-200";

                    return (
                        <button 
                            key={m.id}
                            onClick={() => setCurrentIndex(i)}
                            className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium border ${statusClass}`}
                        >
                            {i + 1}
                        </button>
                    );
                })}
            </div>

            <div className="p-3 flex justify-between items-center max-w-2xl mx-auto">
                <button 
                    onClick={() => setCurrentIndex(p => Math.max(0, p - 1))}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 text-sm font-medium text-gray-600 disabled:opacity-30"
                >
                    ← Prev
                </button>
                
                <button 
                    onClick={toggleMark}
                    className={`px-4 py-2 text-sm font-medium rounded-lg ${isMarked ? 'bg-amber-100 text-amber-700' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    {isMarked ? 'Unmark' : 'Mark'}
                </button>

                <button 
                    onClick={() => setCurrentIndex(p => Math.min(mcqs.length - 1, p + 1))}
                    disabled={currentIndex === mcqs.length - 1}
                    className="px-4 py-2 text-sm font-medium text-gray-600 disabled:opacity-30"
                >
                    Next →
                </button>
            </div>
        </div>

        {/* Exam Settings Modal */}
        <PremiumModal isOpen={showSettings} onClose={() => navigate(`/live-mcq/set/${setId}`)} title="Exam Settings" size="sm">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit</label>
                    <div className="grid grid-cols-4 gap-2">
                        {[10, 15, 20, 30].map(m => (
                            <button 
                                key={m}
                                onClick={() => setTimeLimit(m)}
                                className={`py-2 rounded text-sm border ${timeLimit === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                {m}m
                            </button>
                        ))}
                    </div>
                </div>
                
                <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer">
                    <span className="text-sm font-medium">Shuffle Questions</span>
                    <input type="checkbox" checked={options.shuffleQuestions} onChange={e => setOptions({...options, shuffleQuestions: e.target.checked})} className="w-5 h-5 text-blue-600" />
                </label>

                <div className="pt-4">
                    <PremiumButton fullWidth onClick={startExam}>Start Exam</PremiumButton>
                </div>
            </div>
        </PremiumModal>

        {/* Submit Confirmation */}
        <PremiumModal isOpen={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)} title="Submit Exam?" size="sm">
            <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Answered:</span>
                        <span className="font-medium text-blue-600">{Object.keys(answers).length}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Marked:</span>
                        <span className="font-medium text-amber-600">{marked.size}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Remaining:</span>
                        <span className="font-medium text-gray-900">{mcqs.length - Object.keys(answers).length}</span>
                    </div>
                </div>
                <p className="text-xs text-gray-500 text-center">You cannot change answers after submitting.</p>
                <div className="flex gap-3">
                    <PremiumButton variant="ghost" onClick={() => setShowSubmitConfirm(false)}>Continue Exam</PremiumButton>
                    <PremiumButton variant="primary" onClick={() => finishExam()}>Submit Now</PremiumButton>
                </div>
            </div>
        </PremiumModal>

        {/* Exit Confirmation */}
        <PremiumModal isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} title="Exit Exam?" size="sm">
            <div className="space-y-4">
                <p className="text-[var(--text-secondary)]">Are you sure? Progress will be lost.</p>
                <div className="flex justify-end gap-3">
                    <PremiumButton variant="ghost" onClick={() => setShowExitConfirm(false)}>Cancel</PremiumButton>
                    <PremiumButton variant="danger" onClick={handleExit}>Exit</PremiumButton>
                </div>
            </div>
        </PremiumModal>
    </div>
  );
};

export default ExamSession;
