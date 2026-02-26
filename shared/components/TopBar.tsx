
import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';

interface Props {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  backPath?: string;
  showHome?: boolean;
  onHome?: () => void;
  rightAction?: ReactNode;
}

const TopBar: React.FC<Props> = ({ 
  title, 
  showBack, 
  onBack, 
  backPath,
  showHome = true,
  onHome,
  rightAction 
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-[60px] bg-[#F8FAFC]/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 z-header transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-2 min-w-[80px]">
        {showBack && (
          <button 
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-slate-200/50 text-slate-400 hover:text-slate-700 active:scale-95 transition-all"
            aria-label="Back"
          >
            <Icon name="arrow-left" size="md" />
          </button>
        )}
        
        {showHome && (
          <button
            onClick={handleHome}
            className="p-2 rounded-full hover:bg-slate-200/50 text-slate-400 hover:text-slate-700 active:scale-95 transition-all"
            aria-label="Home"
          >
            <Icon name="home" size="md" />
          </button>
        )}
      </div>
      
      <h1 className="text-lg font-bold text-slate-700 truncate text-center flex-1 px-2 tracking-tight">
        {title}
      </h1>

      <div className="min-w-[80px] flex justify-end items-center gap-2">
        {rightAction}
      </div>
    </div>
  );
};

export default TopBar;
