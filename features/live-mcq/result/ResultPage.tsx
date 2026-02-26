
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptService, mcqSetService } from '../../../core/storage/services';
import { Attempt, MCQSet } from '../../../types';
import TopBar from '../../../shared/components/TopBar';
import PremiumCard from '../../../shared/components/PremiumCard';
import PremiumButton from '../../../shared/components/PremiumButton';
import CheckmarkIcon from '../../../shared/components/CheckmarkIcon';

const ResultPage: React.FC = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [set, setSet] = useState<MCQSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (attemptId) {
        loadResult();
    } else {
        setLoading(false);
        setError("Invalid result ID");
    }
  }, [attemptId]);

  const loadResult = async () => {
      setLoading(true);
      setError('');
      try {
          const a = await attemptService.getById(attemptId!);
          if (a) {
              setAttempt(a);
              if (a.setId) {
                  const s = await mcqSetService.getById(a.setId);
                  setSet(s || null);
              }
          } else {
              setError("Result not found");
          }
      } catch (e) {
          console.error(e);
          setError("Failed to load result");
      } finally {
          setLoading(false);
      }
  };

  if (loading) {
      return (
          <div className="min-h-screen bg-[var(--bg)] pt-[56px] flex flex-col items-center justify-center">
              <TopBar title="Loading Result" showBack backPath="/live-mcq/topics" showHome={true} />
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p className="text-[var(--text-secondary)]">Loading your results...</p>
          </div>
      );
  }

  if (error || !attempt) {
      return (
          <div className="min-h-screen bg-[var(--bg)] pt-[56px] flex flex-col items-center justify-center p-4 text-center">
              <TopBar title="Error" showBack backPath="/live-mcq/topics" showHome={true} />
              <div className="text-4xl mb-4">❌</div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">{error || "Something went wrong"}</h2>
              <p className="text-gray-500 mb-6">Could not load the result data.</p>
              <div className="flex gap-3">
                  <PremiumButton onClick={() => navigate('/live-mcq/topics')}>Go Home</PremiumButton>
                  <PremiumButton variant="secondary" onClick={loadResult}>Retry</PremiumButton>
              </div>
          </div>
      );
  }

  const getMessage = (p: number) => {
      if (p >= 90) return { text: "Outstanding!", emoji: "🏆" };
      if (p >= 80) return { text: "Excellent Work!", emoji: "🎉" };
      if (p >= 70) return { text: "Good Job!", emoji: "👍" };
      if (p >= 50) return { text: "Keep Practicing!", emoji: "💪" };
      return { text: "Need More Practice", emoji: "📚" };
  };

  const msg = getMessage(attempt.percentage);
  const correctCount = attempt.score;
  const wrongCount = Object.keys(attempt.answers).length - correctCount;
  const skippedCount = attempt.total - Object.keys(attempt.answers).length;
  
  // Calc values for circle
  const radius = 82;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (attempt.percentage || 0) / 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 pt-[60px]">
        <header className="fixed top-0 left-0 right-0 h-[60px] bg-white/80 backdrop-blur-xl border-b border-slate-200/60 z-50 px-5 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => set ? navigate(`/live-mcq/set/${set.id}`) : navigate('/live-mcq/topics')} 
                    className="p-2 -ml-2 text-slate-500 hover:text-slate-900 rounded-full transition-colors active:scale-95"
                >
                    <Icon name="arrow-left" size="md" />
                </button>
            </div>
            <h1 className="text-[18px] font-semibold text-slate-900 absolute left-1/2 -translate-x-1/2 tracking-tight">
                Result
            </h1>
            <div className="w-10"></div>
        </header>

        {!showReview ? (
            <div className="max-w-md mx-auto p-6 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="space-y-2">
                    <div className="text-6xl mb-4 block animate-bounce drop-shadow-md">{msg.emoji}</div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{msg.text}</h1>
                    <p className="text-slate-500 font-medium">You scored {attempt.score} out of {attempt.total}</p>
                </div>

                {/* Score Circle */}
                <div className="relative w-56 h-56 mx-auto">
                    <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 192 192">
                        {/* Background Circle */}
                        <circle cx="96" cy="96" r="82" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                        {/* Progress Circle */}
                        <circle 
                            cx="96" cy="96" r="82" 
                            stroke={attempt.percentage >= 70 ? '#10B981' : attempt.percentage >= 40 ? '#F59E0B' : '#EF4444'} 
                            strokeWidth="12" 
                            fill="none" 
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-5xl font-bold text-slate-800 tracking-tighter">{attempt.percentage}%</span>
                        <span className="text-sm text-slate-400 font-medium uppercase tracking-widest mt-1">Accuracy</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-emerald-50 p-4 rounded-[20px] border border-emerald-100 shadow-sm">
                        <div className="text-2xl font-bold text-emerald-600">{correctCount}</div>
                        <div className="text-[11px] uppercase text-emerald-600/70 font-bold tracking-wider mt-1">Correct</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-[20px] border border-red-100 shadow-sm">
                        <div className="text-2xl font-bold text-red-600">{wrongCount}</div>
                        <div className="text-[11px] uppercase text-red-600/70 font-bold tracking-wider mt-1">Wrong</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-[20px] border border-slate-100 shadow-sm">
                        <div className="text-2xl font-bold text-slate-600">{skippedCount}</div>
                        <div className="text-[11px] uppercase text-slate-500/70 font-bold tracking-wider mt-1">Skipped</div>
                    </div>
                </div>

                <div className="space-y-3 pt-6">
                    {set && (
                        <PremiumButton fullWidth onClick={() => setShowReview(true)} className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 py-4 text-[16px]">Review Answers</PremiumButton>
                    )}
                    <PremiumButton fullWidth variant="secondary" onClick={() => set ? navigate(`/live-mcq/set/${set.id}`) : navigate('/live-mcq/topics')} className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 py-4 text-[16px]">
                        {set ? 'Back to Set' : 'Back Home'}
                    </PremiumButton>
                </div>
            </div>
        ) : (
            <div className="max-w-2xl mx-auto p-5 space-y-5">
                <div className="flex justify-between items-center mb-2 px-1">
                    <h2 className="font-bold text-xl text-slate-800">Review Answers</h2>
                    <button onClick={() => setShowReview(false)} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">Back to Score</button>
                </div>

                {set?.mcqs.map((mcq, i) => {
                    const userAns = attempt.answers[mcq.id];
                    const isCorrect = userAns === mcq.answer;
                    const isSkipped = !userAns;

                    return (
                        <div key={mcq.id} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 space-y-4">
                            <div className="flex gap-4">
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-sm ${isSkipped ? 'bg-slate-400' : isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                    {isSkipped ? '?' : isCorrect ? '✓' : '✕'}
                                </div>
                                <div className="flex-1">
                                    <div className="text-[16px] font-medium text-slate-800 mb-4 leading-relaxed">
                                        <span className="font-bold mr-1 text-slate-400">{i + 1}.</span> {mcq.question}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {['A', 'B', 'C', 'D'].map(opt => {
                                            const optionKey = `option${opt}` as keyof typeof mcq;
                                            const isSelected = userAns === opt;
                                            const isAnswer = mcq.answer === opt;
                                            
                                            let cls = "p-3 rounded-xl border border-transparent flex items-center gap-3 transition-colors";
                                            let icon = null;

                                            if (isAnswer) {
                                                cls = "bg-emerald-50 border-emerald-200 text-emerald-800 font-medium";
                                                icon = <CheckmarkIcon size={16} color="#059669" />;
                                            } else if (isSelected) {
                                                cls = "bg-red-50 border-red-200 text-red-800 line-through decoration-red-400 opacity-80";
                                                icon = <span className="text-red-500 font-bold">✕</span>;
                                            } else {
                                                cls = "bg-slate-50 text-slate-500 border-slate-100";
                                            }

                                            return (
                                                <div key={opt} className={cls}>
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isAnswer ? 'bg-emerald-200 text-emerald-800' : isSelected ? 'bg-red-200 text-red-800' : 'bg-white border border-slate-200 text-slate-400'}`}>{opt}</span>
                                                    <span className="flex-1">{mcq[optionKey] as string}</span>
                                                    {icon}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {mcq.explanation && (
                                        <div className="mt-4 text-sm bg-slate-50 p-4 rounded-[16px] text-slate-600 border border-slate-100">
                                            <span className="font-bold text-slate-700 block mb-1">Explanation:</span> {mcq.explanation}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};

export default ResultPage;
