import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, CheckCircle, Target } from 'lucide-react';
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
              className="rounded-[20px] p-4 active:scale-95 transition-transform cursor-pointer flex flex-col items-center justify-center aspect-square group hover:shadow-md"
              style={{ 
                backgroundColor: currentTheme.cardBg,
                boxShadow: currentTheme.shadow,
                border: `1px solid ${currentTheme.borderColor}`
              }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: `${currentTheme.accentColor}15` }}>
                <Plus className="w-5 h-5" style={{ color: currentTheme.accentColor }} />
              </div>
              <span className="text-2xl font-bold leading-none mb-1" style={{ color: currentTheme.textColor }}>{counts.new}</span>
              <span className="text-xs font-medium" style={{ color: currentTheme.subTextColor }}>New Words</span>
            </div>

            {/* Daily Words */}
            <div 
              onClick={() => navigate('/flashcards/daily')}
              className="rounded-[20px] p-4 active:scale-95 transition-transform cursor-pointer flex flex-col items-center justify-center aspect-square group hover:shadow-md"
              style={{ 
                backgroundColor: currentTheme.cardBg,
                boxShadow: currentTheme.shadow,
                border: `1px solid ${currentTheme.borderColor}`
              }}
            >
              <div className="w-10 h-10 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center mb-2">
                <Calendar className="w-5 h-5 text-[#FF6B6B]" />
              </div>
              <span className="text-2xl font-bold leading-none mb-1" style={{ color: currentTheme.textColor }}>{counts.daily}</span>
              <span className="text-xs font-medium" style={{ color: currentTheme.subTextColor }}>Daily Words</span>
            </div>

            {/* Mastered */}
            <div 
              onClick={() => navigate('/flashcards/mastered')}
              className="rounded-[20px] p-4 active:scale-95 transition-transform cursor-pointer flex flex-col items-center justify-center aspect-square group hover:shadow-md"
              style={{ 
                backgroundColor: currentTheme.cardBg,
                boxShadow: currentTheme.shadow,
                border: `1px solid ${currentTheme.borderColor}`
              }}
            >
              <div className="w-10 h-10 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5 text-[#4CAF50]" />
              </div>
              <span className="text-2xl font-bold leading-none mb-1" style={{ color: currentTheme.textColor }}>{counts.mastered}</span>
              <span className="text-xs font-medium" style={{ color: currentTheme.subTextColor }}>Mastered</span>
            </div>

            {/* Quiz Mode */}
            <div 
              onClick={() => navigate('/flashcards/quiz')}
              className="rounded-[20px] p-4 active:scale-95 transition-transform cursor-pointer flex flex-col items-center justify-center aspect-square group hover:shadow-md"
              style={{ 
                backgroundColor: currentTheme.cardBg,
                boxShadow: currentTheme.shadow,
                border: `1px solid ${currentTheme.borderColor}`
              }}
            >
              <div className="w-10 h-10 rounded-full bg-[#FFA726]/10 flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-[#FFA726]" />
              </div>
              <span className="text-2xl font-bold leading-none mb-1" style={{ color: currentTheme.textColor }}>Quiz</span>
              <span className="text-xs font-medium" style={{ color: currentTheme.subTextColor }}>Practice</span>
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
