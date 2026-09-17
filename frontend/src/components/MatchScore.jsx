import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export const MatchScore = ({ score, tier, size = 'md', showLabel = true }) => {
  const numericScore = typeof score === 'number' ? Math.round(score) : 0;

  // Determine color theme based on score
  const getColorClass = () => {
    if (numericScore >= 85) {
      return {
        bg: 'bg-emerald-500',
        text: 'text-emerald-700',
        badgeBg: 'bg-emerald-50',
        border: 'border-emerald-200',
        ring: 'text-emerald-500',
        label: tier || 'Strong Match',
      };
    } else if (numericScore >= 70) {
      return {
        bg: 'bg-teal-500',
        text: 'text-teal-700',
        badgeBg: 'bg-teal-50',
        border: 'border-teal-200',
        ring: 'text-teal-500',
        label: tier || 'Good Match',
      };
    } else if (numericScore >= 50) {
      return {
        bg: 'bg-amber-500',
        text: 'text-amber-700',
        badgeBg: 'bg-amber-50',
        border: 'border-amber-200',
        ring: 'text-amber-500',
        label: tier || 'Moderate Match',
      };
    } else {
      return {
        bg: 'bg-rose-500',
        text: 'text-rose-700',
        badgeBg: 'bg-rose-50',
        border: 'border-rose-200',
        ring: 'text-rose-500',
        label: tier || 'Low Match',
      };
    }
  };

  const theme = getColorClass();

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${theme.badgeBg} ${theme.text} border ${theme.border}`}>
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        <span>{numericScore}% Match</span>
      </div>
    );
  }

  // Circular gauge for medium/large
  const radius = size === 'lg' ? 38 : 28;
  const stroke = size === 'lg' ? 6 : 5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (numericScore / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative inline-flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="#e2e8f0"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            className={`${theme.ring} transition-all duration-700 ease-out`}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`font-bold leading-none ${size === 'lg' ? 'text-lg' : 'text-sm'} text-slate-800`}>
            {numericScore}%
          </span>
        </div>
      </div>

      {showLabel && (
        <div>
          <div className={`text-xs font-bold uppercase tracking-wider ${theme.text}`}>
            {theme.label}
          </div>
          <div className="text-[11px] text-slate-400">
            Algorithmic Fit
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchScore;
