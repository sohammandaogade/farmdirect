import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Recycle,
  PlusCircle,
  ShoppingBag,
  Filter,
  Flame,
  Leaf,
  DollarSign,
  MapPin,
  CheckCircle2,
  X,
  Search,
  AlertCircle,
  Phone,
  Info,
  Sparkles,
  Clock,
  Check,
  PackageCheck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { wasteAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

// Curated presets for common agricultural residues
const WASTE_PRESETS = [
  {
    type: 'Sugarcane Bagasse',
    defaultDesc: 'Dry, fibrous residue after sugarcane crushing. Low moisture, ideal for biomass pellets, boilers, and paper pulp.',
    defaultUses: 'Biofuel Pellets, Industrial Boilers, Paper Pulp, Cattle Fodder',
    defaultPrice: 1400,
    defaultUnit: 'tonnes',
    imageUrl: 'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?w=600&auto=format&fit=crop',
  },
  {
    type: 'Wheat Straw',
    defaultDesc: 'Clean, baled wheat straw directly from harvester threshing. Dry and golden, perfect for livestock feed or bio-power plants.',
    defaultUses: 'Mushroom Cultivation, Animal Fodder, Bio-Electricity, Mulching',
    defaultPrice: 2200,
    defaultUnit: 'tonnes',
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format&fit=crop',
  },
  {
    type: 'Rice Stubble / Paddy Straw',
    defaultDesc: 'Zero-burning collected paddy straw. Mechanically baled and dried for green energy pelletizing and packaging boards.',
    defaultUses: 'Bio-Gas CNG, Bio-Ethanol, Thermal Power Plants, Packaging Material',
    defaultPrice: 1800,
    defaultUnit: 'tonnes',
    imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop',
  },
  {
    type: 'Cotton Stalks',
    defaultDesc: 'Post-harvest woody cotton stalks. High calorific value residue suitable for briquetting, particle board, and gasification.',
    defaultUses: 'Biomass Briquettes, Particle Boards, Gasifier Plants, Biochar',
    defaultPrice: 1600,
    defaultUnit: 'tonnes',
    imageUrl: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=600&auto=format&fit=crop',
  },
  {
    type: 'Corn Stover & Husks',
    defaultDesc: 'Dry maize stalks, leaves, and husks collected after cob harvesting. Excellent fiber source for silage and bio-energy.',
    defaultUses: 'Silage Animal Feed, Biofuel, Furfural Extraction, Compost',
    defaultPrice: 1500,
    defaultUnit: 'tonnes',
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop',
  },
  {
    type: 'Biomass Organic Compost',
    defaultDesc: 'Enriched microbial-aerated organic agricultural compost from aged crop residues and cow manure.',
    defaultUses: 'Organic Soil Conditioning, Horticulture, Nursery Bedding, Carbon Sequestration',
    defaultPrice: 3200,
    defaultUnit: 'tonnes',
    imageUrl: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=600&auto=format&fit=crop',
  },
];

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?w=600&auto=format&fit=crop';

export const WasteMarketplace = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // State
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'my'
  const [loading, setLoading] = useState(true);

  // Filters
  const [wasteTypeFilter, setWasteTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Listing Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [formData, setFormData] = useState({
    waste_type: 'Sugarcane Bagasse',
    quantity: '25',
    unit: 'tonnes',
    asking_price: '1400',
    location: '',
    description: WASTE_PRESETS[0].defaultDesc,
    suggested_uses: WASTE_PRESETS[0].defaultUses,
    image_url: WASTE_PRESETS[0].imageUrl,
  });

  // Procurement / Order Modal State
  const [selectedListingForOrder, setSelectedListingForOrder] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Populate default location from user profile if available
  useEffect(() => {
    if (user?.farmer_profile?.location && !formData.location) {
      setFormData((prev) => ({
        ...prev,
        location: user.farmer_profile.location,
      }));
    }
  }, [user]);

  // Load listings on filter change
  useEffect(() => {
    fetchListings();
  }, [wasteTypeFilter, locationFilter]);

  // Load farmer's personal listings if logged in as farmer
  useEffect(() => {
    if (user?.role === 'farmer') {
      fetchMyListings();
    }
  }, [user]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (wasteTypeFilter) {
        params.type = wasteTypeFilter;
        params.waste_type = wasteTypeFilter;
      }
      if (locationFilter) {
        params.location = locationFilter;
      }
      const res = await wasteAPI.getListings(params);
      if (res.data?.success) {
        setListings(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load waste listings:', err);
      showToast('Could not load waste listings from server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyListings = async () => {
    try {
      const res = await wasteAPI.getMyListings();
      if (res.data?.success) {
        setMyListings(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch personal waste listings:', err);
    }
  };

  // Preset selector handler
  const handlePresetSelect = (presetType) => {
    const preset = WASTE_PRESETS.find((p) => p.type === presetType);
    if (preset) {
      setFormData((prev) => ({
        ...prev,
        waste_type: preset.type,
        asking_price: preset.defaultPrice.toString(),
        unit: preset.defaultUnit,
        description: preset.defaultDesc,
        suggested_uses: preset.defaultUses,
        image_url: preset.imageUrl,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        waste_type: presetType,
      }));
    }
  };

  // Submit Listing Creation
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!user) {
      setCreateError('You must be logged in as a farmer to list agricultural residue.');
      return;
    }

    if (user.role !== 'farmer') {
      setCreateError('Only registered farmers have permission to list agricultural waste.');
      return;
    }

    const qty = parseFloat(formData.quantity);
    const price = parseFloat(formData.asking_price);

    if (!formData.waste_type.trim()) {
      setCreateError('Please specify the agricultural residue or waste type.');
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      setCreateError('Please enter a valid quantity greater than 0.');
      return;
    }

    if (isNaN(price) || price <= 0) {
      setCreateError('Please enter a valid asking price greater than 0.');
      return;
    }

    if (!formData.location.trim()) {
      setCreateError('Please specify a district or pickup location.');
      return;
    }

    try {
      setCreateSubmitting(true);
      const payload = {
        waste_type: formData.waste_type.trim(),
        quantity: qty,
        unit: formData.unit.trim() || 'tonnes',
        asking_price: price,
        location: formData.location.trim(),
        description: formData.description.trim(),
        suggested_uses: formData.suggested_uses.trim(),
        image_url: formData.image_url.trim() || DEFAULT_IMAGE,
      };

      const res = await wasteAPI.createListing(payload);
      if (res.data?.success) {
        showToast(res.data.message || 'Agricultural residue batch published successfully!', 'success');
        setShowCreateModal(false);
        // Refresh both public feed and farmer's listings
        fetchListings();
        fetchMyListings();
      } else {
        setCreateError(res.data?.message || 'Failed to publish listing.');
      }
    } catch (err) {
      console.error('Failed to publish waste listing:', err);
      const msg = err.response?.data?.message || err.message || 'An error occurred while publishing the listing.';
      setCreateError(msg);
      showToast(msg, 'error');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open Procurement Modal
  const handleOpenOrderModal = (listing) => {
    setSelectedListingForOrder(listing);
    setOrderQuantity(Math.min(5, listing.quantity).toString());
    setOrderError('');
    setConfirmedOrder(null);
  };

  // Close Procurement Modal
  const handleCloseOrderModal = () => {
    setSelectedListingForOrder(null);
    setOrderError('');
    setConfirmedOrder(null);
  };

  // Submit Procurement Order
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!selectedListingForOrder) return;
    setOrderError('');

    if (!user) {
      setOrderError('Please log in with a buyer account to procure biomass.');
      return;
    }

    const qty = parseFloat(orderQuantity);
    if (isNaN(qty) || qty <= 0) {
      setOrderError(`Quantity must be a positive number.`);
      return;
    }

    if (qty > selectedListingForOrder.quantity) {
      setOrderError(`Available stock is only ${selectedListingForOrder.quantity} ${selectedListingForOrder.unit || 'tonnes'}.`);
      return;
    }

    try {
      setOrderSubmitting(true);
      const payload = {
        waste_listing_id: Number(selectedListingForOrder.id),
        quantity: qty,
      };

      const res = await wasteAPI.createOrder(payload);
      if (res.data?.success) {
        showToast(res.data.message || 'Biomass purchase order placed successfully!', 'success');
        setConfirmedOrder(res.data.data);
        // Refresh listings so inventory decrement is visible in real-time
        fetchListings();
        if (user.role === 'farmer') {
          fetchMyListings();
        }
      } else {
        setOrderError(res.data?.message || 'Failed to place purchase order.');
      }
    } catch (err) {
      console.error('Failed to place waste order:', err);
      const msg = err.response?.data?.message || err.message || 'Could not complete procurement order.';
      setOrderError(msg);
      showToast(msg, 'error');
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Filter listings by search query
  const filteredListings = useMemo(() => {
    const activeList = activeTab === 'my' ? myListings : listings;
    if (!searchQuery.trim()) return activeList;
    const q = searchQuery.toLowerCase();
    return activeList.filter(
      (item) =>
        item.waste_type?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        item.farmer_name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.suggested_uses?.toLowerCase().includes(q)
    );
  }, [listings, myListings, activeTab, searchQuery]);

  // Aggregate Impact Calculations from real backend inventory data
  const totalSupply = useMemo(() => {
    return listings.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  }, [listings]);

  const totalMarketValue = useMemo(() => {
    return listings.reduce(
      (acc, curr) => acc + (Number(curr.quantity) || 0) * (Number(curr.asking_price) || 0),
      0
    );
  }, [listings]);

  const estimatedCo2Saved = useMemo(() => {
    return Math.round(totalSupply * 1.4);
  }, [totalSupply]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#211C18] via-[#332A22] to-[#211C18] border border-[#8B7A66]/30 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-10 pointer-events-none">
          <Recycle className="w-96 h-96 text-[#8B7A66]" />
        </div>

        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#FFE5B8]/20 text-[#FFE5B8] border border-[#FFE5B8]/30">
              Circular Economy • Zero Crop Burning
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8B7A66]/30 text-[#FFE5B8] border border-[#8B7A66]/40">
              Verified Biomass
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Farm Waste & Biomass Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Directly connect agricultural residue suppliers with green energy pelletizers, bio-fuel plants, paper mills, and composting enterprises. Turn stubble into sustainable revenue.
          </p>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row gap-3">
          {user?.role === 'farmer' && (
            <button
              onClick={() => {
                setCreateError('');
                setShowCreateModal(true);
              }}
              className="py-3 px-5 btn-hawaiian-primary text-xs uppercase tracking-wider rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Farm Residue</span>
            </button>
          )}

          {!user && (
            <button
              onClick={() => navigate('/login')}
              className="py-3 px-5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl backdrop-blur-xs border border-white/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Login to Trade</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Real-time Environmental & Economic Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-amber-300 transition-all flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
            <Flame className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Biomass Diverted from Burning
            </span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">
              {totalSupply.toLocaleString()} Tonnes
            </span>
            <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 mt-0.5">
              <Check className="w-3 h-3 shrink-0" />
              <span>Zero-Stubble Burning Initiative</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <Leaf className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              CO₂ Emissions Averted
            </span>
            <span className="text-2xl font-black text-emerald-600 block mt-0.5">
              {estimatedCo2Saved.toLocaleString()} Metric Tons
            </span>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>Green Bio-Energy Feedstock</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
            <DollarSign className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Active Residue Market Value
            </span>
            <span className="text-2xl font-black text-blue-600 block mt-0.5">
              ₹{totalMarketValue.toLocaleString()}
            </span>
            <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3 shrink-0" />
              <span>Secondary Income for Farmers</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs (Farmer only) & Filter Bar */}
      <div className="space-y-4">
        {user?.role === 'farmer' && (
          <div className="flex border-b border-slate-200 gap-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'all'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Recycle className="w-4 h-4" />
              <span>All Active Listings ({listings.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'my'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>My Waste Listings ({myListings.length})</span>
            </button>
          </div>
        )}

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search residue, farmer, district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={wasteTypeFilter}
                onChange={(e) => setWasteTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Biomass Types</option>
                <option value="Sugarcane Bagasse">Sugarcane Bagasse</option>
                <option value="Wheat Straw">Wheat Straw</option>
                <option value="Rice Stubble">Rice Stubble</option>
                <option value="Cotton Stalks">Cotton Stalks</option>
                <option value="Corn Stover">Corn Stover</option>
                <option value="Biomass Compost">Biomass Compost</option>
              </select>
            </div>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Regions / Districts</option>
              <option value="Kolhapur">Kolhapur</option>
              <option value="Nashik">Nashik</option>
              <option value="Pune">Pune</option>
              <option value="Ahmednagar">Ahmednagar</option>
              <option value="Nagpur">Nagpur</option>
              <option value="Solapur">Solapur</option>
              <option value="Sangli">Sangli</option>
              <option value="Satara">Satara</option>
              <option value="Aurangabad">Chhatrapati Sambhajinagar</option>
            </select>
          </div>

          <div className="text-xs font-bold text-slate-500 shrink-0 self-end md:self-auto">
            Showing <strong className="text-slate-900">{filteredListings.length}</strong> available batches
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <LoadingSpinner text="Scanning agricultural residue listings..." />
      ) : filteredListings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#FFE5B8]/30 text-[#8B7A66] flex items-center justify-center mx-auto">
            <Recycle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900">
              {activeTab === 'my'
                ? "You haven't listed any farm residue yet"
                : 'No biomass listings match your filter'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {activeTab === 'my'
                ? 'Monetize your post-harvest crop residues, stalks, and bagasse for bio-energy and composting industries.'
                : 'Try resetting your search query or region filter to browse other active residue batches.'}
            </p>
          </div>
          {user?.role === 'farmer' && (
            <button
              onClick={() => {
                setCreateError('');
                setShowCreateModal(true);
              }}
              className="py-2.5 px-5 bg-[#8B7A66] hover:bg-[#786855] text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish First Residue Batch</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((item) => {
            const isMyListing = user && item.farmer_id === user.id;
            const isSold = item.status === 'SOLD' || item.quantity <= 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-[#F5EBDD] shadow-xs hover:border-[#FFE5B8] hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Image & Status Badge */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={item.image_url || DEFAULT_IMAGE}
                      alt={item.waste_type}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_IMAGE;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                      <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-[#8B7A66] text-white shadow-md">
                        {item.waste_type}
                      </span>
                      {isSold ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white shadow-md">
                          SOLD OUT
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#FFE5B8] text-[#211C18] shadow-md">
                          AVAILABLE
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-[#FFE5B8] shrink-0" />
                        <span className="truncate">{item.location || 'Maharashtra'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-[#8B7A66] transition-colors">
                        {item.waste_type}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.description || 'Verified agricultural biomass suitable for bio-fuel, animal feed, or industrial composting.'}
                      </p>
                    </div>

                    {/* Stock & Price Metric Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Available Supply
                        </span>
                        <strong className="text-slate-900 text-sm font-black">
                          {item.quantity?.toLocaleString()} {item.unit || 'tonnes'}
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Asking Price
                        </span>
                        <strong className="text-[#8B7A66] text-sm font-black">
                          ₹{item.asking_price?.toLocaleString()}
                          <span className="text-[10px] font-semibold text-slate-400">
                            /{item.unit || 'ton'}
                          </span>
                        </strong>
                      </div>
                    </div>

                    {/* Suggested Uses Tags */}
                    {item.suggested_uses && (
                      <div className="text-[11px] text-slate-600 bg-[#FFE5B8]/20 p-2.5 rounded-xl border border-[#FFE5B8]/40">
                        <strong className="text-[#211C18] font-bold block mb-0.5">
                          Recommended Industrial Uses:
                        </strong>
                        <span className="text-slate-600">{item.suggested_uses}</span>
                      </div>
                    )}

                    {/* Farmer / Supplier Attribution */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <div className="truncate">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">
                          Supplier
                        </span>
                        <strong className="text-slate-800 font-bold text-xs truncate">
                          {item.farmer_name || item.farm_name || 'Verified Farmer'}
                        </strong>
                      </div>

                      {item.farmer_phone && (
                        <a
                          href={`tel:${item.farmer_phone}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors shrink-0"
                          title="Call Farmer"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Contact</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0">
                  {isSold ? (
                    <div className="w-full py-2.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold text-center">
                      Residue Batch Fully Procured
                    </div>
                  ) : isMyListing ? (
                    <div className="w-full py-2.5 bg-[#FFE5B8]/25 border border-[#FFE5B8] text-[#211C18] rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#8B7A66]" />
                      <span>Your Active Listing</span>
                    </div>
                  ) : user?.role === 'buyer' ? (
                    <button
                      onClick={() => handleOpenOrderModal(item)}
                      className="w-full py-2.5 btn-hawaiian-primary rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Procure Biomass Batch</span>
                    </button>
                  ) : !user ? (
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Login as Buyer to Procure</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="w-full py-2 bg-slate-50 text-slate-500 rounded-xl text-[11px] font-semibold text-center border border-slate-100">
                      Buyer Account Required to Procure
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. FARMER CREATE RESIDUE MODAL (Hardened Positioning, Scrolling & Contract) */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget && !createSubmitting) {
              setShowCreateModal(false);
            }
          }}
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FFE5B8]/30 text-[#8B7A66] flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">List Farm Residue / Waste</h3>
                  <p className="text-[11px] text-slate-500">Post agro-byproducts to bio-energy buyers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                disabled={createSubmitting}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Inline Error Alert */}
                {createError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1 leading-snug">{createError}</div>
                  </div>
                )}

                {/* Residue Type Selector */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Residue / By-product Type *</label>
                    <span className="text-[10px] text-[#8B7A66] font-bold">Auto-fills uses & details</span>
                  </div>
                  <select
                    value={formData.waste_type}
                    onChange={(e) => handlePresetSelect(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
                    required
                  >
                    {WASTE_PRESETS.map((p) => (
                      <option key={p.type} value={p.type}>
                        {p.type}
                      </option>
                    ))}
                    <option value="Other Agro-Residue">Other Agricultural Residue</option>
                  </select>
                </div>

                {/* Quantity, Unit & Asking Price */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Quantity *</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
                      placeholder="e.g. 25"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Unit *</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
                    >
                      <option value="tonnes">Tonnes</option>
                      <option value="quintals">Quintals</option>
                      <option value="kg">Kilograms</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Price / Unit (₹) *</label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={formData.asking_price}
                      onChange={(e) => setFormData({ ...formData, asking_price: e.target.value })}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
                      placeholder="e.g. 1400"
                      required
                    />
                  </div>
                </div>

                {/* Pickup Location */}
                <div>
                  <label className="text-xs font-bold text-slate-700">Pickup Location / District *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Kolhapur, Maharashtra"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
                    required
                  />
                </div>

                {/* Suggested Uses */}
                <div>
                  <label className="text-xs font-bold text-slate-700">Recommended Industrial Uses</label>
                  <input
                    type="text"
                    value={formData.suggested_uses}
                    onChange={(e) => setFormData({ ...formData, suggested_uses: e.target.value })}
                    placeholder="e.g. Bio-pellets, Boiler Fuel, Paper Pulp, Cattle Fodder"
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
                  />
                </div>

                {/* Detailed Description */}
                <div>
                  <label className="text-xs font-bold text-slate-700">Detailed Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="Moisture condition, baling status, access for 10-wheel transport trucks..."
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
                  />
                </div>

                {/* Photo Preview & URL */}
                <div>
                  <label className="text-xs font-bold text-slate-700">Residue Photo URL</label>
                  <div className="flex gap-2 items-center mt-1">
                    <img
                      src={formData.image_url || DEFAULT_IMAGE}
                      alt="Preview"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_IMAGE;
                      }}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://..."
                      className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
                    />
                  </div>
                </div>

                {/* Expected Revenue Estimate */}
                {parseFloat(formData.quantity) > 0 && parseFloat(formData.asking_price) > 0 && (
                  <div className="p-3.5 rounded-2xl bg-[#FFE5B8]/30 border border-[#FFE5B8] flex items-center justify-between text-xs">
                    <span className="font-bold text-[#211C18]">Total Estimated Revenue:</span>
                    <strong className="text-[#8B7A66] text-sm font-black">
                      ₹{(parseFloat(formData.quantity) * parseFloat(formData.asking_price)).toLocaleString()}
                    </strong>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  disabled={createSubmitting}
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2.5 bg-[#8B7A66] hover:bg-[#786855] disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {createSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Publish Residue Batch</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BUYER ORDER / PROCUREMENT MODAL (Clean Centering, Robust Contract, Flow) */}
      {/* ========================================================================= */}
      {selectedListingForOrder && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget && !orderSubmitting) {
              handleCloseOrderModal();
            }
          }}
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-[#FFE5B8]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {confirmedOrder ? 'Order Confirmation' : 'Procure Agricultural Biomass'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {confirmedOrder ? 'Contract issued to farm supplier' : 'Submit direct procurement request'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseOrderModal}
                disabled={orderSubmitting}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {confirmedOrder ? (
                /* ORDER CONFIRMED RECEIPT VIEW */
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-[#FFE5B8]/30 text-[#8B7A66] flex items-center justify-center mx-auto border border-[#FFE5B8]">
                    <CheckCircle2 className="w-9 h-9 text-[#8B7A66]" />
                  </div>

                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#FFE5B8] text-[#211C18] tracking-wider">
                      Order Confirmed • #{confirmedOrder.id}
                    </span>
                    <h4 className="text-lg font-black text-slate-900 mt-1">
                      Biomass Order Placed!
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Platform notification and dispatch contract sent to the farmer.
                    </p>
                  </div>

                  {/* Summary Details Box */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Residue Type:</span>
                      <strong className="text-slate-900 font-bold">{confirmedOrder.waste_type || selectedListingForOrder.waste_type}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Quantity Procured:</span>
                      <strong className="text-slate-900 font-bold">
                        {confirmedOrder.quantity} {confirmedOrder.unit}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Total Cost:</span>
                      <strong className="text-[#8B7A66] font-black text-sm">
                        ₹{confirmedOrder.total_price?.toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Supplier:</span>
                      <span className="text-slate-700 font-bold">
                        {confirmedOrder.farmer_name || selectedListingForOrder.farmer_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-semibold">Location:</span>
                      <span className="text-slate-700 font-bold">
                        {confirmedOrder.farmer_location || selectedListingForOrder.location}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200/80">
                      <span className="text-slate-400 font-semibold">Contract Status:</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#FFE5B8] text-[#211C18]">
                        {confirmedOrder.status || 'CONFIRMED'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseOrderModal}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                    >
                      Done / Back to Marketplace
                    </button>
                    {user?.role === 'buyer' && (
                      <button
                        type="button"
                        onClick={() => {
                          handleCloseOrderModal();
                          navigate('/buyer/orders');
                        }}
                        className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
                      >
                        View Orders
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* ORDER SUBMISSION FORM */
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                  {/* Inline Error Alert */}
                  {orderError && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1 leading-snug">{orderError}</div>
                    </div>
                  )}

                  {/* Listing Snapshot */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#FFE5B8] text-[#211C18]">
                        {selectedListingForOrder.waste_type}
                      </span>
                      <span className="text-xs font-black text-[#8B7A66]">
                        ₹{selectedListingForOrder.asking_price?.toLocaleString()} / {selectedListingForOrder.unit || 'ton'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>Available Stock:</span>
                      <strong className="text-slate-900 font-black">
                        {selectedListingForOrder.quantity} {selectedListingForOrder.unit || 'tonnes'}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {selectedListingForOrder.location} • {selectedListingForOrder.farmer_name || 'Verified Farmer'}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block">
                      Order Quantity ({selectedListingForOrder.unit || 'tonnes'}) *
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        max={selectedListingForOrder.quantity}
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setOrderQuantity(selectedListingForOrder.quantity.toString())}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-[#8B7A66] hover:text-[#786855] bg-[#FFE5B8]/40 px-2 py-0.5 rounded-md"
                      >
                        Max Stock
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Must be between 0.1 and {selectedListingForOrder.quantity} {selectedListingForOrder.unit || 'tonnes'}.
                    </span>
                  </div>

                  {/* Order Total Price Box */}
                  <div className="p-3.5 rounded-2xl bg-[#FFE5B8]/30 border border-[#FFE5B8] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#211C18] block">Total Procurement Cost:</span>
                      <span className="text-[10px] text-[#6F655B]">
                        {orderQuantity || 0} {selectedListingForOrder.unit || 'tonnes'} × ₹{selectedListingForOrder.asking_price?.toLocaleString()}
                      </span>
                    </div>
                    <strong className="text-[#8B7A66] text-base font-black">
                      ₹{((parseFloat(orderQuantity) || 0) * selectedListingForOrder.asking_price).toLocaleString()}
                    </strong>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={orderSubmitting}
                      onClick={handleCloseOrderModal}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={orderSubmitting}
                      className="px-5 py-2.5 bg-[#8B7A66] hover:bg-[#786855] disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      {orderSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Confirming Order...</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>Confirm Procurement Order</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WasteMarketplace;
