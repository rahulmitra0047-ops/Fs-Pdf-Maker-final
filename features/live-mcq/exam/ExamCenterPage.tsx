
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
                className="relative overflow-hidden rounded-[24px] p-6 shadow-lg" 
                style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)' }}
            >
                <div>
                    <h2 className="text-[22px] font-bold text-white leading-tight">Create Custom Exam</h2>
                    <p className="text-[14px] text-white/60 mt-1 font-normal">Select topics, sets, and configure your exam</p>
                </div>
                <button 
                    onClick={() => navigate('/live-mcq/exam-center/create')}
                    className="mt-5 w-full py-[14px] bg-white/15 border border-white/20 text-white rounded-[14px] text-[15px] font-medium active:scale-[0.98] transition-transform hover:bg-white/20 backdrop-blur-sm"
                >
                    + Create New Exam
                </button>
            </div>

            {/* 3. Smart Practice */}
            <h3 className="text-[13px] font-semibold text-[#9CA3AF] tracking-[0.5px] mt-[28px] mb-[14px]">Smart Practice</h3>
            <div className="grid grid-cols-2 gap-[12px]">
                <button 
                    onClick={handleRandomMix}
                    className="bg-white p-5 rounded-[18px] border border-[#F3F4F6] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:border-indigo-100"
                >
                    <div className="text-[#6366F1] mb-1">
                        <Icon name="shuffle" size="xl" />
                    </div>
                    <span className="text-[14px] font-medium text-[#374151]">Random Mix</span>
                </button>
                <button 
                    onClick={handleWeakAreas}
                    className="bg-white p-5 rounded-[18px] border border-[#F3F4F6] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:border-indigo-100"
                >
                    <div className="text-[#6366F1] mb-1">
                        <Icon name="bar-chart-3" size="xl" />
                    </div>
                    <span className="text-[14px] font-medium text-[#374151]">Weak Topics</span>
                </button>
                <button 
                    onClick={handleSpacedRepetition}
                    className="bg-white p-5 rounded-[18px] border border-[#F3F4F6] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:border-indigo-100"
                >
                    <div className="text-[#6366F1] mb-1">
                        <Icon name="alert-triangle" size="xl" />
                    </div>
                    <span className="text-[14px] font-medium text-[#374151]">Mistakes</span>
                </button>
                <button 
                    onClick={handleUnattempted}
                    className="bg-white p-5 rounded-[18px] border border-[#F3F4F6] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:border-indigo-100"
                >
                    <div className="text-[#6366F1] mb-1">
                        <Icon name="sparkles" size="xl" />
                    </div>
                    <span className="text-[14px] font-medium text-[#374151]">Unattempted</span>
                </button>
            </div>

            {/* 4. Saved Templates */}
            <h3 className="text-[13px] font-semibold text-[#9CA3AF] tracking-[0.5px] mt-[28px] mb-[14px]">Saved Templates</h3>
            {templates.length === 0 ? (
                <div className="text-center py-6 bg-[#F9FAFB] rounded-[18px] border border-dashed border-[#E5E7EB]">
                    <p className="text-[14px] text-[#9CA3AF]">No templates saved yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {templates.map(temp => (
                        <div 
                            key={temp.id} 
                            className="bg-white border border-[#F3F4F6] rounded-[18px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex justify-between items-center"
                        >
                            <div>
                                <div className="font-semibold text-[15px] text-[#111827]">{temp.name}</div>
                                <div className="text-[12px] text-[#9CA3AF] mt-0.5">
                                    {temp.settings.totalQuestions} MCQs • {temp.settings.timeLimit}m
                                </div>
                            </div>
                            <button 
                                onClick={() => startFromTemplate(temp)}
                                className="bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB] px-4 py-2 rounded-[10px] text-[13px] font-medium transition-colors"
                            >
                                Start
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* 5. Recent History */}
            <h3 className="text-[13px] font-semibold text-[#9CA3AF] tracking-[0.5px] mt-[28px] mb-[14px]">Recent History</h3>
            {recentAttempts.length === 0 ? (
                <div className="text-center py-6 bg-[#F9FAFB] rounded-[18px] border border-dashed border-[#E5E7EB]">
                    <p className="text-[14px] text-[#9CA3AF]">No recent exam history</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {recentAttempts.map(attempt => (
                        <div 
                            key={attempt.id} 
                            onClick={() => navigate(`/live-mcq/exam-center/result/${attempt.id}`)}
                            className="bg-white border border-[#F3F4F6] rounded-[18px] p-0 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:scale-[0.99] transition-transform cursor-pointer"
                        >
                            <div className="p-4 flex justify-between items-center relative">
                                <div 
                                    className="absolute left-0 top-0 bottom-0 bg-[#EEF2FF] z-0"
                                    style={{ width: `${attempt.percentage}%` }}
                                ></div>
                                
                                <div className="relative z-10">
                                    <div className="font-semibold text-[15px] text-[#111827]">Exam Result</div>
                                    <div className="text-[12px] text-[#6B7280] mt-0.5">{getTimeAgo(attempt.completedAt)}</div>
                                </div>
                                <div className={`relative z-10 font-bold text-[16px] ${attempt.percentage >= 60 ? 'text-[#059669]' : 'text-orange-500'}`}>
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
