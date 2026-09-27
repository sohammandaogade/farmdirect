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
} from 'lucide-react';
import { commandCenterAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export const AnomalyDetection = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('pending'); // 'all', 'pending', 'resolved'

  // Resolution modal
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [resolutionText, setResolutionText] = useState('Reviewed by platform auditor - Verified legitimate.');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchAnomalies();
  }, [filterTab]);

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

  const handleResolve = async (e) => {
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
        fetchAnomalies();
      }
    } catch (err) {
      console.error('Failed to resolve anomaly:', err);
    } finally {
      setResolving(false);
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

  const pendingCount = anomalies.filter((a) => !a.is_resolved).length;

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
            Real-time detection of price gouging, volume spikes, and duplicate listings
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span className="text-xs font-bold text-slate-700">
            <strong>{pendingCount}</strong> Active Flags Awaiting Audit
          </span>
        </div>
      </div>

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
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Resolved
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pending Review
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-base font-black text-slate-900">{item.title || 'Market Anomaly'}</h4>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 font-semibold pt-1">
                  <span>Target: {item.entity_type || 'Listing'} #{item.entity_id || 'N/A'}</span>
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

      {/* Resolution Modal */}
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

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Audit Resolution Notes</label>
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  rows={3}
                  className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
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
    </div>
  );
};

export default AnomalyDetection;
