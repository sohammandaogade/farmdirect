import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, CheckCircle, Package, ArrowUpRight } from 'lucide-react';
import MatchScore from './MatchScore';

// Default safe agricultural imagery fallback by crop name
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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group">
      {/* Produce Image Header */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        <img
          src={displayImage}
          alt={crop}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

        {/* Quality Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-800 backdrop-blur-md shadow-xs flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            {quality_grade}
          </span>
        </div>

        {/* Match score pill if available */}
        {matchData && (
          <div className="absolute top-3 right-3">
            <MatchScore score={matchData.match_score} tier={matchData.tier} size="sm" />
          </div>
        )}

        {/* Location & Farm on Image */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="flex items-center gap-1.5 text-xs text-slate-200">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{location}</span>
            <span>•</span>
            <span className="truncate">{farm_name || farmer_name}</span>
          </div>
        </div>
      </div>

      {/* Produce Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-slate-900 capitalize group-hover:text-emerald-700 transition-colors">
              {crop}
            </h3>
            <div className="text-right">
              <span className="text-xs text-slate-500 block leading-none font-medium">Price</span>
              <span className="text-lg font-black text-emerald-700">₹{expected_price}/{unit}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 my-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <span>Available: <strong>{available_quantity?.toLocaleString()} {unit}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Ready: <strong>{availability_date}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
          <Link
            to={`/marketplace/${id}`}
            className="flex-1 py-2.5 px-3 text-center text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          {!isOwner && showRequestButton && (
            <button
              onClick={() => onRequestPurchase && onRequestPurchase(listing)}
              className="flex-1 py-2.5 px-3 text-center text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              Request Purchase
            </button>
          )}

          {isOwner && (
            <Link
              to={`/farmer/listings/edit/${id}`}
              className="flex-1 py-2.5 px-3 text-center text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition-colors"
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
