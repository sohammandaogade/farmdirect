import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, ArrowUpRight, Check, X, MessageSquare, AlertCircle, Handshake } from 'lucide-react';
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
      if (res.data.success) {
        setRequests(res.data.data);
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
      if (res.data.success) {
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
      if (res.data.success) {
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
      if (res.data.success) {
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Inbound Demands</span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Purchase Requests</h1>
        <p className="text-xs text-slate-500 mt-1">Review buyer proposals, negotiate pricing, or confirm orders</p>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading requests..." />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No Requests Received Yet"
          message="When commercial buyers find your produce or send purchase requests, they will appear here."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Buyer / Business</th>
                  <th className="py-3.5 px-4">Crop</th>
                  <th className="py-3.5 px-4">Requested Qty</th>
                  <th className="py-3.5 px-4">Your Price vs Offer</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{req.buyer_business || req.buyer_name}</div>
                      <div className="text-[11px] text-slate-400">{req.buyer_type} • {req.buyer_location}</div>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800 capitalize">
                      {req.crop}
                    </td>
                    <td className="py-4 px-4">
                      {req.requested_quantity?.toLocaleString()} {req.unit || 'kg'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-400 line-through text-[11px]">Listed: ₹{req.farmer_listed_price}/kg</div>
                      <div className="font-black text-emerald-700 text-sm">Offer: ₹{req.offered_price}/kg</div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
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
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/farmer/negotiations/${req.id}`}
                          className="py-1.5 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] transition-colors flex items-center gap-1"
                        >
                          <span>Timeline</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>

                        {req.status !== 'ACCEPTED' && req.status !== 'REJECTED' && (
                          <>
                            <button
                              onClick={() => handleAccept(req.id)}
                              className="py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs active:scale-95 transition-all flex items-center gap-1"
                              title="Accept Offer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>

                            <button
                              onClick={() => openCounterModal(req)}
                              className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-[11px] shadow-xs transition-all"
                              title="Counter Offer"
                            >
                              Counter
                            </button>

                            <button
                              onClick={() => handleReject(req.id)}
                              className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Reject"
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Counter Offer for {activeReq.crop}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Responding to {activeReq.buyer_business || activeReq.buyer_name}
            </p>

            <form onSubmit={handleCounterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Counter Price (₹/kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity (kg) *</label>
                  <input
                    type="number"
                    required
                    value={counterQty}
                    onChange={(e) => setCounterQty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Note to Buyer</label>
                <input
                  type="text"
                  placeholder="e.g. Best price we can do for Grade A harvest is ₹27.50/kg."
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between font-bold">
                <span className="text-slate-600">Total Contract:</span>
                <span className="text-emerald-700">₹{((parseFloat(counterPrice) || 0) * (parseFloat(counterQty) || 0)).toLocaleString()}</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveReq(null)}
                  className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Counter Offer'}
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
