
import React, { ReactNode } from 'react';
import PremiumButton from './PremiumButton';

interface Props {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<Props> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-64">
      <div className="text-5xl mb-4 text-[var(--color-text-secondary)] opacity-50">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-xs mb-6">
        {description}
      </p>
      {action && (
        <PremiumButton onClick={action.onClick} variant="primary" size="sm">
          {action.label}
        </PremiumButton>
      )}
    </div>
  );
};

export default EmptyState;
