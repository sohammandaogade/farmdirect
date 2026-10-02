import React, { useState } from 'react';
import { CheckCircle2, Clock, Truck, PackageCheck, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

const STEPS = [
  { id: 'CONFIRMED', label: 'Order Confirmed', icon: CheckCircle2, desc: 'Agreement finalized & logged' },
  { id: 'PICKUP_SCHEDULED', label: 'Pickup Scheduled', icon: Clock, desc: 'Carrier dispatch arranged' },
  { id: 'IN_TRANSIT', label: 'In Transit', icon: Truck, desc: 'En route to buyer' },
  { id: 'DELIVERED', label: 'Delivered', icon: PackageCheck, desc: 'Received & inspected' },
];

export const OrderTimeline = ({ order, isFarmer = false, onUpdateStatus, updating = false }) => {
  const currentStatus = order?.status || 'CONFIRMED';
  const history = order?.history || [];
  const [note, setNote] = useState('');

  const getStepIndex = (status) => {
    return STEPS.findIndex((s) => s.id === status);
  };

  const currentIndex = getStepIndex(currentStatus);
  const nextStep = currentIndex >= 0 && currentIndex < STEPS.length - 1 ? STEPS[currentIndex + 1] : null;

  const handleAdvance = () => {
    if (!nextStep) return;
    onUpdateStatus(nextStep.id, note.trim() || `Advanced status to ${nextStep.label}`);
    setNote('');
  };

  return (
    <div className="bg-white rounded-3xl border border-warm-border p-6 sm:p-7 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-warm-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-hawaiian-500 animate-pulse" />
            <h4 className="text-sm font-bold text-warm-charcoal">Delivery Fulfillment Lifecycle</h4>
          </div>
          <p className="text-xs text-hawaiian-400 mt-0.5">Real-time status tracking for Consignment #{order?.order_number}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-mocassin-100 text-hawaiian-800 border border-mocassin-300 self-start sm:self-auto">
          {currentStatus.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Stepped Horizontal Progression */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative mb-8">
        {STEPS.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          // Find history entry for this step if exists
          const historyEntry = history.find((h) => h.status === step.id);

          return (
            <div key={step.id} className="relative flex flex-col items-center text-center">
              {/* Connector line with subtle gradient */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`hidden sm:block absolute top-5 left-1/2 w-full h-1 z-0 rounded-full transition-all duration-300 ${
                    idx < currentIndex ? 'bg-gradient-to-r from-hawaiian-500 to-mocassin-300' : 'bg-warm-border'
                  }`}
                />
              )}

              {/* Icon Circle */}
              <div
                className={`relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isCurrent
                    ? 'bg-hawaiian-500 text-white shadow-lg shadow-hawaiian-900/25 scale-110 ring-4 ring-mocassin-200'
                    : isDone
                    ? 'bg-hawaiian-600 text-white shadow-subtle'
                    : 'bg-warm-canvas text-hawaiian-300 border border-warm-border'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Label & Details */}
              <div className="mt-3">
                <div className={`text-xs font-bold ${isDone ? 'text-warm-charcoal' : 'text-hawaiian-400'}`}>
                  {step.label}
                </div>
                <div className="text-[11px] text-hawaiian-400 mt-0.5">{step.desc}</div>
                {historyEntry && (
                  <div className="text-[10px] text-hawaiian-600 font-semibold mt-1 bg-mocassin-50 px-2 py-0.5 rounded-md inline-block border border-mocassin-200">
                    {new Date(historyEntry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status History Notes Log */}
      {history.length > 0 && (
        <div className="bg-warm-canvas rounded-2xl p-4 border border-warm-border mb-6">
          <h5 className="text-[11px] font-black text-hawaiian-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-hawaiian-500" />
            Operational History Log
          </h5>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={h.id || i} className="text-xs flex items-start justify-between text-hawaiian-800 pb-2 border-b border-warm-border last:border-0 last:pb-0">
                <div>
                  <span className="font-bold text-hawaiian-900 mr-2">[{h.status}]</span>
                  <span>{h.note}</span>
                  <span className="text-[11px] text-hawaiian-400 ml-1.5">by {h.updated_by_name || 'System'}</span>
                </div>
                <span className="text-[11px] text-hawaiian-400 shrink-0 ml-2 tabular-nums">
                  {new Date(h.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Farmer operational status controls */}
      {isFarmer && nextStep && currentStatus !== 'CANCELLED' && (
        <div className="p-4 bg-mocassin-50/80 border border-mocassin-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex-1 w-full">
            <span className="text-xs font-bold text-hawaiian-900 block mb-1">
              Advance Operational Status
            </span>
            <input
              type="text"
              placeholder={`Optional note (e.g. Dispatched tempo to delivery depot)`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-warm-border rounded-xl text-xs text-warm-charcoal placeholder-hawaiian-300 focus:outline-none focus:ring-2 focus:ring-hawaiian-500/20 focus:border-hawaiian-500"
            />
          </div>
          <button
            onClick={handleAdvance}
            disabled={updating}
            className="w-full sm:w-auto py-2.5 px-5 btn-hawaiian-primary text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            <span>Advance to {nextStep.label}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderTimeline;
