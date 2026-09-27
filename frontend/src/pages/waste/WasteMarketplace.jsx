import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { wasteAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export const WasteMarketplace = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wasteTypeFilter, setWasteTypeFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedListingForOrder, setSelectedListingForOrder] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(10);
  const [orderPrice, setOrderPrice] = useState(1200);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // New Listing Form
  const [formData, setFormData] = useState({
    waste_type: 'Bagasse',
    title: 'Dry Sugarcane Bagasse',
    description: 'High-fiber sugarcane residue ideal for bio-pellet production and animal feed.',
    quantity_tons: 25,
    price_per_ton: 1400,
    moisture_pct: 12,
    location_district: 'Kolhapur',
    address: 'Near Sugar Mill, Kolhapur Bypass',
    suggested_use: 'Bio-fuel pellets, Paper pulp, Composting',
  });

  useEffect(() => {
    fetchListings();
  }, [wasteTypeFilter, districtFilter]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (wasteTypeFilter) params.waste_type = wasteTypeFilter;
      if (districtFilter) params.district = districtFilter;
      const res = await wasteAPI.getListings(params);
      if (res.data.success) {
        setListings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load waste listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await wasteAPI.createListing({
        ...formData,
        quantity_tons: parseFloat(formData.quantity_tons),
        price_per_ton: parseFloat(formData.price_per_ton),
        moisture_pct: parseFloat(formData.moisture_pct),
      });
      if (res.data.success) {
        setShowCreateModal(false);
        fetchListings();
      }
    } catch (err) {
      console.error('Failed to list farm waste:', err);
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!selectedListingForOrder) return;
    try {
      setOrderSubmitting(true);
      const res = await wasteAPI.createOrder({
        waste_listing_id: selectedListingForOrder.id,
        quantity_tons: parseFloat(orderQuantity),
        proposed_price_per_ton: parseFloat(orderPrice),
        delivery_notes: orderNotes || 'Direct pickup via biomass transport partner.',
      });
      if (res.data.success) {
        setOrderSuccess(true);
        setTimeout(() => {
          setOrderSuccess(false);
          setSelectedListingForOrder(null);
          fetchListings();
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to place waste order:', err);
    } finally {
      setOrderSubmitting(false);
    }
  };

  const totalTonsAvailable = listings.reduce((acc, curr) => acc + Number(curr.quantity_tons || 0), 0);
  const estimatedCo2Saved = (totalTonsAvailable * 1.4).toFixed(0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Circular Economy
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
              Zero Crop Burning
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Farm Waste & Biomass Marketplace
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monetize crop residues, stubble, and bagasse for bio-energy, paper, and compost industries
          </p>
        </div>

        {user?.role === 'farmer' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>List Farm Residue</span>
          </button>
        )}
      </div>

      {/* Circular Economy Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Residue Diverted from Burning
            </span>
            <span className="text-xl font-black text-slate-900 block mt-0.5">
              {totalTonsAvailable.toLocaleString()} Tons
            </span>
            <span className="text-[10px] text-amber-600 font-semibold">Zero-Stubble Burning</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CO₂ Emissions Averted
            </span>
            <span className="text-xl font-black text-emerald-600 block mt-0.5">
              {estimatedCo2Saved} Metric Tons
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">Verified Carbon Offset</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Secondary Farmer Earnings
            </span>
            <span className="text-xl font-black text-blue-600 block mt-0.5">
              ₹{(totalTonsAvailable * 1350).toLocaleString()}
            </span>
            <span className="text-[10px] text-blue-600 font-semibold">Additional Agro Income</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={wasteTypeFilter}
            onChange={(e) => setWasteTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
          >
            <option value="">All Waste Types</option>
            <option value="Bagasse">Sugarcane Bagasse</option>
            <option value="Wheat Straw">Wheat Straw</option>
            <option value="Rice Stubble">Rice Stubble</option>
            <option value="Cotton Stalks">Cotton Stalks</option>
            <option value="Biomass Compost">Biomass Compost</option>
          </select>

          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
          >
            <option value="">All Maharashtra Districts</option>
            <option value="Kolhapur">Kolhapur</option>
            <option value="Nashik">Nashik</option>
            <option value="Pune">Pune</option>
            <option value="Ahmednagar">Ahmednagar</option>
            <option value="Nagpur">Nagpur</option>
            <option value="Solapur">Solapur</option>
          </select>
        </div>

        <span className="text-xs font-bold text-slate-500">
          Showing {listings.length} Available Biomass Batches
        </span>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <LoadingSpinner text="Scanning farm biomass supply..." />
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <Recycle className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No biomass listings match your filter</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try resetting your filters or list the first agricultural residue batch to earn secondary farm revenue.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {item.waste_type}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    Moisture: {item.moisture_pct}%
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 leading-snug">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Available Supply
                    </span>
                    <strong className="text-slate-900 text-sm font-black">
                      {item.quantity_tons} Tons
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Price / Ton
                    </span>
                    <strong className="text-emerald-600 text-sm font-black">
                      ₹{item.price_per_ton?.toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {item.location_district || 'Maharashtra'} • {item.farmer_name || 'Verified Farmer'}
                  </span>
                </div>

                {item.suggested_use && (
                  <div className="text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                    <strong className="text-slate-700 font-bold">Recommended Use:</strong>{' '}
                    {item.suggested_use}
                  </div>
                )}
              </div>

              {/* Action Button */}
              {user?.role === 'buyer' && (
                <button
                  onClick={() => {
                    setSelectedListingForOrder(item);
                    setOrderQuantity(Math.min(10, item.quantity_tons));
                    setOrderPrice(item.price_per_ton);
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 mt-2"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Procure Biomass Batch</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Farmer Create Waste Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">List Farm Waste / Biomass</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Residue / Waste Type</label>
                <select
                  value={formData.waste_type}
                  onChange={(e) => setFormData({ ...formData, waste_type: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  <option value="Bagasse">Sugarcane Bagasse</option>
                  <option value="Wheat Straw">Wheat Straw</option>
                  <option value="Rice Stubble">Rice Stubble</option>
                  <option value="Cotton Stalks">Cotton Stalks</option>
                  <option value="Biomass Compost">Biomass Compost</option>
                  <option value="Other">Other Agro-Residue</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Listing Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Tons Available</label>
                  <input
                    type="number"
                    value={formData.quantity_tons}
                    onChange={(e) => setFormData({ ...formData, quantity_tons: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Price / Ton (₹)</label>
                  <input
                    type="number"
                    value={formData.price_per_ton}
                    onChange={(e) => setFormData({ ...formData, price_per_ton: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Moisture %</label>
                  <input
                    type="number"
                    value={formData.moisture_pct}
                    onChange={(e) => setFormData({ ...formData, moisture_pct: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">District Location</label>
                  <input
                    type="text"
                    value={formData.location_district}
                    onChange={(e) => setFormData({ ...formData, location_district: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Suggested Industrial Use</label>
                  <input
                    type="text"
                    value={formData.suggested_use}
                    onChange={(e) => setFormData({ ...formData, suggested_use: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Detailed Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Publish Residue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Buyer Purchase Modal */}
      {selectedListingForOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Procure Agricultural Biomass</h3>
              <button
                onClick={() => setSelectedListingForOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-slate-900">Biomass Purchase Order Sent!</h4>
                <p className="text-xs text-slate-500">The supplier has been notified for logistics coordination.</p>
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit} className="space-y-4">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Listing:</span>
                  <strong className="text-slate-800 block text-sm font-black">
                    {selectedListingForOrder.title}
                  </strong>
                  <span className="text-slate-500">
                    Max Available: {selectedListingForOrder.quantity_tons} Tons
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Order Quantity (Tons)</label>
                    <input
                      type="number"
                      max={selectedListingForOrder.quantity_tons}
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(e.target.value)}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Offered Price / Ton (₹)</label>
                    <input
                      type="number"
                      value={orderPrice}
                      onChange={(e) => setOrderPrice(e.target.value)}
                      className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Delivery & Logistics Notes</label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={2}
                    placeholder="e.g. Biofuel manufacturing plant pickup, truck dispatch arranged."
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900">Total Purchase Value:</span>
                  <strong className="text-emerald-700 text-sm font-black">
                    ₹{(orderQuantity * orderPrice).toLocaleString()}
                  </strong>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedListingForOrder(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={orderSubmitting}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    {orderSubmitting ? 'Placing Order...' : 'Confirm Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WasteMarketplace;
