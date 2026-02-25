import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { flashcardService } from '../../core/storage/services';
import { FlashcardMasteredWord } from '../../types';
import toast from 'react-hot-toast';

type QuizStep = 'selection' | 'quiz' | 'result';

interface Question {
  word: FlashcardMasteredWord;
  type: 'en-to-bn' | 'bn-to-en';
  options: string[];
  correctOption: string;
}

const FlashcardQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<QuizStep>('selection');
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongWords, setWrongWords] = useState<FlashcardMasteredWord[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- 1. Selection Step ---
  const startQuiz = async (count: number) => {
    setLoading(true);
    try {
      const allMastered = await flashcardService.getMasteredWords();
      if (allMastered.length === 0) {
        toast.error('No mastered words available for quiz');
        setLoading(false);
        return;
      }

      // Generate Questions
      const shuffled = [...allMastered].sort(() => 0.5 - Math.random());
      const selectedWords = [];
      
      // Allow repeating if not enough words
      for (let i = 0; i < count; i++) {
        selectedWords.push(shuffled[i % shuffled.length]);
      }

      const newQuestions: Question[] = selectedWords.map(word => {
        const type = Math.random() > 0.5 ? 'en-to-bn' : 'bn-to-en';
        const correctOption = type === 'en-to-bn' ? word.meaning : word.word;
        
        // Generate Distractors
        const otherWords = allMastered.filter(w => w.id !== word.id);
        const distractors = [];
        for (let i = 0; i < 3; i++) {
            const randomDistractor = otherWords.length > 0 
                ? otherWords[Math.floor(Math.random() * otherWords.length)]
                : word; // Fallback if only 1 word exists
            
            distractors.push(type === 'en-to-bn' ? randomDistractor.meaning : randomDistractor.word);
        }

        const options = [...distractors, correctOption].sort(() => 0.5 - Math.random());

        return {
          word,
          type,
          options,
          correctOption
        };
      });

      setQuestions(newQuestions);
      setQuestionCount(count);
      setStep('quiz');
    } catch (error) {
      console.error(error);
      toast.error('Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Quiz Step ---
  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);

    const currentQuestion = questions[currentIndex];
    const isCorrect = option === currentQuestion.correctOption;

    if (isCorrect) {
      setScore(prev => prev + 1);
    } else {
      setWrongWords(prev => [...prev, currentQuestion.word]);
    }

    // Auto Next
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        setStep('result');
      }
    }, 1000);
  };

  // --- 3. Result Step ---
  useEffect(() => {
    if (step === 'result' && wrongWords.length > 0) {
      // Move wrong words to Daily
      const moveWords = async () => {
        // Use Set to avoid duplicates if same word appeared multiple times
        const uniqueWrongIds = Array.from(new Set(wrongWords.map(w => w.id)));
        
        for (const id of uniqueWrongIds) {
            try {
                await flashcardService.moveMasteredToDaily(id);
            } catch (e) {
                console.error('Failed to move word', id, e);
            }
        }
      };
      moveWords();
    }
  }, [step, wrongWords]);

  // --- Renders ---

  if (step === 'selection') {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
        <div className="px-4 py-3 flex items-center sticky top-0 z-10">
          <button onClick={() => navigate('/flashcards')} className="p-2 -ml-2 rounded-full hover:bg-gray-200/50">
            <ArrowLeft className="w-6 h-6 text-[#424242]" />
          </button>
          <h1 className="text-[18px] font-bold ml-2 text-[#1A1A1A]">Quiz Mode</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <h2 className="text-[24px] font-bold text-[#1A1A1A] mb-2">Select Questions</h2>
          <p className="text-[#757575] mb-8">Choose how many words to practice</p>

          <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
            {[5, 10, 15, 20].map(count => (
              <button
                key={count}
                onClick={() => startQuiz(count)}
                disabled={loading}
                className="py-6 bg-white rounded-[20px] shadow-sm border border-transparent hover:border-[#6C63FF] active:scale-95 transition-all flex flex-col items-center justify-center gap-2"
              >
                <span className="text-[24px] font-bold text-[#1A1A1A]">{count}</span>
                <span className="text-[12px] text-[#9E9E9E] uppercase tracking-wider">Questions</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'quiz') {
    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questionCount) * 100;

    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 w-full">
          <motion.div 
            className="h-full bg-[#6C63FF]" 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/flashcards')} className="p-2 -ml-2 rounded-full hover:bg-gray-200/50">
            <X className="w-6 h-6 text-[#424242]" />
          </button>
          <span className="text-[#9E9E9E] font-medium text-[14px]">
            {currentIndex + 1}/{questionCount}
          </span>
        </div>

        <div className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full">
          {/* Question Card */}
          <div className="bg-white rounded-[24px] p-8 shadow-[0px_10px_40px_rgba(0,0,0,0.05)] mb-8 flex items-center justify-center min-h-[180px]">
            <h2 className="text-[28px] font-bold text-[#1A1A1A] text-center">
              {currentQuestion.type === 'en-to-bn' ? currentQuestion.word.word : currentQuestion.word.meaning}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              let stateClass = "bg-white border-transparent text-[#424242]";
              
              if (isAnswered) {
                if (option === currentQuestion.correctOption) {
                  stateClass = "bg-[#E8F5E9] border-[#4CAF50] text-[#2E7D32]"; // Correct Green
                } else if (option === selectedOption) {
                  stateClass = "bg-[#FFEBEE] border-[#EF5350] text-[#C62828]"; // Wrong Red
                } else {
                  stateClass = "bg-white border-transparent opacity-50"; // Dim others
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(option)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-[16px] border-[1.5px] font-medium text-[16px] shadow-sm transition-all ${stateClass} ${!isAnswered && 'active:scale-[0.98] hover:shadow-md'}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'result') {
    const isPerfect = score === questionCount;
    
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${isPerfect ? 'bg-[#4CAF50]/10' : 'bg-[#6C63FF]/10'}`}
        >
          {isPerfect ? (
            <span className="text-4xl">🎉</span>
          ) : (
            <span className="text-[32px] font-bold text-[#6C63FF]">{score}</span>
          )}
        </motion.div>

        <h2 className="text-[24px] font-bold text-[#1A1A1A] mb-2">
          {isPerfect ? 'Perfect Score!' : 'Quiz Completed'}
        </h2>
        
        <p className="text-[#757575] text-[16px] mb-8">
          You got <span className="font-bold text-[#1A1A1A]">{score}/{questionCount}</span> correct
        </p>

        {wrongWords.length > 0 && (
          <div className="bg-[#FFF3E0] px-4 py-3 rounded-[12px] mb-8 max-w-xs w-full">
            <p className="text-[#E65100] text-[14px] font-medium">
              {wrongWords.length} wrong words moved to Daily Words for review.
            </p>
          </div>
        )}

        <button 
          onClick={() => navigate('/flashcards')}
          className="w-full max-w-xs py-3.5 bg-[#1A1A1A] text-white font-bold rounded-[16px] shadow-lg active:scale-95 transition-transform"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return null;
};

export default FlashcardQuizPage;
