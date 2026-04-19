import React, { useState, useEffect, useRef } from 'react';
import { quotes } from '../data/quotes';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../../shared/components/Icon';

const MotivationalQuote: React.FC = () => {
  const [quote, setQuote] = useState<{ text: string; author: string; lang: string } | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  
  const indexRef = useRef(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const selectRandomQuote = () => {
      const lastShownIndex = localStorage.getItem('lastShownQuoteIndex');
      let randomIndex;
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
        indexRef.current++;
        setDisplayedText(fullText.slice(0, indexRef.current));
        const randomSpeed = Math.floor(Math.random() * 40) + 30;
        typingTimeoutRef.current = setTimeout(typeCharacter, randomSpeed);
      } else {
        setIsTyping(false);
      }
    };

    typingTimeoutRef.current = setTimeout(typeCharacter, 500);

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
      className="w-full text-center px-4 py-2"
    >
      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        
        <p className={`font-serif italic text-[20px] leading-[1.4] text-text-primary tracking-[-0.02em] font-medium max-w-sm mx-auto ${quote.lang === 'bn' ? 'font-bengali' : ''}`}>
          "{displayedText}
          <motion.span 
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            className="inline-block w-[2px] h-[1em] bg-text-primary ml-1 align-middle rounded-full"
          />"
        </p>

        <AnimatePresence>
          {!isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-3 justify-center"
            >
              <div className="w-6 h-[1px] bg-text-secondary"></div>
              <span className={`font-sans text-[12px] uppercase tracking-[0.08em] font-semibold text-text-secondary ${quote.lang === 'bn' ? 'font-bengali' : ''}`}>
                {quote.author}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default MotivationalQuote;
