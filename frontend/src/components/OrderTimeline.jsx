import React, { useState } from 'react';
import { CheckCircle2, Clock, Truck, PackageCheck, AlertCircle, ArrowRight } from 'lucide-react';

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
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Order Delivery Progression</h4>
          <p className="text-xs text-slate-500 mt-0.5">Real-time lifecycle tracking for #{order?.order_number}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
          {currentStatus.replace('_', ' ')}
        </span>
      </div>

      {/* Horizontal Stepper for Desktop, vertical on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative mb-8">
        {STEPS.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          // Find history entry for this step if exists
          const historyEntry = history.find((h) => h.status === step.id);

          return (
            <div key={step.id} className="relative flex flex-col items-center text-center">
              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`hidden sm:block absolute top-5 left-1/2 w-full h-0.5 z-0 ${
                    idx < currentIndex ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}

              {/* Icon Circle */}
              <div
                className={`relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-110 ring-4 ring-emerald-100'
                    : isDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Label & Details */}
              <div className="mt-3">
                <div className={`text-xs font-bold ${isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                  {step.label}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{step.desc}</div>
                {historyEntry && (
                  <div className="text-[10px] text-emerald-600 font-medium mt-1">
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
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
            Operational History Log
          </h5>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={h.id || i} className="text-xs flex items-start justify-between text-slate-600 pb-1.5 border-b border-slate-200/60 last:border-0 last:pb-0">
                <div>
                  <span className="font-bold text-slate-800 mr-2">[{h.status}]</span>
                  <span>{h.note}</span>
                  <span className="text-[11px] text-slate-400 ml-1.5">by {h.updated_by_name || 'System'}</span>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                  {new Date(h.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Farmer operational status controls */}
      {isFarmer && nextStep && currentStatus !== 'CANCELLED' && (
        <div className="p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex-1 w-full">
            <span className="text-xs font-bold text-emerald-900 block mb-1">
              Advance Operational Status
            </span>
            <input
              type="text"
              placeholder={`Optional note (e.g. Dispatched tempo to delivery depot)`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            onClick={handleAdvance}
            disabled={updating}
            className="w-full sm:w-auto py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <span>Move to {nextStep.label}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderTimeline;
