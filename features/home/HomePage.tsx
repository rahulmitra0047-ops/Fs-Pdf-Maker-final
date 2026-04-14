
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../shared/components/Icon';
import GlobalSearchModal from '../../shared/components/GlobalSearchModal';
import { useToast } from '../../shared/context/ToastContext';
import { lessonService } from '../../core/storage/services';
import { Lesson } from '../../types';
import MotivationalQuote from './components/MotivationalQuote';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  // UI State
  const [showSearch, setShowSearch] = useState(false);
  const [greeting, setGreeting] = useState('');
  
  // Data State
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Good Morning");
    else if (hour >= 12 && hour < 17) setGreeting("Good Afternoon");
    else if (hour >= 17 && hour < 21) setGreeting("Good Evening");
    else setGreeting("Good Night");

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const lessons = await lessonService.getLessons();
      setAllLessons(lessons);
    } catch (e) {
      console.error("Home load failed", e);
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
                className="col-span-1 bg-white rounded-2xl p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-36 flex flex-col justify-between border border-slate-200/80 group cursor-pointer"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500 text-indigo-600">
                    <Icon name="clock" size="lg" className="w-16 h-16" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                    <Icon name="play" size="sm" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-base leading-tight">Quick<br/>Practice</h3>
                </div>
            </div>

            {/* Exam Center */}
            <div 
                onClick={() => navigate('/live-mcq/exam-center')}
                className="col-span-1 bg-white rounded-2xl p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-36 flex flex-col justify-between border border-slate-200/80 group cursor-pointer"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500 text-rose-600">
                    <Icon name="target" size="lg" className="w-16 h-16" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100/50 shadow-sm group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
                    <Icon name="target" size="sm" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-base leading-tight">Exam<br/>Center</h3>
                </div>
            </div>

            {/* Flashcards */}
            <div 
                onClick={() => navigate('/flashcards')}
                className="col-span-1 bg-white rounded-2xl p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-36 flex flex-col justify-between border border-slate-200/80 group cursor-pointer"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500 text-amber-600">
                    <Icon name="file-text" size="lg" className="w-16 h-16" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/50 shadow-sm group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                    <Icon name="layers" size="sm" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-base leading-tight">Flash<br/>Cards</h3>
                </div>
            </div>

            {/* Synonym Finder */}
            <div 
                onClick={() => navigate('/flashcards/universe')}
                className="col-span-1 bg-white rounded-2xl p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-36 flex flex-col justify-between border border-slate-200/80 group cursor-pointer"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500 text-emerald-600">
                    <Icon name="search" size="lg" className="w-16 h-16" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                    <Icon name="search" size="sm" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-base leading-tight">Synonym<br/>Finder</h3>
                </div>
            </div>
        </div>

      </main>
      
      <GlobalSearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  );
};

export default HomePage;
