import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../shared/components/Icon';
import { flashcardService } from '../../core/storage/services';
import { FlashcardWord } from '../../types';
import { useToast } from '../../shared/context/ToastContext';

const PracticeModeSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<FlashcardWord[]>([]);
  const [selectedPool, setSelectedPool] = useState<'all' | 'mastered' | 'learning' | 'favorites'>('all');

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    setLoading(true);
    try {
      const allWords = await flashcardService.getAll();
      setWords(allWords);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load words");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCount = (pool: string) => {
    switch (pool) {
      case 'mastered': return words.filter(w => w.confidenceLevel >= 4).length;
      case 'learning': return words.filter(w => w.confidenceLevel > 0 && w.confidenceLevel < 4).length;
      case 'favorites': return words.filter(w => w.isFavorite).length;
      default: return words.length;
    }
  };

  const handleModeSelect = (mode: string, path: string) => {
    const count = getFilteredCount(selectedPool);
    if (count < 4) {
      toast.error(`Not enough words in "${selectedPool}" pool (Min 4 required)`);
      return;
    }
    navigate(`${path}?pool=${selectedPool}&mode=practice`);
  };

  const modes = [
    {
      id: 'shuffle',
      title: 'Shuffle Flashcard',
      icon: 'layers',
      color: '#6C63FF',
      path: '/flashcards/session',
      desc: 'Randomized review without SRS'
    },
    {
      id: 'quiz',
      title: 'Quiz MCQ',
      icon: 'help-circle',
      color: '#4CAF50',
      path: '/flashcards/practice/quiz',
      desc: 'Multiple choice questions'
    },
    {
      id: 'spelling',
      title: 'Spelling Test',
      icon: 'edit-3',
      color: '#FF9800',
      path: '/flashcards/practice/spelling',
      desc: 'Type the correct spelling'
    },
    {
      id: 'reverse',
      title: 'Reverse Card',
      icon: 'refresh-cw',
      color: '#E91E63',
      path: '/flashcards/session', // Reuses session with param
      params: '&direction=reverse',
      desc: 'Guess English from Bangla'
    },
    {
      id: 'speed',
      title: 'Speed Round',
      icon: 'zap',
      color: '#F44336',
      path: '/flashcards/practice/speed',
      desc: 'Race against time'
    },
    {
      id: 'context',
      title: 'Context Match',
      icon: 'maximize',
      color: '#00BCD4',
      path: '/flashcards/practice/context',
      desc: 'Fill in the blanks'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <div className="bg-white px-5 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/flashcards')} className="text-gray-600">
          <Icon name="arrow-left" size="sm" />
        </button>
        <h1 className="text-[20px] font-bold text-gray-800">Practice Modes</h1>
      </div>

      <div className="p-5">
        {/* Word Pool Selection */}
        <div className="mb-6">
          <h2 className="text-[14px] font-bold text-gray-700 mb-3 uppercase tracking-wider">Select Word Pool</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Words' },
              { id: 'mastered', label: 'Mastered' },
              { id: 'learning', label: 'Learning' },
              { id: 'favorites', label: 'Favorites' }
            ].map((pool) => {
              const count = getFilteredCount(pool.id);
              const isSelected = selectedPool === pool.id;
              return (
                <button
                  key={pool.id}
                  onClick={() => setSelectedPool(pool.id as any)}
                  className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-all ${
                    isSelected 
                      ? 'bg-[#6C63FF] text-white border-[#6C63FF] shadow-md' 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {pool.label} <span className={`ml-1 text-[11px] ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modes Grid */}
        <div className="grid grid-cols-2 gap-4">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeSelect(mode.id, mode.path + (mode.params || ''))}
              className="bg-white p-4 rounded-[16px] border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-95 text-left flex flex-col h-full"
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: `${mode.color}15` }}
              >
                <Icon name={mode.icon as any} size="md" className="" style={{ color: mode.color }} />
              </div>
              <h3 className="text-[15px] font-bold text-gray-800 mb-1 leading-tight">{mode.title}</h3>
              <p className="text-[11px] text-gray-500 leading-snug">{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PracticeModeSelectionPage;
