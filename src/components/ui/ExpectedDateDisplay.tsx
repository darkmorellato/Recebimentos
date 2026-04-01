import React from 'react';
import { Icons } from './Icons';

interface ExpectedDateDisplayProps {
  date: string;
  isLate: boolean;
  isReceived: boolean;
}

export const ExpectedDateDisplay: React.FC<ExpectedDateDisplayProps> = ({ date, isLate, isReceived }) => (
  <div className={`flex items-center gap-1.5 font-bold text-xs md:text-sm ${isLate && !isReceived ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
    <Icons.Clock className="w-3 h-3 md:w-4 md:h-4 text-slate-400 opacity-70" />
    {date}
  </div>
);
