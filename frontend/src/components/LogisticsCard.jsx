import React from 'react';
import { Truck, MapPin, Clock, ArrowRight, ShieldAlert } from 'lucide-react';

export const LogisticsCard = ({ logistics, farmerLoc, buyerLoc }) => {
  if (!logistics) return null;

  const { distance_km, estimated_transport_cost, estimated_delivery_time, suggested_vehicle, disclaimer } = logistics;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Logistics Assistance</h4>
            <div className="text-sm font-semibold text-slate-800">Direct Farm-to-Business Transit</div>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Estimated
        </span>
      </div>

      {/* Origin -> Destination Route visualization */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between mb-4 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>{farmerLoc || 'Farmer Location'}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <span className="h-0.5 w-8 bg-slate-300"></span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          <span>{buyerLoc || 'Buyer Location'}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center mb-3">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="text-[11px] text-slate-500 font-medium">Distance</div>
          <div className="text-sm font-bold text-slate-800 mt-0.5">~{distance_km} km</div>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="text-[11px] text-slate-500 font-medium">Est. Freight</div>
          <div className="text-sm font-bold text-emerald-600 mt-0.5">₹{estimated_transport_cost?.toLocaleString()}</div>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="text-[11px] text-slate-500 font-medium">Transit Time</div>
          <div className="text-sm font-bold text-slate-800 mt-0.5">{estimated_delivery_time?.split(' ')[0]}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>Suggested carrier: <strong className="text-slate-700">{suggested_vehicle}</strong></span>
        <span className="text-[11px] text-slate-400">{disclaimer}</span>
      </div>
    </div>
  );
};

export default LogisticsCard;
