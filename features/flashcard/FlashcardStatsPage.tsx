import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from 'lucide-react';
import { flashcardAnalyticsService } from '../../core/storage/services';

export default function FlashcardStatsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    overview: null,
    confidence: [],
    weekly: [],
    practice: [],
    difficult: [],
    strongest: []
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [overview, confidence, weekly, practice, difficult, strongest] = await Promise.all([
      flashcardAnalyticsService.getWordStats(),
      flashcardAnalyticsService.getConfidenceDistribution(),
      flashcardAnalyticsService.getWeeklyActivity(),
      flashcardAnalyticsService.getPracticeHistoryStats(),
      flashcardAnalyticsService.getTopDifficultWords(),
      flashcardAnalyticsService.getTopStrongestWords()
    ]);

    setStats({ overview, confidence, weekly, practice, difficult, strongest });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C63FF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10">
      {/* Top Bar */}
      <div className="bg-white px-5 py-4 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate('/flashcards')} className="mr-4 text-gray-600">
          <Icon name="arrow-left" size={24} />
        </button>
        <h1 className="text-[18px] font-bold text-gray-800">Stats & Analytics</h1>
      </div>

      <div className="px-5 py-6 space-y-8">
        
        {/* Overview */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px bg-gray-200 flex-1"></div>
            <h2 className="text-[13px] font-medium text-gray-500 uppercase tracking-wider">Overview</h2>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total Words" value={stats.overview.total} color="#6C63FF" />
            <StatCard label="Learning" value={stats.overview.learning} color="#FFA726" />
            <StatCard label="New" value={stats.overview.new} color="#2196F3" />
            <StatCard label="Mastered" value={stats.overview.mastered} color="#4CAF50" />
            <StatCard label="Accuracy" value={`${stats.overview.accuracy}%`} color="#6C63FF" />
            <StatCard label="Streak" value="🔥" subValue="days" color="#FFA726" />
          </div>
        </section>

        {/* Confidence Distribution */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px bg-gray-200 flex-1"></div>
            <h2 className="text-[13px] font-medium text-gray-500 uppercase tracking-wider">Confidence Distribution</h2>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
          
          <div className="bg-white rounded-[14px] p-4 shadow-sm border border-gray-100">
            {stats.confidence.slice().reverse().map((count: number, idx: number) => {
              const level = 5 - idx;
              const max = Math.max(...stats.confidence);
              const width = max === 0 ? 0 : (count / max) * 100;
              const colors = ['#9E9E9E', '#FF7043', '#FFA726', '#2196F3', '#8BC34A', '#4CAF50'];
              
              return (
                <div key={level} className="flex items-center mb-2 last:mb-0">
                  <span className="text-[12px] text-gray-600 w-8">Lv{level}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden mx-2">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${width}%`, backgroundColor: colors[level] }}
                    ></div>
                  </div>
                  <span className="text-[12px] text-gray-700 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Weekly Activity */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px bg-gray-200 flex-1"></div>
            <h2 className="text-[13px] font-medium text-gray-500 uppercase tracking-wider">Weekly Activity</h2>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
          
          <div className="bg-white rounded-[14px] p-4 shadow-sm border border-gray-100">
            {stats.weekly.map((day: any, idx: number) => {
              const max = Math.max(...stats.weekly.map((d: any) => d.count));
              const width = max === 0 ? 0 : (day.count / max) * 100;
              
              return (
                <div key={idx} className="flex items-center mb-2 last:mb-0">
                  <span className="text-[12px] text-gray-600 w-8">{day.day}</span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden mx-2">
                    {day.count > 0 && (
                      <div 
                        className="h-full rounded-full bg-[#6C63FF] transition-all duration-500"
                        style={{ width: `${width}%` }}
                      ></div>
                    )}
                  </div>
                  <span className="text-[12px] text-gray-700 w-6 text-right">{day.count || '—'}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Practice History */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px bg-gray-200 flex-1"></div>
            <h2 className="text-[13px] font-medium text-gray-500 uppercase tracking-wider">Practice History</h2>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
          
          <div className="bg-white rounded-[14px] overflow-hidden shadow-sm border border-gray-100">
            {stats.practice.map((item: any, idx: number) => (
              <div key={item.mode}>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[16px]">{getModeIcon(item.mode)}</span>
                      <span className="text-[14px] font-bold text-gray-800 capitalize">{item.mode}</span>
                    </div>
                    <div className="text-[12px] text-gray-500">{item.count} sessions</div>
                  </div>
                  <div className="text-right">
                    {item.count === 0 ? (
                      <span className="text-[12px] text-gray-400">No sessions yet</span>
                    ) : (
                      <div className="text-[12px] text-gray-600">
                        {getModeStats(item)}
                      </div>
                    )}
                  </div>
                </div>
                {idx < stats.practice.length - 1 && <div className="h-px bg-gray-100 mx-4"></div>}
              </div>
            ))}
          </div>
        </section>

        {/* Top Difficult Words */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px bg-gray-200 flex-1"></div>
            <h2 className="text-[13px] font-medium text-gray-500 uppercase tracking-wider">Top Difficult Words</h2>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
          
          <div className="bg-white rounded-[14px] overflow-hidden shadow-sm border border-gray-100">
            {stats.difficult.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-[13px]">
                এখনো enough data নেই
              </div>
            ) : (
              stats.difficult.map((word: any, idx: number) => (
                <div key={word.id}>
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] font-bold text-[#E53935] w-4">{idx + 1}.</span>
                      <div>
                        <div className="text-[14px] text-gray-800 font-medium">{word.word} <span className="text-gray-400">→</span> {word.meaning}</div>
                        <div className="text-[11px] text-[#E53935]">Wrong: {word.wrongCount} • Accuracy: {word.accuracy}%</div>
                      </div>
                    </div>
                  </div>
                  {idx < stats.difficult.length - 1 && <div className="h-px bg-gray-100 mx-4"></div>}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Top Strongest Words */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px bg-gray-200 flex-1"></div>
            <h2 className="text-[13px] font-medium text-gray-500 uppercase tracking-wider">Top Strongest Words</h2>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
          
          <div className="bg-white rounded-[14px] overflow-hidden shadow-sm border border-gray-100">
            {stats.strongest.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-[13px]">
                এখনো enough data নেই
              </div>
            ) : (
              stats.strongest.map((word: any, idx: number) => (
                <div key={word.id}>
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] font-bold text-[#4CAF50] w-4">{idx + 1}.</span>
                      <div>
                        <div className="text-[14px] text-gray-800 font-medium">{word.word} <span className="text-gray-400">→</span> {word.meaning}</div>
                        <div className="text-[11px] text-[#4CAF50]">Reviews: {word.totalReviews} • Accuracy: {word.accuracy}%</div>
                      </div>
                    </div>
                  </div>
                  {idx < stats.strongest.length - 1 && <div className="h-px bg-gray-100 mx-4"></div>}
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

const StatCard = ({ label, value, subValue, color }: { label: string, value: string | number, subValue?: string, color: string }) => (
  <div className="bg-white rounded-[14px] p-3 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-24">
    <div className="text-[20px] font-bold mb-1" style={{ color }}>{value}</div>
    {subValue && <div className="text-[10px] text-gray-400 -mt-1 mb-1">{subValue}</div>}
    <div className="text-[11px] text-gray-600 leading-tight">{label}</div>
  </div>
);

const getModeIcon = (mode: string) => {
  switch (mode) {
    case 'quiz': return '📝';
    case 'spelling': return '✍️';
    case 'speed': return '⏱️';
    case 'context': return '🧠';
    case 'shuffle': return '🃏';
    case 'reverse': return '🎯';
    default: return '🎮';
  }
};

const getModeStats = (item: any) => {
  if (item.mode === 'speed') {
    return `Avg: ${item.avg}/min • 🏆 Best: ${item.best}`;
  } else if (item.mode === 'shuffle' || item.mode === 'reverse') {
    return `Total cards: ${item.totalCards}`;
  } else {
    return `Avg Score: ${item.avg}% • Best: ${item.best}%`;
  }
};
