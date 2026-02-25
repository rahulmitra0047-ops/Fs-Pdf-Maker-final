import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, CheckCircle, Target } from 'lucide-react';
import { flashcardService } from '../../core/storage/services';
import toast from 'react-hot-toast';

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
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      {/* Top Bar */}
      <div className="px-4 py-3 flex items-center sticky top-0 z-10">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-gray-200/50">
          <ArrowLeft className="w-6 h-6 text-[#424242]" />
        </button>
        <h1 className="text-[18px] font-bold ml-2 text-[#1A1A1A]">Flashcard</h1>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C63FF]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {/* New Words */}
            <div 
              onClick={() => navigate('/flashcards/new')}
              className="bg-white rounded-[24px] p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] active:scale-95 transition-transform cursor-pointer flex flex-col items-center justify-center aspect-square"
            >
              <div className="w-12 h-12 rounded-full bg-[#6C63FF]/10 flex items-center justify-center mb-3">
                <Plus className="w-6 h-6 text-[#6C63FF]" />
              </div>
              <span className="text-[28px] font-bold text-[#1A1A1A] leading-none mb-1">{counts.new}</span>
              <span className="text-[13px] font-medium text-[#9E9E9E]">New Words</span>
            </div>

            {/* Daily Words */}
            <div 
              onClick={() => navigate('/flashcards/daily')}
              className="bg-white rounded-[24px] p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] active:scale-95 transition-transform cursor-pointer flex flex-col items-center justify-center aspect-square"
            >
              <div className="w-12 h-12 rounded-full bg-[#FF6B6B]/10 flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-[#FF6B6B]" />
              </div>
              <span className="text-[28px] font-bold text-[#1A1A1A] leading-none mb-1">{counts.daily}</span>
              <span className="text-[13px] font-medium text-[#9E9E9E]">Daily Words</span>
            </div>

            {/* Mastered */}
            <div 
              onClick={() => navigate('/flashcards/mastered')}
              className="bg-white rounded-[24px] p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] active:scale-95 transition-transform cursor-pointer flex flex-col items-center justify-center aspect-square"
            >
              <div className="w-12 h-12 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-[#4CAF50]" />
              </div>
              <span className="text-[28px] font-bold text-[#1A1A1A] leading-none mb-1">{counts.mastered}</span>
              <span className="text-[13px] font-medium text-[#9E9E9E]">Mastered</span>
            </div>

            {/* Quiz Mode (New) */}
            <div 
              onClick={() => navigate('/flashcards/quiz')}
              className="bg-white rounded-[24px] p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] active:scale-95 transition-transform cursor-pointer flex flex-col items-center justify-center aspect-square"
            >
              <div className="w-12 h-12 rounded-full bg-[#FFA726]/10 flex items-center justify-center mb-3">
                <Target className="w-6 h-6 text-[#FFA726]" />
              </div>
              <span className="text-[28px] font-bold text-[#1A1A1A] leading-none mb-1">Quiz</span>
              <span className="text-[13px] font-medium text-[#9E9E9E]">Practice</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardHome;
