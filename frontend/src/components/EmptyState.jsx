import React from 'react';
import { Sprout, Inbox, ShoppingBag, SearchX } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Sprout,
  title = 'No items found',
  message = 'There are currently no records to display.',
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-lg mx-auto my-6">
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-inner">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-95"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
