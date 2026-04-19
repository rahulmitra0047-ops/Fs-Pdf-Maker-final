
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
    <div className="fixed top-0 left-0 right-0 h-[64px] bg-background border-b border-border flex items-center justify-between px-4 z-header">
      <div className="flex items-center gap-1 min-w-[60px]">
        {showBack && (
          <button 
            onClick={handleBack}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Back"
          >
            <Icon name="arrow-left" size="md" />
          </button>
        )}
        
        {showHome && (
          <button
            onClick={handleHome}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Home"
          >
            <Icon name="home" size="md" />
          </button>
        )}
      </div>
      
      <h1 className="text-xl font-serif font-medium text-text-primary truncate text-center flex-1 tracking-tight">
        {title}
      </h1>

      <div className="min-w-[60px] flex justify-end items-center gap-1">
        {rightAction}
      </div>
    </div>
  );
};

export default TopBar;
