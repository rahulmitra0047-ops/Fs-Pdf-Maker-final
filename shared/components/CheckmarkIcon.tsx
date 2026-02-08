import React from 'react';

interface Props {
  size?: number;
  color?: string;
  className?: string;
}

const CheckmarkIcon: React.FC<Props> = ({ size = 11, color = '#10B981', className = '' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block ml-0.5 checkmark-svg ${className}`}
      style={{ verticalAlign: 'middle', minWidth: size }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
};

export default CheckmarkIcon;