
import React, { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const PremiumModal: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className={`
          relative 
          w-full 
          ${sizeClasses[size]} 
          bg-[var(--color-surface)] 
          rounded-[var(--radius-xl)] 
          shadow-2xl 
          transform 
          transition-all 
          animate-in fade-in zoom-in-95 duration-200
          flex flex-col
          max-h-[90vh]
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-divider)]">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--color-bg)] text-[var(--color-text-secondary)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PremiumModal;
