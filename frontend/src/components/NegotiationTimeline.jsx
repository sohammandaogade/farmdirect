import React, { useState } from 'react';
import { Check, X, ArrowDown, CornerDownRight, Handshake, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NegotiationTimeline = ({
  request,
  timeline = [],
  currentUserId,
  userRole,
  onCounter,
  onAccept,
  onReject,
  loading = false,
}) => {
  const latestOffer = timeline[timeline.length - 1] || {};
  const isResolved = ['ACCEPTED', 'REJECTED', 'CANCELLED'].includes(request.status);
  
  // Is it my turn? If the latest sender wasn't me, I can accept or counter
  const isLatestSenderMe = latestOffer.sender_id === currentUserId;

  const [counterPrice, setCounterPrice] = useState(latestOffer.offered_price || request.offered_price || '');
  const [counterQty, setCounterQty] = useState(latestOffer.offered_quantity || request.requested_quantity || '');
  const [counterMessage, setCounterMessage] = useState('');
  const [showCounterBox, setShowCounterBox] = useState(false);

  const handleCounterSubmit = (e) => {
    e.preventDefault();
    if (!counterPrice || !counterQty) return;
    onCounter({
      offered_price: parseFloat(counterPrice),
      offered_quantity: parseFloat(counterQty),
      message: counterMessage.trim(),
    });
    setShowCounterBox(false);
  };

  return (
    <div className="space-y-6">
      {/* Timeline steps */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {timeline.map((step, index) => {
          const isBuyer = step.sender_role === 'buyer';
          const isAcceptance = step.status === 'ACCEPTED';
          const isRejection = step.status === 'REJECTED';

          return (
            <div key={step.id || index} className="relative group">
              {/* Timeline dot */}
              <div
                className={`absolute -left-6 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shadow-xs ${
                  isAcceptance
                    ? 'bg-[#8B7A66] border-white text-white'
                    : isRejection
                    ? 'bg-rose-600 border-white text-white'
                    : isBuyer
                    ? 'bg-blue-600 border-white text-white'
                    : 'bg-amber-600 border-white text-white'
                }`}
              >
                {isAcceptance ? <Check className="w-3.5 h-3.5" /> : isRejection ? <X className="w-3.5 h-3.5" /> : index + 1}
              </div>

              {/* Offer Card */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isAcceptance
                    ? 'bg-[#FFE5B8]/30 border-[#FFE5B8] text-[#211C18] shadow-xs'
                    : isRejection
                    ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                    : isBuyer
                    ? 'bg-white border-[#F5EBDD] shadow-xs'
                    : 'bg-amber-50/40 border-amber-200/80 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                        isBuyer ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {step.sender_role}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {step.sender_name || (isBuyer ? 'Buyer' : 'Farmer')}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {step.created_at ? new Date(step.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between my-2">
                  <div className="text-sm">
                    <span className="font-bold text-slate-900">₹{step.offered_price}/kg</span>
                    <span className="text-slate-400 mx-1.5">×</span>
                    <span className="text-slate-700 font-medium">{step.offered_quantity?.toLocaleString()} kg</span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-800">
                    Total: ₹{(step.offered_price * step.offered_quantity)?.toLocaleString()}
                  </div>
                </div>

                {step.message && (
                  <p className="text-xs text-slate-600 bg-white/60 p-2.5 rounded-xl border border-slate-100 italic mt-2">
                    "{step.message}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FINAL AGREEMENT CARD */}
      {request.status === 'ACCEPTED' && (
        <div className="bg-[#8B7A66] text-white rounded-3xl p-6 shadow-xl shadow-[#8B7A66]/20 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Handshake className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black tracking-tight">FINAL AGREEMENT REACHED</h3>
          <p className="text-xs text-white/80 mt-1">
            Price: ₹{latestOffer.offered_price || request.offered_price}/kg • Quantity: {latestOffer.offered_quantity || request.requested_quantity} kg
          </p>
          <div className="my-3 py-2 px-4 bg-[#FFE5B8]/20 border border-[#FFE5B8]/40 rounded-2xl inline-block text-xl font-black text-[#FFE5B8]">
            Total Contract: ₹{((latestOffer.offered_price || request.offered_price) * (latestOffer.offered_quantity || request.requested_quantity)).toLocaleString()}
          </div>
          <div className="mt-2">
            {request.order_id ? (
              <Link
                to={`/${userRole}/orders`}
                className="inline-flex items-center gap-1.5 py-2 px-5 bg-white text-[#211C18] font-bold text-xs rounded-xl shadow-md hover:bg-[#FAF8F5] transition-colors"
              >
                <span>View Order {request.order_number}</span>
                <CornerDownRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="text-xs text-white/70">Order successfully generated</span>
            )}
          </div>
        </div>
      )}

      {/* ACTIVE NEGOTIATION CONTROLS */}
      {!isResolved && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-800">Negotiation Actions</h4>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {isLatestSenderMe ? 'Awaiting Counterpart Response' : 'Action Required'}
            </span>
          </div>

          {/* Action buttons */}
          {!showCounterBox ? (
            <div className="flex flex-wrap gap-2.5">
              {!isLatestSenderMe && (
                <button
                  onClick={onAccept}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-[#8B7A66] hover:bg-[#786855] text-white font-semibold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept Offer (₹{latestOffer.offered_price}/kg)</span>
                </button>
              )}

              <button
                onClick={() => setShowCounterBox(true)}
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Counter Offer</span>
              </button>

              {!isLatestSenderMe && (
                <button
                  onClick={() => onReject('Declined offer terms.')}
                  disabled={loading}
                  className="py-2.5 px-4 border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" />
                  <span>Decline</span>
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleCounterSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Counter Price (₹/kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Quantity (kg) *</label>
                  <input
                    type="number"
                    required
                    value={counterQty}
                    onChange={(e) => setCounterQty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Counter Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Can we meet in the middle at ₹27.50/kg?"
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCounterBox(false)}
                  className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 rounded-xl bg-[#8B7A66] hover:bg-[#786855] text-white text-xs font-semibold shadow-md transition-all"
                >
                  Submit Counter Offer (Total ₹{((parseFloat(counterPrice) || 0) * (parseFloat(counterQty) || 0)).toLocaleString()})
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default NegotiationTimeline;
