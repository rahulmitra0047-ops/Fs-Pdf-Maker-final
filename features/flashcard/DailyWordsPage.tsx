import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ArrowRight } from 'lucide-react';
import { flashcardService } from '../../core/storage/services';
import { FlashcardDailyWord } from '../../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import FlashcardCard from './components/FlashcardCard';
import { useTheme } from './context/ThemeContext';
import ThemeIcon from './components/ThemeIcon';

const DailyWordsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
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
            Daily Words
          </h1>
          <span className="ml-auto text-sm font-medium" style={{ color: currentTheme.subTextColor }}>0/0</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-lg mb-2" style={{ color: currentTheme.subTextColor }}>No daily words!</p>
          <p className="text-sm mb-6" style={{ color: currentTheme.subTextColor }}>Add from New Words</p>
          <button 
            onClick={() => navigate('/flashcards/new')}
            className="px-6 py-3 border font-bold rounded-2xl active:scale-95 transition-transform"
            style={{ 
              borderColor: currentTheme.accentColor,
              color: currentTheme.accentColor
            }}
          >
            Go to New Words
          </button>
        </div>
        <ThemeIcon />
      </div>
    );
  }

  // Completion State
  if (!loading && !error && words.length === 0 && masteredSessionCount > 0) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors duration-300"
        style={{ backgroundColor: currentTheme.background }}
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.4 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: `${currentTheme.accentColor}15` }}
        >
          <Check size={48} style={{ color: currentTheme.accentColor }} />
        </motion.div>
        <h2 className="text-[20px] font-bold mb-2" style={{ color: currentTheme.textColor }}>All words mastered</h2>
        <p className="text-[14px] mb-8" style={{ color: currentTheme.subTextColor }}>{masteredSessionCount} words completed</p>
        
        <div className="w-full max-w-xs space-y-3">
          <button 
            onClick={() => navigate('/flashcards/new')}
            className="w-full py-3.5 font-medium rounded-2xl active:scale-95 transition-transform shadow-sm"
            style={{ 
              backgroundColor: currentTheme.cardBg,
              border: `1px solid ${currentTheme.borderColor}`,
              color: currentTheme.textColor
            }}
          >
            Add More Words
          </button>
          <button 
            onClick={() => navigate('/flashcards')}
            className="w-full py-3.5 font-medium rounded-2xl active:scale-95 transition-transform shadow-sm"
            style={{ 
              backgroundColor: currentTheme.cardBg,
              border: `1px solid ${currentTheme.borderColor}`,
              color: currentTheme.textColor
            }}
          >
            Back to Flashcard
          </button>
        </div>
        <ThemeIcon />
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <div 
      className="min-h-screen flex flex-col overflow-hidden transition-colors duration-300"
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
          className="text-[18px] font-bold ml-2"
          style={{ color: currentTheme.textColor }}
        >
          Daily Words
        </h1>
        <span className="ml-auto text-[14px] font-medium" style={{ color: currentTheme.subTextColor }}>
          {words.length > 0 ? `${currentIndex + 1}/${words.length}` : '0/0'}
        </span>
      </div>

      {/* Main Content - Full Screen Card */}
      <div className="flex-1 flex flex-col p-4 relative w-full max-w-md mx-auto h-full">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: currentTheme.accentColor }}></div>
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
        <div 
          className="p-6 pb-8 flex justify-center gap-4 z-20 backdrop-blur-md bg-opacity-80"
          style={{ backgroundColor: currentTheme.background }}
        >
          <button 
            onClick={handleMastered}
            disabled={loading || isAnimating}
            className="flex items-center gap-2 px-6 py-3.5 font-bold text-[14px] rounded-[16px] active:scale-95 transition-transform disabled:opacity-50"
            style={{ 
              backgroundColor: currentTheme.buttonBg,
              color: currentTheme.buttonText,
              boxShadow: currentTheme.shadow
            }}
          >
            <Check size={18} strokeWidth={3} />
            Mastered
          </button>
          <button 
            onClick={handleNext}
            disabled={loading || isAnimating}
            className="flex items-center gap-2 px-6 py-3.5 font-medium text-[14px] rounded-[16px] active:bg-black/5 transition-colors disabled:opacity-50"
            style={{ 
              backgroundColor: currentTheme.cardBg,
              border: `1.5px solid ${currentTheme.borderColor !== 'transparent' ? currentTheme.borderColor : '#E0E0E0'}`,
              color: currentTheme.textColor,
              boxShadow: '0px 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            Next
            <ArrowRight size={18} />
          </button>
        </div>
      )}
      <ThemeIcon />
    </div>
  );
};

export default DailyWordsPage;
