import React, { useState } from 'react';
import { Icons } from './Icons';
import { formatDateBR } from '../../utils/helpers';

interface DateInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  required,
  className,
  placeholder = 'dd/mm/aaaa',
}) => {
  const [inputType, setInputType] = useState<'text' | 'date'>('text');

  return (
    <div className="relative w-full group">
      <input
        type={inputType}
        required={required}
        value={inputType === 'text' && value ? formatDateBR(value) : value}
        onChange={onChange}
        onFocus={(e) => {
          setInputType('date');
          if ((e.target as any).showPicker) {
            try { (e.target as any).showPicker(); } catch { /* ignore */ }
          }
        }}
        onBlur={() => setInputType('text')}
        placeholder={placeholder}
        className={className}
      />
      {inputType === 'text' && (
        <div className="absolute right-5 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
          <Icons.Calendar className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};
