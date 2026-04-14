import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, CheckCircle, Target, Sparkles } from 'lucide-react';
import { flashcardService } from '../../core/storage/services';
import toast from 'react-hot-toast';
import ThemeIcon from './components/ThemeIcon';
import { useTheme } from './context/ThemeContext';

const FlashcardHomeContent: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
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
    <div 
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ backgroundColor: currentTheme.background }}
    >
      {/* Top Bar */}
      <div 
        className="px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl bg-opacity-80 transition-all"
        style={{ 
          backgroundColor: currentTheme.background === '#F8FAFC' ? 'rgba(248, 250, 252, 0.8)' : currentTheme.cardBg,
          borderBottom: `1px solid ${currentTheme.borderColor}`
        }}
      >
        <div className="flex items-center gap-2">
            <button onClick={() => navigate('/home')} className="mr-2 p-1 rounded-full hover:bg-black/5 transition-colors active:scale-95">
                <ArrowLeft className="w-6 h-6" style={{ color: currentTheme.textColor }} />
            </button>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center transform rotate-45 shadow-lg" style={{ backgroundColor: currentTheme.buttonBg }}>
                <Target className="w-4 h-4 text-white transform -rotate-45" />
            </div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: currentTheme.textColor }}>Flashcards</h1>
        </div>
        
        <div className="flex items-center gap-2">
            {/* Theme Icon or Settings could go here */}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.accentColor }}></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            {/* New Words */}
            <div 
              onClick={() => navigate('/flashcards/new')}
              className="bg-white rounded-2xl p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between border border-slate-200/80 group cursor-pointer aspect-square"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-3 group-hover:bg-indigo-600 transition-colors duration-300">
                <Plus className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold leading-none mb-1 text-slate-800">{counts.new}</span>
                <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">New Words</span>
              </div>
            </div>

            {/* Daily Words */}
            <div 
              onClick={() => navigate('/flashcards/daily')}
              className="bg-white rounded-2xl p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between border border-slate-200/80 group cursor-pointer aspect-square"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center mb-3 group-hover:bg-rose-600 transition-colors duration-300">
                <Calendar className="w-6 h-6 text-rose-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold leading-none mb-1 text-slate-800">{counts.daily}</span>
                <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">Daily Words</span>
              </div>
            </div>

            {/* Mastered */}
            <div 
              onClick={() => navigate('/flashcards/mastered')}
              className="bg-white rounded-2xl p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between border border-slate-200/80 group cursor-pointer aspect-square"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-3 group-hover:bg-emerald-600 transition-colors duration-300">
                <CheckCircle className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold leading-none mb-1 text-slate-800">{counts.mastered}</span>
                <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">Mastered</span>
              </div>
            </div>

            {/* Quiz Mode */}
            <div 
              onClick={() => navigate('/flashcards/quiz')}
              className="bg-white rounded-2xl p-5 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between border border-slate-200/80 group cursor-pointer aspect-square"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-3 group-hover:bg-amber-500 transition-colors duration-300">
                <Target className="w-6 h-6 text-amber-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold leading-none mb-1 text-slate-800">Quiz</span>
                <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">Practice</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <ThemeIcon />
    </div>
  );
};

const FlashcardHome: React.FC = () => {
  return <FlashcardHomeContent />;
};

export default FlashcardHome;
