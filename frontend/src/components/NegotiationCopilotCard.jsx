import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Handshake,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Percent,
} from 'lucide-react';
import { aiAPI } from '../services/api';

export const NegotiationCopilotCard = ({ requestId, userRole = 'farmer', onApplyCounter }) => {
  const [copilotData, setCopilotData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (requestId) {
      fetchCopilot();
    }
  }, [requestId]);

  const fetchCopilot = async () => {
    try {
      setLoading(true);
      const res = await aiAPI.getNegotiationCopilot(requestId);
      if (res.data.success) {
        setCopilotData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load negotiation copilot:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !copilotData) return null;

  const zone = copilotData.agreement_zone || {};
  const counter = copilotData.suggested_counter || {};
  const tradeOffs = copilotData.trade_offs || [];

  return (
    <div className="bg-gradient-to-br from-emerald-50/80 via-white to-blue-50/50 rounded-3xl p-6 border border-emerald-200/80 shadow-xs space-y-5 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              AI Negotiation Copilot
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Win-Win Zone
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Contract optimization & deal-closing intelligence
            </p>
          </div>
        </div>

        {counter.suggested_price && (
          <button
            onClick={() => onApplyCounter && onApplyCounter(counter.suggested_price)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Handshake className="w-3.5 h-3.5" />
            <span>Apply ₹{counter.suggested_price}/kg Counter</span>
          </button>
        )}
      </div>

      {/* Agreement Zone Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Buyer Bid</span>
          <span className="text-base font-black text-slate-800 mt-0.5 block">
            ₹{zone.buyer_bid || zone.min_price || 24}/kg
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Listing Ask</span>
          <span className="text-base font-black text-slate-800 mt-0.5 block">
            ₹{zone.seller_ask || zone.max_price || 30}/kg
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-emerald-800 block">
            Suggested Compromise
          </span>
          <span className="text-base font-black text-emerald-600 mt-0.5 block">
            ₹{zone.optimal_compromise || counter.suggested_price || 27}/kg
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Spread Gap</span>
          <span className="text-base font-black text-blue-600 mt-0.5 block">
            {zone.spread_pct || 15}%
          </span>
        </div>
      </div>

      {/* Rationale & Trade-offs */}
      <div className="space-y-3">
        {counter.rationale && (
          <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white/70 p-3 rounded-2xl border border-slate-100">
            <strong className="text-slate-900 font-bold">AI Rationale:</strong> {counter.rationale}
          </p>
        )}

        {tradeOffs.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Suggested Non-Price Trade-Offs:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tradeOffs.map((to, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white/90 border border-emerald-100 text-xs text-slate-700 font-medium flex items-start gap-2 shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{to.offer || to.description || to}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NegotiationCopilotCard;
