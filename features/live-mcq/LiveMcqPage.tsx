
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
          if (!debouncedSearch.trim()) {
              // Optimized path for initial load
              const recents = await attemptService.getRecent(5, 'completedAt');
              
              const attemptsWithNames = await Promise.all(recents.map(async a => {
                  let setName = "Unknown";
                  if (a.setId) {
                      const set = await mcqSetService.getById(a.setId);
                      setName = set?.name || "Set Deleted";
                  } else if (a.mode === 'custom-exam') {
                      setName = "Custom Exam";
                  }
                  return { ...a, setName };
              }));
              setRecentAttempts(attemptsWithNames);
              return;
          }

          const allAttempts = await attemptService.getAll();
          const allSets = await mcqSetService.getAll();
          
          const mapped = allAttempts.map(a => {
              let setName = "Unknown";
              if (a.setId) setName = allSets.find(s => s.id === a.setId)?.name || "Set Deleted";
              else if (a.mode === 'custom-exam') setName = "Custom Exam";
              return { ...a, setName };
          });
          
          const lower = debouncedSearch.toLowerCase();
          const filtered = mapped.filter(r => r.setName.toLowerCase().includes(lower));
          
          setRecentAttempts(filtered.sort((a, b) => b.completedAt - a.completedAt).slice(0, 5));
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
    <div className="min-h-screen bg-background pb-20 pt-[60px] font-serif text-text-primary">
        {/* Custom Header - Minimal & Clean */}
        <header className="fixed top-0 left-0 right-0 h-[64px] bg-background border-b border-border/50 z-50 px-6 flex items-center justify-between transition-all">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/')} 
                    className="p-2 -ml-2 text-text-primary hover:bg-[#EBE7DF] transition-colors active:scale-95"
                >
                    <Icon name="arrow-left" size="sm" strokeWidth={1.5} />
                </button>
                <h1 className="text-xl font-medium tracking-tight">Live MCQ</h1>
            </div>
            <button 
                onClick={() => navigate('/')}
                className="p-2 -mr-2 text-text-primary hover:bg-[#EBE7DF] transition-colors active:scale-95"
            >
                <Icon name="home" size="sm" strokeWidth={1.5} />
            </button>
        </header>

        <div className="max-w-xl mx-auto px-6">
            {/* Search Bar - Refined */}
            <div className="mt-6 relative group">
                <input 
                    type="text" 
                    placeholder="Search history..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-surface border border-border text-text-primary placeholder-text-secondary/50 text-[15px] focus:outline-none focus:border-primary transition-all font-serif"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors">
                    <Icon name="search" size="sm" strokeWidth={1.5} />
                </div>
            </div>

            {/* Main Navigation Cards */}
            <div className="grid grid-cols-2 gap-4 mt-6">
                {/* TOPICS CARD */}
                <div 
                    onClick={() => navigate('/live-mcq/topics')}
                    className="bg-surface p-6 border border-border hover:bg-[#EBE7DF] active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center gap-4 group aspect-square"
                >
                    <div className="w-10 h-10 border border-border bg-background flex items-center justify-center text-text-primary transition-colors">
                        <Icon name="book-open" size="sm" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h2 className="text-[17px] font-medium text-text-primary">Practice Topics</h2>
                        <p className="font-sans text-[10px] font-semibold text-text-secondary uppercase tracking-[0.1em] mt-1">Browse MCQs</p>
                    </div>
                </div>

                {/* EXAM CENTER CARD */}
                <div 
                    onClick={() => navigate('/live-mcq/exam-center')}
                    className="bg-[#F4F1EA] p-6 border border-primary hover:bg-[#EBE7DF] active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center gap-4 group aspect-square"
                >
                    <div className="w-10 h-10 border border-primary bg-primary flex items-center justify-center text-surface transition-colors">
                        <Icon name="target" size="sm" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h2 className="text-[17px] font-medium text-primary">Exam Center</h2>
                        <p className="font-sans text-[10px] font-semibold text-primary uppercase tracking-[0.1em] mt-1">Take Tests</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            {recentAttempts.length > 0 && (
                <div className="mt-10 animate-fade-in">
                    <h2 className="font-sans text-xs font-semibold text-text-secondary uppercase tracking-widest mb-4 border-b border-border/50 pb-2">
                        Recent Activity
                    </h2>
                    <div className="bg-surface border border-border">
                        {recentAttempts.map((attempt, i) => (
                            <div 
                                key={attempt.id} 
                                onClick={() => navigate(attempt.mode === 'custom-exam' ? `/live-mcq/exam-center/result/${attempt.id}` : `/live-mcq/result/${attempt.id}`)}
                                className={`p-4 flex items-center justify-between hover:bg-[#EBE7DF] cursor-pointer transition-colors ${i !== recentAttempts.length - 1 ? 'border-b border-border/50' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 border flex items-center justify-center font-sans text-xs font-semibold ${attempt.mode === 'practice' ? 'bg-background border-border text-text-primary' : 'bg-primary border-primary text-surface'}`}>
                                        {attempt.mode === 'practice' ? 'PR' : 'EX'}
                                    </div>
                                    <div>
                                        <div className="text-[15px] font-medium text-text-primary line-clamp-1">{attempt.setName}</div>
                                        <div className="font-sans text-[10px] text-text-secondary uppercase tracking-widest mt-1">
                                            {attempt.percentage}% Score • {getTimeAgo(attempt.completedAt)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-text-secondary">
                                    <Icon name="chevron-right" size="sm" strokeWidth={1.5} />
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
