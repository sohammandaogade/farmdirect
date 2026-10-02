import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, ShieldCheck } from 'lucide-react';

export const MatchExplanation = ({ explanation, breakdown, isOpen, onClose }) => {
  if (!explanation) return null;

  const factors = [
    { key: 'crop', label: 'Produce Compatibility (30%)', text: explanation.crop, score: breakdown?.crop },
    { key: 'quantity', label: 'Volume Fulfillment (20%)', text: explanation.quantity, score: breakdown?.quantity },
    { key: 'price', label: 'Budget Fit (20%)', text: explanation.price, score: breakdown?.price },
    { key: 'location', label: 'Geographic Proximity (15%)', text: explanation.location, score: breakdown?.location },
    { key: 'quality', label: 'Quality & Grade (10%)', text: explanation.quality, score: breakdown?.quality },
    { key: 'availability', label: 'Harvest Schedule (5%)', text: explanation.availability, score: breakdown?.availability },
  ];

  return (
    <div className="bg-[#FFF9F0] rounded-2xl border border-[#F5EBDD] p-5 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-5 h-5 text-[#8B7A66]" />
        <h4 className="text-sm font-bold text-[#211C18]">Explainable AI Match Breakdown</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        {factors.map((f) => (
          <div key={f.key} className="bg-white p-3 rounded-xl border border-[#F5EBDD] shadow-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#8B7A66] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs font-semibold text-[#332A22]">
                <span>{f.label}</span>
                {f.score !== undefined && (
                  <span className="text-[#6F655B] font-mono text-[11px]">{f.score}/100</span>
                )}
              </div>
              <p className="text-xs text-[#6F655B] mt-0.5 truncate">{f.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Positive & Negative Factors Checklist */}
      {(explanation.positive_factors?.length > 0 || explanation.negative_factors?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {explanation.positive_factors?.length > 0 && (
            <div className="p-3 bg-[#FFE5B8]/25 border border-[#FFE5B8] rounded-xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#6F655B] block">
                (+) Key Match Strengths:
              </span>
              <ul className="space-y-1 text-xs text-[#211C18] font-medium">
                {explanation.positive_factors.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#8B7A66] shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {explanation.negative_factors?.length > 0 && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                (-) Trade-off Considerations:
              </span>
              <ul className="space-y-1 text-xs text-amber-900 font-medium">
                {explanation.negative_factors.map((n, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {explanation.considerations && explanation.considerations.length > 0 && (
        <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900">
          <div className="font-semibold flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Key Considerations:
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-amber-800">
            {explanation.considerations.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MatchExplanation;
