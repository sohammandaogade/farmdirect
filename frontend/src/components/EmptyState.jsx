import React from 'react';
import { Sprout } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Sprout,
  title = 'No items found',
  message = 'There are currently no records to display.',
  actionText,
  onAction,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-3xl border border-[#E8E2D8] shadow-card max-w-lg mx-auto my-6 overflow-hidden">
      {/* Background warm ambient glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FFE5B8]/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#F5EBDD] rounded-full blur-2xl pointer-events-none" />

      <div className="relative w-16 h-16 rounded-2xl bg-[#FFF9ED] border border-[#FED898] text-[#8B7A66] flex items-center justify-center mb-4 shadow-subtle">
        <Icon className="w-8 h-8 stroke-[1.75]" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-[#211C18] mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-[#6F655B] max-w-sm mb-6 leading-relaxed font-normal">{message}</p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 btn-hawaiian-primary font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
        >
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
