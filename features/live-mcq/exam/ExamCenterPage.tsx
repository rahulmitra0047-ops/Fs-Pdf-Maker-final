
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PremiumCard from '../../../shared/components/PremiumCard';
import PremiumButton from '../../../shared/components/PremiumButton';
import { examTemplateService, attemptService, mcqSetService, mcqStatsService } from '../../../core/storage/services';
import { ExamTemplate, Attempt } from '../../../types';
import { useToast } from '../../../shared/context/ToastContext';
import Icon from '../../../shared/components/Icon';

const ExamCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [templates, setTemplates] = useState<ExamTemplate[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
      const allTemplates = await examTemplateService.getAll();
      const allAttempts = await attemptService.getAll();
      
      setTemplates(allTemplates.sort((a, b) => b.usedCount - a.usedCount)); 
      setRecentAttempts(allAttempts.filter(a => a.mode === 'custom-exam').sort((a, b) => b.completedAt - a.completedAt).slice(0, 3));
      setLoading(false);
  };

  const startFromTemplate = (template: ExamTemplate) => {
      navigate('/live-mcq/exam-center/active', { state: { template } });
  };

  const handleRandomMix = async () => {
      toast.info("Preparing Random Mix...");
      const allSets = await mcqSetService.getAll();
      const allMCQs = allSets.flatMap(s => s.mcqs);
      
      if (allMCQs.length < 5) return toast.error("Need at least 5 MCQs to start");
      
      const shuffled = allMCQs.sort(() => Math.random() - 0.5).slice(0, 30);
      
      navigate('/live-mcq/practice', { 
          state: { 
              customMCQs: shuffled, 
              sourceName: "Random Mix Exam" 
          } 
      });
  };

  const handleWeakAreas = async () => {
      toast.info("Analyzing Weak Areas...");
      const stats = await mcqStatsService.getAll();
      const weakStats = stats.filter(s => s.accuracy < 60);
      
      if (weakStats.length === 0) return toast.success("No weak areas found! Great job!");
      
      const weakMcqIds = weakStats.map(s => s.mcqId);
      
      navigate('/live-mcq/practice', {
          state: {
              mcqIds: weakMcqIds,
              sourceName: "Weak Areas Review"
          }
      });
  };

  const handleSpacedRepetition = async () => {
      // Basic implementation: Mistakes/Low Accuracy
      const stats = await mcqStatsService.getAll();
      const dueStats = stats.filter(s => s.accuracy < 80);
      
      if (dueStats.length === 0) return toast.success("No reviews due!");
      
      const dueIds = dueStats.map(s => s.mcqId).slice(0, 20); // Limit to 20
      
      navigate('/live-mcq/practice', {
          state: {
              mcqIds: dueIds,
              sourceName: "Mistakes Review"
          }
      });
  };

  const handleUnattempted = async () => {
      toast.info("Finding fresh questions...");
      const [allSets, allStats] = await Promise.all([
          mcqSetService.getAll(),
          mcqStatsService.getAll()
      ]);
      
      const attemptedIds = new Set(allStats.map(s => s.mcqId));
      const allMcqs = allSets.flatMap(s => s.mcqs);
      const unattempted = allMcqs.filter(m => !attemptedIds.has(m.id));
      
      if (unattempted.length === 0) return toast.success("You've attempted everything!");
      
      const subset = unattempted.slice(0, 30);
      
      navigate('/live-mcq/practice', {
          state: {
              customMCQs: subset,
              sourceName: "Unattempted Questions"
          }
      });
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20 pt-[60px]">
        {/* 1. Header */}
        <header className="fixed top-0 left-0 right-0 h-[60px] bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 px-5 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate('/')} 
                    className="p-2 -ml-2 text-[#6B7280] hover:text-gray-900 rounded-full transition-colors active:scale-95"
                >
                    <Icon name="arrow-left" size="md" />
                </button>
            </div>
            <h1 className="text-[18px] font-semibold text-[#111827] absolute left-1/2 -translate-x-1/2 tracking-tight">
                Exam Center
            </h1>
            <button 
                onClick={() => navigate('/')}
                className="p-2 -mr-2 text-[#6B7280] hover:text-gray-900 rounded-full transition-colors active:scale-95"
            >
                <Icon name="home" size="md" />
            </button>
        </header>

        <div className="max-w-3xl mx-auto px-5 mt-4">
            
            {/* 2. Hero Card */}
            <div 
                className="relative overflow-hidden rounded-none p-6 border border-border bg-text-primary" 
            >
                <div>
                    <h2 className="text-[22px] font-bold text-surface font-serif leading-tight">Create Custom Exam</h2>
                    <p className="text-[14px] text-surface/60 mt-1 font-sans">Select topics, sets, and configure your exam</p>
                </div>
                <button 
                    onClick={() => navigate('/live-mcq/exam-center/create')}
                    className="mt-5 w-full py-[14px] bg-background border border-border text-text-primary rounded-none font-sans font-semibold text-[13px] uppercase tracking-widest transition-all hover:bg-surface"
                >
                    + Create New Exam
                </button>
            </div>

            {/* 3. Smart Practice */}
            <h3 className="font-sans text-[11px] font-semibold text-text-secondary uppercase tracking-widest mt-8 mb-4">Smart Practice</h3>
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={handleRandomMix}
                    className="bg-surface p-4 rounded-none border border-border flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-[#EBE7DF]"
                >
                    <div className="text-secondary">
                        <Icon name="shuffle" size="sm" />
                    </div>
                    <span className="font-sans text-[10px] uppercase font-semibold text-text-primary tracking-widest mt-1">Random Mix</span>
                </button>
                <button 
                    onClick={handleWeakAreas}
                    className="bg-surface p-4 rounded-none border border-border flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-[#EBE7DF]"
                >
                    <div className="text-secondary">
                        <Icon name="bar-chart-3" size="sm" />
                    </div>
                    <span className="font-sans text-[10px] uppercase font-semibold text-text-primary tracking-widest mt-1">Weak Topics</span>
                </button>
                <button 
                    onClick={handleSpacedRepetition}
                    className="bg-surface p-4 rounded-none border border-border flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-[#EBE7DF]"
                >
                    <div className="text-secondary">
                        <Icon name="alert-triangle" size="sm" />
                    </div>
                    <span className="font-sans text-[10px] uppercase font-semibold text-text-primary tracking-widest mt-1">Mistakes</span>
                </button>
                <button 
                    onClick={handleUnattempted}
                    className="bg-surface p-4 rounded-none border border-border flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-[#EBE7DF]"
                >
                    <div className="text-secondary">
                        <Icon name="sparkles" size="sm" />
                    </div>
                    <span className="font-sans text-[10px] uppercase font-semibold text-text-primary tracking-widest mt-1">Unattempted</span>
                </button>
            </div>

            {/* 4. Saved Templates */}
            <h3 className="font-sans text-[11px] font-semibold text-text-secondary uppercase tracking-widest mt-8 mb-4">Saved Templates</h3>
            {templates.length === 0 ? (
                <div className="text-center py-6 bg-surface border border-dashed border-border mb-8">
                    <p className="font-sans text-[11px] uppercase tracking-widest text-secondary font-semibold">No templates saved yet</p>
                </div>
            ) : (
                <div className="space-y-3 mb-8">
                    {templates.map(temp => (
                        <div 
                            key={temp.id} 
                            className="bg-surface border border-border p-4 flex justify-between items-center transition-colors hover:border-text-primary group"
                        >
                            <div>
                                <div className="font-serif text-[17px] font-medium text-text-primary">{temp.name}</div>
                                <div className="font-sans text-[10px] uppercase tracking-widest text-text-secondary font-semibold mt-1">
                                    {temp.settings.totalQuestions} MCQs • {temp.settings.timeLimit}m
                                </div>
                            </div>
                            <button 
                                onClick={() => startFromTemplate(temp)}
                                className="bg-background text-text-primary font-sans text-[10px] font-semibold tracking-widest uppercase border border-border group-hover:border-text-primary px-4 py-2 transition-colors hover:bg-[#EBE7DF]"
                            >
                                Start
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* 5. Recent History */}
            <h3 className="font-sans text-[11px] font-semibold text-text-secondary uppercase tracking-widest mt-8 mb-4">Recent History</h3>
            {recentAttempts.length === 0 ? (
                <div className="text-center py-6 bg-surface border border-dashed border-border mb-8">
                    <p className="font-sans text-[11px] uppercase tracking-widest text-secondary font-semibold">No recent exam history</p>
                </div>
            ) : (
                <div className="space-y-3 mb-10">
                    {recentAttempts.map(attempt => (
                        <div 
                            key={attempt.id} 
                            onClick={() => navigate(`/live-mcq/exam-center/result/${attempt.id}`)}
                            className="bg-surface border border-border p-0 overflow-hidden shadow-none active:scale-[0.99] transition-transform cursor-pointer group hover:border-text-primary"
                        >
                            <div className="p-4 flex justify-between items-center relative">
                                <div 
                                    className="absolute left-0 top-0 bottom-0 bg-[#EBE7DF] z-0 opacity-50"
                                    style={{ width: `${attempt.percentage}%` }}
                                ></div>
                                
                                <div className="relative z-10">
                                    <div className="font-serif text-[15px] font-medium text-text-primary">Custom Exam</div>
                                    <div className="font-sans text-[10px] uppercase tracking-widest text-text-secondary font-semibold mt-1">{getTimeAgo(attempt.completedAt)}</div>
                                </div>
                                <div className={`relative z-10 font-sans text-sm font-bold ${attempt.percentage >= 80 ? 'text-[#34D399]' : attempt.percentage >= 50 ? 'text-[#FBBF24]' : 'text-primary'}`}>
                                    {attempt.percentage}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    </div>
  );
};

export default ExamCenterPage;
