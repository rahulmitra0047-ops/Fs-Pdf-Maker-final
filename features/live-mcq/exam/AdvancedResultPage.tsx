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
          <div className="min-h-screen bg-[#FAFAFA] pt-[60px] flex flex-col items-center justify-center">
              <div className="animate-spin text-3xl mb-4 text-[#6366F1]">
                  <Icon name="refresh-cw" size="lg" />
              </div>
              <p className="text-[#6B7280] font-medium">Loading analytics...</p>
          </div>
      );
  }

  if (error || !attempt) {
      return (
          <div className="min-h-screen bg-[#FAFAFA] pt-[60px] flex flex-col items-center justify-center p-4 text-center">
              <div className="text-4xl mb-4 text-red-500"><Icon name="alert-triangle" size="xl" /></div>
              <h2 className="text-lg font-bold text-[#111827] mb-2">{error || "Something went wrong"}</h2>
              <p className="text-[#6B7280] mb-6">Could not load the exam result.</p>
              <div className="flex gap-3">
                  <button onClick={() => navigate('/live-mcq/exam-center')} className="bg-[#6366F1] text-white px-6 py-3 rounded-xl font-medium">Back to Exams</button>
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
    <header className="fixed top-0 left-0 right-0 h-[60px] bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 px-5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
            <button 
                onClick={() => navigate('/live-mcq/exam-center')} 
                className="p-2 -ml-2 text-[#6B7280] hover:text-gray-900 rounded-full transition-colors active:scale-95"
            >
                <Icon name="arrow-left" size="md" />
            </button>
        </div>
        <h1 className="text-[18px] font-semibold text-[#111827] tracking-tight">Exam Result</h1>
        <button 
            onClick={() => navigate('/')}
            className="p-2 -mr-2 text-[#6B7280] hover:text-gray-900 rounded-full transition-colors active:scale-95"
        >
            <Icon name="home" size="md" />
        </button>
    </header>
  );

  const TabBar = () => (
      <div className="bg-white border-b border-[#F3F4F6]">
          <div className="flex">
              <button 
                  onClick={() => setActiveTab('analysis')}
                  className={`flex-1 py-[14px] text-[16px] font-medium transition-colors border-b-2 ${activeTab === 'analysis' ? 'border-[#6366F1] text-[#111827] font-semibold' : 'border-transparent text-[#9CA3AF]'}`}
              >
                  Analysis
              </button>
              <button 
                  onClick={() => setActiveTab('review')}
                  className={`flex-1 py-[14px] text-[16px] font-medium transition-colors border-b-2 ${activeTab === 'review' ? 'border-[#6366F1] text-[#111827] font-semibold' : 'border-transparent text-[#9CA3AF]'}`}
              >
                  Review
              </button>
          </div>
      </div>
  );

  const renderAnalysis = () => (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Score Card */}
          <div className="bg-[#1E1B4B] rounded-[24px] p-[28px] text-center shadow-lg mt-4">
              <div className="text-[14px] font-medium text-white/50 uppercase tracking-[0.5px] mb-3">Final Score</div>
              <div className="text-[48px] font-extrabold text-white leading-none mb-3">{attempt.percentage}%</div>
              
              <div className="flex justify-center gap-[20px] mb-5">
                  <div className="text-[14px] font-medium text-[#34D399]">{correctCount} Correct</div>
                  <div className="text-[14px] font-medium text-[#F87171]">{wrongCount} Wrong</div>
              </div>
              
              <div className="border-t border-white/10 my-5"></div>
              
              <div className="grid grid-cols-3 text-center">
                  <div>
                      <div className="text-[22px] font-bold text-white mb-1">{attempt.score}</div>
                      <div className="text-[11px] font-medium text-white/50 uppercase tracking-[0.5px]">Marks</div>
                  </div>
                  <div>
                      <div className="text-[22px] font-bold text-white mb-1">{Math.round(attempt.timeSpent / 60)}m</div>
                      <div className="text-[11px] font-medium text-white/50 uppercase tracking-[0.5px]">Time</div>
                  </div>
                  <div>
                      <div className={`text-[22px] font-bold mb-1 ${attempt.percentage >= 60 ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
                          {attempt.percentage >= 60 ? 'PASS' : 'FAIL'}
                      </div>
                      <div className="text-[11px] font-medium text-white/50 uppercase tracking-[0.5px]">Result</div>
                  </div>
              </div>
          </div>

          {/* Confidence Analysis */}
          {attempt.confidence && (
              <div className="bg-white border border-[#F3F4F6] rounded-[18px] p-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <h3 className="text-[16px] font-semibold text-[#111827] mb-[16px]">Confidence Analysis</h3>
                  
                  <div className="space-y-4">
                      {/* Sure Section */}
                      <div>
                          <div className="flex justify-between text-[14px] font-medium mb-1.5">
                              <span className="text-[#059669]">Sure Answers ({sureCorrect + sureWrong})</span>
                              <span className="text-[#9CA3AF] text-[13px]">{Math.round((sureCorrect / (sureCorrect + sureWrong || 1)) * 100)}% Accuracy</span>
                          </div>
                          <div className="h-[4px] bg-[#F3F4F6] rounded-[4px] overflow-hidden flex">
                              <div style={{ width: `${(sureCorrect / (sureCorrect + sureWrong || 1)) * 100}%` }} className="bg-[#059669]"></div>
                          </div>
                      </div>

                      {/* Guess Section */}
                      <div>
                          <div className="flex justify-between text-[14px] font-medium mb-1.5">
                              <span className="text-[#F59E0B]">Guesses ({guessCorrect + guessWrong})</span>
                              <span className="text-[#9CA3AF] text-[13px]">{Math.round((guessCorrect / (guessCorrect + guessWrong || 1)) * 100)}% Accuracy</span>
                          </div>
                          <div className="h-[4px] bg-[#F3F4F6] rounded-[4px] overflow-hidden flex">
                              <div style={{ width: `${(guessCorrect / (guessCorrect + guessWrong || 1)) * 100}%` }} className="bg-[#F59E0B]"></div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          <button 
              onClick={() => setActiveTab('review')}
              className="w-full bg-[#6366F1] text-white py-[16px] rounded-[16px] text-[16px] font-semibold active:scale-[0.98] transition-transform mt-2 shadow-sm"
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
          <div className="mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Filters */}
              <div className="flex gap-[8px] overflow-x-auto pb-2 scrollbar-hide mb-4">
                  {[
                      { id: 'all', label: 'All', count: mcqs.length },
                      { id: 'wrong', label: 'Wrong', count: wrongCount },
                      { id: 'guess', label: 'Guess', count: guessCorrect + guessWrong }
                  ].map(f => (
                      <button 
                          key={f.id}
                          onClick={() => setFilter(f.id as any)}
                          className={`
                              px-[18px] py-[8px] rounded-[20px] text-[14px] font-medium whitespace-nowrap transition-colors
                              ${filter === f.id 
                                  ? 'bg-[#6366F1] text-white' 
                                  : 'bg-[#F9FAFB] border border-[#F3F4F6] text-[#6B7280]'
                              }
                          `}
                      >
                          {f.label} ({f.count})
                      </button>
                  ))}
              </div>

              {filteredMCQs.length === 0 ? (
                  <div className="text-center py-12">
                      <p className="text-[#9CA3AF] text-[14px]">No questions found for this filter.</p>
                  </div>
              ) : (
                  <div className="space-y-[12px]">
                      {filteredMCQs.map((mcq, i) => {
                          const userAns = attempt.answers[mcq.id];
                          const isCorrect = userAns === mcq.answer;
                          const isSkipped = !userAns;
                          
                          return (
                              <div key={mcq.id} className="bg-white border border-[#F3F4F6] rounded-[18px] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                                  <div className="flex gap-3">
                                      <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[12px] font-bold mt-0.5 ${isSkipped ? 'bg-gray-300' : isCorrect ? 'bg-[#34D399]' : 'bg-[#F87171]'}`}>
                                          {isSkipped ? '?' : isCorrect ? '✓' : '✕'}
                                      </div>
                                      <div className="flex-1">
                                          <div className="text-[15px] font-semibold text-[#111827] leading-[1.5] mb-3">
                                              {mcq.question}
                                          </div>
                                          
                                          <div className="space-y-2">
                                              {['A', 'B', 'C', 'D'].map(opt => {
                                                  const optionKey = `option${opt}` as keyof typeof mcq;
                                                  const isSelected = userAns === opt;
                                                  const isAnswer = mcq.answer === opt;
                                                  
                                                  // Highlight Logic
                                                  let bgClass = "bg-transparent";
                                                  let textClass = "text-[#6B7280]";
                                                  let borderClass = "border border-transparent";
                                                  let fontClass = "font-normal";

                                                  if (isAnswer) {
                                                      bgClass = "bg-[#ECFDF5]";
                                                      textClass = "text-[#059669]";
                                                      fontClass = "font-semibold";
                                                  } else if (isSelected && !isCorrect) {
                                                      bgClass = "bg-[#FEF2F2]";
                                                      textClass = "text-[#EF4444]";
                                                      fontClass = "font-semibold";
                                                  }

                                                  return (
                                                      <div key={opt} className={`flex gap-2 p-2 rounded-[8px] ${bgClass} ${borderClass}`}>
                                                          <span className={`w-5 ${fontClass} ${textClass}`}>{opt})</span>
                                                          <span className={`flex-1 text-[14px] ${textClass} ${fontClass}`}>{mcq[optionKey] as string}</span>
                                                      </div>
                                                  );
                                              })}
                                          </div>

                                          {mcq.explanation && (
                                              <div className="mt-3 text-[13px] bg-[#F9FAFB] p-3 rounded-[12px] text-[#4B5563] leading-relaxed">
                                                  <span className="font-bold text-[#374151] mr-1">Explanation:</span>
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
    <div className="min-h-screen bg-[#FAFAFA] pb-20 pt-[60px]">
        <Header />
        <TabBar />

        <div className="max-w-3xl mx-auto px-5">
            {activeTab === 'analysis' ? renderAnalysis() : renderReview()}
        </div>
    </div>
  );
};

export default AdvancedResultPage;