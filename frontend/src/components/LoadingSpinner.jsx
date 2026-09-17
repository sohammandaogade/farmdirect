import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ text = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} text-emerald-600 animate-spin mb-3`} />
      <p className="text-sm font-medium text-slate-500 animate-pulse">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
