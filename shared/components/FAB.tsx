
import React, { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  onClick: () => void;
  className?: string;
}

const FAB: React.FC<Props> = ({ icon, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 right-6
        w-14 h-14
        bg-[var(--color-primary)] text-white
        rounded-full
        shadow-[var(--shadow-lg)]
        flex items-center justify-center
        transform transition-all duration-200
        hover:bg-[var(--color-primary-700)] hover:-translate-y-1
        active:scale-95
        z-40
        ${className}
      `}
    >
      {icon}
    </button>
  );
};

export default FAB;
