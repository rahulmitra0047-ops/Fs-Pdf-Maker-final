import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../shared/components/Icon';
import { flashcardService, practiceService, flashcardSettingsService } from '../../core/storage/services';
import { FlashcardWord, FlashcardSettings } from '../../types';
import { useToast } from '../../shared/context/ToastContext';

const QuizMCQPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pool = searchParams.get('pool') as 'all' | 'mastered' | 'learning' | 'favorites' || 'all';
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<{ word: FlashcardWord, options: string[] }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [settings, setSettings] = useState<FlashcardSettings | null>(null);

  useEffect(() => {
    loadQuiz();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await flashcardSettingsService.getSettings();
    setSettings(s);
  };

  const triggerHaptic = (type: 'success' | 'error') => {
    if (!settings?.hapticEnabled) return;
    if (navigator.vibrate) {
      if (type === 'success') navigator.vibrate(50);
      else navigator.vibrate([30, 50, 30]);
    }
  };

  const playSound = (type: 'correct' | 'wrong') => {
    if (!settings?.soundEnabled) return;
    // const audio = new Audio(`/sounds/${type}.mp3`);
    // audio.play().catch(() => {});
  };

  const loadQuiz = async () => {
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
        toast.error("Not enough words for a quiz (Min 4)");
        navigate('/flashcards/practice');
        return;
      }

      // Shuffle and pick 10
      const quizWords = poolWords.sort(() => Math.random() - 0.5).slice(0, 10);
      
      const generatedQuestions = quizWords.map(word => {
        // Generate distractors
        const distractors = allWords
          .filter(w => w.id !== word.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(w => w.meaning);
        
        const options = [...distractors, word.meaning].sort(() => Math.random() - 0.5);
        return { word, options };
      });

      setQuestions(generatedQuestions);
      setStartTime(Date.now());
    } catch (e) {
      console.error(e);
      toast.error("Failed to load quiz");
      navigate('/flashcards/practice');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (selectedOption) return; // Prevent multiple clicks

    setSelectedOption(option);
    const correct = option === questions[currentIndex].word.meaning;
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
      // Sound effect?
    } else {
      // Vibrate?
      if (navigator.vibrate) navigator.vibrate(200);
    }

    // Auto advance
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        finishQuiz();
      }
    }, 1000);
  };

  const finishQuiz = async () => {
    setQuizComplete(true);
    const duration = Math.round((Date.now() - startTime) / 1000);
    const accuracy = Math.round((score / questions.length) * 100);

    await practiceService.saveResult({
      id: crypto.randomUUID(),
      mode: 'quiz',
      date: new Date().toISOString().split('T')[0],
      totalQuestions: questions.length,
      correctCount: score,
      wrongCount: questions.length - score,
      accuracy,
      duration,
      wordPool: pool,
      createdAt: Date.now()
    });
  };

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6C63FF]"></div></div>;

  if (quizComplete) {
    const accuracy = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-5 flex flex-col items-center justify-center text-center">
        <div className="text-[48px] mb-4 animate-bounce">🏆</div>
        <h2 className="text-[22px] font-bold text-[#6C63FF] mb-2">Quiz Complete!</h2>
        
        <div className="bg-white rounded-[14px] p-6 w-full max-w-xs shadow-sm border border-gray-200 mb-6">
          <div className="text-[40px] font-bold text-gray-800 mb-2">{score}/{questions.length}</div>
          <div className="text-[14px] text-gray-500 mb-4">Correct Answers</div>
          
          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div className="bg-[#4CAF50] h-2 rounded-full transition-all duration-1000" style={{ width: `${accuracy}%` }}></div>
          </div>
          
          <div className="flex justify-between text-[12px] text-gray-400">
            <span>Accuracy: {accuracy}%</span>
            <span>Time: {Math.round((Date.now() - startTime) / 1000)}s</span>
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

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between bg-white shadow-sm">
        <button onClick={() => {
            if (window.confirm("Quit quiz?")) navigate('/flashcards/practice');
        }} className="text-gray-600">
          <Icon name="x" size="sm" />
        </button>
        <span className="text-[16px] font-bold text-gray-800">Quiz MCQ</span>
        <span className="text-[14px] font-bold text-[#6C63FF]">{score} pts</span>
      </div>

      {/* Progress */}
      <div className="w-full h-[3px] bg-gray-200">
        <div className="h-full bg-[#4CAF50] transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Question Area */}
      <div className="flex-1 p-5 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <div className="text-[14px] text-gray-500 mb-2">Question {currentIndex + 1} of {questions.length}</div>
        <h2 className="text-[32px] font-bold text-gray-800 mb-8 text-center">{currentQuestion.word.word}</h2>

        <div className="w-full space-y-3">
          {currentQuestion.options.map((option, idx) => {
            let stateClass = "bg-white border-gray-200 text-gray-700 hover:bg-gray-50";
            
            if (selectedOption) {
              if (option === currentQuestion.word.meaning) {
                stateClass = "bg-[#4CAF50] border-[#4CAF50] text-white"; // Correct answer always green
              } else if (option === selectedOption) {
                stateClass = "bg-[#E53935] border-[#E53935] text-white"; // Wrong selection red
              } else {
                stateClass = "bg-gray-50 border-gray-100 text-gray-400 opacity-50"; // Others fade
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(option)}
                disabled={!!selectedOption}
                className={`w-full p-4 rounded-[14px] border-2 text-left font-medium transition-all active:scale-95 ${stateClass}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizMCQPage;
