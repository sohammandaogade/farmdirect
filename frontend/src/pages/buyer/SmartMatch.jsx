import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Calendar,
  MapPin,
  Tag,
  Package,
  ArrowRight,
  Send,
  HelpCircle,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { matchingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import MatchScore from '../../components/MatchScore';
import MatchExplanation from '../../components/MatchExplanation';
import FairPriceInsight from '../../components/FairPriceInsight';
import LogisticsCard from '../../components/LogisticsCard';
import PurchaseRequestModal from '../../components/PurchaseRequestModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const CROPS = ['Tomato', 'Onion', 'Potato', 'Wheat', 'Rice', 'Carrot', 'Cabbage', 'Capsicum', 'Maize', 'Cauliflower'];
const QUALITIES = ['Grade A', 'Grade B', 'Organic'];

export const SmartMatch = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Requirement form state (prefilled with default demo requirement for seamless hackathon testing)
  const [crop, setCrop] = useState('Tomato');
  const [isCustomCrop, setIsCustomCrop] = useState(false);
  const [customCrop, setCustomCrop] = useState('');
  const [quantity, setQuantity] = useState('1500');
  const [maxPrice, setMaxPrice] = useState('30');
  const [location, setLocation] = useState(user?.buyer_profile?.location || 'Pune');
  const [quality, setQuality] = useState('Grade A');
  const [requiredByDate, setRequiredByDate] = useState('2026-09-22');

  const [matches, setMatches] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Purchase modal
  const [selectedListing, setSelectedListing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFindMatches = async (e) => {
    if (e) e.preventDefault();

    const activeCrop = isCustomCrop ? customCrop.trim() : crop;
    if (!activeCrop) {
      showToast('Please specify a crop name to match.', 'error');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const payload = {
        crop: activeCrop,
        quantity: parseFloat(quantity) || 0,
        max_price: parseFloat(maxPrice) || 0,
        location,
        quality,
        required_by_date: requiredByDate,
      };

      const res = await matchingAPI.findMatches(payload);
      if (res.data?.success) {
        setMatches(res.data.data || []);
      }
    } catch (err) {
      showToast('Failed to compute AI matches', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemoScenario = () => {
    setIsCustomCrop(false);
    setCustomCrop('');
    setCrop('Tomato');
    setQuantity('1500');
    setMaxPrice('30');
    setLocation('Pune');
    setQuality('Grade A');
    setRequiredByDate('2026-09-22');
    showToast('Loaded Hackathon Demo Scenario: Tomato 1,500 kg @ max ₹30/kg');
  };

  const handleRequestPurchase = (listing) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setSelectedListing(listing);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 shadow-elevated border border-emerald-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Agricultural Recommendation Engine</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Algorithmic Direct-Farm Matching
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
            Specify your commercial procurement volume, target budget ceiling, and delivery window. Our explainable matching engine evaluates crop compatibility, quantity fulfillment, geographic distance, and harvest freshness to find optimal supplier farms.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleLoadDemoScenario}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all inline-flex items-center gap-2 backdrop-blur-md active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Load Hackathon Demo Scenario (Rajesh Farms 🍅)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Requirement Input Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Procurement Specifications</h3>
              <p className="text-xs text-slate-400">Configure parameters for algorithmic matching</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleFindMatches} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Crop Selection (Predefined or Custom Crop) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">Produce / Crop *</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCrop(!isCustomCrop);
                    if (!isCustomCrop && !customCrop) setCustomCrop('');
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  {isCustomCrop ? '← Standard Crops' : '+ Custom Produce'}
                </button>
              </div>

              {isCustomCrop ? (
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={customCrop}
                    onChange={(e) => setCustomCrop(e.target.value)}
                    placeholder="e.g. Dragon Fruit, Sweet Corn, Organic Turmeric"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  {customCrop && (
                    <button
                      type="button"
                      onClick={() => setCustomCrop('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {CROPS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Required Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">Required Quantity (kg) *</label>
              <input
                type="number"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Maximum Price */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">Target Budget Ceiling (₹/kg) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="e.g. 30"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">Delivery Destination District *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Pune"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Quality Grade */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">Target Quality Grade *</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {QUALITIES.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            {/* Required By Date */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">Required Delivery Date *</label>
              <input
                type="date"
                required
                value={requiredByDate}
                onChange={(e) => setRequiredByDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>{loading ? 'Evaluating Agricultural Matches...' : 'Find Matches via AI'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {loading ? (
        <LoadingSpinner text="Computing multi-variable compatibility, logistics, and fair price benchmarks..." />
      ) : hasSearched && matches.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No Direct Matches Found"
          message="No active listings fit all strict parameters. Try broadening your budget ceiling or adjusting your destination location."
        />
      ) : matches.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>Ranked Farm Matches ({matches.length})</span>
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              Ranked by weighted composite score
            </span>
          </div>

          {/* Ranked Result Cards */}
          <div className="space-y-6">
            {matches.map((item, index) => {
              const { listing, match, price_insight, logistics_estimate } = item;
              return (
                <div
                  key={listing.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-card hover:shadow-card-hover transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-slate-100">
                    {/* Produce & Farmer Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 shadow-subtle">
                        <img
                          src={listing.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400'}
                          alt={listing.crop}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400';
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                            Rank #{index + 1}
                          </span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs font-bold text-slate-600">{listing.quality_grade}</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 capitalize mt-1">
                          {listing.crop}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{listing.location}</span>
                          <span>•</span>
                          <strong className="text-slate-800">{listing.farm_name || listing.farmer_name}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Stock & Price */}
                    <div className="flex flex-wrap items-center gap-6">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Available Harvest</span>
                        <span className="text-base font-black text-slate-900 tabular-nums">
                          {listing.available_quantity?.toLocaleString()} kg
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Gate Price</span>
                        <span className="text-2xl font-black text-emerald-700 tabular-nums">
                          ₹{listing.expected_price}/kg
                        </span>
                      </div>

                      {/* Radial Match Score Component */}
                      <div className="pl-4 border-l border-slate-100">
                        <MatchScore score={match.match_score} tier={match.tier} size="md" />
                      </div>
                    </div>
                  </div>

                  {/* Explainable AI Checklist Component */}
                  <div className="my-4">
                    <MatchExplanation
                      explanation={match.explanation}
                      breakdown={match.breakdown}
                    />
                  </div>

                  {/* Quick summary of price and logistics if available */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {price_insight && (
                      <FairPriceInsight insight={price_insight} compact={true} />
                    )}
                    {logistics_estimate && (
                      <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-center justify-between text-xs text-slate-700">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Est. Freight: <strong>₹{logistics_estimate.estimated_transport_cost?.toLocaleString()}</strong> (~{logistics_estimate.distance_km} km)</span>
                        </div>
                        <span className="text-[11px] text-blue-700 font-bold bg-white px-2 py-0.5 rounded-lg border border-blue-200">
                          {logistics_estimate.estimated_delivery_time}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <a
                      href={`/marketplace/${listing.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                    >
                      <span>Produce Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => handleRequestPurchase(listing)}
                      className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Request Direct Purchase</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Purchase Request Modal */}
      <PurchaseRequestModal
        listing={selectedListing}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          showToast('Purchase request dispatched to farmer!');
        }}
      />
    </div>
  );
};

export default SmartMatch;
