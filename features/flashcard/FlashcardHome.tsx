import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, CheckCircle, Target } from 'lucide-react';
import { flashcardService } from '../../core/storage/services';
import toast from 'react-hot-toast';
import Icon from '../../shared/components/Icon';

const FlashcardHome: React.FC = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ new: 0, daily: 0, mastered: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      const newWords = await flashcardService.getNewWords();
      const dailyWords = await flashcardService.getDailyWords();
      const masteredWords = await flashcardService.getMasteredWords();
      
      setCounts({
        new: newWords.length,
        daily: dailyWords.length,
        mastered: masteredWords.length
      });
    } catch (error) {
      console.error('Failed to load counts', error);
      toast.error('Data load হচ্ছে না');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-serif text-text-primary pb-28">
      {/* Top Bar */}
      <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-10 bg-background border-b border-border/50">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/home')} className="p-2 -ml-2 text-text-primary hover:bg-surface-hover transition-colors active:scale-95">
                <Icon name="arrow-left" size="sm" strokeWidth={1.5} />
            </button>
            <h1 className="text-xl font-medium tracking-tight">Flashcards</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
            {/* New Words */}
            <div 
              onClick={() => navigate('/flashcards/new')}
              className="bg-surface p-5 relative shadow-sm hover:bg-surface-hover active:scale-95 transition-transform duration-200 flex flex-col justify-between border border-border cursor-pointer aspect-square"
            >
              <div className="w-10 h-10 border border-border bg-background flex items-center justify-center mb-4">
                <Icon name="plus" size="sm" className="text-text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-serif text-text-primary mb-1 line-clamp-1">{counts.new}</span>
                <span className="font-sans text-[11px] font-semibold tracking-[0.1em] uppercase text-text-secondary">New Words</span>
              </div>
            </div>

            {/* Daily Words */}
            <div 
              onClick={() => navigate('/flashcards/daily')}
              className="bg-surface p-5 relative shadow-sm hover:bg-surface-hover active:scale-95 transition-transform duration-200 flex flex-col justify-between border border-border cursor-pointer aspect-square"
            >
              <div className="w-10 h-10 border border-border bg-background flex items-center justify-center mb-4">
                <Icon name="calendar" size="sm" className="text-text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-serif text-text-primary mb-1 line-clamp-1">{counts.daily}</span>
                <span className="font-sans text-[11px] font-semibold tracking-[0.1em] uppercase text-text-secondary">Daily Words</span>
              </div>
            </div>

            {/* Mastered */}
            <div 
              onClick={() => navigate('/flashcards/mastered')}
              className="bg-surface p-5 relative shadow-sm hover:bg-surface-hover active:scale-95 transition-transform duration-200 flex flex-col justify-between border border-border cursor-pointer aspect-square"
            >
              <div className="w-10 h-10 border border-border bg-background flex items-center justify-center mb-4">
                <Icon name="check-circle" size="sm" className="text-text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-serif text-text-primary mb-1 line-clamp-1">{counts.mastered}</span>
                <span className="font-sans text-[11px] font-semibold tracking-[0.1em] uppercase text-text-secondary">Mastered</span>
              </div>
            </div>

            {/* Quiz Mode */}
            <div 
              onClick={() => navigate('/flashcards/quiz')}
              className="bg-surface p-5 relative shadow-sm hover:bg-surface-hover active:scale-95 transition-transform duration-200 flex flex-col justify-between border border-border cursor-pointer aspect-square"
            >
              <div className="w-10 h-10 border border-border bg-background flex items-center justify-center mb-4">
                <Icon name="target" size="sm" className="text-text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-serif text-text-primary mb-1">Quiz</span>
                <span className="font-sans text-[11px] font-semibold tracking-[0.1em] uppercase text-text-secondary">Practice</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardHome;
