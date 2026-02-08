
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
              <TopBar title="Loading Result" showBack backPath="/live-mcq" showHome={true} />
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p className="text-[var(--text-secondary)]">Loading your results...</p>
          </div>
      );
  }

  if (error || !attempt) {
      return (
          <div className="min-h-screen bg-[var(--bg)] pt-[56px] flex flex-col items-center justify-center p-4 text-center">
              <TopBar title="Error" showBack backPath="/live-mcq" showHome={true} />
              <div className="text-4xl mb-4">❌</div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">{error || "Something went wrong"}</h2>
              <p className="text-gray-500 mb-6">Could not load the result data.</p>
              <div className="flex gap-3">
                  <PremiumButton onClick={() => navigate('/live-mcq')}>Go Home</PremiumButton>
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
    <div className="min-h-screen bg-[var(--bg)] pb-20 pt-[56px]">
        <TopBar 
            title="Result" 
            showBack 
            backPath={set ? `/live-mcq/set/${set.id}` : '/live-mcq'}
            showHome={true}
        />

        {!showReview ? (
            <div className="max-w-md mx-auto p-6 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="space-y-2">
                    <div className="text-6xl mb-4 block animate-bounce">{msg.emoji}</div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">{msg.text}</h1>
                    <p className="text-[var(--text-secondary)]">You scored {attempt.score} out of {attempt.total}</p>
                </div>

                {/* Score Circle */}
                <div className="relative w-48 h-48 mx-auto">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
                        {/* Background Circle */}
                        <circle cx="96" cy="96" r="82" stroke="#e5e7eb" strokeWidth="12" fill="none" />
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
                        <span className="text-4xl font-bold text-[var(--text-primary)]">{attempt.percentage}%</span>
                        <span className="text-xs text-gray-500">Accuracy</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                        <div className="text-xl font-bold text-green-700">{correctCount}</div>
                        <div className="text-[10px] uppercase text-green-600 font-bold">Correct</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                        <div className="text-xl font-bold text-red-700">{wrongCount}</div>
                        <div className="text-[10px] uppercase text-red-600 font-bold">Wrong</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-xl border border-gray-200">
                        <div className="text-xl font-bold text-gray-700">{skippedCount}</div>
                        <div className="text-[10px] uppercase text-gray-600 font-bold">Skipped</div>
                    </div>
                </div>

                <div className="space-y-3 pt-4">
                    {set && (
                        <PremiumButton fullWidth onClick={() => setShowReview(true)}>Review Answers</PremiumButton>
                    )}
                    <PremiumButton fullWidth variant="secondary" onClick={() => set ? navigate(`/live-mcq/set/${set.id}`) : navigate('/live-mcq')}>
                        {set ? 'Back to Set' : 'Back Home'}
                    </PremiumButton>
                </div>
            </div>
        ) : (
            <div className="max-w-2xl mx-auto p-4 space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-lg">Review Answers</h2>
                    <button onClick={() => setShowReview(false)} className="text-sm text-[var(--primary)]">Back to Score</button>
                </div>

                {set?.mcqs.map((mcq, i) => {
                    const userAns = attempt.answers[mcq.id];
                    const isCorrect = userAns === mcq.answer;
                    const isSkipped = !userAns;

                    return (
                        <PremiumCard key={mcq.id} className="space-y-3">
                            <div className="flex gap-3">
                                <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-0.5 ${isSkipped ? 'bg-gray-400' : isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {isSkipped ? '?' : isCorrect ? '✓' : '✕'}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-[var(--text-primary)] mb-2">
                                        <span className="font-bold mr-1">{i + 1}.</span> {mcq.question}
                                    </div>
                                    
                                    <div className="space-y-1 text-sm">
                                        {['A', 'B', 'C', 'D'].map(opt => {
                                            const optionKey = `option${opt}` as keyof typeof mcq;
                                            const isSelected = userAns === opt;
                                            const isAnswer = mcq.answer === opt;
                                            
                                            let cls = "p-2 rounded border border-transparent";
                                            if (isAnswer) cls = "bg-green-50 border-green-200 text-green-800 font-medium";
                                            else if (isSelected) cls = "bg-red-50 border-red-200 text-red-800 line-through decoration-red-500";
                                            else cls = "text-gray-500";

                                            return (
                                                <div key={opt} className={`flex gap-2 ${cls}`}>
                                                    <span className="w-5 font-bold">{opt})</span>
                                                    <span>{mcq[optionKey] as string}</span>
                                                    {isAnswer && <CheckmarkIcon size={14} />}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {mcq.explanation && (
                                        <div className="mt-3 text-xs bg-gray-50 p-2 rounded text-gray-600">
                                            <span className="font-bold">Exp:</span> {mcq.explanation}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </PremiumCard>
                    );
                })}
            </div>
        )}
    </div>
  );
};

export default ResultPage;
