
import React, { useId } from 'react';

interface LogoProps {
  variant?: 'icon' | 'full' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ variant = 'full', size = 'md', className = '' }) => {
  const sizes = {
    sm: { h: 24, w: 24, text: 16 },
    md: { h: 32, w: 32, text: 20 },
    lg: { h: 40, w: 40, text: 24 },
    xl: { h: 48, w: 48, text: 32 },
  };

  const currentSize = sizes[size];
  const uniqueId = useId();
  const gradientId = `logo-gradient-${uniqueId.replace(/:/g, '')}`;

  return (
    <div className={`flex items-center gap-2.5 select-none group ${className}`}>
      {(variant === 'icon' || variant === 'full') && (
        <div className="relative group-hover:scale-105 transition-transform duration-300">
            {/* Glow effect behind logo */}
            <div className="absolute -inset-1 bg-indigo-500/30 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <svg 
            width={currentSize.w} 
            height={currentSize.h} 
            viewBox="0 0 48 48" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="relative drop-shadow-md"
            >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
            </defs>
            <rect width="48" height="48" rx="12" fill={`url(#${gradientId})`} />
            <path d="M14 14H34V34H14V14Z" fill="white" fillOpacity="0.2" />
            <path d="M18 18H34V34H18V18Z" fill="white" fillOpacity="0.3" />
            <path d="M22 22H34V34H22V22Z" fill="white" />
            <path d="M14 14L22 22" stroke="white" strokeWidth="2" strokeOpacity="0.5" strokeLinecap="round"/>
            </svg>
        </div>
      )}
      {(variant === 'text' || variant === 'full') && (
        <div className="flex items-baseline" style={{ fontSize: `${currentSize.text}px`, letterSpacing: '0.5px' }}>
            <span className="font-extrabold text-[#6366F1]">FS</span>
            <span className="font-medium text-[#374151] ml-1.5">PDF MAKER</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
