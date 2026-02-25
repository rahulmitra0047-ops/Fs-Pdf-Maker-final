import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../shared/components/Icon';
import { flashcardService, practiceService } from '../../core/storage/services';
import { FlashcardWord } from '../../types';
import { useToast } from '../../shared/context/ToastContext';

const SpellingTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pool = searchParams.get('pool') as 'all' | 'mastered' | 'learning' | 'favorites' || 'all';
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<FlashcardWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadQuiz();
  }, []);

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
        toast.error("Not enough words for spelling test (Min 4)");
        navigate('/flashcards/practice');
        return;
      }

      // Shuffle and pick 10
      const quizWords = poolWords.sort(() => Math.random() - 0.5).slice(0, 10);
      setQuestions(quizWords);
      setStartTime(Date.now());
      
      // Auto-focus input
      setTimeout(() => inputRef.current?.focus(), 500);
      
      // Speak first word
      speakWord(quizWords[0].word);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load quiz");
      navigate('/flashcards/practice');
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

  const handleCheck = () => {
    if (feedback) return; // Already checked

    const currentWord = questions[currentIndex];
    const isCorrect = input.trim().toLowerCase() === currentWord.word.toLowerCase();

    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setScore(prev => prev + 1);

    // Auto advance
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setInput('');
        setFeedback(null);
        inputRef.current?.focus();
        speakWord(questions[currentIndex + 1].word);
      } else {
        finishQuiz();
      }
    }, 1500);
  };

  const finishQuiz = async () => {
    setQuizComplete(true);
    const duration = Math.round((Date.now() - startTime) / 1000);
    const accuracy = Math.round((score / questions.length) * 100);

    await practiceService.saveResult({
      id: crypto.randomUUID(),
      mode: 'spelling',
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
        <div className="text-[48px] mb-4 animate-bounce">✍️</div>
        <h2 className="text-[22px] font-bold text-[#6C63FF] mb-2">Spelling Test Complete!</h2>
        
        <div className="bg-white rounded-[14px] p-6 w-full max-w-xs shadow-sm border border-gray-200 mb-6">
          <div className="text-[40px] font-bold text-gray-800 mb-2">{score}/{questions.length}</div>
          <div className="text-[14px] text-gray-500 mb-4">Correct Spellings</div>
          
          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div className="bg-[#FF9800] h-2 rounded-full transition-all duration-1000" style={{ width: `${accuracy}%` }}></div>
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

  const currentWord = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between bg-white shadow-sm">
        <button onClick={() => {
            if (window.confirm("Quit test?")) navigate('/flashcards/practice');
        }} className="text-gray-600">
          <Icon name="x" size="sm" />
        </button>
        <span className="text-[16px] font-bold text-gray-800">Spelling Test</span>
        <span className="text-[14px] font-bold text-[#6C63FF]">{score} pts</span>
      </div>

      {/* Progress */}
      <div className="w-full h-[3px] bg-gray-200">
        <div className="h-full bg-[#FF9800] transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Question Area */}
      <div className="flex-1 p-5 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <div className="text-[14px] text-gray-500 mb-2">Word {currentIndex + 1} of {questions.length}</div>
        
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 w-full mb-8 text-center">
          <button 
            onClick={() => speakWord(currentWord.word)}
            className="w-16 h-16 bg-[#6C63FF]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#6C63FF] hover:bg-[#6C63FF]/20 transition-colors"
          >
            <Icon name="volume-2" size="lg" />
          </button>
          <p className="text-[18px] text-gray-600 font-medium">{currentWord.meaning}</p>
          <p className="text-[12px] text-gray-400 mt-2 italic">Type the English word</p>
        </div>

        <div className="w-full relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            disabled={!!feedback}
            placeholder="Type here..."
            className={`w-full p-4 text-center text-[24px] font-bold rounded-[14px] border-2 outline-none transition-all ${
              feedback === 'correct' ? 'border-[#4CAF50] bg-green-50 text-[#4CAF50]' :
              feedback === 'wrong' ? 'border-[#E53935] bg-red-50 text-[#E53935]' :
              'border-gray-200 focus:border-[#6C63FF] text-gray-800'
            }`}
          />
          
          {feedback === 'wrong' && (
            <div className="absolute top-full left-0 w-full text-center mt-2 text-[#E53935] font-bold animate-shake">
              Correct: {currentWord.word}
            </div>
          )}
        </div>

        <button
          onClick={handleCheck}
          disabled={!input || !!feedback}
          className={`mt-8 w-full py-4 rounded-[14px] font-bold text-white shadow-md transition-all active:scale-95 ${
            !input || !!feedback ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#6C63FF] hover:bg-[#5a52d5]'
          }`}
        >
          {feedback ? (feedback === 'correct' ? 'Correct!' : 'Wrong!') : 'Check Answer'}
        </button>
      </div>
    </div>
  );
};

export default SpellingTestPage;
