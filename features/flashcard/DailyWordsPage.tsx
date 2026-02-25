import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ArrowRight } from 'lucide-react';
import { flashcardService } from '../../core/storage/services';
import { FlashcardDailyWord } from '../../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import FlashcardCard from './components/FlashcardCard';

const DailyWordsPage: React.FC = () => {
  const navigate = useNavigate();
  const [words, setWords] = useState<FlashcardDailyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [masteredSessionCount, setMasteredSessionCount] = useState(0);
  
  // Clean State Management
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await flashcardService.getDailyWords();
      setWords(data);
    } catch (error) {
      console.error(error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.45;
    window.speechSynthesis.speak(utterance);
  };

  const handleFlip = () => {
    if (!isAnimating) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleNext = () => {
    if (isAnimating || words.length === 0) return;
    setIsAnimating(true);

    // Sequence: Reset Flip -> Change Card
    if (isFlipped) {
      setIsFlipped(false);
      setTimeout(() => {
        proceedToNextCard();
      }, 300); // Wait for flip animation
    } else {
      proceedToNextCard();
    }
  };

  const proceedToNextCard = () => {
    // We don't need a timeout here if we want immediate slide
    // But AnimatePresence needs a state change to trigger
    setCurrentIndex((prev) => (prev + 1) % words.length);
    
    // Reset animation lock after transition
    setTimeout(() => {
      setIsAnimating(false);
    }, 500); // Wait for slide animation (approx 400-500ms)
  };

  const handleMastered = async () => {
    if (isAnimating || words.length === 0) return;
    const currentWord = words[currentIndex];
    if (!currentWord) return;

    setIsAnimating(true);

    // Sequence: Reset Flip -> Remove Card
    if (isFlipped) {
        setIsFlipped(false);
        setTimeout(() => {
            executeMastered(currentWord);
        }, 300);
    } else {
        executeMastered(currentWord);
    }
  };

  const executeMastered = (currentWord: FlashcardDailyWord) => {
    // Optimistic Update
    const newWords = words.filter(w => w.id !== currentWord.id);
    setWords(newWords);
    setMasteredSessionCount(prev => prev + 1);
    
    // Adjust index if needed
    if (currentIndex >= newWords.length) {
        setCurrentIndex(0);
    }
    
    setTimeout(() => {
        setIsAnimating(false);
    }, 500);

    // Background API call
    flashcardService.moveDailyToMastered(currentWord.id).catch(() => {
      toast.error('Failed to update');
    });
  };

  // Empty State (Initial Load)
  if (!loading && !error && words.length === 0 && masteredSessionCount === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
        <div className="px-4 py-3 flex items-center sticky top-0 z-10">
          <button onClick={() => navigate('/flashcards')} className="p-2 -ml-2 rounded-full hover:bg-gray-200/50">
            <ArrowLeft className="w-6 h-6 text-[#424242]" />
          </button>
          <h1 className="text-xl font-bold ml-2 text-[#1A1A1A]">Daily Words</h1>
          <span className="ml-auto text-[#9E9E9E] text-sm font-medium">0/0</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-6xl mb-4 text-[#BDBDBD]">📅</div>
          <p className="text-[#757575] text-lg mb-2">No daily words!</p>
          <p className="text-[#9E9E9E] text-sm mb-6">Add from New Words</p>
          <button 
            onClick={() => navigate('/flashcards/new')}
            className="px-6 py-3 border border-[#6C63FF] text-[#6C63FF] font-bold rounded-2xl active:bg-blue-50"
          >
            Go to New Words
          </button>
        </div>
      </div>
    );
  }

  // Completion State
  if (!loading && !error && words.length === 0 && masteredSessionCount > 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.4 }}
          className="w-20 h-20 rounded-full bg-[#6C63FF]/10 flex items-center justify-center mb-6"
        >
          <Check size={48} className="text-[#6C63FF]" />
        </motion.div>
        <h2 className="text-[20px] font-bold text-[#1A1A1A] mb-2">All words mastered</h2>
        <p className="text-[#757575] text-[14px] mb-8">{masteredSessionCount} words completed</p>
        
        <div className="w-full max-w-xs space-y-3">
          <button 
            onClick={() => navigate('/flashcards/new')}
            className="w-full py-3.5 bg-white border border-[#E0E0E0] text-[#424242] font-medium rounded-2xl active:bg-gray-50 shadow-sm"
          >
            Add More Words
          </button>
          <button 
            onClick={() => navigate('/flashcards')}
            className="w-full py-3.5 bg-white border border-[#E0E0E0] text-[#424242] font-medium rounded-2xl active:bg-gray-50 shadow-sm"
          >
            Back to Flashcard
          </button>
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="px-4 py-3 flex items-center sticky top-0 z-10">
        <button onClick={() => navigate('/flashcards')} className="p-2 -ml-2 rounded-full hover:bg-gray-200/50">
          <ArrowLeft className="w-6 h-6 text-[#424242]" />
        </button>
        <h1 className="text-[18px] font-bold ml-2 text-[#1A1A1A]">Daily Words</h1>
        <span className="ml-auto text-[#9E9E9E] text-[14px] font-medium">
          {words.length > 0 ? `${currentIndex + 1}/${words.length}` : '0/0'}
        </span>
      </div>

      {/* Main Content - Full Screen Card */}
      <div className="flex-1 flex flex-col p-4 relative w-full max-w-md mx-auto h-full">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6C63FF]"></div>
          </div>
        ) : error ? (
          <div className="text-center mt-20">
            <p className="text-red-500 mb-2">Failed to load data</p>
            <button onClick={loadWords} className="text-blue-600 underline">Retry</button>
          </div>
        ) : currentWord && (
          <div className="flex-1 relative w-full h-full perspective-1000">
            <AnimatePresence mode='popLayout'>
              <motion.div
                key={currentWord.id}
                initial={{ x: 300, opacity: 0, scale: 0.9 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -300, opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                <FlashcardCard 
                  word={currentWord}
                  isFlipped={isFlipped}
                  onFlip={handleFlip}
                  onSpeak={handleSpeak}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom Buttons */}
      {words.length > 0 && (
        <div className="p-6 pb-8 flex justify-center gap-4 z-20 bg-[#F5F5F5]">
          <button 
            onClick={handleMastered}
            disabled={loading || isAnimating}
            className="flex items-center gap-2 px-6 py-3.5 bg-[#4CAF50] text-white font-bold text-[14px] rounded-[16px] shadow-[0px_4px_12px_rgba(76,175,80,0.3)] active:scale-95 transition-transform disabled:opacity-50"
          >
            <Check size={18} strokeWidth={3} />
            Mastered
          </button>
          <button 
            onClick={handleNext}
            disabled={loading || isAnimating}
            className="flex items-center gap-2 px-6 py-3.5 bg-white border-[1.5px] border-[#E0E0E0] text-[#424242] font-medium text-[14px] rounded-[16px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)] active:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Next
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DailyWordsPage;
