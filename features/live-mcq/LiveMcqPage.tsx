
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { attemptService, mcqSetService } from '../../core/storage/services';
import { Attempt } from '../../types';
import Icon from '../../shared/components/Icon';
import { useDebounce } from '../../shared/hooks/useDebounce';

const LiveMcqPage: React.FC = () => {
  const navigate = useNavigate();
  const [recentAttempts, setRecentAttempts] = useState<(Attempt & { setName: string })[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    loadRecents();
  }, [debouncedSearch]); // Reload when search settles

  const loadRecents = async () => {
      try {
          const allAttempts = await attemptService.getAll();
          const allSets = await mcqSetService.getAll();
          
          let filteredAttempts = allAttempts;
          // Note: Client side filtering happens after mapping below for now
          
          const recents = filteredAttempts
              .sort((a, b) => b.completedAt - a.completedAt)
              .slice(0, 5) // Increased limit slightly for better view
              .map(a => {
                  let setName = "Unknown";
                  if (a.setId) setName = allSets.find(s => s.id === a.setId)?.name || "Set Deleted";
                  else if (a.mode === 'custom-exam') setName = "Custom Exam";
                  return { ...a, setName };
              });
          
          // Simple client-side filter after mapping
          if (debouncedSearch.trim()) {
              const lower = debouncedSearch.toLowerCase();
              setRecentAttempts(recents.filter(r => r.setName.toLowerCase().includes(lower)));
          } else {
              setRecentAttempts(recents);
          }
      } catch (e) {
          console.error(e);
      }
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return 'Yesterday';
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20 pt-[60px]">
        {/* Custom Header - Minimal & Clean */}
        <header className="fixed top-0 left-0 right-0 h-[60px] bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 px-5 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate('/')} 
                    className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full transition-colors active:scale-95"
                >
                    <Icon name="arrow-left" size="md" />
                </button>
            </div>
            <h1 className="text-[18px] font-semibold text-[#111827] absolute left-1/2 -translate-x-1/2 tracking-tight">Live MCQ</h1>
            <button 
                onClick={() => navigate('/')}
                className="p-2 -mr-2 text-gray-500 hover:text-gray-900 rounded-full transition-colors active:scale-95"
            >
                <Icon name="home" size="md" />
            </button>
        </header>

        <div className="max-w-3xl mx-auto px-5">
            {/* Search Bar - Refined */}
            <div className="mt-4 relative group">
                <input 
                    type="text" 
                    placeholder="Search history..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-[46px] pr-4 py-[14px] bg-[#F9FAFB] border border-[#F3F4F6] rounded-[14px] text-[#111827] placeholder-gray-400 text-sm focus:outline-none focus:border-[#6366F1] focus:bg-white transition-all shadow-sm"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6366F1] transition-colors">
                    <Icon name="search" size="md" />
                </div>
            </div>

            {/* Main Navigation Cards */}
            <div className="flex flex-col gap-[14px] mt-4">
                {/* TOPICS CARD */}
                <div 
                    onClick={() => navigate('/live-mcq/topics')}
                    className="bg-white border border-[#F3F4F6] rounded-[20px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-between group"
                >
                    <div className="flex items-center gap-4">
                        <div className="text-[#6366F1]">
                            <Icon name="book-open" size="lg" />
                        </div>
                        <div>
                            <h2 className="text-[17px] font-semibold text-[#111827] leading-tight group-hover:text-[#6366F1] transition-colors">Topics</h2>
                            <p className="text-[13px] font-normal text-[#9CA3AF] mt-1">Browse & Practice MCQs</p>
                        </div>
                    </div>
                    <div className="text-gray-300 group-hover:text-[#6366F1] transition-colors">
                        <Icon name="chevron-right" size="md" />
                    </div>
                </div>

                {/* EXAM CENTER CARD */}
                <div 
                    onClick={() => navigate('/live-mcq/exam-center')}
                    className="bg-white border border-[#F3F4F6] rounded-[20px] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-between group"
                >
                    <div className="flex items-center gap-4">
                        <div className="text-[#6366F1]">
                            <Icon name="target" size="lg" />
                        </div>
                        <div>
                            <h2 className="text-[17px] font-semibold text-[#111827] leading-tight group-hover:text-[#6366F1] transition-colors">Exam Center</h2>
                            <p className="text-[13px] font-normal text-[#9CA3AF] mt-1">Take Custom Exams</p>
                        </div>
                    </div>
                    <div className="text-gray-300 group-hover:text-[#6366F1] transition-colors">
                        <Icon name="chevron-right" size="md" />
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            {recentAttempts.length > 0 && (
                <div className="mt-8 animate-fade-in">
                    <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                        Recent Activity
                    </h2>
                    <div className="bg-white rounded-[20px] border border-[#F3F4F6] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
                        {recentAttempts.map((attempt, i) => (
                            <div 
                                key={attempt.id} 
                                onClick={() => navigate(attempt.mode === 'custom-exam' ? `/live-mcq/exam-center/result/${attempt.id}` : `/live-mcq/result/${attempt.id}`)}
                                className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors ${i !== recentAttempts.length - 1 ? 'border-b border-[#F3F4F6]' : ''}`}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${attempt.mode === 'practice' ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                                        {attempt.mode === 'practice' ? 'P' : 'E'}
                                    </div>
                                    <div>
                                        <div className="text-[14px] font-semibold text-gray-900 line-clamp-1">{attempt.setName}</div>
                                        <div className="text-[12px] text-gray-400 mt-0.5 font-medium">
                                            {attempt.percentage}% Score • {getTimeAgo(attempt.completedAt)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-gray-300">
                                    <Icon name="chevron-right" size="sm" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default LiveMcqPage;
