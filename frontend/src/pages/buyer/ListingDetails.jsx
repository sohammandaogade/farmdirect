import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  CheckCircle2,
  Package,
  Phone,
  Store,
  Sprout,
  Send,
  Edit3,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { marketplaceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import FairPriceInsight from '../../components/FairPriceInsight';
import LogisticsCard from '../../components/LogisticsCard';
import PurchaseRequestModal from '../../components/PurchaseRequestModal';
import LoadingSpinner from '../../components/LoadingSpinner';

export const ListingDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const res = await marketplaceAPI.getListing(id);
      if (res.data.success) {
        setListing(res.data.data);
      }
    } catch (e) {
      showToast('Listing not found', 'error');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading produce details..." />;
  if (!listing) return null;

  const isOwner = user && user.id === listing.farmer_id;
  const isBuyer = user?.role === 'buyer';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Marketplace</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image & Produce Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
            {/* Produce Image */}
            <div className="relative h-72 sm:h-96 w-full bg-slate-100">
              <img
                src={listing.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800'}
                alt={listing.crop}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-white/95 text-slate-900 backdrop-blur-md shadow-sm">
                  {listing.quality_grade}
                </span>
              </div>
            </div>

            {/* Produce Info */}
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 capitalize tracking-tight">
                    {listing.crop}
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{listing.location}</span>
                    <span>•</span>
                    <strong className="text-slate-700">{listing.farm_name || listing.farmer_name}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">Expected Price</span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                    ₹{listing.expected_price}/{listing.unit || 'kg'}
                  </span>
                </div>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-6">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block text-[11px]">Available Stock</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                    {listing.available_quantity?.toLocaleString()} {listing.unit || 'kg'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  <span className="text-slate-400 block text-[11px]">Availability Date</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                    {listing.availability_date}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[11px]">Listing Status</span>
                  <span className="text-sm font-bold text-emerald-700 mt-0.5 block">
                    {listing.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              {listing.description && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Harvest & Quality Description
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {listing.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Fair Price Insight Card */}
          {listing.price_insight && (
            <FairPriceInsight insight={listing.price_insight} />
          )}

          {/* AI Quality Inspection Report Card */}
          {listing.quality_inspection && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">AI Quality Inspection Audit</h3>
                    <p className="text-[11px] text-slate-400">
                      {listing.quality_inspection.model_name || 'FarmDirect-AgriVision'} v{listing.quality_inspection.model_version || '2.0.0'}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  listing.quality_inspection.verification_status === 'VERIFIED_ALIGNED' || listing.quality_inspection.verification_status === 'VERIFIED_SUPERIOR'
                    ? 'bg-emerald-100 text-emerald-800'
                    : listing.quality_inspection.verification_status === 'VISIBLE_DEFECTS' || listing.quality_inspection.verification_status === 'CROP_MISMATCH'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {listing.quality_inspection.verification_status?.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Declared</span>
                  <strong className="text-slate-800 text-sm mt-0.5 block">{listing.quality_grade}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-emerald-600 block uppercase">AI Assessed</span>
                  <strong className="text-emerald-700 text-sm mt-0.5 block">{listing.quality_inspection.ai_assessed_grade}</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Ripeness</span>
                  <strong className="text-slate-800 text-sm mt-0.5 block">{listing.quality_inspection.ripeness_pct || 88}%</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Uniformity</span>
                  <strong className="text-slate-800 text-sm mt-0.5 block">{listing.quality_inspection.uniformity_score || 82}%</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Defects</span>
                  <strong className="text-slate-800 text-sm mt-0.5 block">{listing.quality_inspection.defect_detected_pct}%</strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Confidence</span>
                  <strong className="text-slate-800 text-sm mt-0.5 block">{listing.quality_inspection.confidence_score}%</strong>
                </div>
              </div>

              {listing.quality_inspection.assessment_notes && (
                <div className="p-3.5 bg-slate-50/80 rounded-2xl text-xs text-slate-600 leading-relaxed border border-slate-100">
                  <span className="font-bold text-slate-700 block mb-1">Optical Inspection Notes:</span>
                  {listing.quality_inspection.assessment_notes}
                </div>
              )}

              <p className="text-[10px] text-slate-400 text-center italic">
                {listing.quality_inspection.disclaimer || 'AI-assisted visual quality assessment. Not certified laboratory inspection.'}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Farmer info, Logistics, Purchase action */}
        <div className="space-y-6">
          {/* Action Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Procurement Action</h3>
            <p className="text-xs text-slate-500 mb-4">
              Direct-to-farmer trade terms with zero broker fee
            </p>

            {isOwner ? (
              <Link
                to={`/farmer/listings/edit/${listing.id}`}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit My Listing</span>
              </Link>
            ) : (listing.available_quantity <= 0 || listing.status === 'SOLD') ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white">
                  Sold Out
                </span>
                <p className="text-xs text-rose-700 font-medium">
                  This harvest lot has been fully procured. Further purchase orders are closed.
                </p>
              </div>
            ) : isBuyer ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Request Purchase</span>
              </button>
            ) : !user ? (
              <Link
                to="/login"
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-center"
              >
                Sign In to Request Purchase
              </Link>
            ) : (
              <div className="p-3 bg-slate-50 text-slate-500 text-xs rounded-xl text-center">
                Logged in as Farmer. Purchase requests are available to Buyer accounts.
              </div>
            )}
          </div>

          {/* Logistics Assistance Estimator Card */}
          {listing.logistics_estimate ? (
            <LogisticsCard
              logistics={listing.logistics_estimate}
              farmerLoc={listing.location}
              buyerLoc={user?.buyer_profile?.location}
            />
          ) : (
            <LogisticsCard
              logistics={{
                distance_km: 25,
                estimated_transport_cost: 1280,
                estimated_delivery_time: 'Same day (3-5 hours)',
                suggested_vehicle: 'Mini Truck / 1.5T Pickup',
                disclaimer: 'Sign in as a buyer to calculate personalized distance from your warehouse.'
              }}
              farmerLoc={listing.location}
              buyerLoc="Your Operating Region"
            />
          )}

          {/* Farmer Contact Info */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Farmer Verification
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">{listing.farm_name || listing.farmer_name}</div>
                <div className="text-xs text-slate-500">{listing.location} • Verified Farmer</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Request Modal */}
      <PurchaseRequestModal
        listing={listing}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchListing();
        }}
      />
    </div>
  );
};

export default ListingDetails;
