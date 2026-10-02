import React from 'react';
import { Tag, TrendingUp, Info } from 'lucide-react';

export const FairPriceInsight = ({ insight, compact = false }) => {
  if (!insight || !insight.has_reference) {
    return (
      <div className="p-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-xs text-[#6F655B] flex items-center gap-2">
        <Info className="w-4 h-4 text-[#AFA190] shrink-0" />
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
      ? 'bg-[#FFE5B8] text-[#5E5142] border-[#FED898]'
      : tag === 'premium'
      ? 'bg-[#F5EBDD] text-[#332A22] border-[#E8E2D8]'
      : 'bg-[#FAF8F5] text-[#211C18] border-[#D1C6B7]';

  if (compact) {
    return (
      <div className="flex items-center justify-between p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8] text-xs">
        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-[#8B7A66]" />
          <span className="text-[#403A34] font-medium">Ref Range: ₹{min_price}–₹{max_price}/kg</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeColor}`}>
          {status}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-[#E8E2D8] p-5 sm:p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#FFF9ED] text-[#8B7A66] rounded-xl border border-[#FED898]">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[#AFA190]">Fair Price Intelligence</h4>
            <div className="text-sm font-bold text-[#211C18]">Regional Benchmark Comparison</div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
          {status}
        </span>
      </div>

      <div className="my-4 bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D8]">
        <div className="flex justify-between text-xs text-[#6F655B] mb-2 font-medium">
          <span>Min: ₹{min_price}/kg</span>
          <span className="text-[#211C18] font-bold">Farmer Price: ₹{listing_price}/kg</span>
          <span>Max: ₹{max_price}/kg</span>
        </div>

        {/* Visual benchmark bar */}
        <div className="relative w-full h-2.5 bg-[#E8E2D8] rounded-full overflow-hidden">
          <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#8B7A66] to-[#FFE5B8] w-full opacity-80" />
        </div>
        <div className="relative w-full mt-1">
          <div
            style={{ left: `${posPercent}%` }}
            className="absolute transform -translate-x-1/2 -top-3.5 w-3.5 h-3.5 bg-[#8B7A66] border-2 border-white rounded-full shadow-md"
          />
        </div>
      </div>

      <p className="text-xs text-[#403A34] font-medium leading-relaxed">{verdict}</p>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#AFA190]">
        <Info className="w-3.5 h-3.5 shrink-0 text-[#8B7A66]" />
        <span>{disclaimer}</span>
      </div>
    </div>
  );
};

export default FairPriceInsight;
