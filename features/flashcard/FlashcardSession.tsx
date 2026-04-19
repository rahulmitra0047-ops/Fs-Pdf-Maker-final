import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../shared/components/Icon';
import { flashcardService, flashcardStatsService, practiceService, flashcardSettingsService } from '../../core/storage/services';
import { calculateNextReview } from './utils/srs';
import { FlashcardWord, FlashcardSettings } from '../../types';
import { useToast } from '../../shared/context/ToastContext';

const FlashcardSession: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') as 'new' | 'review' | null;
  const mode = searchParams.get('mode') as 'learning' | 'practice' || 'learning';
  const pool = searchParams.get('pool') as 'all' | 'mastered' | 'learning' | 'favorites' || 'all';
  const direction = searchParams.get('direction') as 'normal' | 'reverse' || 'normal';
  const universeId = searchParams.get('universeId');
  
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<FlashcardWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [settings, setSettings] = useState<FlashcardSettings | null>(null);
  
  // Stats for this session
  const [sessionStats, setSessionStats] = useState({
    gotIt: 0,
    again: 0,
    total: 0
  });

  // Swipe State
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDeck();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await flashcardSettingsService.getSettings();
    setSettings(s);
  };

  const triggerHaptic = (type: 'success' | 'error' | 'light') => {
    if (!settings?.hapticEnabled) return;
    if (navigator.vibrate) {
      if (type === 'success') navigator.vibrate(50);
      else if (type === 'error') navigator.vibrate([30, 50, 30]);
      else navigator.vibrate(10);
    }
  };

  const playSound = (type: 'flip' | 'correct' | 'wrong') => {
    if (!settings?.soundEnabled) return;
    // Simple beep logic using AudioContext or HTML5 Audio
    // For now, we'll skip actual audio file loading to avoid missing assets, 
    // but structure is here.
    // const audio = new Audio(`/sounds/${type}.mp3`);
    // audio.play().catch(() => {});
  };

  const loadDeck = async () => {
    setLoading(true);
    try {
      let words: FlashcardWord[] = [];
      
      if (universeId) {
        // Load words from a specific universe
        const savedUniverses = localStorage.getItem('saved_word_universes');
        if (savedUniverses) {
          const universes = JSON.parse(savedUniverses);
          const universe = universes.find((u: any) => u.id === universeId);
          if (universe) {
            const allNodes = [
              ...(universe.advancedWords || []),
              ...(universe.greWords || []),
              ...(universe.idioms || []),
              ...(universe.oneWordSubstitutes || [])
            ];
            words = allNodes.map(w => ({
              id: w.id,
              word: w.word,
              meaning: w.meaning,
              type: (w.partOfSpeech as any) || 'Other',
              verbForms: null,
              examples: [w.exampleSentence],
              synonyms: [universe.basicWord],
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
            })) as FlashcardWord[];
          }
        }
      } else if (mode === 'practice') {
        const all = await flashcardService.getAll();
        if (pool === 'mastered') {
          words = all.filter(w => w.confidenceLevel >= 4);
        } else if (pool === 'learning') {
          words = all.filter(w => w.confidenceLevel > 0 && w.confidenceLevel < 4);
        } else if (pool === 'favorites') {
          words = all.filter(w => w.isFavorite);
        } else {
          words = all;
        }
        // Shuffle for practice
        words = words.sort(() => Math.random() - 0.5);
      } else {
        // Learning Mode
        if (type === 'new') {
          words = await flashcardService.getNewWords();
          words = words.slice(0, 10);
        } else if (type === 'review') {
          words = await flashcardService.getReviewDueWords();
          words = words.slice(0, 10);
        } else {
          const newWords = await flashcardService.getNewWords();
          const reviewWords = await flashcardService.getReviewDueWords();
          words = [...reviewWords, ...newWords].slice(0, 10);
        }
      }

      if (words.length === 0) {
        toast.info("No cards available for this session.");
        navigate('/flashcards');
        return;
      }

      setDeck(words);
      setSessionStats(prev => ({ ...prev, total: words.length }));
      setStartTime(Date.now());
      
      // Auto-play TTS for first card (only if normal direction)
      // if (direction === 'normal') {
      //   speakWord(words[0].word);
      // }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load session");
      navigate('/flashcards');
    } finally {
      setLoading(false);
    }
  };

  const speakWord = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    startX.current = clientX;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const delta = clientX - startX.current;
    setDragX(delta);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(dragX) > 100) {
      if (dragX > 0) {
        handleSwipe('right'); // Got it
      } else {
        handleSwipe('left'); // Again
      }
    } else {
      setDragX(0);
    }
  };

  const handleSwipe = async (swipeDir: 'left' | 'right') => {
    const currentCard = deck[currentIndex];
    if (!currentCard) return;

    const isCorrect = swipeDir === 'right';
    
    // Feedback
    triggerHaptic(isCorrect ? 'success' : 'error');
    playSound(isCorrect ? 'correct' : 'wrong');

    // Animate out
    setDragX(swipeDir === 'right' ? 500 : -500);

    // Update Logic
    if (mode === 'learning') {
      const { newLevel, nextReviewDate } = calculateNextReview(currentCard.confidenceLevel, isCorrect);

      // Update DB
      await flashcardService.updateWord(currentCard.id, {
        confidenceLevel: newLevel,
        nextReviewDate,
        lastReviewedAt: Date.now(),
        totalReviews: currentCard.totalReviews + 1,
        correctCount: currentCard.correctCount + (isCorrect ? 1 : 0),
        wrongCount: currentCard.wrongCount + (isCorrect ? 0 : 1)
      });

      // Update Today's Stats
      await flashcardStatsService.updateTodayStats({
        completed: (await flashcardStatsService.getTodayStats()).completed + 1,
        gotIt: (await flashcardStatsService.getTodayStats()).gotIt + (isCorrect ? 1 : 0),
        again: (await flashcardStatsService.getTodayStats()).again + (isCorrect ? 0 : 1)
      });
    }

    // Update Session Stats
    setSessionStats(prev => ({
      ...prev,
      gotIt: prev.gotIt + (isCorrect ? 1 : 0),
      again: prev.again + (isCorrect ? 0 : 1)
    }));

    // If Again, push to end of deck (only in learning mode or if user wants repetition)
    if (!isCorrect) {
      setDeck(prev => [...prev, currentCard]);
    }

    // Wait for animation
    setTimeout(async () => {
      if (currentIndex < deck.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setDragX(0);
        setIsFlipped(false);
        // Speak next word
        // const nextCard = deck[currentIndex + 1];
        // if (nextCard && direction === 'normal') speakWord(nextCard.word);
      } else {
        // Session Complete
        setSessionComplete(true);
        if (mode === 'practice') {
           await savePracticeSession();
        }
      }
    }, 300);
  };

  const savePracticeSession = async () => {
    const duration = Math.round((Date.now() - startTime) / 1000);
    const accuracy = Math.round((sessionStats.gotIt / (sessionStats.gotIt + sessionStats.again)) * 100) || 0;
    
    await practiceService.saveResult({
      id: crypto.randomUUID(),
      mode: direction === 'reverse' ? 'reverse' : 'shuffle',
      date: new Date().toISOString().split('T')[0],
      totalQuestions: sessionStats.gotIt + sessionStats.again,
      correctCount: sessionStats.gotIt,
      wrongCount: sessionStats.again,
      accuracy,
      duration,
      wordPool: pool,
      createdAt: Date.now()
    });
  };

  const handleFlip = () => {
    // Increased tolerance for tap vs drag
    if (Math.abs(dragX) < 10) {
      triggerHaptic('light');
      playSound('flip');
      setIsFlipped(!isFlipped);
      if (!isFlipped && direction === 'reverse') {
         // Speak when revealing English in reverse mode
         // speakWord(deck[currentIndex].word);
      }
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  if (sessionComplete) {
    const accuracy = Math.round((sessionStats.gotIt / (sessionStats.gotIt + sessionStats.again)) * 100) || 0;
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center text-center font-serif">
        <h2 className="text-2xl tracking-tight text-text-primary mb-2 font-medium">Session Complete</h2>
        {mode === 'practice' && (
          <p className="font-sans text-xs text-text-secondary mb-8 uppercase tracking-widest">Casual mode — no SRS progress saved</p>
        )}
        
        <div className="bg-surface p-6 w-full max-w-xs border border-border mb-8">
          <div className="flex justify-between mb-4 items-center">
            <span className="font-sans text-sm text-text-secondary uppercase tracking-wider">{direction === 'reverse' ? 'I knew it' : 'Got it'}</span>
            <span className="font-sans text-base font-medium text-text-primary">{sessionStats.gotIt}</span>
          </div>
          <div className="flex justify-between mb-4 items-center">
            <span className="font-sans text-sm text-text-secondary uppercase tracking-wider">{direction === 'reverse' ? "Didn't know" : 'Again'}</span>
            <span className="font-sans text-base font-medium text-text-primary">{sessionStats.again}</span>
          </div>
          <div className="h-[1px] bg-border my-4 w-full"></div>
          <div className="flex justify-between items-center">
            <span className="font-sans text-sm text-text-primary uppercase tracking-wider font-semibold">Accuracy</span>
            <span className="font-sans text-base font-semibold text-primary">{accuracy}%</span>
          </div>
        </div>

        <div className="space-y-4 w-full max-w-xs font-sans">
          {sessionStats.again > 0 && mode === 'learning' && (
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-surface py-3 text-sm font-semibold tracking-wider uppercase active:scale-[0.98] transition-transform"
            >
              Review Mistakes ({sessionStats.again})
            </button>
          )}
          <button 
            onClick={() => navigate(mode === 'practice' ? '/flashcards/practice' : '/flashcards')}
            className="w-full border border-primary text-primary py-3 text-sm font-semibold tracking-wider uppercase active:scale-[0.98] transition-transform"
          >
            Back to {mode === 'practice' ? 'Practice' : 'Flashcard'}
          </button>
        </div>
      </div>
    );
  }

  const currentCard = deck[currentIndex];
  const nextCard = deck[currentIndex + 1];
  const progress = Math.min(100, ((currentIndex) / deck.length) * 100);

  // Dynamic Styles for Swipe
  const rotate = (dragX / 100) * 15;
  const opacityRight = Math.min(1, Math.max(0, dragX / 100));
  const opacityLeft = Math.min(1, Math.max(0, -dragX / 100));  // Content Logic based on Direction
  const FrontContent = () => {
    if (direction === 'reverse') {
      return (
        <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 text-center bg-surface">
          <h2 className="text-3xl font-serif text-text-primary mb-6 leading-snug">{currentCard.meaning}</h2>
          <span className="font-sans text-xs uppercase tracking-widest text-text-secondary mb-6 before:content-['—'] before:mr-2 after:content-['—'] after:ml-2">
            {currentCard.type}
          </span>
          <p className="absolute bottom-6 font-sans text-xs uppercase tracking-widest text-text-secondary opacity-60">tap to reveal</p>
        </div>
      );
    }
    return (
      <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 text-center bg-surface">
        <h2 className="text-4xl font-serif text-text-primary mb-8 tracking-tight">{currentCard.word}</h2>
        <button 
          onClick={(e) => { e.stopPropagation(); speakWord(currentCard.word); }}
          className="text-primary p-3 hover:bg-[#EBE7DF] transition-colors"
        >
          <Icon name="volume-2" size="md" strokeWidth={1.5} />
        </button>
        <p className="absolute bottom-6 font-sans text-xs uppercase tracking-widest text-text-secondary opacity-60">tap to flip</p>
      </div>
    );
  };

  const BackContent = () => {
    if (direction === 'reverse') {
      return (
        <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 text-center bg-surface">
          <h2 className="text-3xl font-serif text-primary mb-4">{currentCard.word}</h2>
          
          {currentCard.verbForms && (
             <p className="font-sans text-xs text-text-secondary mb-4 italic">{currentCard.verbForms.v1}, {currentCard.verbForms.v2}, {currentCard.verbForms.v3}</p>
          )}

          {currentCard.examples && currentCard.examples.length > 0 && (
             <p className="font-serif text-lg leading-relaxed text-text-primary mb-6 line-clamp-3">
              "{currentCard.examples[0].split('=')[1]?.trim() || currentCard.examples[0]}"
             </p>
          )}

          <button 
            onClick={(e) => { e.stopPropagation(); speakWord(currentCard.word); }}
            className="text-primary flex items-center gap-2 font-sans text-xs uppercase tracking-wider font-semibold hover:bg-[#EBE7DF] p-2 transition-colors"
          >
            <Icon name="volume-2" size="sm" strokeWidth={1.5} /> tap to hear
          </button>
        </div>
      );
    }
    return (
      <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 text-center bg-surface">
        <h2 className="text-2xl font-serif text-primary mb-4 leading-snug">{currentCard.word} <br/><span className="text-text-primary text-xl mt-2 block">{currentCard.meaning}</span></h2>
        
        <span className="font-sans text-xs uppercase tracking-widest text-text-secondary mb-6 before:content-['—'] before:mr-2 after:content-['—'] after:ml-2">
          {currentCard.type}
        </span>

        {currentCard.type === 'Verb' && currentCard.verbForms && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 border border-border p-4 mb-6 w-full font-serif text-sm text-text-secondary">
            <div>V1: {currentCard.verbForms.v1}</div>
            <div>V1s: {currentCard.verbForms.v1s}</div>
            <div>V2: {currentCard.verbForms.v2}</div>
            <div>V3: {currentCard.verbForms.v3}</div>
            <div className="col-span-2 mt-1 pt-1 border-t border-border/50">Ving: {currentCard.verbForms.vIng}</div>
          </div>
        )}

        {currentCard.examples && currentCard.examples.length > 0 && (
           <p className="font-serif text-lg leading-relaxed text-text-primary mb-8 line-clamp-3">
            "{currentCard.examples[0].split('=')[1]?.trim() || currentCard.examples[0]}"
           </p>
        )}

        <button 
          onClick={(e) => { e.stopPropagation(); speakWord(currentCard.word); }}
          className="text-primary flex items-center gap-2 font-sans text-xs uppercase tracking-wider font-semibold hover:bg-[#EBE7DF] p-2 transition-colors"
        >
          <Icon name="volume-2" size="sm" strokeWidth={1.5} /> tap to hear
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden font-serif">
      {/* Top Bar */}
      <div className="px-6 py-4 flex items-center justify-between relative z-20 border-b border-border/50">
        <button 
          onClick={() => {
             navigate(mode === 'practice' ? '/flashcards/practice' : '/flashcards');
          }}
          className="text-text-primary p-2 -ml-2"
        >
          <Icon name="arrow-left" size="sm" />
        </button>
        <span className="font-sans text-xs uppercase tracking-widest text-text-secondary font-semibold">
          {mode === 'practice' ? (direction === 'reverse' ? 'Reverse Card' : 'Shuffle Practice') : 'Session'}
        </span>
        <span className="font-sans text-xs font-semibold text-text-primary">{currentIndex + 1} / {deck.length}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-[1px] bg-border">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Card Area */}
      <div className="flex-1 relative flex items-center justify-center perspective-1000">
        
        {/* Next Card (Background) */}
        {nextCard && (
          <div className="absolute w-[85%] h-[60%] bg-surface border border-border transform scale-95 opacity-50 -z-10"></div>
        )}

        {/* Current Card */}
        <div 
          ref={cardRef}
          className="absolute w-[85%] h-[60%] bg-surface border border-border cursor-grab active:cursor-grabbing transform-style-3d transition-transform duration-0"
          style={{ 
            transform: `translateX(${dragX}px) rotate(${rotate}deg) rotateY(${isFlipped ? 180 : 0}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          onClick={handleFlip}
        >
          <FrontContent />
          
          {/* Swipe Overlays */}
          <div 
            className="absolute inset-0 bg-primary/10 flex items-center justify-center pointer-events-none transition-opacity backface-hidden border border-primary/20"
            style={{ opacity: opacityRight * 0.2, zIndex: 10 }}
          >
              <Icon name="check" size="xl" className="text-primary opacity-80" strokeWidth={1.5} />
          </div>
          <div 
            className="absolute inset-0 bg-text-secondary/10 flex items-center justify-center pointer-events-none transition-opacity backface-hidden border border-text-secondary/20"
            style={{ opacity: opacityLeft * 0.2, zIndex: 10 }}
          >
              <Icon name="x" size="xl" className="text-text-secondary opacity-80" strokeWidth={1.5} />
          </div>

          <BackContent />
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="p-8 flex justify-between items-center max-w-sm mx-auto w-full">
        <button 
          onClick={() => handleSwipe('left')}
          className="w-14 h-14 border border-border flex items-center justify-center bg-surface hover:bg-[#EBE7DF] active:scale-[0.98] transition-transform"
        >
          <Icon name="x" size="md" className="text-text-secondary" strokeWidth={1.5} />
        </button>

        <div className="text-center">
            <span className="font-sans text-xs uppercase tracking-widest text-text-secondary block mb-1 opacity-0 transition-opacity" style={{ opacity: opacityLeft }}>
              {direction === 'reverse' ? "Didn't know" : 'Again'}
            </span>
            <span className="font-sans text-xs uppercase tracking-widest text-primary block opacity-0 transition-opacity" style={{ opacity: opacityRight }}>
              {direction === 'reverse' ? "I knew it" : 'Got it'}
            </span>
        </div>

        <button 
          onClick={() => handleSwipe('right')}
          className="w-14 h-14 border border-border flex items-center justify-center bg-surface hover:bg-[#EBE7DF] active:scale-[0.98] transition-transform"
        >
          <Icon name="check" size="md" className="text-primary" strokeWidth={1.5} />
        </button>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default FlashcardSession;
