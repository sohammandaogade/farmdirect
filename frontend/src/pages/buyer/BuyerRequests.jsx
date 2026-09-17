import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, ArrowUpRight, Check, X, Clock, MessageSquare } from 'lucide-react';
import { requestsAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export const BuyerRequests = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
      showToast('Failed to load your purchase requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this purchase request?')) return;
    try {
      const res = await requestsAPI.cancelRequest(id);
      if (res.data.success) {
        showToast('Request cancelled.');
        fetchRequests();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Procurement</span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Purchase Requests</h1>
          <p className="text-xs text-slate-500 mt-1">Track offers sent to farmers and counter-offer status</p>
        </div>

        <Link
          to="/buyer/smart-match"
          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all self-start"
        >
          New Requirement Search
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching your requests..." />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No Purchase Requests Sent"
          message="You haven't submitted any offers to farmers yet. Use the marketplace or Smart Match to find produce."
          actionText="Find Produce"
          onAction={() => window.location.href = '/marketplace'}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Farmer / Farm</th>
                  <th className="py-3.5 px-4">Produce</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Listed vs Offer</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{req.farm_name || req.farmer_name}</div>
                      <div className="text-[11px] text-slate-400">{req.listing_location}</div>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800 capitalize">
                      {req.crop}
                    </td>
                    <td className="py-4 px-4">
                      {req.requested_quantity?.toLocaleString()} {req.unit || 'kg'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-400 line-through text-[11px]">₹{req.farmer_listed_price}/kg</div>
                      <div className="font-black text-emerald-700 text-sm">₹{req.offered_price}/kg</div>
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
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/buyer/negotiations/${req.id}`}
                          className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-[11px] transition-colors flex items-center gap-1"
                        >
                          <span>Negotiate</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>

                        {req.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancel(req.id)}
                            className="py-1.5 px-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 text-[11px] font-semibold"
                          >
                            Cancel
                          </button>
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
    </div>
  );
};

export default BuyerRequests;
