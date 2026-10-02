import React, { useState } from 'react';
import { X, Send, AlertCircle, Sparkles } from 'lucide-react';
import { requestsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export const PurchaseRequestModal = ({ listing, isOpen, onClose, onSuccess }) => {
  if (!isOpen || !listing) return null;

  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(listing.available_quantity ? Math.min(1500, listing.available_quantity) : '');
  const [offerPrice, setOfferPrice] = useState(listing.expected_price || '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const numQty = parseFloat(quantity) || 0;
  const numPrice = parseFloat(offerPrice) || 0;
  const totalOffer = Math.round(numQty * numPrice * 100) / 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (numQty <= 0) {
      setError('Requested quantity must be greater than 0.');
      return;
    }
    if (numQty > listing.available_quantity) {
      setError(`Requested quantity cannot exceed available quantity (${listing.available_quantity?.toLocaleString()} kg).`);
      return;
    }
    if (numPrice <= 0) {
      setError('Offered price must be greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await requestsAPI.createRequest({
        listing_id: listing.id,
        requested_quantity: numQty,
        offered_price: numPrice,
        message: message.trim() || `I would like to purchase ${numQty.toLocaleString()} kg. Can you offer ₹${numPrice}/kg?`,
      });

      if (res.data.success) {
        showToast('Purchase request sent successfully! Farmer will review your offer.');
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send purchase request. Please try again.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Send Purchase Request</h3>
            <p className="text-xs text-slate-500">Initiate direct negotiation with {listing.farm_name || listing.farmer_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Listing Mini Summary */}
        <div className="my-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-slate-800 text-sm">{listing.crop} • {listing.quality_grade}</div>
            <div className="text-slate-500 mt-0.5">{listing.location} • Available: {listing.available_quantity?.toLocaleString()} kg</div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Listed Price</span>
            <span className="text-sm font-extrabold text-slate-900">₹{listing.expected_price}/kg</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Requested Quantity (kg) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Offer Price (₹/kg) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="e.g. 27"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Dynamic Calculation preview */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-900">Estimated Total Order Value</span>
            <span className="text-base font-black text-emerald-700">₹{totalOffer.toLocaleString()}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Message or Delivery Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. I would like to purchase 1,500 kg for restaurant consumption. Can you offer ₹27/kg?"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Sending Request...' : 'Send Purchase Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseRequestModal;
