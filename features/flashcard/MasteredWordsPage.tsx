import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, RefreshCw, Trash2 } from 'lucide-react';
import { flashcardService } from '../../core/storage/services';
import { FlashcardMasteredWord } from '../../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './context/ThemeContext';
import ThemeIcon from './components/ThemeIcon';

interface DateGroup {
  date: string;
  count: number;
}

const MasteredWordsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [dates, setDates] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedWords, setExpandedWords] = useState<FlashcardMasteredWord[]>([]);
  const [expanding, setExpanding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<FlashcardMasteredWord | null>(null);

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

  const handleDeleteClick = (e: React.MouseEvent, word: FlashcardMasteredWord) => {
    e.stopPropagation();
    setConfirmDelete(word);
  };

  const confirmDeleteWord = async () => {
    if (!confirmDelete) return;
    try {
      await flashcardService.deleteMasteredWord(confirmDelete.id);
      toast.success('Word deleted');
      setConfirmDelete(null);
      
      // Reload dates and current expanded words
      const data = await flashcardService.getMasteredDates();
      setDates(data);
      
      if (expandedDate) {
         const words = await flashcardService.getMasteredByDate(expandedDate);
         setExpandedWords(words);
         // If no words left in this date, collapse it
         if (words.length === 0) {
             setExpandedDate(null);
         }
      }
    } catch (error) {
      toast.error('Delete failed');
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
      <div 
        className="min-h-screen flex flex-col transition-colors duration-300"
        style={{ backgroundColor: currentTheme.background }}
      >
        <div 
          className="px-4 py-3 flex items-center sticky top-0 z-10 backdrop-blur-md bg-opacity-80"
          style={{ 
            backgroundColor: currentTheme.cardBg,
            borderBottom: `1px solid ${currentTheme.borderColor}`
          }}
        >
          <button 
            onClick={() => navigate('/flashcards')} 
            className="p-2 -ml-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
            style={{ color: currentTheme.textColor }}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 
            className="text-xl font-bold ml-2"
            style={{ color: currentTheme.textColor }}
          >
            Mastered
          </h1>
          <span className="ml-auto text-sm font-medium" style={{ color: currentTheme.subTextColor }}>(0)</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-lg mb-2" style={{ color: currentTheme.subTextColor }}>এখনো কোনো word master করোনি!</p>
          <p className="text-sm mb-6" style={{ color: currentTheme.subTextColor }}>Daily Words থেকে শিখে ✅ tap করো</p>
          <button 
            onClick={() => navigate('/flashcards/daily')}
            className="px-6 py-3 border font-bold rounded-xl active:scale-95 transition-transform"
            style={{ 
              borderColor: currentTheme.accentColor,
              color: currentTheme.accentColor
            }}
          >
            📅 Go to Daily Words
          </button>
        </div>
        <ThemeIcon />
      </div>
    );
  }

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
          onClick={() => navigate('/flashcards')} 
          className="p-2 -ml-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
          style={{ color: currentTheme.textColor }}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 
          className="text-xl font-bold ml-2"
          style={{ color: currentTheme.textColor }}
        >
          Mastered
        </h1>
        <span className="ml-auto text-sm font-medium" style={{ color: currentTheme.subTextColor }}>({totalMastered})</span>
      </div>

      {/* Date List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className="h-16 rounded-xl animate-pulse" 
                style={{ backgroundColor: currentTheme.cardBg }}
              />
            ))}
          </div>
        ) : (
          dates.map(item => (
            <div 
              key={item.date} 
              className="rounded-[14px] overflow-hidden transition-colors duration-300"
              style={{ 
                backgroundColor: currentTheme.cardBg,
                border: `1px solid ${currentTheme.borderColor}`
              }}
            >
              <div 
                onClick={() => handleExpand(item.date)}
                className="flex items-center justify-between p-3 px-4 cursor-pointer active:bg-black/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: expandedDate === item.date ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight size={18} style={{ color: currentTheme.subTextColor }} />
                  </motion.div>
                  <span className="text-[14px] font-bold" style={{ color: currentTheme.textColor }}>
                    📅 {formatDate(item.date)} <span className="font-normal" style={{ color: currentTheme.subTextColor }}>({item.count} words)</span>
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
                    className="border-t"
                    style={{ 
                      borderColor: currentTheme.borderColor,
                      backgroundColor: `${currentTheme.background}50`
                    }}
                  >
                    <div className="p-3 px-4">
                      {expanding ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: currentTheme.accentColor }}></div>
                        </div>
                      ) : expandedWords.length === 0 ? (
                        <p className="text-center text-[13px] py-2" style={{ color: currentTheme.subTextColor }}>কোনো word পাওয়া যায়নি</p>
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {expandedWords.map(word => (
                              <div 
                                key={word.id} 
                                className="px-2 py-1 text-[13px] rounded-full border flex items-center gap-1 group"
                                style={{ 
                                  backgroundColor: `${currentTheme.accentColor}10`,
                                  borderColor: `${currentTheme.accentColor}30`,
                                  color: currentTheme.accentColor
                                }}
                              >
                                <span>{word.word}</span>
                                <button
                                  onClick={(e) => handleDeleteClick(e, word)}
                                  className="p-0.5 rounded-full hover:bg-black/10 active:bg-black/20 transition-colors"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button 
                            onClick={() => navigate(`/flashcards/review/${item.date}`)}
                            className="w-full py-2.5 border font-bold text-[13px] rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                            style={{ 
                              backgroundColor: currentTheme.cardBg,
                              borderColor: currentTheme.accentColor,
                              color: currentTheme.accentColor
                            }}
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

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            style={{ backgroundColor: currentTheme.cardBg }}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto text-red-500">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-center" style={{ color: currentTheme.textColor }}>এই word delete করবে?</h3>
            <p className="mb-6 text-center" style={{ color: currentTheme.subTextColor }}>
              "{confirmDelete.word}" কে permanently delete করা হবে।
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border font-bold rounded-xl"
                style={{ 
                  borderColor: currentTheme.borderColor,
                  color: currentTheme.textColor
                }}
              >
                না
              </button>
              <button 
                onClick={confirmDeleteWord}
                className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl"
              >
                হ্যাঁ, Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <ThemeIcon />
    </div>
  );
};

export default MasteredWordsPage;
