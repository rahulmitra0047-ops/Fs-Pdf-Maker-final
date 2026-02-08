
import React, { ReactNode } from 'react';

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  icon?: ReactNode;
}

const PremiumButton: React.FC<Props> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  onClick,
  className = '',
  icon,
}) => {
  const baseStyles = "relative inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none overflow-hidden select-none tracking-tight";
  
  const variants = {
    // Primary: Modern Indigo
    primary: "bg-primary-600 text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30 border-none",
    
    // Gradient: Vivid
    gradient: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 border-none",
    
    // Secondary: Clean Outline
    secondary: "bg-white border border-slate-200 text-slate-700 hover:border-primary-600 hover:text-primary-600 hover:bg-slate-50 shadow-sm",
    
    // Ghost: Minimal
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    
    // Danger: Soft Red
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-transparent",
  };

  const sizes = {
    sm: "h-9 px-3 text-xs rounded-[var(--radius-md)] gap-1.5",
    md: "h-12 px-6 text-sm rounded-[var(--radius-lg)] gap-2",
    lg: "h-14 px-8 text-base rounded-[var(--radius-xl)] gap-2.5",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!loading && icon && <span className="flex items-center justify-center">{icon}</span>}
      {children}
    </button>
  );
};

export default PremiumButton;
