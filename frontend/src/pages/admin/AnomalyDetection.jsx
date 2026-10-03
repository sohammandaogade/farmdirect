import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Filter,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
  X,
  FileText,
  MessageSquare,
  Scale,
  Send,
  User,
  Package
} from 'lucide-react';
import { commandCenterAPI, ordersAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export const AnomalyDetection = () => {
  const { showToast } = useToast();
  // Section toggle: 'anomalies' (system outliers) vs 'disputes' (user complaints)
  const [activeSection, setActiveSection] = useState('anomalies');

  // Anomalies state
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('pending'); // 'all', 'pending', 'resolved'

  // Anomaly Resolution modal
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [resolutionText, setResolutionText] = useState('Reviewed by platform auditor - Verified legitimate.');
  const [resolving, setResolving] = useState(false);

  // Complaints / Dispute Tickets state
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [complaintFilter, setComplaintFilter] = useState('pending'); // 'pending', 'resolved', 'all'
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [adjudicationStatus, setAdjudicationStatus] = useState('UNDER REVIEW');
  const [adjudicationNote, setAdjudicationNote] = useState('');
  const [adjudicating, setAdjudicating] = useState(false);

  useEffect(() => {
    if (activeSection === 'anomalies') {
      fetchAnomalies();
    } else {
      fetchComplaints();
    }
  }, [activeSection, filterTab, complaintFilter]);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const statusParam =
        filterTab === 'resolved' ? 'RESOLVED' : filterTab === 'pending' ? 'NEEDS_REVIEW' : undefined;
      const res = await commandCenterAPI.getAnomalies(statusParam);
      if (res.data.success) {
        setAnomalies(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load anomalies:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      setLoadingComplaints(true);
      const res = await ordersAPI.getAllComplaints();
      if (res.data.success) {
        setComplaints(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
      showToast('Failed to load dispute tickets', 'error');
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleResolveAnomaly = async (e) => {
    e.preventDefault();
    if (!selectedAnomaly) return;
    try {
      setResolving(true);
      const res = await commandCenterAPI.updateAnomaly(selectedAnomaly.id, {
        status: 'RESOLVED',
        resolution_note: resolutionText,
      });
      if (res.data.success) {
        setSelectedAnomaly(null);
        showToast('Anomaly resolved successfully', 'success');
        fetchAnomalies();
      }
    } catch (err) {
      showToast('Failed to resolve anomaly', 'error');
    } finally {
      setResolving(false);
    }
  };

  const handleAdjudicateComplaint = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    try {
      setAdjudicating(true);
      const res = await ordersAPI.updateComplaintStatus(selectedComplaint.id, {
        status: adjudicationStatus,
        resolution_note: adjudicationNote.trim() || undefined,
      });
      if (res.data.success) {
        setSelectedComplaint(null);
        setAdjudicationNote('');
        showToast(`Dispute ticket ${selectedComplaint.ticket_number} marked as ${adjudicationStatus}`, 'success');
        fetchComplaints();
      } else {
        showToast(res.data?.message || 'Failed to update dispute status', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to adjudicate dispute ticket', 'error');
    } finally {
      setAdjudicating(false);
    }
  };

  const getSeverityBadge = (severity) => {
    const s = severity?.toLowerCase() || 'medium';
    if (s === 'high' || s === 'critical') {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    } else if (s === 'medium') {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getDisputeStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'UNDER REVIEW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'INVESTIGATING':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECTED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const pendingAnomaliesCount = anomalies.filter((a) => !a.is_resolved).length;
  const pendingDisputesCount = complaints.filter((c) => ['SUBMITTED', 'UNDER REVIEW', 'INVESTIGATING'].includes(c.status)).length;

  const filteredComplaints = complaints.filter((c) => {
    if (complaintFilter === 'pending') {
      return ['SUBMITTED', 'UNDER REVIEW', 'INVESTIGATING'].includes(c.status);
    }
    if (complaintFilter === 'resolved') {
      return ['RESOLVED', 'REJECTED'].includes(c.status);
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Audit & Compliance Center
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
              Anomaly & Fraud Sentinel
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Market Integrity & Anomaly Audit
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time detection of price gouging, volume spikes, and order dispute mediation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-bold text-slate-700">
              <strong>{pendingAnomaliesCount}</strong> Outlier Flags
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
            <Scale className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-700">
              <strong>{pendingDisputesCount}</strong> Order Disputes
            </span>
          </div>
        </div>
      </div>

      {/* Main Mode Toggle: Anomalies vs Disputes */}
      <div className="flex items-center p-1.5 bg-slate-100 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveSection('anomalies')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeSection === 'anomalies'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>System Anomalies</span>
          {pendingAnomaliesCount > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 text-[10px] font-black rounded-full">
              {pendingAnomaliesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveSection('disputes');
            fetchComplaints();
          }}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeSection === 'disputes'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4 text-amber-500" />
          <span>Order Disputes & Issues</span>
          {pendingDisputesCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full">
              {pendingDisputesCount}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: SYSTEM ANOMALIES VIEW                          */}
      {/* ========================================================= */}
      {activeSection === 'anomalies' && (
        <div className="space-y-6">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            {[
              { id: 'pending', label: 'Pending Review' },
              { id: 'resolved', label: 'Resolved History' },
              { id: 'all', label: 'All Audits' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filterTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Anomalies List */}
          {loading ? (
            <LoadingSpinner text="Scanning audit logs and fraud detection telemetry..." />
          ) : anomalies.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No anomalies in this queue</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All marketplace listings and trade transactions are currently within fair-market statistical baselines.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {anomalies.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getSeverityBadge(
                          item.severity
                        )}`}
                      >
                        {item.severity || 'Medium'} Severity
                      </span>
                      <span className="text-xs font-bold text-slate-400 capitalize">
                        Category: {item.anomaly_type?.replace(/_/g, ' ') || 'Outlier Alert'}
                      </span>
                      {item.status === 'RESOLVED' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Resolved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {item.details || item.description}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium pt-1">
                      <span>Target: {item.entity_type} #{item.entity_id}</span>
                      <span>•</span>
                      <span>Detected: {new Date(item.created_at || Date.now()).toLocaleDateString()}</span>
                      {item.resolution_note && (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          Resolution: {item.resolution_note}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.status !== 'RESOLVED' && (
                    <button
                      onClick={() => setSelectedAnomaly(item)}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 self-start md:self-auto shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Audit & Resolve</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: CUSTOMER ORDER DISPUTES & COMPLAINTS           */}
      {/* ========================================================= */}
      {activeSection === 'disputes' && (
        <div className="space-y-6">
          {/* Dispute Filters */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            {[
              { id: 'pending', label: 'Action Required (Pending/Active)' },
              { id: 'resolved', label: 'Adjudicated & Closed' },
              { id: 'all', label: 'All Dispute Tickets' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setComplaintFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  complaintFilter === tab.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loadingComplaints ? (
            <LoadingSpinner text="Fetching filed order issues and customer disputes..." />
          ) : filteredComplaints.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No dispute tickets in this queue</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No active buyer or farmer complaints require administrative mediation under this filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-amber-300 transition-all"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {c.ticket_number}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getDisputeStatusBadge(
                          c.status
                        )}`}
                      >
                        {c.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        Role: {c.reporter_role}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{c.category}</h3>
                      <span className="text-xs text-slate-400">• Order #{c.order_number || c.order_id}</span>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed">
                      "{c.description}"
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-medium pt-1">
                      <span>Reported by: <strong className="text-slate-700">{c.reporter_name || 'User #' + c.reporter_id}</strong> ({c.reporter_role})</span>
                      <span>•</span>
                      <span>Date: {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}</span>
                      {c.resolution_note && (
                        <div className="w-full mt-1.5 p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs">
                          <strong>Admin Resolution Note:</strong> {c.resolution_note}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedComplaint(c);
                      setAdjudicationStatus(c.status === 'SUBMITTED' ? 'UNDER REVIEW' : c.status);
                      setAdjudicationNote(c.resolution_note || '');
                    }}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 self-start md:self-auto shrink-0"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Adjudicate Dispute</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* ANOMALY RESOLUTION MODAL                                  */}
      {/* ========================================================= */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Audit Resolution Action</h3>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Flagged Entity:</span>
              <strong className="text-slate-900 block text-sm font-black">
                {selectedAnomaly.title}
              </strong>
              <p className="text-slate-500">{selectedAnomaly.description}</p>
            </div>

            <form onSubmit={handleResolveAnomaly} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Audit Resolution Notes</label>
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  rows={3}
                  className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAnomaly(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {resolving ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DISPUTE ADJUDICATION MODAL                                */}
      {/* ========================================================= */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {selectedComplaint.ticket_number}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Dispute Adjudication</h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Category: {selectedComplaint.category}</span>
                <span className="text-slate-400">Order #{selectedComplaint.order_number || selectedComplaint.order_id}</span>
              </div>
              <div className="text-slate-500">
                Filed by: <strong className="text-slate-700">{selectedComplaint.reporter_name}</strong> ({selectedComplaint.reporter_role})
              </div>
              <p className="text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-200/80">
                "{selectedComplaint.description}"
              </p>
            </div>

            <form onSubmit={handleAdjudicateComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Adjudication Decision Status *</label>
                <select
                  value={adjudicationStatus}
                  onChange={(e) => setAdjudicationStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="UNDER REVIEW">UNDER REVIEW — Preliminary review underway</option>
                  <option value="INVESTIGATING">INVESTIGATING — Evidence and carrier audit in progress</option>
                  <option value="RESOLVED">RESOLVED — Dispute settled / Refund or replacement approved</option>
                  <option value="REJECTED">REJECTED — Dispute dismissed after verification</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Official Administrative Note</label>
                <textarea
                  value={adjudicationNote}
                  onChange={(e) => setAdjudicationNote(e.target.value)}
                  placeholder="Enter mediation findings, insurance claim details, settlement amounts, or rejection rationale..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjudicating}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{adjudicating ? 'Updating...' : 'Submit Adjudication'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnomalyDetection;
