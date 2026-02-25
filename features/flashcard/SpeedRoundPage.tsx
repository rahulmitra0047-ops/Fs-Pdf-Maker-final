import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../shared/components/Icon';
import { flashcardService, practiceService } from '../../core/storage/services';
import { FlashcardWord } from '../../types';
import { useToast } from '../../shared/context/ToastContext';

const SpeedRoundPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pool = searchParams.get('pool') as 'all' | 'mastered' | 'learning' | 'favorites' || 'all';
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<FlashcardWord[]>([]);
  const [currentWord, setCurrentWord] = useState<FlashcardWord | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadGame = async () => {
    setLoading(true);
    try {
      const allWords = await flashcardService.getAll();
      let poolWords: FlashcardWord[] = [];

      if (pool === 'mastered') {
        poolWords = allWords.filter(w => w.confidenceLevel >= 4);
      } else if (pool === 'learning') {
        poolWords = allWords.filter(w => w.confidenceLevel > 0 && w.confidenceLevel < 4);
      } else if (pool === 'favorites') {
        poolWords = allWords.filter(w => w.isFavorite);
      } else {
        poolWords = allWords;
      }

      if (poolWords.length < 4) {
        toast.error("Not enough words for speed round (Min 4)");
        navigate('/flashcards/practice');
        return;
      }

      setWords(poolWords);
      const currentHighScore = await practiceService.getSpeedHighScore();
      setHighScore(currentHighScore);
      
      startGame(poolWords);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load game");
      navigate('/flashcards/practice');
    } finally {
      setLoading(false);
    }
  };

  const startGame = (gameWords: FlashcardWord[]) => {
    setGameActive(true);
    setScore(0);
    setTimeLeft(60);
    nextQuestion(gameWords);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const nextQuestion = (gameWords: FlashcardWord[]) => {
    const randomWord = gameWords[Math.floor(Math.random() * gameWords.length)];
    setCurrentWord(randomWord);

    // Generate options
    const distractors = gameWords
      .filter(w => w.id !== randomWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.meaning);
    
    setOptions([...distractors, randomWord.meaning].sort(() => Math.random() - 0.5));
  };

  const handleAnswer = (option: string) => {
    if (!gameActive || !currentWord) return;

    if (option === currentWord.meaning) {
      setScore(prev => prev + 1);
      // Sound effect?
    } else {
      // Penalty? Maybe -5s?
      // For now just no points
      if (navigator.vibrate) navigator.vibrate(200);
    }

    nextQuestion(words);
  };

  const endGame = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameActive(false);
    setGameOver(true);

    const isNew = await practiceService.updateSpeedHighScore(score);
    setIsNewHighScore(isNew);
    if (isNew) setHighScore(score);

    await practiceService.saveResult({
      id: crypto.randomUUID(),
      mode: 'speed',
      date: new Date().toISOString().split('T')[0],
      totalQuestions: score, // In speed round, total is just score for now or we track attempts?
      correctCount: score,
      wrongCount: 0, // We didn't track wrongs
      accuracy: 100, // Placeholder
      duration: 60,
      wordPool: pool,
      highScore: score,
      createdAt: Date.now()
    });
  };

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C63FF]"></div></div>;

  if (gameOver) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-5 flex flex-col items-center justify-center text-center">
        <div className="text-[48px] mb-4 animate-bounce">⏱️</div>
        <h2 className="text-[22px] font-bold text-[#6C63FF] mb-2">Time's Up!</h2>
        
        <div className="bg-white rounded-[14px] p-6 w-full max-w-xs shadow-sm border border-gray-200 mb-6 relative overflow-hidden">
          {isNewHighScore && (
            <div className="absolute top-0 right-0 bg-[#FFD700] text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">NEW RECORD!</div>
          )}
          <div className="text-[60px] font-bold text-gray-800 mb-2 leading-none">{score}</div>
          <div className="text-[14px] text-gray-500 mb-4">Final Score</div>
          
          <div className="flex justify-between text-[12px] text-gray-400 border-t pt-4">
            <span>High Score: {highScore}</span>
            <span>Pool: {pool}</span>
          </div>
        </div>

        <div className="space-y-3 w-full max-w-xs">
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-[#6C63FF] text-white py-3 rounded-[14px] font-bold shadow-md active:scale-95 transition-transform"
          >
            🔄 Play Again
          </button>
          <button 
            onClick={() => navigate('/flashcards/practice')}
            className="w-full border border-[#6C63FF] text-[#6C63FF] py-3 rounded-[14px] font-bold active:scale-95 transition-transform"
          >
            🏠 Back to Practice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between bg-white shadow-sm">
        <button onClick={() => {
            if (window.confirm("Quit game?")) navigate('/flashcards/practice');
        }} className="text-gray-600">
          <Icon name="x" size="sm" />
        </button>
        <div className={`text-[24px] font-bold ${timeLeft <= 10 ? 'text-[#E53935] animate-pulse' : 'text-gray-800'}`}>
          {timeLeft}s
        </div>
        <span className="text-[14px] font-bold text-[#6C63FF]">{score} pts</span>
      </div>

      {/* Game Area */}
      <div className="flex-1 p-5 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {currentWord && (
          <>
            <h2 className="text-[40px] font-bold text-gray-800 mb-8 text-center animate-in fade-in zoom-in duration-300 key={currentWord.id}">
              {currentWord.word}
            </h2>

            <div className="grid grid-cols-2 gap-3 w-full">
              {options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  className="p-6 rounded-[16px] bg-white border-2 border-gray-100 shadow-sm hover:border-[#6C63FF] hover:bg-indigo-50 text-[16px] font-medium text-gray-700 transition-all active:scale-95 flex items-center justify-center text-center h-32"
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SpeedRoundPage;
