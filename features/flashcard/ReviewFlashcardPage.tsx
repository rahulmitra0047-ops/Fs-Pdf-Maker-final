import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { flashcardService } from '../../core/storage/services';
import { FlashcardMasteredWord } from '../../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import FlashcardCard from './components/FlashcardCard';
import { useTheme } from './context/ThemeContext';
import ThemeIcon from './components/ThemeIcon';

const ReviewFlashcardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { date } = useParams<{ date: string }>();
  const [words, setWords] = useState<FlashcardMasteredWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Clean State Management
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (date) {
      loadWords(date);
    }
  }, [date]);

  const loadWords = async (dateStr: string) => {
    setLoading(true);
    setError(false);
    try {
      const data = await flashcardService.getMasteredByDate(dateStr);
      setWords(data);
    } catch (error) {
      console.error(error);
      setError(true);
      toast.error('Failed to load words');
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
    setCurrentIndex((prev) => (prev + 1) % words.length);
    
    // Reset animation lock after transition
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: currentTheme.background }}
      >
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: currentTheme.accentColor }}></div>
      </div>
    );
  }

  if (error || words.length === 0) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors duration-300"
        style={{ backgroundColor: currentTheme.background }}
      >
        <p className="mb-4" style={{ color: currentTheme.subTextColor }}>No words found for this date</p>
        <button 
          onClick={() => navigate(-1)} 
          className="font-bold"
          style={{ color: currentTheme.accentColor }}
        >
          Go Back
        </button>
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
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
          style={{ color: currentTheme.textColor }}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 
          className="text-[18px] font-bold ml-2"
          style={{ color: currentTheme.textColor }}
        >
          Review • {formatDate(date || '')}
        </h1>
        <span className="ml-auto text-[14px] font-medium" style={{ color: currentTheme.subTextColor }}>
          {currentIndex + 1}/{words.length}
        </span>
      </div>

      {/* Main Content - Full Screen Card */}
      <div className="flex-1 flex flex-col p-4 relative w-full max-w-md mx-auto h-full">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: currentTheme.accentColor }}></div>
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
      <div 
        className="p-6 pb-8 flex justify-center z-20 backdrop-blur-md bg-opacity-80"
        style={{ backgroundColor: currentTheme.background }}
      >
        <button 
          onClick={handleNext}
          disabled={loading || isAnimating}
          className="flex items-center gap-2 px-8 py-3.5 font-medium text-[14px] rounded-[16px] active:bg-black/5 transition-colors disabled:opacity-50"
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
      <ThemeIcon />
    </div>
  );
};

export default ReviewFlashcardPage;
