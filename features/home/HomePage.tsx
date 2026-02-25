
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../shared/components/Icon';
import GlobalSearchModal from '../../shared/components/GlobalSearchModal';
import PremiumModal from '../../shared/components/PremiumModal';
import { useToast } from '../../shared/context/ToastContext';
import { 
  dailyProgressService, userActivityService, 
  lessonService, grammarService, vocabService, 
  translationService, practiceTopicService,
  mcqStatsService, attemptService 
} from '../../core/storage/services';
import { DailyProgress, UserActivity, Lesson } from '../../types';
import Skeleton from '../../shared/components/Skeleton';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  // UI State
  const [showSearch, setShowSearch] = useState(false);
  const [greeting, setGreeting] = useState('');
  
  // Data State
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    vocabCount: 0,
    rulesCount: 0,
    passagesCompleted: 0,
    mcqCount: 0
  });
  
  const [dailyStats, setDailyStats] = useState({
    rules: 0,
    vocab: 0,
    passages: 0,
    mcqs: 0
  });
  
  const [lastSession, setLastSession] = useState<UserActivity | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);

  // List Data for Modal
  const [learnedRules, setLearnedRules] = useState<{title: string, lesson: string}[]>([]);
  const [learnedVocab, setLearnedVocab] = useState<{word: string, meaning: string}[]>([]);
  const [learnedPassages, setLearnedPassages] = useState<{title: string, type: string}[]>([]);

  // Modal State
  const [listModalOpen, setListModalOpen] = useState(false);
  const [listModalTitle, setListModalTitle] = useState('');
  const [listModalData, setListModalData] = useState<any[]>([]);
  const [listModalType, setListModalType] = useState<'rule'|'vocab'|'passage'>('rule');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Good Morning");
    else if (hour >= 12 && hour < 17) setGreeting("Good Afternoon");
    else if (hour >= 17 && hour < 21) setGreeting("Good Evening");
    else setGreeting("Good Night");

    fetchData();
  }, []);

  // Helper for Local Date String (YYYY-MM-DD)
  const getLocalDateStr = (timestamp?: number | string | Date) => {
      const date = timestamp ? new Date(timestamp) : new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const todayStr = getLocalDateStr();
      
      const [lessons, dailyRec, userActRecs, mcqStats, attempts] = await Promise.all([
        lessonService.getLessons(),
        dailyProgressService.getById(todayStr),
        userActivityService.getAll(),
        mcqStatsService.getAll(),
        attemptService.getAll()
      ]);

      setAllLessons(lessons);

      // --- Calculate Learn Stats & Daily Progress ---
      const lessonPromises = lessons.map(async (l) => {
        const [vs, rs, ts, ps] = await Promise.all([
          vocabService.getWords(l.id),
          grammarService.getRules(l.id),
          translationService.getTranslations(l.id),
          practiceTopicService.getTopics(l.id)
        ]);
        return { vs, rs, ts, ps };
      });

      const lessonData = await Promise.all(lessonPromises);
      
      let vCount = 0, rCount = 0, pCompleted = 0;
      let todaysCompletedCount = 0;
      let latestActivity: UserActivity | null = null;
      let maxUpdatedAt = 0;
      
      // Daily Counters
      let dailyV = 0, dailyR = 0, dailyP = 0;

      // Lists Aggregation
      const allR: {title: string, lesson: string}[] = [];
      const allV: {word: string, meaning: string}[] = [];
      const allP: {title: string, type: string}[] = [];

      lessonData.forEach((d, idx) => {
        const lTitle = lessons[idx].title;

        // Vocab
        vCount += d.vs.length;
        d.vs.forEach(v => {
             allV.push({ word: v.word, meaning: v.meaning });
             if (getLocalDateStr(v.createdAt) === todayStr) dailyV++;
        });

        // Rules
        rCount += d.rs.length;
        d.rs.forEach(r => {
             allR.push({ title: r.title, lesson: lTitle });
             if (getLocalDateStr(r.createdAt) === todayStr) dailyR++;
        });
        
        // Passages
        const completedTs = d.ts.filter(t => t.isCompleted);
        const completedPs = d.ps.filter(p => p.isCompleted);
        pCompleted += completedTs.length + completedPs.length;

        completedTs.forEach(t => {
            allP.push({ title: t.bengaliText.substring(0, 40) + (t.bengaliText.length>40?'...':''), type: 'Translation' });
            if (getLocalDateStr(t.updatedAt) === todayStr) dailyP++;
        });
        completedPs.forEach(p => {
            allP.push({ title: p.title, type: 'Writing' });
            if (getLocalDateStr(p.updatedAt) === todayStr) dailyP++;
        });

        // Last Session Logic
        const checkItemDate = (item: any) => {
           const itemDate = getLocalDateStr(item.updatedAt);
           if (item.isCompleted && itemDate === todayStr) {
               todaysCompletedCount++;
           }
           if (item.updatedAt > maxUpdatedAt) {
               maxUpdatedAt = item.updatedAt;
               
               // Calculate Progress for this lesson
               const totalPractice = d.ts.length + d.ps.length;
               const donePractice = completedTs.length + completedPs.length;
               const progressPercent = totalPractice > 0 ? Math.round((donePractice / totalPractice) * 100) : 0;

               latestActivity = {
                   id: 'last_session',
                   lessonId: lessons[idx].id,
                   lessonTitle: lessons[idx].title,
                   lastTab: d.rs.includes(item as any) ? 'grammar' : d.vs.includes(item as any) ? 'vocabulary' : 'practice',
                   progress: progressPercent,
                   updatedAt: maxUpdatedAt
               };
           }
        };

        [...completedTs, ...completedPs].forEach(checkItemDate);
        
        // Also check uncompleted items for "Last Viewed" to update pointer
        [...d.rs, ...d.vs, ...d.ts, ...d.ps].forEach(item => {
             if (item.updatedAt > maxUpdatedAt) {
               maxUpdatedAt = item.updatedAt;
               
               const totalPractice = d.ts.length + d.ps.length;
               const donePractice = completedTs.length + completedPs.length;
               const progressPercent = totalPractice > 0 ? Math.round((donePractice / totalPractice) * 100) : 0;

               latestActivity = {
                   id: 'last_session',
                   lessonId: lessons[idx].id,
                   lessonTitle: lessons[idx].title,
                   lastTab: d.rs.includes(item as any) ? 'grammar' : d.vs.includes(item as any) ? 'vocabulary' : 'practice',
                   progress: progressPercent,
                   updatedAt: maxUpdatedAt
               };
             }
        });
      });

      // MCQs Today
      const todayAttempts = attempts.filter(a => 
          getLocalDateStr(a.completedAt) === todayStr
      );
      const dailyM = todayAttempts.reduce((acc, a) => acc + a.total, 0);

      setStats({ vocabCount: vCount, rulesCount: rCount, passagesCompleted: pCompleted, mcqCount: mcqStats.length });
      setDailyStats({ vocab: dailyV, rules: dailyR, passages: dailyP, mcqs: dailyM });
      
      setLearnedRules(allR);
      setLearnedVocab(allV);
      setLearnedPassages(allP);

      if (latestActivity) setLastSession(latestActivity);

      // --- Background Daily Goal Sync ---
      if (!dailyRec) {
          try {
              await dailyProgressService.create({
                  id: todayStr,
                  date: todayStr,
                  completedCount: todaysCompletedCount,
                  target: 5,
                  streak: 0, 
                  updatedAt: Date.now()
              });
          } catch (e: any) {
              // Ignore ConstraintError (duplicate key) as it means another process/tab created it
              if (e.name !== 'ConstraintError' && !e.message?.includes('exists')) {
                  console.error("Failed to create daily progress", e);
              } else {
                  // Retry update if create failed due to existence (race condition)
                  try {
                      const existing = await dailyProgressService.getById(todayStr);
                      if (existing && todaysCompletedCount > existing.completedCount) {
                          await dailyProgressService.update(todayStr, { completedCount: todaysCompletedCount });
                      }
                  } catch (retryError) {
                      console.error("Failed to update daily progress on retry", retryError);
                  }
              }
          }
      } else if (todaysCompletedCount > dailyRec.completedCount) {
          dailyProgressService.update(todayStr, { completedCount: todaysCompletedCount });
      }

    } catch (e) {
      console.error("Home load failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPractice = () => {
      if (allLessons.length === 0) {
          toast.info("Add some lessons first!");
          return;
      }
      const randomLesson = allLessons[Math.floor(Math.random() * allLessons.length)];
      navigate(`/learn/lesson/${randomLesson.id}?tab=practice`);
  };

  const openList = (type: 'rule'|'vocab'|'passage') => {
      if (type === 'rule') {
          setListModalTitle('Learned Rules');
          setListModalData(learnedRules);
          setListModalType('rule');
      } else if (type === 'vocab') {
          setListModalTitle('Learned Vocabulary');
          setListModalData(learnedVocab);
          setListModalType('vocab');
      } else if (type === 'passage') {
          setListModalTitle('Completed Passages');
          setListModalData(learnedPassages);
          setListModalType('passage');
      }
      setListModalOpen(true);
  };

  // Daily Goal Item with Ring & Total Action
  const GoalItem = ({ label, current, target, color, ringColor, total, onTotalClick }: { 
      label: string, current: number, target: number, color: string, ringColor: string, total: number, onTotalClick: () => void 
  }) => {
      const percentage = Math.min(100, Math.round((current / target) * 100));
      const radius = 18;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (percentage / 100) * circumference;

      return (
          <div className="flex flex-col items-center gap-1">
              <div className="relative w-[44px] h-[44px] flex items-center justify-center mb-0.5">
                  {/* Background Ring */}
                  <svg className="w-full h-full transform -rotate-90">
                      <circle cx="22" cy="22" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-100" />
                      <circle cx="22" cy="22" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" 
                          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={ringColor} />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center leading-none">
                      <span className={`text-[11px] font-bold ${color}`}>{current}</span>
                      <span className="text-[8px] text-gray-300 font-medium">/{target}</span>
                  </div>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
              
              <button 
                onClick={onTotalClick}
                className="text-[9px] font-semibold text-slate-400 flex items-center gap-0.5 hover:text-indigo-600 transition-colors bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 mt-0.5 active:scale-95"
              >
                  Total: {total} <Icon name="chevron-right" size="sm" className="w-2.5 h-2.5" />
              </button>
          </div>
      );
  };

  const getSessionIcon = (tab: string) => {
      switch(tab) {
          case 'vocabulary': return 'book';
          case 'practice': return 'edit-3';
          default: return 'layout-grid'; // grammar
      }
  };

  const getSessionLabel = (tab: string) => {
      switch(tab) {
          case 'vocabulary': return 'Vocabulary';
          case 'practice': return 'Practice';
          default: return 'Grammar';
      }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24 overflow-hidden flex flex-col">
      
      {/* 1. Compact Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100/50 px-5 h-[56px] flex items-center justify-between flex-none">
        <div>
            <h1 className="text-[18px] font-serif font-bold text-gray-900 tracking-tight flex items-center gap-1">
                <span className="text-indigo-600 text-[22px]">✦</span> Edunex
            </h1>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-gray-500">{greeting}</span>
            <button 
              onClick={() => navigate('/settings')}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-500 hover:text-indigo-600 active:scale-95 shadow-sm"
            >
              <Icon name="settings" size="sm" />
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-evenly max-w-md mx-auto px-5 w-full py-2">
        
        {/* 2. Daily Goal Section */}
        <div className="w-full bg-white rounded-[20px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100/80">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
                    <div className="p-1 bg-indigo-50 rounded-full text-indigo-600">
                        <Icon name="target" size="sm" /> 
                    </div>
                    Daily Goals
                </h3>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-[8px] border border-slate-100">
                    Today
                </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
                <GoalItem 
                    label="Rules" 
                    current={dailyStats.rules} 
                    target={5} 
                    color="text-orange-500" 
                    ringColor="text-orange-500" 
                    total={stats.rulesCount}
                    onTotalClick={() => openList('rule')}
                />
                <GoalItem 
                    label="Vocab" 
                    current={dailyStats.vocab} 
                    target={10} 
                    color="text-blue-500" 
                    ringColor="text-blue-500"
                    total={stats.vocabCount}
                    onTotalClick={() => openList('vocab')}
                />
                <GoalItem 
                    label="Psgs" 
                    current={dailyStats.passages} 
                    target={2} 
                    color="text-emerald-500" 
                    ringColor="text-emerald-500"
                    total={stats.passagesCompleted}
                    onTotalClick={() => openList('passage')}
                />
                <GoalItem 
                    label="MCQs" 
                    current={dailyStats.mcqs} 
                    target={20} 
                    color="text-purple-500" 
                    ringColor="text-purple-500"
                    total={stats.mcqCount}
                    onTotalClick={() => navigate('/live-mcq/exam-center')}
                />
            </div>
        </div>

        {/* 3. Action Grid (2x2) */}
        <div className="grid grid-cols-2 gap-3 w-full">
            {/* Quick Practice */}
            <div 
                onClick={handleQuickPractice}
                className="group relative overflow-hidden rounded-[18px] p-3.5 cursor-pointer shadow-lg shadow-indigo-200/40 active:scale-[0.98] transition-all bg-gradient-to-br from-indigo-600 to-indigo-700 text-white min-h-[90px] flex flex-col justify-between"
            >
                <div className="absolute top-2 right-2 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <Icon name="clock" size="xl" />
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon name="play" size="sm" />
                </div>
                <div>
                    <h3 className="text-[14px] font-bold leading-tight">Quick<br/>Practice</h3>
                </div>
            </div>

            {/* Exam Center */}
            <div 
                onClick={() => navigate('/live-mcq/exam-center')}
                className="group relative overflow-hidden rounded-[18px] p-3.5 cursor-pointer shadow-sm border border-purple-100 hover:border-purple-200 active:scale-[0.98] transition-all bg-white min-h-[90px] flex flex-col justify-between"
            >
                <div className="absolute top-2 right-2 opacity-5 text-purple-600">
                    <Icon name="target" size="xl" />
                </div>
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Icon name="target" size="sm" />
                </div>
                <div>
                    <h3 className="text-[14px] font-bold text-slate-800 leading-tight">Exam<br/>Center</h3>
                </div>
            </div>

            {/* Flashcards */}
            <div 
                onClick={() => navigate('/flashcards')}
                className="group relative overflow-hidden rounded-[18px] p-3.5 cursor-pointer shadow-sm border border-orange-100 hover:border-orange-200 active:scale-[0.98] transition-all bg-white min-h-[90px] flex flex-col justify-between"
            >
                <div className="absolute top-2 right-2 opacity-5 text-orange-600">
                    <Icon name="file-text" size="xl" />
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                    <Icon name="file-text" size="sm" />
                </div>
                <div>
                    <h3 className="text-[14px] font-bold text-slate-800 leading-tight">Flash<br/>Cards</h3>
                </div>
            </div>

            {/* Synonym Finder */}
            <div 
                onClick={() => toast.info("Synonym Finder coming soon!")}
                className="group relative overflow-hidden rounded-[18px] p-3.5 cursor-pointer shadow-sm border border-cyan-100 hover:border-cyan-200 active:scale-[0.98] transition-all bg-white min-h-[90px] flex flex-col justify-between"
            >
                <div className="absolute top-2 right-2 opacity-5 text-cyan-600">
                    <Icon name="search" size="xl" />
                </div>
                <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center">
                    <Icon name="search" size="sm" />
                </div>
                <div>
                    <h3 className="text-[14px] font-bold text-slate-800 leading-tight">Synonym<br/>Finder</h3>
                </div>
            </div>
        </div>

        {/* 4. Enhanced Continue Learning */}
        <div className="w-full">
            {lastSession ? (
                <div
                    onClick={() => navigate(`/learn/lesson/${lastSession.lessonId}?tab=${lastSession.lastTab}`)}
                    className="relative w-full bg-white border border-indigo-100 rounded-[20px] p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all active:scale-[0.99] cursor-pointer group overflow-hidden"
                >
                    {/* Decorators */}
                    <div className="absolute -top-6 -right-6 w-20 h-20 bg-indigo-50/50 rounded-full blur-xl group-hover:bg-indigo-100/50 transition-colors"></div>
                    
                    {/* Header Label */}
                    <div className="flex justify-between items-center mb-3 relative z-10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pick up where you left off</span>
                    </div>

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            {/* Icon Box */}
                            <div className="w-[48px] h-[48px] rounded-[14px] bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center shadow-sm border border-indigo-50 group-hover:scale-105 transition-transform duration-300">
                                <Icon name={getSessionIcon(lastSession.lastTab)} size="md" />
                            </div>
                            
                            {/* Text Content */}
                            <div>
                                <h4 className="text-[15px] font-bold text-slate-800 leading-tight group-hover:text-indigo-700 transition-colors">
                                    {lastSession.lessonTitle}
                                </h4>
                                <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                                    Resume {getSessionLabel(lastSession.lastTab)}
                                </p>
                            </div>
                        </div>

                        {/* Play Button */}
                        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 group-hover:bg-indigo-700 transition-colors">
                            <Icon name="play" size="sm" className="ml-0.5" />
                        </div>
                    </div>

                    {/* Progress Bar (Only if > 0) */}
                    {lastSession.progress > 0 && (
                        <div className="mt-4 relative z-10">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                                <span>Progress</span>
                                <span>{lastSession.progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${lastSession.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <button
                    onClick={() => navigate('/learn')}
                    className="w-full bg-white border border-dashed border-gray-300 rounded-[16px] p-5 text-center hover:bg-gray-50 active:scale-[0.99] transition-all group"
                >
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-colors">
                        <Icon name="plus" size="md" />
                    </div>
                    <span className="text-sm font-bold text-gray-600 block">Start Your Learning Journey</span>
                    <span className="text-xs text-gray-400">Create your first lesson to begin</span>
                </button>
            )}
        </div>

      </main>

      <GlobalSearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />

      {/* Detail List Modal */}
      <PremiumModal isOpen={listModalOpen} onClose={() => setListModalOpen(false)} title={listModalTitle} size="md">
          <div className="max-h-[60vh] overflow-y-auto">
              {listModalData.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                      No items found yet. Start learning!
                  </div>
              ) : (
                  <div className="space-y-2">
                      {listModalData.map((item, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1">
                              {listModalType === 'rule' && (
                                  <>
                                    <div className="font-bold text-slate-800 text-sm">{item.title}</div>
                                    <div className="text-xs text-slate-500">Lesson: {item.lesson}</div>
                                  </>
                              )}
                              {listModalType === 'vocab' && (
                                  <>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-sm">{item.word}</span>
                                        <span className="text-slate-400">→</span>
                                        <span className="text-slate-600 text-sm">{item.meaning}</span>
                                    </div>
                                  </>
                              )}
                              {listModalType === 'passage' && (
                                  <>
                                    <div className="font-medium text-slate-800 text-sm line-clamp-2">{item.title}</div>
                                    <div className="flex gap-2">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${item.type === 'Translation' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                            {item.type}
                                        </span>
                                    </div>
                                  </>
                              )}
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </PremiumModal>
    </div>
  );
};

export default HomePage;
