import React, { useState, useEffect, useRef } from 'react';
import { quotes } from '../data/quotes';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../shared/components/Icon';

const MotivationalQuote: React.FC = () => {
  const [quote, setQuote] = useState<{ text: string; author: string; lang: string } | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  
  // Use refs for typing logic to avoid closure staleness and re-render loops
  const indexRef = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Random Selection Logic
    const selectRandomQuote = () => {
      const lastShownIndex = localStorage.getItem('lastShownQuoteIndex');
      let randomIndex;

      // Ensure we don't show the same quote twice in a row
      do {
        randomIndex = Math.floor(Math.random() * quotes.length);
      } while (quotes.length > 1 && randomIndex.toString() === lastShownIndex);

      localStorage.setItem('lastShownQuoteIndex', randomIndex.toString());
      return quotes[randomIndex];
    };

    const selectedQuote = selectRandomQuote();
    setQuote(selectedQuote);
    setDisplayedText('');
    setIsTyping(true);
    indexRef.current = 0;

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!quote) return;

    const typeCharacter = () => {
      const fullText = quote.text;
      
      if (indexRef.current < fullText.length) {
        // Increment first, then slice. This ensures we get the next character.
        // Using slice is safer than appending to previous state to avoid missing characters
        indexRef.current++;
        setDisplayedText(fullText.slice(0, indexRef.current));
        
        // Randomize typing speed slightly for a more natural feel (30ms - 70ms)
        const randomSpeed = Math.floor(Math.random() * 40) + 30;
        typingTimeoutRef.current = setTimeout(typeCharacter, randomSpeed);
      } else {
        setIsTyping(false);
      }
    };

    // Start typing
    typingTimeoutRef.current = setTimeout(typeCharacter, 500); // Initial delay

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [quote]);

  if (!quote) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full relative overflow-hidden bg-gradient-to-br from-white to-indigo-50/30 rounded-[24px] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 backdrop-blur-sm mb-6 group"
    >
      {/* Background Decorator - Large Quote Icon */}
      <div className="absolute top-4 right-6 opacity-[0.03] pointer-events-none select-none transform rotate-12 scale-150">
        <Icon name="quote" size="xl" className="w-32 h-32 text-indigo-900" />
      </div>

      <div className="relative z-10 flex flex-col gap-5">
        {/* Quote Content */}
        <div className="relative pl-3">
          {/* Decorative Side Line */}
          <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-gradient-to-b from-indigo-400 to-indigo-200 rounded-full opacity-60"></div>
          
          <div className="relative">
             <span className="absolute -top-3 -left-1 text-3xl text-indigo-200/60 font-serif leading-none select-none">“</span>
             
             <p className={`text-[16px] sm:text-[18px] leading-relaxed text-slate-700 font-medium tracking-wide relative z-10 px-3 py-1 ${quote.lang === 'bn' ? 'font-bengali' : 'font-serif italic'}`}>
              {displayedText}
              <motion.span 
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="inline-block w-[2px] h-[1em] bg-indigo-500 ml-1 align-middle rounded-full"
              />
            </p>
            
            {!isTyping && (
               <span className="absolute -bottom-4 right-0 text-3xl text-indigo-200/60 font-serif leading-none select-none rotate-180">“</span>
            )}
          </div>
        </div>
        
        {/* Author Section */}
        <AnimatePresence>
          {!isTyping && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex justify-end items-center mt-1"
            >
              <div className="flex items-center gap-3 group-hover:gap-4 transition-all duration-500">
                <div className="h-[1px] w-8 bg-indigo-300/50 group-hover:w-12 transition-all duration-500"></div>
                <span className={`text-[13px] font-bold text-indigo-900/80 uppercase tracking-widest ${quote.lang === 'bn' ? 'font-bengali' : ''}`}>
                  {quote.author}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default MotivationalQuote;
