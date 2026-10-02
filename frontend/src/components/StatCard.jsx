import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'hawaiian' }) => {
  const colorMap = {
    hawaiian: {
      accent: 'from-[#8B7A66] to-[#FFE5B8]',
      bg: 'bg-[#FAF8F5] text-[#8B7A66]',
      border: 'border-[#E8E2D8]',
      badge: 'bg-[#F5EBDD] text-[#5E5142]',
    },
    mocassin: {
      accent: 'from-[#FFE5B8] to-[#E2A74F]',
      bg: 'bg-[#FFF9ED] text-[#7B4D1B]',
      border: 'border-[#FED898]',
      badge: 'bg-[#FFE5B8] text-[#422709]',
    },
    coffee: {
      accent: 'from-[#332A22] to-[#8B7A66]',
      bg: 'bg-[#F5EBDD] text-[#211C18]',
      border: 'border-[#D1C6B7]',
      badge: 'bg-[#FAF8F5] text-[#332A22]',
    },
    amber: {
      accent: 'from-[#D97706] to-[#FFE5B8]',
      bg: 'bg-[#FFF9ED] text-[#B45309]',
      border: 'border-[#FED898]',
      badge: 'bg-[#FEF3C7] text-[#92400E]',
    },
    // Aliases to handle existing calls gracefully
    emerald: {
      accent: 'from-[#8B7A66] to-[#FFE5B8]',
      bg: 'bg-[#FAF8F5] text-[#8B7A66]',
      border: 'border-[#E8E2D8]',
      badge: 'bg-[#F5EBDD] text-[#5E5142]',
    },
    blue: {
      accent: 'from-[#6F655B] to-[#FFE5B8]',
      bg: 'bg-[#FAF8F5] text-[#332A22]',
      border: 'border-[#E8E2D8]',
      badge: 'bg-[#F5EBDD] text-[#332A22]',
    },
    violet: {
      accent: 'from-[#332A22] to-[#8B7A66]',
      bg: 'bg-[#F5EBDD] text-[#211C18]',
      border: 'border-[#D1C6B7]',
      badge: 'bg-[#FAF8F5] text-[#332A22]',
    },
  };

  const theme = colorMap[color] || colorMap.hawaiian;

  return (
    <div className="group relative bg-white rounded-3xl border border-[#E8E2D8] p-5 sm:p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
      {/* Top subtle color indicator line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.accent} opacity-80`} />

      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#6F655B] block">
            {title}
          </span>
          <div className="mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-[#211C18] tracking-tight tabular-nums">
              {value}
            </h3>
            {subtitle && (
              <p className="text-xs text-[#6F655B] mt-1 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#AFA190]" />
                <span>{subtitle}</span>
              </p>
            )}
          </div>
        </div>

        {Icon && (
          <div className={`p-3 rounded-2xl ${theme.bg} ${theme.border} border shadow-subtle group-hover:bg-[#FFE5B8] group-hover:text-[#211C18] group-hover:scale-110 transition-all duration-300 shrink-0`}>
            <Icon className="w-5 h-5 stroke-[2]" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
