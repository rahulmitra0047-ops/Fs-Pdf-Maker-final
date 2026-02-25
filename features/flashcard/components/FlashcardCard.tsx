import React from 'react';
import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { FlashcardDailyWord, FlashcardMasteredWord } from '../../types';

interface FlashcardCardProps {
  word: FlashcardDailyWord | FlashcardMasteredWord;
  isFlipped: boolean;
  onFlip: () => void;
  onSpeak: (e: React.MouseEvent, text: string) => void;
}

const FlashcardCard: React.FC<FlashcardCardProps> = ({ word, isFlipped, onFlip, onSpeak }) => {
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
          className="absolute inset-0 w-full h-full bg-white rounded-[24px] shadow-[0px_10px_40px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center p-8 backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <h2 className="text-[32px] font-bold text-[#1A1A1A] tracking-[1px] text-center leading-tight">
            {word.word}
          </h2>
          
          <button 
            onClick={(e) => onSpeak(e, word.word)}
            className="mt-6 p-3 text-[#6C63FF] bg-[#6C63FF]/5 hover:bg-[#6C63FF]/10 rounded-full transition-colors"
          >
            <Volume2 size={28} />
          </button>
          
          <div className="absolute bottom-8 text-[12px] font-medium text-[#BDBDBD] tracking-wide uppercase">
            Tap to flip
          </div>
        </div>

        {/* Back Side */}
        <div 
          className="absolute inset-0 w-full h-full bg-white rounded-[24px] shadow-[0px_10px_40px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center p-8 backface-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="flex flex-col items-center text-center w-full max-w-xs">
            <div className="flex items-center justify-center flex-wrap gap-2 mb-6">
              <span className="text-[24px] font-bold text-[#1A1A1A]">{word.word}</span>
              <span className="text-[#BDBDBD] text-xl">→</span>
              <span className="text-[24px] font-bold text-[#6C63FF]">{word.meaning}</span>
            </div>
            
            {word.examples && word.examples.length > 0 && (
              <div className="relative mt-2 px-4 py-3 bg-gray-50 rounded-xl w-full">
                <p className="text-[15px] text-[#424242] italic leading-relaxed">
                  "{word.examples[0]}"
                </p>
              </div>
            )}
            
            {word.synonyms && word.synonyms.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {word.synonyms.slice(0, 3).map((syn, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-100 text-[#757575] text-[12px] rounded-full font-medium">
                    {syn}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="absolute bottom-8 text-[12px] font-medium text-[#BDBDBD] tracking-wide uppercase">
            Tap to flip
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FlashcardCard;
