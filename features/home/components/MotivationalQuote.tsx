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
      className="w-full bg-white rounded-[24px] p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] relative overflow-hidden mb-4"
    >
      {/* Quote Icons */}
      <div className="absolute top-4 left-4 text-emerald-100">
        <Icon name="quote" size="lg" className="w-8 h-8 transform -scale-x-100" />
      </div>
      <div className="absolute bottom-12 right-4 text-emerald-100">
        <Icon name="quote" size="lg" className="w-8 h-8 transform rotate-180" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center space-y-4 py-2">
        {/* Decorative Line */}
        <div className="w-1 h-12 bg-gradient-to-b from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 absolute left-0 top-1/2 -translate-y-1/2 rounded-full opacity-50 hidden sm:block"></div>
        
        <p className={`font-serif italic text-xl leading-relaxed text-slate-700 max-w-xs mx-auto ${quote.lang === 'bn' ? 'font-bengali' : ''}`}>
          {displayedText}
          <motion.span 
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            className="inline-block w-[2px] h-[1em] bg-emerald-500 ml-1 align-middle rounded-full"
          />
        </p>

        <AnimatePresence>
          {!isTyping && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-2 w-full justify-end pt-1"
            >
              <div className="h-[1px] w-8 bg-emerald-500/30"></div>
              <span className={`text-[10px] font-bold tracking-widest text-emerald-500 uppercase ${quote.lang === 'bn' ? 'font-bengali' : ''}`}>
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
