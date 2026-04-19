
import React from 'react';

interface Props {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  type?: 'text' | 'number';
  className?: string;
}

const PremiumInput: React.FC<Props> = ({
  label,
  placeholder,
  value,
  onChange,
  error,
  helperText,
  type = 'text',
  className = '',
}) => {
  return (
    <div className={`w-full ${className} font-serif`}>
      {label && (
        <label className="block text-[15px] font-medium text-text-primary mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full 
            bg-background
            border 
            rounded-none
            px-4 py-3
            text-base text-text-primary 
            placeholder-text-secondary/50
            transition-all duration-200
            focus:outline-none focus:border-primary
            disabled:bg-surface disabled:text-text-secondary
            font-serif
            ${error ? 'border-primary' : 'border-border'}
          `}
        />
      </div>
      {(error || helperText) && (
        <p className={`mt-2 font-sans uppercase tracking-[0.1em] text-[10px] font-semibold ${error ? 'text-primary' : 'text-text-secondary'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default PremiumInput;
