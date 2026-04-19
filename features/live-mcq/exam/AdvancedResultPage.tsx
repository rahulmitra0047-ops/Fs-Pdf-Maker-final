import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptService, mcqSetService } from '../../../core/storage/services';
import { Attempt, MCQ } from '../../../types';
import PremiumCard from '../../../shared/components/PremiumCard';
import Icon from '../../../shared/components/Icon';

const AdvancedResultPage: React.FC = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [mcqs, setMCQs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'analysis' | 'review'>('analysis');
  const [filter, setFilter] = useState<'all' | 'wrong' | 'guess'>('all');

  useEffect(() => {
    if (attemptId) {
        loadResult();
    } else {
        setLoading(false);
        setError("Invalid attempt ID");
    }
  }, [attemptId]);

  const loadResult = async () => {
      setLoading(true);
      setError('');
      try {
          const a = await attemptService.getById(attemptId!);
          if (a) {
              setAttempt(a);
              // Fetch MCQs for context
              const allSets = await mcqSetService.getAll();
              const allMcqsMap = new Map<string, MCQ>();
              allSets.forEach(s => s.mcqs.forEach(m => allMcqsMap.set(m.id, m)));
              
              const relevantMcqs = Object.keys(a.answers).map(id => allMcqsMap.get(id)).filter(Boolean) as MCQ[];
              setMCQs(relevantMcqs);
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
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-widest">Loading analytics...</p>
          </div>
      );
  }

  if (error || !attempt) {
      return (
          <div className="min-h-screen bg-background pt-[60px] flex flex-col items-center justify-center p-4 text-center font-sans">
              <div className="text-4xl mb-4 text-primary"><Icon name="alert-triangle" size="xl" /></div>
              <h2 className="text-[18px] font-serif font-medium text-text-primary mb-2">{error || "Something went wrong"}</h2>
              <p className="text-[14px] font-serif text-text-secondary mb-6">Could not load the exam result.</p>
              <div className="flex gap-3">
                  <button onClick={() => navigate('/live-mcq/exam-center')} className="bg-text-primary text-surface px-6 py-3 rounded-none text-[12px] uppercase tracking-widest font-semibold hover:bg-[#1A1A1A]">Back to Exams</button>
              </div>
          </div>
      );
  }

  // Analysis Logic
  const correctCount = Object.keys(attempt.answers).filter(id => {
      const mcq = mcqs.find(m => m.id === id);
      return mcq && mcq.answer === attempt.answers[id];
  }).length;
  
  const wrongCount = Object.keys(attempt.answers).length - correctCount;

  // Confidence Analysis
  let sureCorrect = 0, sureWrong = 0, guessCorrect = 0, guessWrong = 0;
  if (attempt.confidence) {
      Object.entries(attempt.confidence).forEach(([id, level]) => {
          const ans = attempt.answers[id];
          const mcq = mcqs.find(m => m.id === id);
          if (!mcq || !ans) return;
          const isCorrect = mcq.answer === ans;
          
          if (level === 'sure') {
              if (isCorrect) sureCorrect++; else sureWrong++;
          } else {
              if (isCorrect) guessCorrect++; else guessWrong++;
          }
      });
  }

  // Header Component
  const Header = () => (
    <header className="fixed top-0 left-0 right-0 h-[60px] bg-background border-b border-border z-50 px-5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
            <button 
                onClick={() => navigate('/live-mcq/exam-center')} 
                className="p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors active:scale-95 rounded-none"
            >
                <Icon name="arrow-left" size="md" />
            </button>
        </div>
        <h1 className="text-[18px] font-serif font-medium text-text-primary tracking-tight">Exam Result</h1>
        <button 
            onClick={() => navigate('/')}
            className="p-2 -mr-2 text-text-secondary hover:text-text-primary transition-colors active:scale-95 rounded-none"
        >
            <Icon name="home" size="md" />
        </button>
    </header>
  );

  const TabBar = () => (
      <div className="bg-background border-b border-border">
          <div className="flex max-w-md mx-auto">
              <button 
                  onClick={() => setActiveTab('analysis')}
                  className={`flex-1 py-[14px] text-[11px] uppercase tracking-widest font-sans transition-colors border-b-2 ${activeTab === 'analysis' ? 'border-text-primary text-text-primary font-bold' : 'border-transparent text-text-secondary font-semibold hover:text-text-primary'}`}
              >
                  Analysis
              </button>
              <button 
                  onClick={() => setActiveTab('review')}
                  className={`flex-1 py-[14px] text-[11px] uppercase tracking-widest font-sans transition-colors border-b-2 ${activeTab === 'review' ? 'border-text-primary text-text-primary font-bold' : 'border-transparent text-text-secondary font-semibold hover:text-text-primary'}`}
              >
                  Review
              </button>
          </div>
      </div>
  );

  const renderAnalysis = () => (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans mt-4">
          {/* Score Card */}
          <div className="bg-surface border border-border rounded-none p-[28px] text-center shadow-none">
              <div className="text-[11px] font-sans font-semibold text-text-secondary uppercase tracking-widest mb-4">Final Score</div>
              <div className="text-[52px] font-serif font-medium text-text-primary leading-none mb-6">{attempt.percentage}%</div>
              
              <div className="flex justify-center gap-6 mb-6">
                  <div className="text-[14px] font-serif text-[#059669]"><span className="font-semibold">{correctCount}</span> Correct</div>
                  <div className="text-[14px] font-serif text-[#EF4444]"><span className="font-semibold">{wrongCount}</span> Wrong</div>
              </div>
              
              <div className="border-t border-border my-6"></div>
              
              <div className="grid grid-cols-3 text-center">
                  <div>
                      <div className="text-[24px] font-serif font-medium text-text-primary mb-2">{attempt.score}</div>
                      <div className="text-[10px] font-sans font-semibold text-text-secondary uppercase tracking-widest">Marks</div>
                  </div>
                  <div>
                      <div className="text-[24px] font-serif font-medium text-text-primary mb-2">{Math.round(attempt.timeSpent / 60)}m</div>
                      <div className="text-[10px] font-sans font-semibold text-text-secondary uppercase tracking-widest">Time</div>
                  </div>
                  <div>
                      <div className={`text-[24px] font-serif font-medium mb-2 ${attempt.percentage >= 60 ? 'text-[#059669]' : 'text-[#EF4444]'}`}>
                          {attempt.percentage >= 60 ? 'PASS' : 'FAIL'}
                      </div>
                      <div className="text-[10px] font-sans font-semibold text-text-secondary uppercase tracking-widest">Result</div>
                  </div>
              </div>
          </div>

          {/* Confidence Analysis */}
          {attempt.confidence && (
              <div className="bg-surface border border-border rounded-none p-[24px] shadow-none">
                  <h3 className="text-[16px] font-serif font-medium text-text-primary mb-6">Confidence Analysis</h3>
                  
                  <div className="space-y-6">
                      {/* Sure Section */}
                      <div>
                          <div className="flex justify-between text-[14px] font-serif mb-2">
                              <span className="text-text-primary">Sure Answers ({sureCorrect + sureWrong})</span>
                              <span className="text-text-secondary">{Math.round((sureCorrect / (sureCorrect + sureWrong || 1)) * 100)}% Accuracy</span>
                          </div>
                          <div className="h-[4px] bg-border rounded-none overflow-hidden flex">
                              <div style={{ width: `${(sureCorrect / (sureCorrect + sureWrong || 1)) * 100}%` }} className="bg-text-primary"></div>
                          </div>
                      </div>

                      {/* Guess Section */}
                      <div>
                          <div className="flex justify-between text-[14px] font-serif mb-2">
                              <span className="text-text-primary">Guesses ({guessCorrect + guessWrong})</span>
                              <span className="text-text-secondary">{Math.round((guessCorrect / (guessCorrect + guessWrong || 1)) * 100)}% Accuracy</span>
                          </div>
                          <div className="h-[4px] bg-border rounded-none overflow-hidden flex">
                              <div style={{ width: `${(guessCorrect / (guessCorrect + guessWrong || 1)) * 100}%` }} className="bg-text-secondary"></div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          <button 
              onClick={() => setActiveTab('review')}
              className="w-full bg-text-primary text-surface py-[14px] rounded-none text-[12px] uppercase tracking-widest font-semibold active:scale-[0.98] transition-transform mt-4 shadow-none hover:bg-[#1A1A1A]"
          >
              Review Answers
          </button>
      </div>
  );

  const renderReview = () => {
      const filteredMCQs = mcqs.filter(m => {
          const userAns = attempt.answers[m.id];
          const isCorrect = userAns === m.answer;
          const conf = attempt.confidence?.[m.id];
          
          if (filter === 'wrong') return !isCorrect && userAns;
          if (filter === 'guess') return conf === 'guess';
          return true;
      });

      return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans mt-4">
              {/* Filters */}
              <div className="flex gap-[12px] overflow-x-auto pb-4 scrollbar-hide mb-4">
                  {[
                      { id: 'all', label: 'All', count: mcqs.length },
                      { id: 'wrong', label: 'Wrong', count: wrongCount },
                      { id: 'guess', label: 'Guess', count: guessCorrect + guessWrong }
                  ].map(f => (
                      <button 
                          key={f.id}
                          onClick={() => setFilter(f.id as any)}
                          className={`
                              px-[20px] py-[10px] rounded-none text-[11px] uppercase tracking-widest font-semibold whitespace-nowrap transition-colors border
                              ${filter === f.id 
                                  ? 'bg-text-primary text-surface border-text-primary' 
                                  : 'bg-background border-border text-text-secondary hover:text-text-primary hover:border-text-secondary'
                              }
                          `}
                      >
                          {f.label} ({f.count})
                      </button>
                  ))}
              </div>

              {filteredMCQs.length === 0 ? (
                  <div className="text-center py-16">
                      <p className="text-text-secondary text-[14px] font-serif">No questions found for this filter.</p>
                  </div>
              ) : (
                  <div className="space-y-4">
                      {filteredMCQs.map((mcq, i) => {
                          const userAns = attempt.answers[mcq.id];
                          const isCorrect = userAns === mcq.answer;
                          const isSkipped = !userAns;
                          
                          return (
                              <div key={mcq.id} className="bg-surface border border-border rounded-none p-5 shadow-none pb-6">
                                  <div className="flex gap-4">
                                      <div className={`w-6 h-6 rounded-none flex-shrink-0 flex items-center justify-center text-surface text-[12px] font-bold mt-1 ${isSkipped ? 'bg-border text-text-secondary' : isCorrect ? 'bg-[#059669]' : 'bg-[#EF4444]'}`}>
                                          {isSkipped ? '?' : isCorrect ? '✓' : '✕'}
                                      </div>
                                      <div className="flex-1">
                                          <div className="text-[16px] font-serif text-text-primary leading-[1.6] mb-5 font-medium">
                                              {mcq.question}
                                          </div>
                                          
                                          <div className="space-y-2">
                                              {['A', 'B', 'C', 'D'].map(opt => {
                                                  const optionKey = `option${opt}` as keyof typeof mcq;
                                                  const isSelected = userAns === opt;
                                                  const isAnswer = mcq.answer === opt;
                                                  
                                                  // Highlight Logic
                                                  let bgClass = "bg-transparent";
                                                  let textClass = "text-text-secondary";
                                                  let borderClass = "border border-border";
                                                  let fontClass = "font-medium";

                                                  if (isAnswer) {
                                                      bgClass = "bg-[#ECFDF5]";
                                                      textClass = "text-[#059669]";
                                                      fontClass = "font-medium";
                                                      borderClass = "border-[#059669]";
                                                  } else if (isSelected && !isCorrect) {
                                                      bgClass = "bg-[#FEF2F2]";
                                                      textClass = "text-[#EF4444]";
                                                      fontClass = "font-medium";
                                                      borderClass = "border-[#EF4444]";
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

  return (
    <div className="min-h-screen bg-background pb-20 pt-[60px] font-sans">
        <Header />
        <TabBar />

        <div className="max-w-md mx-auto px-5">
            {activeTab === 'analysis' ? renderAnalysis() : renderReview()}
        </div>
    </div>
  );
};

export default AdvancedResultPage;