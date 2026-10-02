import React from 'react';
import { Truck, MapPin, Clock, ArrowRight, ShieldAlert } from 'lucide-react';

export const LogisticsCard = ({ logistics, farmerLoc, buyerLoc }) => {
  if (!logistics) return null;

  const { distance_km, estimated_transport_cost, estimated_delivery_time, suggested_vehicle, disclaimer } = logistics;

  return (
    <div className="bg-white rounded-3xl border border-[#E8E2D8] p-5 sm:p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#FFF9ED] text-[#8B7A66] rounded-xl border border-[#FED898]">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-[#AFA190]">Logistics Estimation</h4>
            <div className="text-sm font-bold text-[#211C18]">Direct Farm-to-Business Transit</div>
          </div>
        </div>
        <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#F5EBDD] text-[#5E5142] border border-[#E8E2D8]">
          Estimated
        </span>
      </div>

      {/* Origin -> Destination Route visualization */}
      <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E8E2D8] flex items-center justify-between mb-4 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-[#211C18]">
          <MapPin className="w-3.5 h-3.5 text-[#8B7A66]" />
          <span>{farmerLoc || 'Farmer Location'}</span>
        </div>
        <div className="flex items-center gap-1 text-[#AFA190]">
          <span className="h-0.5 w-8 bg-[#D1C6B7]"></span>
          <ArrowRight className="w-3.5 h-3.5 text-[#8B7A66]" />
        </div>
        <div className="flex items-center gap-1.5 font-bold text-[#211C18]">
          <MapPin className="w-3.5 h-3.5 text-[#6F655B]" />
          <span>{buyerLoc || 'Buyer Location'}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center mb-3">
        <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E8E2D8]">
          <div className="text-[11px] text-[#AFA190] font-bold uppercase tracking-wider">Distance</div>
          <div className="text-sm font-black text-[#211C18] mt-0.5">~{distance_km} km</div>
        </div>
        <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E8E2D8]">
          <div className="text-[11px] text-[#AFA190] font-bold uppercase tracking-wider">Est. Freight</div>
          <div className="text-sm font-black text-[#8B7A66] mt-0.5">₹{estimated_transport_cost?.toLocaleString()}</div>
        </div>
        <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E8E2D8]">
          <div className="text-[11px] text-[#AFA190] font-bold uppercase tracking-wider">Transit Time</div>
          <div className="text-sm font-black text-[#211C18] mt-0.5">{estimated_delivery_time?.split(' ')[0]}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-[#6F655B] pt-1">
        <span>Suggested carrier: <strong className="text-[#211C18]">{suggested_vehicle}</strong></span>
        <span className="text-[11px] text-[#AFA190]">{disclaimer}</span>
      </div>
    </div>
  );
};

export default LogisticsCard;
