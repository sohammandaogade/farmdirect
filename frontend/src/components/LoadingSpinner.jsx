import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ text = 'Loading data...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md animate-pulse" />
        <Loader2 className={`${sizeClasses[size] || sizeClasses.md} text-emerald-600 animate-spin relative`} />
      </div>
      <p className="text-xs sm:text-sm font-semibold text-slate-600 tracking-tight">{text}</p>
      <span className="text-[11px] text-slate-400 mt-0.5">Please wait a moment</span>
    </div>
  );
};

export default LoadingSpinner;
