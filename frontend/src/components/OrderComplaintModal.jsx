import React, { useState } from 'react';
import { AlertCircle, X, CheckCircle2, ShieldAlert, FileText, Upload } from 'lucide-react';
import { ordersAPI } from '../services/api';

const BUYER_CATEGORIES = [
  'Wrong quantity',
  'Poor quality',
  'Damaged produce',
  'Wrong crop',
  'Missing delivery',
  'Late delivery',
  'Payment problem',
  'Seller issue',
  'Other',
];

const FARMER_CATEGORIES = [
  'Buyer payment issue',
  'Buyer cancellation',
  'Incorrect order',
  'Delivery dispute',
  'Buyer misconduct',
  'Suspicious buyer',
  'Other',
];

export const OrderComplaintModal = ({ order, isOpen, onClose, role = 'buyer' }) => {
  const categories = role === 'farmer' ? FARMER_CATEGORIES : BUYER_CATEGORIES;
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState('');
  const [evidenceName, setEvidenceName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 5) {
      setError('Please provide a detailed description (minimum 5 characters).');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await ordersAPI.submitComplaint(order.id, {
        category,
        description: description.trim(),
        evidence_path: evidenceName || null,
      });

      if (res.data?.success) {
        setSubmittedComplaint(res.data.data);
      } else {
        setError(res.data?.message || 'Failed to submit complaint ticket.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error submitting complaint ticket.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedComplaint(null);
    setDescription('');
    setEvidenceName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {submittedComplaint ? 'Complaint Ticket Status' : 'Raise Transaction Dispute / Report'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Order #{order.order_number} • {order.crop}
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {submittedComplaint ? (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                  {submittedComplaint.status}
                </span>
                <h4 className="text-base font-black text-slate-900 mt-2">
                  Complaint Filed: {submittedComplaint.ticket_number || submittedComplaint.ticketId}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Platform administrators have been alerted to review this transaction inquiry.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category:</span>
                  <strong className="text-slate-800">{submittedComplaint.category}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Order:</span>
                  <span className="text-slate-800 font-bold">{submittedComplaint.order_number || submittedComplaint.orderNumber || ('#' + (submittedComplaint.order_id || ''))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Lifecycle:</span>
                  <span className="font-extrabold text-blue-600">UNDER REVIEW</span>
                </div>
                <div className="pt-2 border-t border-slate-200 text-slate-600 italic">
                  "{submittedComplaint.description}"
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Close Ticket View
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Issue Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Issue Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the discrepancy, delivery delay, quality defect, or payment question in detail..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Evidence / Photo Proof (Optional)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="complaint-evidence"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setEvidenceName(e.target.files[0].name);
                      }
                    }}
                  />
                  <label
                    htmlFor="complaint-evidence"
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose File</span>
                  </label>
                  <span className="text-xs text-slate-400 truncate">
                    {evidenceName || 'No file selected (e.g. Weighbridge slip, produce photo)'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderComplaintModal;
