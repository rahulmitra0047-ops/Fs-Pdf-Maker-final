
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
  const baseStyles = "relative inline-flex items-center justify-center font-sans tracking-widest uppercase font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:pointer-events-none select-none";
  
  const variants = {
    // Primary: Scholarly Terracotta
    primary: "bg-primary text-surface border border-primary hover:opacity-90",
    
    // Gradient: Maps to Primary in Scholarly theme
    gradient: "bg-primary text-surface border border-primary hover:opacity-90",
    
    // Secondary: Page/Background
    secondary: "bg-background border border-border text-text-primary hover:bg-[#EBE7DF]",
    
    // Ghost: No background initially
    ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-[#EBE7DF]",
    
    // Danger: Outlined Terracotta / Filled hover
    danger: "bg-surface border border-primary text-primary hover:bg-primary hover:text-surface",
  };

  const sizes = {
    sm: "h-10 px-4 text-[10px] gap-2",
    md: "h-12 px-6 text-[11px] gap-2.5",
    lg: "h-14 px-8 text-xs gap-3",
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
