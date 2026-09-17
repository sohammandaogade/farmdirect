import React, { useState, useEffect } from 'react';
import { marketplaceAPI } from '../../services/api';
import SearchFilters from '../../components/SearchFilters';
import ListingCard from '../../components/ListingCard';
import PurchaseRequestModal from '../../components/PurchaseRequestModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Sparkles } from 'lucide-react';
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
      if (res.data.success) {
        setListings(res.data.data);
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Agricultural Exchange</span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Direct Produce Marketplace</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse live harvests directly from regional farms. No middlemen, transparent expected prices.
          </p>
        </div>

        <Link
          to="/buyer/smart-match"
          className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs rounded-xl transition-all flex items-center gap-2 self-start shadow-xs"
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Try AI Smart Match</span>
        </Link>
      </div>

      {/* Multi-faceted Search Filters */}
      <SearchFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Results Section */}
      {loading ? (
        <LoadingSpinner text="Loading marketplace produce..." />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Produce Found"
          message="No produce listings match your active search filters. Try adjusting price bounds or location."
          actionText="Clear Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-4">
            Showing <strong className="text-slate-800">{listings.length}</strong> active harvest listings
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
