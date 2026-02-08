
import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'flat' | 'outlined' | 'glass';
}

const PremiumCard: React.FC<Props> = ({ children, onClick, className = '', variant = 'default' }) => {
  const baseStyles = "relative rounded-[var(--radius-xl)] transition-all duration-300 ease-out p-5 overflow-hidden";
  
  const variants = {
    default: "bg-[var(--color-surface)] border border-[var(--color-border)] shadow-soft hover:shadow-lifted hover:-translate-y-1",
    flat: "bg-[var(--color-surface)]",
    outlined: "bg-transparent border border-[var(--color-border)]",
    // Premium Glass Effect
    glass: "bg-white/80 backdrop-blur-xl border border-white/40 shadow-lg shadow-indigo-500/5 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 hover:bg-white/90",
  };

  const interactiveStyles = onClick 
    ? "cursor-pointer active:scale-[0.98]" 
    : "";

  return (
    <div
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${interactiveStyles}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default PremiumCard;
