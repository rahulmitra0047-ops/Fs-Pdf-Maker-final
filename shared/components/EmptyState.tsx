
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
      <div className="text-5xl mb-4 text-secondary opacity-50">
        {icon}
      </div>
      <h3 className="text-lg font-serif font-medium text-text-primary mb-1 tracking-tight">
        {title}
      </h3>
      <p className="font-serif text-[15px] leading-relaxed text-secondary max-w-sm mb-6">
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
