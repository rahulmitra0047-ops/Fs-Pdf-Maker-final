import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../shared/components/Icon';
import { flashcardService, practiceService } from '../../core/storage/services';
import { FlashcardWord } from '../../types';
import { useToast } from '../../shared/context/ToastContext';

const ContextMatchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pool = searchParams.get('pool') as 'all' | 'mastered' | 'learning' | 'favorites' || 'all';
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<{ word: FlashcardWord, sentence: string, options: string[] }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

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
        toast.error("Not enough words for context match (Min 4)");
        navigate('/flashcards/practice');
        return;
      }

      // Shuffle and pick 10
      const quizWords = poolWords.sort(() => Math.random() - 0.5).slice(0, 10);
      
      const generatedQuestions = quizWords.map(word => {
        let sentence = '';
        // Try to find an example
        if (word.examples && word.examples.length > 0) {
          // Example format: "Bangla = English" or just "English"
          const example = word.examples[0].split('=')[1]?.trim() || word.examples[0];
          // Replace word with blank (case insensitive)
          const regex = new RegExp(word.word, 'gi');
          if (regex.test(example)) {
            sentence = example.replace(regex, '_____');
          } else {
            // Fallback if word not found in example (rare but possible)
            sentence = `The word for "${word.meaning}" is _____`;
          }
        } else {
          // Fallback template
          sentence = `The word for "${word.meaning}" is _____`;
        }

        // Generate distractors
        const distractors = allWords
          .filter(w => w.id !== word.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(w => w.word);
        
        const options = [...distractors, word.word].sort(() => Math.random() - 0.5);
        return { word, sentence, options };
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
    if (selectedOption) return;

    setSelectedOption(option);
    const correct = option === questions[currentIndex].word.word;
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
    } else {
      if (navigator.vibrate) navigator.vibrate(200);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsCorrect(null);
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
      mode: 'context',
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
        <div className="text-[48px] mb-4 animate-bounce">🧠</div>
        <h2 className="text-[22px] font-bold text-[#6C63FF] mb-2">Context Match Complete!</h2>
        
        <div className="bg-white rounded-[14px] p-6 w-full max-w-xs shadow-sm border border-gray-200 mb-6">
          <div className="text-[40px] font-bold text-gray-800 mb-2">{score}/{questions.length}</div>
          <div className="text-[14px] text-gray-500 mb-4">Correct Matches</div>
          
          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div className="bg-[#00BCD4] h-2 rounded-full transition-all duration-1000" style={{ width: `${accuracy}%` }}></div>
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
        <span className="text-[16px] font-bold text-gray-800">Context Match</span>
        <span className="text-[14px] font-bold text-[#6C63FF]">{score} pts</span>
      </div>

      {/* Progress */}
      <div className="w-full h-[3px] bg-gray-200">
        <div className="h-full bg-[#00BCD4] transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>

      {/* Question Area */}
      <div className="flex-1 p-5 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <div className="text-[14px] text-gray-500 mb-2">Question {currentIndex + 1} of {questions.length}</div>
        
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 w-full mb-8 text-center min-h-[120px] flex items-center justify-center">
          <p className="text-[18px] text-gray-800 font-medium leading-relaxed">
            {currentQuestion.sentence.split('_____').map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className={`inline-block border-b-2 px-2 mx-1 font-bold ${
                    selectedOption 
                      ? (isCorrect ? 'text-[#4CAF50] border-[#4CAF50]' : 'text-[#E53935] border-[#E53935]') 
                      : 'text-[#6C63FF] border-[#6C63FF]'
                  }`}>
                    {selectedOption && i === 0 ? selectedOption : '_____'}
                  </span>
                )}
              </React.Fragment>
            ))}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          {currentQuestion.options.map((option, idx) => {
            let stateClass = "bg-white border-gray-200 text-gray-700 hover:bg-gray-50";
            
            if (selectedOption) {
              if (option === currentQuestion.word.word) {
                stateClass = "bg-[#4CAF50] border-[#4CAF50] text-white";
              } else if (option === selectedOption) {
                stateClass = "bg-[#E53935] border-[#E53935] text-white";
              } else {
                stateClass = "bg-gray-50 border-gray-100 text-gray-400 opacity-50";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(option)}
                disabled={!!selectedOption}
                className={`p-4 rounded-[14px] border-2 font-medium transition-all active:scale-95 ${stateClass}`}
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

export default ContextMatchPage;
