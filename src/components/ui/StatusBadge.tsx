import React from 'react';
import { PaymentStatus } from '../../utils/types';

interface StatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const sizeClasses = size === 'sm'
    ? 'text-[9px] md:text-[10px] px-2 py-0.5'
    : 'text-[10px] px-2.5 py-1';

  return (
    <span className={`${sizeClasses} rounded border font-bold ${status.color}`}>
      {status.label}
    </span>
  );
};
