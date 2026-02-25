import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { flashcardService } from '../../core/storage/services';
import { FlashcardMasteredWord } from '../../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import FlashcardCard from './components/FlashcardCard';

const ReviewFlashcardPage: React.FC = () => {
  const navigate = useNavigate();
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
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6C63FF]"></div>
      </div>
    );
  }

  if (error || words.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-[#757575] mb-4">No words found for this date</p>
        <button onClick={() => navigate(-1)} className="text-[#6C63FF] font-bold">Go Back</button>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="px-4 py-3 flex items-center sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-200/50">
          <ArrowLeft className="w-6 h-6 text-[#424242]" />
        </button>
        <h1 className="text-[18px] font-bold ml-2 text-[#1A1A1A]">Review • {formatDate(date || '')}</h1>
        <span className="ml-auto text-[#9E9E9E] text-[14px] font-medium">
          {currentIndex + 1}/{words.length}
        </span>
      </div>

      {/* Main Content - Full Screen Card */}
      <div className="flex-1 flex flex-col p-4 relative w-full max-w-md mx-auto h-full">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6C63FF]"></div>
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
      <div className="p-6 pb-8 flex justify-center z-20 bg-[#F5F5F5]">
        <button 
          onClick={handleNext}
          disabled={loading || isAnimating}
          className="flex items-center gap-2 px-8 py-3.5 bg-white border-[1.5px] border-[#E0E0E0] text-[#424242] font-medium text-[14px] rounded-[16px] shadow-[0px_4px_12px_rgba(0,0,0,0.05)] active:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Next
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default ReviewFlashcardPage;
