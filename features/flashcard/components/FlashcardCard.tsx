import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Image as ImageIcon, Video, Play, Trash2, Paperclip, X, Loader2, Camera, Sparkles, BookOpen, RefreshCw } from 'lucide-react';
import { FlashcardWord } from '../../../types';
import { useTheme } from '../context/ThemeContext';
import { doc, updateDoc } from 'firebase/firestore';
import { dbFirestore } from '../../../core/firebase';
import toast from 'react-hot-toast';

interface FlashcardCardProps {
  word: FlashcardWord;
  isFlipped: boolean;
  onFlip: () => void;
  onSpeak: (e: React.MouseEvent, text: string) => void;
}

const FlashcardCard: React.FC<FlashcardCardProps> = ({ word, isFlipped, onFlip, onSpeak }) => {
  const { currentTheme } = useTheme();
  const [showMediaSheet, setShowMediaSheet] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegeneratingMnemonic, setIsRegeneratingMnemonic] = useState(false);

  const handleRegenerateMnemonic = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isRegeneratingMnemonic) return;

      setIsRegeneratingMnemonic(true);
      try {
          const { aiManager } = await import('../../../core/ai/aiManager');
          const prompt = `You are a bilingual linguist and vocabulary expert. I need a NEW, entirely different mnemonic memory trick for the word: "${word.word}".
The previous mnemonic was: "${word.mnemonic || ''}" (Do NOT give anything similar to this).

IMPORTANT RULES:
- Provide a completely different approach or connection to easily remember the word.
- Write in a natural, conversational mix of Bengali and English.
- ALWAYS use proper Bengali script (বাংলা অক্ষর) for Bengali parts.
- NEVER write Bengali words using English letters (NO Banglish/Manglish!). English letters are ONLY for English words.
- FIRST, try to find a meaningful smaller word, root, or phonetics INSIDE the word itself to create a clever connection. If that's not possible, use another creative approach.
- Return ONLY a valid JSON object.

Structure:
{
  "mnemonic": "The new, completely different mnemonic."
}`;

          const aiResponse = await aiManager.generateContent('', prompt, {
              responseMimeType: "application/json"
          });

          if (aiResponse.error || !aiResponse.text) {
              throw new Error(aiResponse.error || "No response received");
          }

          let jsonStr = aiResponse.text;
          if (typeof jsonStr === 'string') {
              if (jsonStr.includes('```json')) {
                  jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
              } else if (jsonStr.includes('```')) {
                  jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
              }
          }

          const details = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;

          word.mnemonic = details.mnemonic;

          await updateFlashcardDetails(word.id, {
              mnemonic: details.mnemonic
          });
          
          toast.success("Mnemonic updated");
      } catch (error) {
          console.error("Failed to regenerate mnemonic", error);
          toast.error("Failed to regenerate mnemonic");
      } finally {
          setIsRegeneratingMnemonic(false);
      }
  };

  const handleBackSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Speak English word
    const englishUtterance = new SpeechSynthesisUtterance(word.word);
    englishUtterance.lang = 'en-US';
    englishUtterance.rate = 0.35; // Reduced speed for English
    
    englishUtterance.onend = () => {
      // Small pause (500ms)
      setTimeout(() => {
        if (!word.meaning) return;

        // Speak Bengali meaning
        const bengaliUtterance = new SpeechSynthesisUtterance(word.meaning);
        bengaliUtterance.rate = 0.4; // Reduced speed for Bengali
        
        // Try to find a Bengali voice
        const voices = window.speechSynthesis.getVoices();
        const bengaliVoice = voices.find(v => v.lang.includes('bn'));
        
        if (bengaliVoice) {
          bengaliUtterance.voice = bengaliVoice;
          bengaliUtterance.lang = bengaliVoice.lang;
        } else {
          // Fallback to generic bn-BD
          bengaliUtterance.lang = 'bn-BD';
        }
        
        window.speechSynthesis.speak(bengaliUtterance);
      }, 500);
    };

    window.speechSynthesis.speak(englishUtterance);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Verb': return { bg: '#E3F2FD', text: '#1565C0' }; // Soft Blue
      case 'Noun': return { bg: '#E8F5E9', text: '#2E7D32' }; // Soft Green
      case 'Adjective': return { bg: '#FFF3E0', text: '#EF6C00' }; // Soft Orange
      case 'Adverb': return { bg: '#F3E5F5', text: '#7B1FA2' }; // Soft Purple
      default: return { bg: '#F5F5F5', text: '#616161' }; // Soft Grey
    }
  };

  const typeColors = getTypeColor(word.type);

  const handleLongPress = () => {
    if (isFlipped) {
      handleGetDetails();
    }
  };

  // Long press logic
  const touchTimer = useRef<NodeJS.Timeout | null>(null);

  const onTouchStart = () => {
    touchTimer.current = setTimeout(handleLongPress, 800);
  };

  const onTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
    }
  };

  const handleGetDetails = async () => {
    setShowMediaSheet(true);
    
    // If we already have the details, do nothing
    if (word.englishMeaning && word.greContext && word.usageContext && word.mnemonic) {
        return;
    }

    if (isGenerating) return;

    setIsGenerating(true);
    try {
        const { aiManager } = await import('../../../core/ai/aiManager');
        const prompt = `You are a bilingual linguist and vocabulary expert. Provide analysis for the word: "${word.word}".
IMPORTANT RULES:
- Write in a natural, conversational mix of Bengali and English.
- ALWAYS use proper Bengali script (বাংলা অক্ষর) for Bengali parts.
- NEVER write Bengali words using English letters (NO Banglish/Manglish!). English letters are ONLY for English words.
- Mnemonic Creation Rule: FIRST, try to find a meaningful smaller word, root, or phonetics INSIDE the word itself to create a clever connection. If that's not possible, use another creative approach.
- Return ONLY a valid JSON object.

Structure:
{
  "englishMeaning": "A concise, one-line English explanation of the meaning.",
  "greContext": "GRE/advanced nuance or context.",
  "usageContext": "Real-world natural usage scenario.",
  "mnemonic": "An advanced, smart mnemonic memory trick (নেমোনিক). Remember the rule: break down the word and use its own parts to build the connection first."
}`;
        
        const aiResponse = await aiManager.generateContent('', prompt, {
            responseMimeType: "application/json"
        });

        if (aiResponse.error || !aiResponse.text) {
             throw new Error(aiResponse.error || "No response received");
        }

        // Extract JSON safely
        let jsonStr = aiResponse.text;
        if (typeof jsonStr === 'string') {
            if (jsonStr.includes('```json')) {
                jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
            } else if (jsonStr.includes('```')) {
                jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
            }
        }

        const details = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;

        // Update word optimism
        word.englishMeaning = details.englishMeaning;
        word.greContext = details.greContext;
        word.usageContext = details.usageContext;
        word.mnemonic = details.mnemonic;

        // Persist
        await updateFlashcardDetails(word.id, {
            englishMeaning: details.englishMeaning,
            greContext: details.greContext,
            usageContext: details.usageContext,
            mnemonic: details.mnemonic
        });

    } catch (error) {
        console.error('Failed to get details', error);
        toast.error('Failed to generate word details');
    } finally {
        setIsGenerating(false);
    }
  };

  const updateFlashcardDetails = async (id: string, details: Partial<FlashcardWord>) => {
    try {
        const collections = ['flashcard_daily_words', 'flashcard_mastered', 'flashcard_new_words'];
        for (const col of collections) {
            try {
                const docRef = doc(dbFirestore, col, id);
                await updateDoc(docRef, details);
            } catch (e) {}
        }
    } catch (error) {
        console.error("Error updating details:", error);
    }
  };

  return (
    <>
    <div 
      className="w-full h-full relative perspective-1000 cursor-pointer select-none"
      onClick={onFlip}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onTouchStart}
      onMouseUp={onTouchEnd}
      onMouseLeave={onTouchEnd}
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
          className="absolute inset-0 w-full h-full rounded-[24px] flex flex-col items-center justify-center p-8"
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            backgroundColor: currentTheme.cardBg,
            boxShadow: currentTheme.shadow,
            border: `1px solid ${currentTheme.borderColor}`
          }}
        >
          <div className="flex-1 flex flex-col items-center justify-center w-full">
              <h2 
                className="text-[42px] font-bold tracking-[1px] text-center leading-tight"
                style={{ color: currentTheme.textColor }}
              >
                {word.word}
              </h2>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSpeak(e, word.word);
                }}
                className="mt-8 p-3.5 rounded-full transition-colors active:scale-95"
                style={{ 
                  color: currentTheme.accentColor,
                  backgroundColor: `${currentTheme.accentColor}10`
                }}
              >
                <Volume2 size={32} />
              </button>
          </div>
          
          <div 
            className="text-[12px] font-medium tracking-widest uppercase pb-2"
            style={{ color: currentTheme.subTextColor }}
          >
            Tap to flip
          </div>
        </div>

        {/* Back Side */}
        <div 
          className="absolute inset-0 w-full h-full rounded-[24px] flex flex-col items-center justify-between p-6"
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            backgroundColor: currentTheme.cardBg,
            boxShadow: currentTheme.shadow,
            border: `1px solid ${currentTheme.borderColor}`
          }}
        >
          {/* Content Container */}
          <div className="flex flex-col items-center w-full flex-grow overflow-y-auto no-scrollbar">
            
            {word.clusterData ? (
              <div className="w-full flex flex-col items-center justify-center h-full">
                <div className="relative w-full h-[200px] flex items-center justify-center mb-4">
                  <div className="absolute z-10 w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <span className="text-white font-bold text-sm">{word.clusterData.basicWord}</span>
                  </div>
                  {[...word.clusterData.advancedWords, ...word.clusterData.greWords, ...word.clusterData.idioms].map((node, index, arr) => {
                    const angle = (index / arr.length) * 2 * Math.PI - Math.PI / 2;
                    const radius = 75;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    let typeColor = 'bg-blue-100 text-blue-700 border-blue-200';
                    if (index >= 2 && index < 5) typeColor = 'bg-orange-100 text-orange-700 border-orange-200';
                    if (index >= 5) typeColor = 'bg-green-100 text-green-700 border-green-200';

                    return (
                      <div 
                        key={index}
                        className={`absolute flex flex-col items-center justify-center w-14 h-14 rounded-full border shadow-sm ${typeColor}`}
                        style={{ transform: `translate(${x}px, ${y}px)` }}
                      >
                        <span className="text-[8px] font-bold text-center leading-tight px-1">{node.word}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center px-2">
                  <p className="text-[12px] italic leading-relaxed" style={{ color: currentTheme.textColor }}>
                    "{word.clusterData.contextualExamples.sentence}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col w-full">
                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto no-scrollbar w-full flex flex-col items-center justify-center p-2 mb-2">
                    
                    {/* Header: Word & Audio */}
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-[32px] font-bold tracking-wide" style={{ color: currentTheme.textColor }}>{word.word}</span>
                        <button 
                          onClick={handleBackSpeak}
                          className="p-2 rounded-full transition-colors hover:bg-black/5 active:scale-95"
                          style={{ color: currentTheme.accentColor, backgroundColor: `${currentTheme.accentColor}10` }}
                        >
                          <Volume2 size={20} />
                        </button>
                    </div>

                    {/* Meaning */}
                    <div className="text-[24px] font-bold text-center leading-tight mb-3" style={{ color: currentTheme.accentColor }}>
                        {word.meaning}
                    </div>

                    {/* Type Badge */}
                    <div 
                        className="px-3 py-1 rounded-md text-[11px] font-semibold tracking-widest uppercase mb-5"
                        style={{ backgroundColor: typeColors.bg, color: typeColors.text }}
                    >
                        {word.type}
                    </div>

                    {/* Details Divider */}
                    {(word.examples?.length > 0 || word.synonyms?.length > 0 || word.verbForms) && (
                        <div className="w-16 h-[1px] mb-5 opacity-50" style={{ backgroundColor: currentTheme.borderColor }}></div>
                    )}

                    {/* Verb Forms */}
                    {word.type === 'Verb' && word.verbForms && (
                        <div className="text-[13px] mb-4 opacity-80 font-medium tracking-wide flex gap-4" style={{ color: currentTheme.subTextColor }}>
                            <span>V2: <strong style={{ color: currentTheme.textColor }}>{word.verbForms.v2}</strong></span>
                            <span>V3: <strong style={{ color: currentTheme.textColor }}>{word.verbForms.v3}</strong></span>
                        </div>
                    )}

                    {/* Example */}
                    {word.examples && word.examples.length > 0 && (
                      <div className="w-full text-center mb-4 px-2">
                        <p className="text-[14px] italic leading-relaxed" style={{ color: currentTheme.textColor }}>
                          "{word.examples[0]}"
                        </p>
                      </div>
                    )}
                    
                    {/* Synonyms */}
                    {word.synonyms && word.synonyms.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-2 mt-1 px-2">
                        {word.synonyms.slice(0, 3).map((syn, idx) => (
                          <span 
                            key={idx} 
                            className="text-[12px] px-2.5 py-1 rounded-full border border-black/5"
                            style={{ 
                                color: currentTheme.subTextColor,
                                backgroundColor: `${currentTheme.borderColor}40`
                            }}
                          >
                            {syn}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>

          <div className="w-full mt-2 flex justify-center pb-1">
              <button
                  onClick={(e) => {
                      e.stopPropagation();
                      handleGetDetails();
                  }}
                  className="px-4 py-1.5 rounded-full text-[12px] font-bold tracking-wide flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  style={{ 
                      backgroundColor: '#F5EBE9', // Light pastel chocolate/maroon
                      color: '#795548', // Brown/Maroon text
                      border: '1px solid #EBDCD7'
                  }}
              >
                  <Sparkles size={12} color="#795548" />
                  Explanation
              </button>
          </div>
        </div>
      </motion.div>
    </div>

    {/* Details Bottom Sheet (reused state) */}
    <AnimatePresence>
        {showMediaSheet && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                    onClick={() => setShowMediaSheet(false)}
                />
                <motion.div 
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 rounded-t-[24px] z-50 p-6 pb-10"
                    style={{ backgroundColor: currentTheme.cardBg }}
                >
                    <div className="w-12 h-1.5 rounded-full mx-auto mb-6 opacity-30" style={{ backgroundColor: currentTheme.subTextColor }} />
                    
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: currentTheme.textColor }}>
                        <BookOpen size={20} style={{ color: currentTheme.accentColor }} />
                        Word Details
                    </h3>

                    <div className="space-y-4 max-h-[50vh] overflow-y-auto no-scrollbar pb-4 text-[14px]">
                       {isGenerating ? (
                           <div className="flex flex-col items-center justify-center py-8">
                               <Loader2 className="animate-spin mb-4" size={32} style={{ color: currentTheme.accentColor }} />
                               <p style={{ color: currentTheme.subTextColor }}>Generating linguistic analysis...</p>
                           </div>
                       ) : (
                           <>
                               <div>
                                   <h4 className="font-semibold mb-1" style={{ color: currentTheme.textColor }}>English Meaning:</h4>
                                   <p style={{ color: currentTheme.subTextColor }} className="leading-relaxed">
                                       {word.englishMeaning || 'Detailed meaning unavailable.'}
                                   </p>
                               </div>
                               
                               {word.greContext && (
                                   <div>
                                       <h4 className="font-semibold mb-1" style={{ color: currentTheme.textColor }}>GRE Context / Nuance:</h4>
                                       <p style={{ color: currentTheme.subTextColor }} className="leading-relaxed">
                                           {word.greContext}
                                       </p>
                                   </div>
                               )}

                               {word.mnemonic && (
                                   <div className="bg-[#FFF8E7] border border-[#FFE0A3] p-3 rounded-lg shadow-sm">
                                       <div className="flex justify-between items-center mb-1.5">
                                           <h4 className="font-bold flex items-center gap-1.5 text-[#B87C00]">
                                               <Sparkles size={14} className="text-[#B87C00]" /> 
                                               Smart Mnemonic
                                           </h4>
                                           <button 
                                               onClick={handleRegenerateMnemonic}
                                               disabled={isRegeneratingMnemonic}
                                               className="p-1 rounded-full text-[#B87C00] hover:bg-[#FFE0A3] transition-colors disabled:opacity-50"
                                               title="Regenerate Mnemonic"
                                           >
                                               <RefreshCw size={14} className={isRegeneratingMnemonic ? "animate-spin" : ""} />
                                           </button>
                                       </div>
                                       <p className="text-[#8C5D00] leading-relaxed font-medium">
                                           {word.mnemonic}
                                       </p>
                                   </div>
                               )}

                               <div>
                                   <h4 className="font-semibold mb-1" style={{ color: currentTheme.textColor }}>Common Usage:</h4>
                                   <p style={{ color: currentTheme.subTextColor }} className="leading-relaxed">
                                       {word.usageContext || 'Example usage unavailable.'}
                                   </p>
                               </div>
                           </>
                       )}
                    </div>

                    <div className="mt-4">
                        <button 
                            onClick={() => setShowMediaSheet(false)}
                            className="w-full py-3.5 px-4 rounded-xl font-medium active:scale-98 transition-transform"
                            style={{ 
                                backgroundColor: currentTheme.buttonBg,
                                color: currentTheme.buttonText
                            }}
                        >
                            Got it
                        </button>
                    </div>
                </motion.div>
            </>
        )}
    </AnimatePresence>
    </>
  );
};

export default FlashcardCard;
