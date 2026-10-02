import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'emerald' }) => {
  const colorMap = {
    emerald: {
      accent: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50/80 text-emerald-700',
      border: 'border-emerald-200/60',
      glow: 'group-hover:shadow-emerald-500/10',
      pill: 'bg-emerald-100/70 text-emerald-800',
    },
    blue: {
      accent: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50/80 text-blue-700',
      border: 'border-blue-200/60',
      glow: 'group-hover:shadow-blue-500/10',
      pill: 'bg-blue-100/70 text-blue-800',
    },
    amber: {
      accent: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50/80 text-amber-700',
      border: 'border-amber-200/60',
      glow: 'group-hover:shadow-amber-500/10',
      pill: 'bg-amber-100/70 text-amber-800',
    },
    violet: {
      accent: 'from-purple-500 to-indigo-600',
      bg: 'bg-purple-50/80 text-purple-700',
      border: 'border-purple-200/60',
      glow: 'group-hover:shadow-purple-500/10',
      pill: 'bg-purple-100/70 text-purple-800',
    },
  };

  const theme = colorMap[color] || colorMap.emerald;

  return (
    <div className={`group relative bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 overflow-hidden`}>
      {/* Top subtle color indicator line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.accent} opacity-80`} />

      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
            {title}
          </span>
          <div className="mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
              {value}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span>{subtitle}</span>
              </p>
            )}
          </div>
        </div>

        {Icon && (
          <div className={`p-3 rounded-2xl ${theme.bg} ${theme.border} border shadow-subtle group-hover:scale-110 transition-transform duration-300 shrink-0`}>
            <Icon className="w-5 h-5 stroke-[2]" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
