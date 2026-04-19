
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptService, mcqSetService } from '../../../core/storage/services';
import { Attempt, MCQSet } from '../../../types';
import PremiumCard from '../../../shared/components/PremiumCard';
import Icon from '../../../shared/components/Icon';

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
          <div className="min-h-screen bg-background pt-[60px] flex flex-col items-center justify-center font-sans">
              <div className="animate-spin text-3xl mb-4 text-text-primary">
                  <Icon name="refresh-cw" size="lg" />
              </div>
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-widest">Loading results...</p>
          </div>
      );
  }

  if (error || !attempt) {
      return (
          <div className="min-h-screen bg-background pt-[60px] flex flex-col items-center justify-center p-4 text-center font-sans">
              <div className="text-4xl mb-4 text-text-primary"><Icon name="alert-triangle" size="xl" /></div>
              <h2 className="text-[18px] font-serif font-medium text-text-primary mb-2">{error || "Something went wrong"}</h2>
              <p className="text-[14px] font-serif text-text-secondary mb-6">Could not load the result data.</p>
              <div className="flex gap-3">
                  <button onClick={() => navigate('/live-mcq/topics')} className="bg-text-primary text-surface px-6 py-3 rounded-none text-[12px] uppercase tracking-widest font-semibold hover:bg-text-primary/90">Back to Topics</button>
              </div>
          </div>
      );
  }

  const getMessage = (p: number) => {
      if (p >= 90) return { text: "Outstanding", emoji: "🏆" };
      if (p >= 80) return { text: "Excellent Work", emoji: "🎉" };
      if (p >= 70) return { text: "Good Job", emoji: "👍" };
      if (p >= 50) return { text: "Keep Practicing", emoji: "💪" };
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
    <div className="min-h-screen bg-background pb-20 pt-[60px] font-sans">
        <header className="fixed top-0 left-0 right-0 h-[60px] bg-background border-b border-border z-50 px-5 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => set ? navigate(`/live-mcq/set/${set.id}`) : navigate('/live-mcq/topics')} 
                    className="p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors active:scale-95 rounded-none"
                >
                    <Icon name="arrow-left" size="md" />
                </button>
            </div>
            <h1 className="text-[18px] font-serif font-medium text-text-primary tracking-tight">
                Result
            </h1>
            <button 
                onClick={() => navigate('/')}
                className="p-2 -mr-2 text-text-secondary hover:text-text-primary transition-colors active:scale-95 rounded-none"
            >
                <Icon name="home" size="md" />
            </button>
        </header>

        {!showReview ? (
            <div className="max-w-md mx-auto p-6 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500 mt-4">
                <div className="space-y-3">
                    <div className="text-6xl mb-6 block">{msg.emoji}</div>
                    <h1 className="text-[28px] font-serif font-medium text-text-primary tracking-tight">{msg.text}</h1>
                    <p className="text-[16px] text-text-secondary font-serif">You scored {attempt.score} out of {attempt.total}</p>
                </div>

                {/* Score Circle */}
                <div className="relative w-56 h-56 mx-auto">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 192 192">
                        {/* Background Circle */}
                        <circle cx="96" cy="96" r="82" stroke="var(--color-border)" strokeWidth="4" fill="none" />
                        {/* Progress Circle */}
                        <circle 
                            cx="96" cy="96" r="82" 
                            stroke={attempt.percentage >= 70 ? 'var(--color-text-primary)' : attempt.percentage >= 40 ? '#8A4F3A' : '#4A2B20'} 
                            strokeWidth="6" 
                            fill="none" 
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="butt"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-[48px] font-serif font-medium text-text-primary tracking-tight leading-none mb-1">{attempt.percentage}%</span>
                        <span className="font-sans text-[10px] text-text-secondary font-semibold uppercase tracking-widest mt-1">Accuracy</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-surface p-5 border border-border rounded-none shadow-none">
                        <div className="text-[24px] font-serif text-text-primary font-medium">{correctCount}</div>
                        <div className="font-sans text-[10px] uppercase text-text-secondary font-semibold tracking-widest mt-2">Correct</div>
                    </div>
                    <div className="bg-surface p-5 border border-border rounded-none shadow-none">
                        <div className="text-[24px] font-serif text-[#8A4F3A] font-medium">{wrongCount}</div>
                        <div className="font-sans text-[10px] uppercase text-[#8A4F3A] font-semibold tracking-widest mt-2">Wrong</div>
                    </div>
                    <div className="bg-surface p-5 border border-border rounded-none shadow-none">
                        <div className="text-[24px] font-serif text-text-secondary font-medium">{skippedCount}</div>
                        <div className="font-sans text-[10px] uppercase text-text-secondary font-semibold tracking-widest mt-2">Skipped</div>
                    </div>
                </div>

                <div className="space-y-4 pt-6">
                    {set && (
                        <button 
                            className="w-full bg-text-primary text-surface py-[14px] rounded-none text-[12px] uppercase tracking-widest font-semibold active:scale-[0.98] transition-transform shadow-none hover:bg-text-primary/90"
                            onClick={() => setShowReview(true)}>
                            Review Answers
                        </button>
                    )}
                    <button 
                        className="w-full bg-background border border-border text-text-primary py-[14px] rounded-none text-[12px] uppercase tracking-widest font-semibold active:scale-[0.98] transition-transform shadow-none hover:bg-surface"
                        onClick={() => set ? navigate(`/live-mcq/set/${set.id}`) : navigate('/live-mcq/topics')}>
                        {set ? 'Back to Set' : 'Back to Topics'}
                    </button>
                </div>
            </div>
        ) : (
            <div className="max-w-md mx-auto p-5 space-y-6 mt-4">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
                    <h2 className="font-serif font-medium text-[20px] text-text-primary tracking-tight">Review Answers</h2>
                    <button onClick={() => setShowReview(false)} className="font-sans text-[10px] font-semibold uppercase tracking-widest text-text-primary hover:text-text-secondary transition-colors underline decoration-border underline-offset-4">Back to Score</button>
                </div>

                {set?.mcqs.map((mcq, i) => {
                    const userAns = attempt.answers[mcq.id];
                    const isCorrect = userAns === mcq.answer;
                    const isSkipped = !userAns;

                    return (
                        <div key={mcq.id} className="bg-surface border border-border rounded-none p-5 shadow-none pb-6">
                            <div className="flex gap-4">
                                <div className={`w-6 h-6 rounded-none flex-shrink-0 flex items-center justify-center text-surface text-[12px] font-bold mt-1 ${isSkipped ? 'bg-border text-text-secondary' : isCorrect ? 'bg-text-primary' : 'bg-[#8A4F3A]'}`}>
                                    {isSkipped ? '?' : isCorrect ? '✓' : '✕'}
                                </div>
                                <div className="flex-1">
                                    <div className="text-[16px] font-serif text-text-primary leading-[1.6] mb-5 font-medium">
                                        <span className="font-medium mr-2 text-text-secondary">{i + 1}.</span> {mcq.question}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {['A', 'B', 'C', 'D'].map(opt => {
                                            const optionKey = `option${opt}` as keyof typeof mcq;
                                            const isSelected = userAns === opt;
                                            const isAnswer = mcq.answer === opt;
                                            
                                            let bgClass = "bg-transparent";
                                            let textClass = "text-text-secondary";
                                            let borderClass = "border border-border";
                                            let fontClass = "font-medium";

                                            if (isAnswer) {
                                                bgClass = "bg-surface";
                                                textClass = "text-text-primary";
                                                fontClass = "font-medium";
                                                borderClass = "border-text-primary";
                                            } else if (isSelected && !isCorrect) {
                                                bgClass = "bg-surface";
                                                textClass = "text-[#8A4F3A]";
                                                fontClass = "font-medium";
                                                borderClass = "border-[#8A4F3A]";
                                            }

                                            return (
                                                <div key={opt} className={`flex gap-3 p-3 flex-col sm:flex-row rounded-none ${bgClass} ${borderClass}`}>
                                                    <span className={`w-6 text-[13px] font-sans ${fontClass} ${textClass}`}>{opt})</span>
                                                    <span className={`flex-1 text-[15px] font-serif ${textClass} ${fontClass}`}>{mcq[optionKey] as string}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {mcq.explanation && (
                                        <div className="mt-5 text-[14px] bg-background border border-border p-4 rounded-none text-text-secondary leading-relaxed font-serif">
                                            <span className="font-semibold text-text-primary mr-2">Explanation:</span>
                                            {mcq.explanation}
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
