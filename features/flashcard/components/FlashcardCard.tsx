import React from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { FlashcardDailyWord, FlashcardMasteredWord } from '../../../types';
import { useTheme } from '../context/ThemeContext';

interface FlashcardCardProps {
  word: FlashcardDailyWord | FlashcardMasteredWord;
  isFlipped: boolean;
  onFlip: () => void;
  onSpeak: (e: React.MouseEvent, text: string) => void;
}

const FlashcardCard: React.FC<FlashcardCardProps> = ({ word, isFlipped, onFlip, onSpeak }) => {
  const { currentTheme } = useTheme();

  return (
    <div 
      className="w-full h-full relative perspective-1000 cursor-pointer"
      onClick={onFlip}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Side */}
        <div 
          className="absolute inset-0 w-full h-full rounded-[24px] flex flex-col items-center justify-center p-8 backface-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            backgroundColor: currentTheme.cardBg,
            boxShadow: currentTheme.shadow,
            border: `1px solid ${currentTheme.borderColor}`
          }}
        >
          <h2 
            className="text-[32px] font-bold tracking-[1px] text-center leading-tight"
            style={{ color: currentTheme.textColor }}
          >
            {word.word}
          </h2>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onSpeak(e, word.word);
            }}
            className="mt-6 p-3 rounded-full transition-colors"
            style={{ 
              color: currentTheme.accentColor,
              backgroundColor: `${currentTheme.accentColor}10` // 10% opacity
            }}
          >
            <Volume2 size={28} />
          </button>
          
          <div 
            className="absolute bottom-8 text-[12px] font-medium tracking-wide uppercase"
            style={{ color: currentTheme.subTextColor }}
          >
            Tap to flip
          </div>
        </div>

        {/* Back Side */}
        <div 
          className="absolute inset-0 w-full h-full rounded-[24px] flex flex-col items-center justify-center p-8 backface-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            backgroundColor: currentTheme.cardBg,
            boxShadow: currentTheme.shadow,
            border: `1px solid ${currentTheme.borderColor}`
          }}
        >
          <div className="flex flex-col items-center text-center w-full max-w-xs">
            <div className="flex items-center justify-center flex-wrap gap-2 mb-6">
              <span className="text-[24px] font-bold" style={{ color: currentTheme.textColor }}>{word.word}</span>
              <span className="text-xl" style={{ color: currentTheme.subTextColor }}>→</span>
              <span className="text-[24px] font-bold" style={{ color: currentTheme.accentColor }}>{word.meaning}</span>
            </div>
            
            {word.examples && word.examples.length > 0 && (
              <div 
                className="relative mt-2 px-4 py-3 rounded-xl w-full"
                style={{ backgroundColor: `${currentTheme.accentColor}08` }}
              >
                <p className="text-[15px] italic leading-relaxed" style={{ color: currentTheme.subTextColor }}>
                  "{word.examples[0]}"
                </p>
              </div>
            )}
            
            {word.synonyms && word.synonyms.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {word.synonyms.slice(0, 3).map((syn, idx) => (
                  <span 
                    key={idx} 
                    className="px-3 py-1 text-[12px] rounded-full font-medium"
                    style={{ 
                      backgroundColor: `${currentTheme.accentColor}15`,
                      color: currentTheme.subTextColor
                    }}
                  >
                    {syn}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div 
            className="absolute bottom-8 text-[12px] font-medium tracking-wide uppercase"
            style={{ color: currentTheme.subTextColor }}
          >
            Tap to flip
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FlashcardCard;
