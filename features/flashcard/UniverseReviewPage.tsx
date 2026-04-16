import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Shuffle } from 'lucide-react';
import { FlashcardWord } from '../../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import FlashcardCard from './components/FlashcardCard';
import { useTheme } from './context/ThemeContext';
import ThemeIcon from './components/ThemeIcon';
import { universeService } from './services/universeService';

const UniverseReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const universeId = searchParams.get('universeId');
  const category = searchParams.get('category');
  const count = searchParams.get('count');
  const shuffle = searchParams.get('shuffle') === 'true';
  const { currentTheme } = useTheme();
  
  const [words, setWords] = useState<FlashcardWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [masteredSessionCount, setMasteredSessionCount] = useState(0);
  
  // Clean State Management
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (universeId) {
      loadWords(universeId);
    } else if (category) {
      loadCategoryWords(category, count, shuffle);
    } else {
      setError(true);
      setLoading(false);
    }
  }, [universeId, category, count, shuffle]);

  const mapNodeToFlashcard = (w: any, basicWord: string): FlashcardWord => ({
    id: w.id,
    word: w.word,
    meaning: w.meaning,
    type: (w.partOfSpeech as any) || 'Other',
    verbForms: null,
    examples: [w.exampleSentence],
    synonyms: [basicWord],
    pronunciation: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    confidenceLevel: 0,
    nextReviewDate: Date.now(),
    lastReviewedAt: 0,
    totalReviews: 0,
    correctCount: 0,
    wrongCount: 0,
    isFavorite: false
  });

  const loadCategoryWords = async (cat: string, limitStr: string | null, doShuffle: boolean) => {
    setLoading(true);
    setError(false);
    try {
      const universes = await universeService.getAllSaved();
      let allNodes: FlashcardWord[] = [];

      universes.forEach(universe => {
        if (cat === 'all' || cat === 'advancedWords') {
          (universe.advancedWords || []).forEach(w => allNodes.push(mapNodeToFlashcard(w, universe.basicWord)));
        }
        if (cat === 'all' || cat === 'greWords') {
          (universe.greWords || []).forEach(w => allNodes.push(mapNodeToFlashcard(w, universe.basicWord)));
        }
        if (cat === 'all' || cat === 'idioms') {
          (universe.idioms || []).forEach(w => allNodes.push(mapNodeToFlashcard(w, universe.basicWord)));
        }
        if (cat === 'all' || cat === 'oneWordSubstitutes') {
          (universe.oneWordSubstitutes || []).forEach(w => allNodes.push(mapNodeToFlashcard(w, universe.basicWord)));
        }
      });

      if (doShuffle) {
        allNodes = allNodes.sort(() => Math.random() - 0.5);
      }

      if (limitStr && limitStr !== 'all') {
        const limit = parseInt(limitStr, 10);
        if (!isNaN(limit)) {
          allNodes = allNodes.slice(0, limit);
        }
      }

      setWords(allNodes);
    } catch (error) {
      console.error(error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadWords = async (id: string) => {
    setLoading(true);
    setError(false);
    try {
      const universe = await universeService.getById(id);
      if (universe) {
        const allNodes = [
          ...(universe.advancedWords || []),
          ...(universe.greWords || []),
          ...(universe.idioms || []),
          ...(universe.oneWordSubstitutes || [])
        ];
        const mappedWords: FlashcardWord[] = allNodes.map((w: any) => mapNodeToFlashcard(w, universe.basicWord));
        setWords(mappedWords);
      } else {
        setError(true);
      }
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
    setCurrentIndex((prev) => (prev + 1) % words.length);
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  const handleMastered = async () => {
    if (isAnimating || words.length === 0) return;
    const currentWord = words[currentIndex];
    if (!currentWord) return;

    setIsAnimating(true);

    if (isFlipped) {
        setIsFlipped(false);
        setTimeout(() => {
            executeMastered(currentWord);
        }, 300);
    } else {
        executeMastered(currentWord);
    }
  };

  const handleShuffle = () => {
    if (words.length <= 1) return;
    
    setIsAnimating(true);
    setIsFlipped(false);
    
    setTimeout(() => {
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        setWords(shuffled);
        setCurrentIndex(0);
        setIsAnimating(false);
        toast.success('Shuffled!', {
            icon: '🔀',
            style: {
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
            },
        });
    }, 300);
  };

  const executeMastered = (currentWord: FlashcardWord) => {
    const newWords = words.filter(w => w.id !== currentWord.id);
    setWords(newWords);
    setMasteredSessionCount(prev => prev + 1);
    
    if (currentIndex >= newWords.length) {
        setCurrentIndex(0);
    }
    
    setTimeout(() => {
        setIsAnimating(false);
    }, 500);
  };

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
            onClick={() => navigate('/flashcards/universe')} 
            className="p-2 -ml-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
            style={{ color: currentTheme.textColor }}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 
            className="text-xl font-bold ml-2"
            style={{ color: currentTheme.textColor }}
          >
            Synonym Finder Review
          </h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-6xl mb-4">🌌</div>
          <p className="text-lg mb-2" style={{ color: currentTheme.subTextColor }}>No words in this universe!</p>
          <button 
            onClick={() => navigate('/flashcards/universe')}
            className="px-6 py-3 border font-bold rounded-2xl active:scale-95 transition-transform mt-6"
            style={{ 
              borderColor: currentTheme.accentColor,
              color: currentTheme.accentColor
            }}
          >
            Go Back
          </button>
        </div>
        <ThemeIcon />
      </div>
    );
  }

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
        <h2 className="text-[20px] font-bold mb-2" style={{ color: currentTheme.textColor }}>Universe Completed!</h2>
        <p className="text-[14px] mb-8" style={{ color: currentTheme.subTextColor }}>{masteredSessionCount} words reviewed</p>
        
        <div className="w-full max-w-xs space-y-3">
          <button 
            onClick={() => navigate('/flashcards/universe')}
            className="w-full py-3.5 font-medium rounded-2xl active:scale-95 transition-transform shadow-sm"
            style={{ 
              backgroundColor: currentTheme.cardBg,
              border: `1px solid ${currentTheme.borderColor}`,
              color: currentTheme.textColor
            }}
          >
            Back to Synonym Finder
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
          onClick={() => navigate('/flashcards/universe')} 
          className="p-2 -ml-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
          style={{ color: currentTheme.textColor }}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 
          className="text-[18px] font-bold ml-2"
          style={{ color: currentTheme.textColor }}
        >
          Synonym Finder Review
        </h1>
        <div className="ml-auto flex items-center gap-3">
          {words.length > 1 && (
            <button 
              onClick={handleShuffle}
              disabled={isAnimating}
              className="p-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors disabled:opacity-50"
              style={{ color: currentTheme.textColor }}
            >
              <Shuffle size={20} />
            </button>
          )}
          <span className="text-[14px] font-medium" style={{ color: currentTheme.subTextColor }}>
            {words.length > 0 ? `${currentIndex + 1}/${words.length}` : '0/0'}
          </span>
        </div>
      </div>

      {/* Main Content - Full Screen Card */}
      <div className="flex-1 flex flex-col p-4 relative w-full max-w-md mx-auto h-full">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: currentTheme.accentColor }}></div>
          </div>
        ) : error ? (
          <div className="text-center mt-20">
            <p className="text-red-500 mb-2">Failed to load universe</p>
            <button onClick={() => navigate('/flashcards/universe')} className="text-blue-600 underline">Go Back</button>
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
                className="absolute inset-0 w-full h-full pb-20"
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

      {/* Bottom Action Bar */}
      {!loading && !error && currentWord && (
        <div 
          className="fixed bottom-0 left-0 right-0 p-4 pb-6 z-20 backdrop-blur-md bg-opacity-90"
          style={{ 
            backgroundColor: currentTheme.cardBg,
            borderTop: `1px solid ${currentTheme.borderColor}`
          }}
        >
          <div className="max-w-md mx-auto flex gap-4">
            <button 
              onClick={handleMastered}
              disabled={isAnimating}
              className="flex-1 py-4 rounded-2xl font-bold text-white shadow-lg shadow-green-500/30 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#4CAF50' }}
            >
              <Check size={20} />
              Got it
            </button>
            <button 
              onClick={handleNext}
              disabled={isAnimating}
              className="flex-1 py-4 rounded-2xl font-bold text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: currentTheme.accentColor }}
            >
              Next
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </button>
          </div>
        </div>
      )}
      
      <ThemeIcon />
    </div>
  );
};

export default UniverseReviewPage;
