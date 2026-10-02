import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, CheckCircle, Package, ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react';
import MatchScore from './MatchScore';

// Safe agricultural imagery fallback by crop name
const CROP_FALLBACKS = {
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80',
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
  carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80',
  cabbage: 'https://images.unsplash.com/photo-1604544203292-0ec5a0248bf8?w=600&auto=format&fit=crop&q=80',
  capsicum: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&auto=format&fit=crop&q=80',
  maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80',
  cauliflower: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&auto=format&fit=crop&q=80',
};

export const ListingCard = ({
  listing,
  matchData,
  onRequestPurchase,
  isOwner = false,
  showRequestButton = true,
}) => {
  const {
    id,
    crop,
    available_quantity,
    unit = 'kg',
    expected_price,
    location,
    quality_grade,
    availability_date,
    farm_name,
    farmer_name,
    image_url,
  } = listing;

  const cropKey = (crop || '').toLowerCase();
  const displayImage = image_url || CROP_FALLBACKS[cropKey] || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80';

  return (
    <div className="group bg-white rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 flex flex-col overflow-hidden">
      {/* Produce Image Header */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        <img
          src={displayImage}
          alt={crop}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        {/* Quality Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-white/95 text-slate-900 backdrop-blur-md shadow-subtle flex items-center gap-1.5 border border-white/40">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            {quality_grade || 'Standard Grade'}
          </span>
        </div>

        {/* Match score pill if available */}
        {matchData && (
          <div className="absolute top-3 right-3">
            <MatchScore score={matchData.match_score} tier={matchData.tier} size="sm" />
          </div>
        )}

        {/* Location & Farm on Image Overlay */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{location || 'Maharashtra'}</span>
            <span className="opacity-40">•</span>
            <span className="truncate text-slate-300 font-normal">{farm_name || farmer_name || 'Direct Farm'}</span>
          </div>
        </div>
      </div>

      {/* Produce Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 block">
                Direct Harvest
              </span>
              <h3 className="text-xl font-black text-slate-900 capitalize group-hover:text-emerald-700 transition-colors">
                {crop}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Asking Rate
              </span>
              <div className="flex items-baseline justify-end gap-0.5">
                <span className="text-2xl font-black text-emerald-700 tabular-nums">₹{expected_price}</span>
                <span className="text-xs font-bold text-slate-500">/{unit}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-600 min-w-0">
              <Package className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Available</span>
                <span className="font-bold text-slate-900">{available_quantity?.toLocaleString()} {unit}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-600 min-w-0">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="truncate">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Harvest Date</span>
                <span className="font-bold text-slate-900">{availability_date || 'Ready Now'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
          <Link
            to={`/marketplace/${id}`}
            className="flex-1 py-2.5 px-3 text-center text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Details</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {!isOwner && showRequestButton && (
            <button
              onClick={() => onRequestPurchase && onRequestPurchase(listing)}
              className="flex-1 py-2.5 px-3 text-center text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              Order Produce
            </button>
          )}

          {isOwner && (
            <Link
              to={`/farmer/listings/edit/${id}`}
              className="flex-1 py-2.5 px-3 text-center text-xs font-bold rounded-xl bg-slate-900 hover:bg-black text-white transition-all text-center"
            >
              Edit Listing
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
