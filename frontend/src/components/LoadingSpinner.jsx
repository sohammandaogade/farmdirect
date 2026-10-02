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
        <div className="absolute inset-0 rounded-full bg-[#FFE5B8]/50 blur-md animate-pulse" />
        <Loader2 className={`${sizeClasses[size] || sizeClasses.md} text-[#8B7A66] animate-spin relative`} />
      </div>
      <p className="text-xs sm:text-sm font-bold text-[#211C18] tracking-tight">{text}</p>
      <span className="text-[11px] text-[#AFA190] mt-0.5">Real-time marketplace connection</span>
    </div>
  );
};

export default LoadingSpinner;
