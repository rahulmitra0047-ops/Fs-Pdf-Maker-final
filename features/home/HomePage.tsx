
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
    <div className="min-h-screen bg-background font-serif text-text-primary pb-20 flex flex-col">
      {/* 1. Scholarly Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/50">
        <h1 className="text-2xl font-serif tracking-tight text-text-primary">Edunex</h1>
        <div className="text-xs font-sans font-medium uppercase tracking-widest text-text-secondary">
            {greeting}
        </div>
      </header>

      <main className="max-w-[640px] mx-auto px-6 py-6 flex flex-col gap-6 flex-1 w-full justify-center">
        
        {/* 2. Motivational Quote Section (Dynamic Integration) */}
        <div className="w-full">
           <MotivationalQuote />
        </div>

        {/* 3. Action Grid (2x2) */}
        <div className="grid grid-cols-2 gap-6 mx-auto w-full max-w-md">
            {/* Quick Practice */}
            <div 
                onClick={handleQuickPractice}
                className="bg-surface border border-border p-4 flex flex-col items-center justify-center h-28 gap-3 hover:bg-[#EBE7DF] transition-colors cursor-pointer"
            >
                <div className="text-primary">
                    <Icon name="clock" size="lg" strokeWidth={1.5} />
                </div>
                <h3 className="font-sans text-xs font-semibold tracking-wide text-text-primary text-center uppercase">Quick Practice</h3>
            </div>

            {/* Exam Center */}
            <div 
                onClick={() => navigate('/live-mcq/exam-center')}
                className="bg-surface border border-border p-4 flex flex-col items-center justify-center h-28 gap-3 hover:bg-[#EBE7DF] transition-colors cursor-pointer"
            >
                <div className="text-primary">
                    <Icon name="award" size="lg" strokeWidth={1.5} />
                </div>
                <h3 className="font-sans text-xs font-semibold tracking-wide text-text-primary text-center uppercase">Exam Center</h3>
            </div>

            {/* Flashcards */}
            <div 
                onClick={() => navigate('/flashcards')}
                className="bg-surface border border-border p-4 flex flex-col items-center justify-center h-28 gap-3 hover:bg-[#EBE7DF] transition-colors cursor-pointer"
            >
                <div className="text-primary">
                    <Icon name="layers" size="lg" strokeWidth={1.5} />
                </div>
                <h3 className="font-sans text-xs font-semibold tracking-wide text-text-primary text-center uppercase">Flash Cards</h3>
            </div>

            {/* Synonym Finder */}
            <div 
                onClick={() => navigate('/flashcards/universe')}
                className="bg-surface border border-border p-4 flex flex-col items-center justify-center h-28 gap-3 hover:bg-[#EBE7DF] transition-colors cursor-pointer"
            >
                <div className="text-primary">
                    <Icon name="refresh-cw" size="lg" strokeWidth={1.5} />
                </div>
                <h3 className="font-sans text-xs font-semibold tracking-wide text-text-primary text-center uppercase">Synonyms</h3>
            </div>
        </div>

      </main>
      
      <GlobalSearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  );
};

export default HomePage;
