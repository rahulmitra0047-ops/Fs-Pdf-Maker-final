
import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'flat' | 'outlined' | 'glass';
}

const PremiumCard: React.FC<Props> = ({ children, onClick, className = '', variant = 'default' }) => {
  const baseStyles = "relative rounded-[20px] transition-all duration-300 ease-out p-5 overflow-hidden";
  
  const variants = {
    default: "bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5",
    flat: "bg-white",
    outlined: "bg-transparent border border-slate-200",
    // Premium Glass Effect
    glass: "bg-white/80 backdrop-blur-xl border border-white/40 shadow-lg shadow-slate-500/5 hover:shadow-xl hover:shadow-slate-500/10 hover:-translate-y-0.5 hover:bg-white/90",
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
