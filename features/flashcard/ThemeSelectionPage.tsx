import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { THEMES, useTheme } from './context/ThemeContext';
import { motion } from 'framer-motion';

const ThemeSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme, setTheme } = useTheme();

  return (
    <div 
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ backgroundColor: currentTheme.background }}
    >
      {/* Top Bar */}
      <div 
        className="px-4 py-3 flex items-center sticky top-0 z-10 backdrop-blur-md bg-opacity-80"
        style={{ 
          backgroundColor: currentTheme.cardBg,
          borderBottom: `1px solid ${currentTheme.borderColor}`
        }}
      >
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
          style={{ color: currentTheme.textColor }}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 
          className="text-[18px] font-bold ml-2"
          style={{ color: currentTheme.textColor }}
        >
          Select Theme
        </h1>
      </div>

      {/* Theme Grid */}
      <div className="flex-1 p-4 grid grid-cols-2 gap-4 pb-20">
        {THEMES.map((theme) => {
          const isSelected = currentTheme.id === theme.id;

          return (
            <motion.button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              whileTap={{ scale: 0.95 }}
              className="relative rounded-[20px] overflow-hidden aspect-[4/5] flex flex-col shadow-sm border transition-all"
              style={{
                backgroundColor: theme.background,
                borderColor: isSelected ? theme.accentColor : 'transparent',
                borderWidth: isSelected ? '2px' : '1px',
                boxShadow: isSelected ? `0 4px 20px ${theme.accentColor}40` : 'none'
              }}
            >
              {/* Preview Card */}
              <div className="flex-1 w-full p-3 flex items-center justify-center">
                <div 
                  className="w-full h-24 rounded-[12px] shadow-sm flex flex-col items-center justify-center gap-1"
                  style={{ backgroundColor: theme.cardBg }}
                >
                  <div className="w-8 h-1 rounded-full opacity-20" style={{ backgroundColor: theme.textColor }} />
                  <div className="w-12 h-1 rounded-full opacity-10" style={{ backgroundColor: theme.textColor }} />
                </div>
              </div>

              {/* Theme Name */}
              <div 
                className="w-full py-3 px-2 text-center text-[13px] font-medium backdrop-blur-sm bg-white/10"
                style={{ 
                  color: theme.id === 'dark-mode' || theme.id === 'cyberpunk-neon' ? '#FFF' : '#1A1A1A',
                  backgroundColor: theme.id === 'dark-mode' || theme.id === 'cyberpunk-neon' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'
                }}
              >
                {theme.name}
              </div>

              {/* Selection Check */}
              {isSelected && (
                <div 
                  className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: theme.accentColor }}
                >
                  <Check size={14} color="#FFF" strokeWidth={3} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeSelectionPage;
