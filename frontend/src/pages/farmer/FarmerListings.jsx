import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, PlusCircle, Edit3, PauseCircle, PlayCircle, CheckCircle, Trash2, Eye, AlertTriangle, Clock, Key, Copy, ShieldCheck } from 'lucide-react';
import { farmerAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const FILTER_TABS = [
  { id: 'ALL', label: 'All Requests' },
  { id: 'PENDING_AGENT_REVIEW', label: 'Pending Agent Review' },
  { id: 'PUBLISHED', label: 'Accepted & Published' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'PAUSED', label: 'Paused' },
  { id: 'SOLD', label: 'Sold' },
];

export const FarmerListings = () => {
  const { showToast } = useToast();
  const [listings, setListings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, [statusFilter]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await farmerAPI.getListings(statusFilter === 'ALL' ? null : statusFilter);
      if (res.data.success) {
        setListings(res.data.data);
      }
    } catch (e) {
      showToast('Failed to load listings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = (currentStatus === 'ACTIVE' || currentStatus === 'PUBLISHED' || currentStatus === 'APPROVED') ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await farmerAPI.toggleStatus(id, nextStatus);
      if (res.data.success) {
        showToast(`Listing marked as ${nextStatus}`);
        fetchListings();
      }
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleMarkSold = async (id) => {
    try {
      const res = await farmerAPI.toggleStatus(id, 'SOLD');
      if (res.data.success) {
        showToast('Listing marked as SOLD');
        fetchListings();
      }
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to mark sold', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      const res = await farmerAPI.deleteListing(id);
      if (res.data.success) {
        showToast('Listing removed successfully');
        fetchListings();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete listing', 'error');
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_AGENT_REVIEW':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800">
            Pending Agent Review
          </span>
        );
      case 'PUBLISHED':
      case 'ACCEPTED':
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
            Accepted & Published
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
            Active
          </span>
        );
      case 'PAUSED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700">
            Paused
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800">
            Rejected
          </span>
        );
      case 'SOLD':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800">
            Sold
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-200 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Farmer Desk</span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Produce Requests & Inventory</h1>
          <p className="text-xs text-slate-500 mt-1">Manage crop requests, quality verification status, and market availability</p>
        </div>

        <Link
          to="/farmer/listings/new"
          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 self-start"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Produce Request</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === tab.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching listings..." />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="No Produce Listed"
          message="You haven't listed any produce under this category yet."
          actionText="Create Listing"
          onAction={() => window.location.href = '/farmer/listings/new'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {item.quality_grade}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 capitalize mt-1">{item.crop}</h3>
                    <p className="text-xs text-slate-400">{item.location} • Ready: {item.availability_date}</p>
                  </div>
                  {renderStatusBadge(item.status)}
                </div>

                <div className="grid grid-cols-2 gap-2 my-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Available / Total</span>
                    <span className="font-bold text-slate-800">
                      {item.available_quantity?.toLocaleString()} / {item.quantity?.toLocaleString()} {item.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Expected Price</span>
                    <span className="font-black text-emerald-700">
                      ₹{item.expected_price}/{item.unit}
                    </span>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">{item.description}</p>
                )}

                {/* Rejection Alert Box */}
                {item.status === 'REJECTED' && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Listing Rejected by Agent</span>
                    </div>
                    <p className="text-rose-700 text-[11px] leading-relaxed">
                      {item.rejection_reason || 'Listing was rejected during quality verification.'}
                    </p>
                    {item.reviewed_at && (
                      <span className="block text-[10px] text-rose-500 mt-1.5 font-medium">
                        Reviewed on {new Date(item.reviewed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Farmer Verification Key Card */}
                {item.verification_key && (
                  <div className="mb-3.5 p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/90 rounded-2xl">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                        <Key className="w-3 h-3 text-emerald-600" />
                        Verification Security Key
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(item.verification_key);
                          showToast('Verification key copied to clipboard!');
                        }}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-xs active:scale-95 flex items-center gap-1 transition-all"
                        title="Copy Key"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-black text-slate-900 tracking-widest bg-white/80 px-2 py-0.5 rounded border border-emerald-200/60">
                        {item.verification_key}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {item.status === 'PENDING_AGENT_REVIEW' ? 'Share with agent to approve' : 'Verified'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Agent Inspection Review Remarks */}
                {item.agent_review && (
                  <div className="mb-3.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1 text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Agent Inspection Notes ({item.agent_agency || item.agent_name || 'Verified Agent'})</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed italic">
                      "{item.agent_review}"
                    </p>
                  </div>
                )}

                {/* Pending Agent Review Notice */}
                {item.status === 'PENDING_AGENT_REVIEW' && (
                  <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-[11px] font-medium">Pending Agent Review — Provide your security key to the visiting quality agent.</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                {(item.status === 'ACTIVE' || item.status === 'APPROVED' || item.status === 'SOLD') ? (
                  <Link
                    to={`/marketplace/${item.id}`}
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                    title="View in Marketplace"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                ) : (
                  <span
                    className="p-2 rounded-xl text-slate-300 cursor-not-allowed"
                    title="Not visible in marketplace until approved"
                  >
                    <Eye className="w-4 h-4" />
                  </span>
                )}

                <Link
                  to={`/farmer/listings/edit/${item.id}`}
                  className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </Link>

                {item.status !== 'SOLD' && item.status !== 'PENDING_AGENT_REVIEW' && item.status !== 'REJECTED' && (
                  <button
                    onClick={() => handleToggleStatus(item.id, item.status)}
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                    title={item.status === 'ACTIVE' ? 'Pause Listing' : 'Activate Listing'}
                  >
                    {item.status === 'ACTIVE' ? (
                      <PauseCircle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <PlayCircle className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>
                )}

                {item.status !== 'SOLD' && item.status !== 'REJECTED' && item.status !== 'PENDING_AGENT_REVIEW' && (
                  <button
                    onClick={() => handleMarkSold(item.id)}
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Mark Sold"
                  >
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  </button>
                )}

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors ml-auto"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmerListings;
