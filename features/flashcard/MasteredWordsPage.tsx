import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronRight, RefreshCw } from 'lucide-react';
import { flashcardService } from '../../core/storage/services';
import { FlashcardMasteredWord } from '../../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface DateGroup {
  date: string;
  count: number;
}

const MasteredWordsPage: React.FC = () => {
  const navigate = useNavigate();
  const [dates, setDates] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedWords, setExpandedWords] = useState<FlashcardMasteredWord[]>([]);
  const [expanding, setExpanding] = useState(false);

  useEffect(() => {
    loadDates();
  }, []);

  const loadDates = async () => {
    setLoading(true);
    try {
      const data = await flashcardService.getMasteredDates();
      setDates(data);
    } catch (error) {
      toast.error('Data load হচ্ছে না');
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (date: string) => {
    if (expandedDate === date) {
      setExpandedDate(null);
      return;
    }

    setExpandedDate(date);
    setExpanding(true);
    try {
      const words = await flashcardService.getMasteredByDate(date);
      setExpandedWords(words);
    } catch (error) {
      toast.error('Load হচ্ছে না');
    } finally {
      setExpanding(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const totalMastered = dates.reduce((acc, curr) => acc + curr.count, 0);

  if (!loading && dates.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white px-4 py-3 flex items-center shadow-sm sticky top-0 z-10">
          <button onClick={() => navigate('/flashcards')} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold ml-2 text-gray-800">Mastered</h1>
          <span className="ml-auto text-gray-500 text-sm font-medium">(0)</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-gray-500 text-lg mb-2">এখনো কোনো word master করোনি!</p>
          <p className="text-gray-400 text-sm mb-6">Daily Words থেকে শিখে ✅ tap করো</p>
          <button 
            onClick={() => navigate('/flashcards/daily')}
            className="px-6 py-3 border border-[#6C63FF] text-[#6C63FF] font-bold rounded-xl active:bg-blue-50"
          >
            📅 Go to Daily Words
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white px-4 py-3 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate('/flashcards')} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold ml-2 text-gray-800">Mastered</h1>
        <span className="ml-auto text-gray-500 text-sm font-medium">({totalMastered})</span>
      </div>

      {/* Date List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white h-16 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          dates.map(item => (
            <div key={item.date} className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
              <div 
                onClick={() => handleExpand(item.date)}
                className="flex items-center justify-between p-3 px-4 cursor-pointer active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: expandedDate === item.date ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight size={18} className="text-gray-400" />
                  </motion.div>
                  <span className="text-[14px] font-bold text-gray-800">
                    📅 {formatDate(item.date)} <span className="text-gray-500 font-normal">({item.count} words)</span>
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {expandedDate === item.date && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-100 bg-gray-50/50"
                  >
                    <div className="p-3 px-4">
                      {expanding ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#6C63FF]"></div>
                        </div>
                      ) : expandedWords.length === 0 ? (
                        <p className="text-center text-gray-400 text-[13px] py-2">কোনো word পাওয়া যায়নি</p>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {expandedWords.map(word => (
                              <span 
                                key={word.id} 
                                className="px-2 py-1 bg-[#6C63FF]/10 border border-[#6C63FF]/30 text-[#6C63FF] text-[13px] rounded-full"
                              >
                                {word.word}
                              </span>
                            ))}
                          </div>
                          <button 
                            onClick={() => navigate(`/flashcards/review/${item.date}`)}
                            className="w-full py-2.5 bg-white border border-[#6C63FF] text-[#6C63FF] font-bold text-[13px] rounded-xl flex items-center justify-center gap-2 active:bg-blue-50"
                          >
                            <RefreshCw size={14} />
                            Review Flashcard
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MasteredWordsPage;
