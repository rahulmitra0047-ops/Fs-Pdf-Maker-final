import React, { createContext, useContext, useState, useEffect } from 'react';

export type FlashcardTheme = {
  id: string;
  name: string;
  background: string;
  cardBg: string;
  textColor: string;
  subTextColor: string;
  accentColor: string;
  borderColor: string;
  buttonBg: string;
  buttonText: string;
  shadow: string;
};

export const THEMES: FlashcardTheme[] = [
  {
    id: 'premium-slate-emerald',
    name: 'Premium Slate',
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    textColor: '#334155',
    subTextColor: '#94A3B8',
    accentColor: '#10B981',
    borderColor: '#F1F5F9',
    buttonBg: '#334155',
    buttonText: '#FFFFFF',
    shadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
  },
  {
    id: 'minimal-white',
    name: 'Minimal White',
    background: '#F5F5F5',
    cardBg: '#FFFFFF',
    textColor: '#1A1A1A',
    subTextColor: '#757575',
    accentColor: '#6C63FF',
    borderColor: 'transparent',
    buttonBg: '#1A1A1A',
    buttonText: '#FFFFFF',
    shadow: '0px 10px 40px rgba(0,0,0,0.08)',
  },
  {
    id: 'dark-mode',
    name: 'Midnight',
    background: '#121212',
    cardBg: '#1E1E1E',
    textColor: '#FFFFFF',
    subTextColor: '#B0B0B0',
    accentColor: '#BB86FC',
    borderColor: '#333333',
    buttonBg: '#BB86FC',
    buttonText: '#000000',
    shadow: '0px 10px 40px rgba(0,0,0,0.5)',
  },
  {
    id: 'warm-paper',
    name: 'Warm Paper',
    background: '#F9F5F0',
    cardBg: '#FFFDF9',
    textColor: '#4A4036',
    subTextColor: '#8C8175',
    accentColor: '#D4A373',
    borderColor: '#E6DCCF',
    buttonBg: '#4A4036',
    buttonText: '#FFFDF9',
    shadow: '0px 8px 24px rgba(74, 64, 54, 0.08)',
  },
  {
    id: 'soft-blue',
    name: 'Serene Blue',
    background: '#E3F2FD',
    cardBg: '#FFFFFF',
    textColor: '#0D47A1',
    subTextColor: '#5472D3',
    accentColor: '#2196F3',
    borderColor: '#BBDEFB',
    buttonBg: '#2196F3',
    buttonText: '#FFFFFF',
    shadow: '0px 10px 30px rgba(33, 150, 243, 0.15)',
  },
  {
    id: 'forest-green',
    name: 'Forest',
    background: '#E8F5E9',
    cardBg: '#FFFFFF',
    textColor: '#1B5E20',
    subTextColor: '#4CAF50',
    accentColor: '#43A047',
    borderColor: '#C8E6C9',
    buttonBg: '#43A047',
    buttonText: '#FFFFFF',
    shadow: '0px 10px 30px rgba(67, 160, 71, 0.15)',
  },
  {
    id: 'lavender-dream',
    name: 'Lavender',
    background: '#F3E5F5',
    cardBg: '#FFFFFF',
    textColor: '#4A148C',
    subTextColor: '#8E24AA',
    accentColor: '#AB47BC',
    borderColor: '#E1BEE7',
    buttonBg: '#AB47BC',
    buttonText: '#FFFFFF',
    shadow: '0px 10px 30px rgba(171, 71, 188, 0.15)',
  },
  {
    id: 'sunset-gradient',
    name: 'Sunset',
    background: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    textColor: '#C2185B',
    subTextColor: '#E91E63',
    accentColor: '#FF4081',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    buttonBg: '#FF4081',
    buttonText: '#FFFFFF',
    shadow: '0px 10px 40px rgba(255, 64, 129, 0.2)',
  },
  {
    id: 'ocean-gradient',
    name: 'Ocean',
    background: 'linear-gradient(120deg, #89f7fe 0%, #66a6ff 100%)',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    textColor: '#01579B',
    subTextColor: '#0277BD',
    accentColor: '#0288D1',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    buttonBg: '#0288D1',
    buttonText: '#FFFFFF',
    shadow: '0px 10px 40px rgba(2, 136, 209, 0.2)',
  },
  {
    id: 'monochrome-pro',
    name: 'Mono Pro',
    background: '#FFFFFF',
    cardBg: '#F5F5F5',
    textColor: '#000000',
    subTextColor: '#666666',
    accentColor: '#000000',
    borderColor: '#E0E0E0',
    buttonBg: '#000000',
    buttonText: '#FFFFFF',
    shadow: 'none',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk',
    background: '#050505',
    cardBg: '#121212',
    textColor: '#00FF00',
    subTextColor: '#00CC00',
    accentColor: '#FF00FF',
    borderColor: '#00FF00',
    buttonBg: '#FF00FF',
    buttonText: '#000000',
    shadow: '0px 0px 20px rgba(0, 255, 0, 0.2)',
  }
];

interface ThemeContextType {
  currentTheme: FlashcardTheme;
  setTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<FlashcardTheme>(THEMES[0]);

  useEffect(() => {
    const savedThemeId = localStorage.getItem('flashcard_theme_id');
    if (savedThemeId) {
      const theme = THEMES.find(t => t.id === savedThemeId);
      if (theme) setCurrentTheme(theme);
    }
  }, []);

  const setTheme = (themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('flashcard_theme_id', themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
