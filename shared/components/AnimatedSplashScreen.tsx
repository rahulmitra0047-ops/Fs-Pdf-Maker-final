import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Sparkles } from 'lucide-react';

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
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      {/* Subtle Background Elements */}
      <motion.div 
        className="absolute w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-[100px]"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute -top-20 -right-20 w-64 h-64 bg-purple-100/50 rounded-full blur-[80px]"
        animate={{ 
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Main Icon Container */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, type: "spring", bounce: 0.4 }}
          className="relative"
        >
          <div className="relative bg-white p-6 rounded-[28px] shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)] border border-slate-100">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl">
              <GraduationCap size={64} className="text-white" strokeWidth={1.5} />
            </div>
            <motion.div
              className="absolute -top-3 -right-3 text-amber-400 drop-shadow-md"
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <Sparkles size={28} fill="currentColor" />
            </motion.div>
          </div>
        </motion.div>

        {/* App Title */}
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Mcq Guru
          </h1>
          
          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-2"
          >
            <p className="text-indigo-600 font-bold tracking-[0.2em] text-xs uppercase">
              Master Your Knowledge
            </p>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Loading Indicator */}
      <motion.div 
        className="absolute bottom-16 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-indigo-300 rounded-full"
            animate={{ 
              y: [0, -8, 0],
              backgroundColor: ["#a5b4fc", "#6366f1", "#a5b4fc"]
            }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default AnimatedSplashScreen;
