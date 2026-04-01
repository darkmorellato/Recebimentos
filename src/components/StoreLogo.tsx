import React from 'react';
import { STORE_IMAGES } from '../utils/constants';

interface StoreLogoProps {
  storeName: string;
  className?: string;
}

export const StoreLogo: React.FC<StoreLogoProps> = ({ storeName, className = 'w-6 h-6' }) => {
  const src = STORE_IMAGES[storeName] || '/images/dompedro.png';

  return (
    <img
      src={src}
      alt={storeName}
      className={`${className} rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm bg-white`}
      onError={(e) => {
        (e.target as HTMLImageElement).onerror = null;
        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${storeName}&background=f8fafc&color=2563eb&bold=true`;
      }}
    />
  );
};
