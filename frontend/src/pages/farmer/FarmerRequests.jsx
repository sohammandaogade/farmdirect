import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, ArrowUpRight, Check, X, MessageSquare, AlertCircle, Handshake, ArrowRight } from 'lucide-react';
import { requestsAPI, negotiationsAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export const FarmerRequests = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Counter offer modal state
  const [activeReq, setActiveReq] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterQty, setCounterQty] = useState('');
  const [counterNote, setCounterNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await requestsAPI.getRequests();
      if (res.data?.success) {
        setRequests(res.data.data || []);
      }
    } catch (e) {
      showToast('Failed to load purchase requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (reqId) => {
    try {
      const res = await negotiationsAPI.accept(reqId);
      if (res.data?.success) {
        showToast(res.data.message || 'Offer accepted and Order generated!');
        fetchRequests();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to accept offer', 'error');
    }
  };

  const handleReject = async (reqId) => {
    const reason = window.prompt('Enter reason for declining (optional):', 'Price too low for Grade A harvest');
    if (reason === null) return;
    try {
      const res = await negotiationsAPI.reject(reqId, { reason });
      if (res.data?.success) {
        showToast('Offer declined.');
        fetchRequests();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject offer', 'error');
    }
  };

  const openCounterModal = (req) => {
    setActiveReq(req);
    setCounterPrice(req.offered_price || '');
    setCounterQty(req.requested_quantity || '');
    setCounterNote('');
  };

  const handleCounterSubmit = async (e) => {
    e.preventDefault();
    if (!activeReq) return;
    try {
      setSubmitting(true);
      const res = await negotiationsAPI.counter(activeReq.id, {
        offered_price: parseFloat(counterPrice),
        offered_quantity: parseFloat(counterQty),
        message: counterNote.trim(),
      });
      if (res.data?.success) {
        showToast('Counter-offer sent to buyer!');
        setActiveReq(null);
        fetchRequests();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send counter-offer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#211C18] bg-[#FFE5B8] px-2.5 py-0.5 rounded-full border border-[#FFE5B8]">
          Inbound Sourcing Proposals
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1.5">
          Buyer Purchase Requests
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review buyer proposals, negotiate pricing directly, or confirm orders.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading inbound requests..." />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No Requests Received Yet"
          message="When commercial buyers discover your produce or send purchase requests, they will appear here."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-[#F5EBDD] overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#F5EBDD] text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                <tr>
                  <th className="py-4 px-5">Buyer / Business</th>
                  <th className="py-4 px-5">Crop</th>
                  <th className="py-4 px-5">Requested Qty</th>
                  <th className="py-4 px-5">Listed Rate vs Offer</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{req.buyer_business || req.buyer_name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{req.buyer_type} • {req.buyer_location}</div>
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-900 capitalize">
                      {req.crop}
                    </td>
                    <td className="py-4 px-5 font-semibold text-slate-800">
                      {req.requested_quantity?.toLocaleString()} {req.unit || 'kg'}
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-slate-400 line-through text-[11px]">Listed: ₹{req.farmer_listed_price}/kg</div>
                      <div className="font-black text-[#8B7A66] text-sm mt-0.5">Offer: ₹{req.offered_price}/kg</div>
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          req.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'NEGOTIATING'
                            ? 'bg-amber-100 text-amber-800'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/farmer/negotiations/${req.id}`}
                          className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[11px] transition-colors flex items-center gap-1"
                        >
                          <span>Timeline</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>

                        {req.status !== 'ACCEPTED' && req.status !== 'REJECTED' && (
                          <>
                            <button
                              onClick={() => handleAccept(req.id)}
                              className="py-2 px-3 rounded-xl bg-[#8B7A66] hover:bg-[#786855] text-white font-bold text-[11px] shadow-sm active:scale-95 transition-all flex items-center gap-1"
                              title="Accept Offer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>

                            <button
                              onClick={() => openCounterModal(req)}
                              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-[11px] shadow-sm transition-all"
                              title="Counter Offer"
                            >
                              Counter
                            </button>

                            <button
                              onClick={() => handleReject(req.id)}
                              className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Decline"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Counter Offer Modal */}
      {activeReq && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-elevated border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Submit Counter-Offer</h3>
                <p className="text-xs text-slate-400 mt-0.5">Negotiate directly with {activeReq.buyer_business || activeReq.buyer_name}</p>
              </div>
              <button
                onClick={() => setActiveReq(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCounterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Counter Price (₹/kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Offered Quantity (kg) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={counterQty}
                  onChange={(e) => setCounterQty(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason or Message to Buyer
                </label>
                <textarea
                  rows={3}
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  placeholder="e.g. Can do ₹28/kg if delivery is taken in crates at farm gate."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveReq(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#8B7A66] hover:bg-[#786855] text-white font-bold text-xs shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Counter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerRequests;
