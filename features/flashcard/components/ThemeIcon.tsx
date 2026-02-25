import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeIcon: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  return (
    <button
      onClick={() => navigate('/flashcards/themes')}
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg transition-transform active:scale-95 hover:scale-105"
      style={{
        backgroundColor: currentTheme.buttonBg,
        color: currentTheme.buttonText,
        boxShadow: currentTheme.shadow
      }}
    >
      <Palette size={20} />
    </button>
  );
};

export default ThemeIcon;
