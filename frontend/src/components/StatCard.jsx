import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'emerald' }) => {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
    },
    violet: {
      bg: 'bg-violet-50 text-violet-600',
      border: 'border-violet-100',
    },
  };

  const theme = colorMap[color] || colorMap.emerald;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-xl ${theme.bg} ${theme.border} border shadow-xs`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
