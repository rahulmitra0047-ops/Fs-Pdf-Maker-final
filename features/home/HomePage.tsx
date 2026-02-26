
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
import MotivationalQuote from './components/MotivationalQuote';

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

        // Calculate completed count for daily goal
        const checkItemDate = (item: any) => {
           const itemDate = getLocalDateStr(item.updatedAt);
           if (item.isCompleted && itemDate === todayStr) {
               todaysCompletedCount++;
           }
        };

        [...completedTs, ...completedPs].forEach(checkItemDate);
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24 overflow-hidden flex flex-col">
      
      {/* 1. Compact Header */}
      <header className="sticky top-0 z-40 bg-[#F8FAFC]/80 backdrop-blur-xl px-6 pt-8 pb-4 flex items-center justify-between flex-none">
        <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-slate-700 rounded-lg flex items-center justify-center transform rotate-45 shadow-lg">
                <span className="text-white transform -rotate-45 text-base">✦</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-700">Edunex</h1>
        </div>
        <div className="text-xs font-medium text-slate-400">
            {greeting}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-start gap-5 max-w-md mx-auto px-6 w-full py-2 overflow-y-auto">
        
        {/* 2. Motivational Quote Section */}
        <MotivationalQuote />

        {/* 3. Action Grid (2x2) */}
        <div className="grid grid-cols-2 gap-3 w-full">
            {/* Quick Practice */}
            <div 
                onClick={handleQuickPractice}
                className="col-span-1 bg-slate-700 text-white rounded-[20px] p-4 relative overflow-hidden shadow-xl shadow-slate-900/10 group cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-36 flex flex-col justify-between"
            >
                <div className="absolute top-0 right-0 p-3 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">
                    <Icon name="clock" size="lg" className="w-12 h-12" />
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-inner">
                    <Icon name="play" size="sm" className="text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-base leading-tight">Quick<br/>Practice</h3>
                </div>
            </div>

            {/* Exam Center */}
            <div 
                onClick={() => navigate('/live-mcq/exam-center')}
                className="col-span-1 bg-white rounded-[20px] p-4 relative overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-purple-200 transition-all duration-300 h-36 flex flex-col justify-between group cursor-pointer"
            >
                <div className="absolute top-0 right-0 p-3 opacity-5 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">
                    <Icon name="target" size="lg" className="w-12 h-12 text-slate-700" />
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                    <Icon name="target" size="sm" className="text-purple-500" />
                </div>
                <div>
                    <h3 className="font-bold text-base leading-tight text-slate-700">Exam<br/>Center</h3>
                </div>
            </div>

            {/* Flashcards */}
            <div 
                onClick={() => navigate('/flashcards')}
                className="col-span-1 bg-white rounded-[20px] p-4 relative overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-orange-200 transition-all duration-300 h-36 flex flex-col justify-between group cursor-pointer"
            >
                <div className="absolute top-0 right-0 p-3 opacity-5 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">
                    <Icon name="file-text" size="lg" className="w-12 h-12 text-slate-700" />
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                    <Icon name="layers" size="sm" className="text-orange-500" />
                </div>
                <div>
                    <h3 className="font-bold text-base leading-tight text-slate-700">Flash<br/>Cards</h3>
                </div>
            </div>

            {/* Synonym Finder */}
            <div 
                onClick={() => toast.info("Synonym Finder coming soon!")}
                className="col-span-1 bg-white rounded-[20px] p-4 relative overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-slate-100 hover:border-emerald-200 transition-all duration-300 h-36 flex flex-col justify-between group cursor-pointer"
            >
                <div className="absolute top-0 right-0 p-3 opacity-5 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">
                    <Icon name="search" size="lg" className="w-12 h-12 text-slate-700" />
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Icon name="search" size="sm" className="text-emerald-500" />
                </div>
                <div>
                    <h3 className="font-bold text-base leading-tight text-slate-700">Synonym<br/>Finder</h3>
                </div>
            </div>
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
