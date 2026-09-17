import React from 'react';
import { Tag, TrendingUp, Info } from 'lucide-react';

export const FairPriceInsight = ({ insight, compact = false }) => {
  if (!insight || !insight.has_reference) {
    return (
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>Historical reference benchmark currently unavailable for this crop.</span>
      </div>
    );
  }

  const { min_price, max_price, listing_price, verdict, status, tag, disclaimer } = insight;

  // Percentage position within range for the progress bar
  const rangeSpan = Math.max(1, max_price - min_price);
  let posPercent = ((listing_price - min_price) / rangeSpan) * 100;
  posPercent = Math.max(5, Math.min(95, posPercent));

  const badgeColor =
    tag === 'competitive'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : tag === 'premium'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-sky-50 text-sky-700 border-sky-200';

  if (compact) {
    return (
      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600 font-medium">Ref Range: ₹{min_price}–₹{max_price}/kg</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeColor}`}>
          {status}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Fair Price Insight</h4>
            <div className="text-sm font-semibold text-slate-800">Regional Benchmark Comparison</div>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}>
          {status}
        </span>
      </div>

      <div className="my-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="flex justify-between text-xs text-slate-600 mb-2 font-medium">
          <span>Min: ₹{min_price}/kg</span>
          <span className="text-slate-900 font-bold">Farmer Price: ₹{listing_price}/kg</span>
          <span>Max: ₹{max_price}/kg</span>
        </div>

        {/* Visual benchmark bar */}
        <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div className="absolute left-0 top-0 h-full bg-emerald-400/40 w-full" />
        </div>
        <div className="relative w-full mt-1">
          <div
            style={{ left: `${posPercent}%` }}
            className="absolute transform -translate-x-1/2 -top-4 w-3 h-3 bg-emerald-600 border-2 border-white rounded-full shadow-sm"
          />
        </div>
      </div>

      <p className="text-xs text-slate-600 font-medium">{verdict}</p>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>{disclaimer}</span>
      </div>
    </div>
  );
};

export default FairPriceInsight;
