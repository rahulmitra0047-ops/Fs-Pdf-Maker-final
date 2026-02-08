
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
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-[var(--color-text)] mb-1.5 ml-1">
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
            bg-white
            border 
            rounded-[var(--radius-lg)]
            px-4 py-3
            text-base text-[var(--color-text)] 
            placeholder-slate-400
            transition-all duration-200
            focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary-600
            disabled:bg-slate-50 disabled:text-slate-400
            shadow-sm
            ${error ? 'border-[var(--color-error)] focus:ring-red-100 focus:border-red-500' : 'border-[var(--color-border)]'}
          `}
        />
      </div>
      {(error || helperText) && (
        <p className={`mt-1.5 ml-1 text-xs font-medium ${error ? 'text-[var(--color-error)]' : 'text-[var(--color-text-secondary)]'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default PremiumInput;
