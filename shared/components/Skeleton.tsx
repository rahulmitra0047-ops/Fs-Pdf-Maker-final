import React from 'react';

interface Props {
  variant?: 'text' | 'circle' | 'rect' | 'card';
  width?: string;
  height?: string;
  className?: string;
}

const Skeleton: React.FC<Props> = ({ 
  variant = 'text', 
  width, 
  height, 
  className = '' 
}) => {
  const baseClasses = "bg-gray-200 animate-pulse";
  
  let variantClasses = "";
  if (variant === 'circle') variantClasses = "rounded-full";
  else if (variant === 'rect') variantClasses = "rounded-md";
  else if (variant === 'card') variantClasses = "rounded-[var(--radius-lg)]";
  else variantClasses = "rounded"; // text

  const style = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1em' : undefined),
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses} ${className}`} 
      style={style}
    />
  );
};

export default Skeleton;