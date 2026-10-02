import React, { useState, useEffect } from 'react';
import { marketplaceAPI } from '../../services/api';
import SearchFilters from '../../components/SearchFilters';
import ListingCard from '../../components/ListingCard';
import PurchaseRequestModal from '../../components/PurchaseRequestModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Sparkles, Sprout, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Marketplace = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [filters, setFilters] = useState({
    q: '',
    crop: '',
    location: '',
    quality: '',
    min_price: '',
    max_price: '',
    min_quantity: '',
    sort: 'newest',
  });

  // Modal state
  const [selectedListing, setSelectedListing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [filters]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await marketplaceAPI.getListings(filters);
      if (res.data?.success) {
        setListings(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch marketplace listings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      q: '',
      crop: '',
      location: '',
      quality: '',
      min_price: '',
      max_price: '',
      min_quantity: '',
      sort: 'newest',
    });
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              Live Agricultural Exchange
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1.5">
            Direct Produce Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Contract directly with verified farmers across Maharashtra at fair gate prices with zero commission middlemen.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/buyer/smart-match"
            className="py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-2xl shadow-md shadow-emerald-700/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Launch AI Smart Match</span>
          </Link>
        </div>
      </div>

      {/* Multi-faceted Search Filters */}
      <SearchFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Results Section */}
      {loading ? (
        <LoadingSpinner text="Querying live agricultural listings..." />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Produce Found"
          message="No produce listings match your active search filters. Try adjusting your district or price bounds."
          actionText="Clear All Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-4 px-1">
            <div>
              Showing <strong className="text-slate-900 font-black">{listings.length}</strong> active farm harvest listings
            </div>
            <span className="text-[11px] text-slate-400">
              Direct Farmer Gate Rates
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((item) => {
              const isOwner = user && user.id === item.farmer_id;
              return (
                <ListingCard
                  key={item.id}
                  listing={item}
                  isOwner={isOwner}
                  onRequestPurchase={handleRequestPurchase}
                  showRequestButton={user?.role === 'buyer'}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Purchase Request Modal */}
      <PurchaseRequestModal
        listing={selectedListing}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchListings();
        }}
      />
    </div>
  );
};

export default Marketplace;
