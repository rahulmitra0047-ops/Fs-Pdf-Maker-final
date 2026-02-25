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
        className="px-4 py-3 flex items-center sticky top-0 z-10 backdrop-blur-md bg-opacity-80"
        style={{ 
          backgroundColor: currentTheme.cardBg,
          borderBottom: `1px solid ${currentTheme.borderColor}`
        }}
      >
        <button 
          onClick={() => navigate('/')} 
          className="p-2 -ml-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
          style={{ color: currentTheme.textColor }}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 
          className="text-[18px] font-bold ml-2"
          style={{ color: currentTheme.textColor }}
        >
          Flashcard
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentTheme.accentColor }}></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {/* New Words */}
            <div 
              onClick={() => navigate('/flashcards/new')}
              className="rounded-[24px] p-5 active:scale-95 transition-transform cursor-pointer flex flex-col items-center justify-center aspect-square"
              style={{ 
                backgroundColor: currentTheme.cardBg,
                boxShadow: currentTheme.shadow,
                border: `1px solid ${currentTheme.borderColor}`
              }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${currentTheme.accentColor}15` }}>
                <Plus className="w-6 h-6" style={{ color: currentTheme.accentColor }} />
              </div>
              <span className="text-[28px] font-bold leading-none mb-1" style={{ color: currentTheme.textColor }}>{counts.new}</span>
              <span className="text-[13px] font-medium" style={{ color: currentTheme.subTextColor }}>New Words</span>
            </div>

            {/* Daily Words */}
            <div 
              onClick={() => navigate('/flashcards/daily')}
              className="rounded-[24px] p-5 active:scale-95 transition-transform cursor-pointer flex flex-col items-center justify-center aspect-square"
              style={{ 
                backgroundColor: currentTheme.cardBg,
                boxShadow: currentTheme.shadow,
                border: `1px solid ${currentTheme.borderColor}`
              }}
            >
              <div className="w-12 h-12 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-[#FF6B6B]" />
              </div>
              <span className="text-[28px] font-bold leading-none mb-1" style={{ color: currentTheme.textColor }}>{counts.daily}</span>
              <span className="text-[13px] font-medium" style={{ color: currentTheme.subTextColor }}>Daily Words</span>
            </div>

            {/* Mastered */}
            <div 
              onClick={() => navigate('/flashcards/mastered')}
              className="rounded-[24px] p-5 active:scale-95 transition-transform cursor-pointer flex flex-col items-center justify-center aspect-square"
              style={{ 
                backgroundColor: currentTheme.cardBg,
                boxShadow: currentTheme.shadow,
                border: `1px solid ${currentTheme.borderColor}`
              }}
            >
              <div className="w-12 h-12 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-[#4CAF50]" />
              </div>
              <span className="text-[28px] font-bold leading-none mb-1" style={{ color: currentTheme.textColor }}>{counts.mastered}</span>
              <span className="text-[13px] font-medium" style={{ color: currentTheme.subTextColor }}>Mastered</span>
            </div>

            {/* Quiz Mode */}
            <div 
              onClick={() => navigate('/flashcards/quiz')}
              className="rounded-[24px] p-5 active:scale-95 transition-transform cursor-pointer flex flex-col items-center justify-center aspect-square"
              style={{ 
                backgroundColor: currentTheme.cardBg,
                boxShadow: currentTheme.shadow,
                border: `1px solid ${currentTheme.borderColor}`
              }}
            >
              <div className="w-12 h-12 rounded-full bg-[#FFA726]/10 flex items-center justify-center mb-3">
                <Target className="w-6 h-6 text-[#FFA726]" />
              </div>
              <span className="text-[28px] font-bold leading-none mb-1" style={{ color: currentTheme.textColor }}>Quiz</span>
              <span className="text-[13px] font-medium" style={{ color: currentTheme.subTextColor }}>Practice</span>
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
