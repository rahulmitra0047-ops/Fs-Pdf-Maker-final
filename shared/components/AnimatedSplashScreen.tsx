import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Sparkles, BookOpen } from 'lucide-react';

interface AnimatedSplashScreenProps {
  onComplete: () => void;
}

const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    // Hide splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-indigo-700 to-purple-800 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {/* Decorative Background Elements */}
      <motion.div 
        className="absolute w-96 h-96 bg-white/5 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.5, 1],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div 
        className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {/* Main Icon Container */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ y: 50, opacity: 0, rotateX: 45 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
          className="relative"
        >
          {/* Glowing effect behind icon */}
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-full blur-xl"
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          <div className="relative bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl">
            <GraduationCap size={80} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" strokeWidth={1.5} />
            <motion.div
              className="absolute -top-2 -right-2 text-yellow-300"
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles size={32} fill="currentColor" />
            </motion.div>
          </div>
        </motion.div>

        {/* App Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 text-center"
        >
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-purple-200 tracking-tight drop-shadow-lg">
            Mcq Guru
          </h1>
          
          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "100%" }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="overflow-hidden whitespace-nowrap mt-3"
          >
            <p className="text-indigo-200 font-medium tracking-[0.3em] text-sm uppercase">
              Master Your Knowledge
            </p>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Loading Indicator */}
      <motion.div 
        className="absolute bottom-12 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 bg-white/60 rounded-full"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default AnimatedSplashScreen;
