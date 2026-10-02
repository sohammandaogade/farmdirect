import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShoppingBag,
  Truck,
  TrendingUp,
  Inbox,
  ArrowUpRight,
  Package,
  Store,
  Building2,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { analyticsAPI, ordersAPI, marketplaceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const BUYER_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

export const BuyerDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [currentOrders, setCurrentOrders] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [anRes, ordRes, markRes] = await Promise.all([
        analyticsAPI.getBuyer(),
        ordersAPI.getOrders(),
        marketplaceAPI.getListings({ sort: 'newest' }),
      ]);

      if (anRes.data?.success) setAnalytics(anRes.data.data);
      if (ordRes.data?.success) setCurrentOrders((ordRes.data.data || []).slice(0, 5));
      if (markRes.data?.success) setRecommended((markRes.data.data || []).slice(0, 4));
    } catch (e) {
      console.error('Failed to load buyer dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Compiling Commercial Procurement Center..." />;

  const businessName = user?.buyer_profile?.business_name || `${user?.name} Enterprise`;
  const buyerType = user?.buyer_profile?.buyer_type || 'Commercial Buyer';
  const location = user?.buyer_profile?.location || 'Maharashtra';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-elevated border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Building2 className="w-3.5 h-3.5" />
                {buyerType}
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>{location}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Welcome, {businessName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
              Direct farm-to-door procurement desk. Algorithmic matching connects your requirements directly with verified agricultural growers across Maharashtra.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/buyer/smart-match"
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-900/40 active:scale-95 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>AI Smart Match</span>
            </Link>

            <Link
              to="/marketplace"
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/15 backdrop-blur-md transition-all flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-blue-300" />
              <span>Explore Marketplace</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Requests"
          value={analytics?.active_requests ?? 0}
          subtitle="Offers pending grower review"
          icon={Inbox}
          color="blue"
        />

        <StatCard
          title="Current Orders"
          value={analytics?.current_orders ?? 0}
          subtitle="Shipments in delivery pipeline"
          icon={Truck}
          color="amber"
        />

        <StatCard
          title="Total Expenditure"
          value={`₹${analytics?.total_spending?.toLocaleString() ?? 0}`}
          subtitle="Direct disintermediated spend"
          icon={TrendingUp}
          color="emerald"
        />

        <StatCard
          title="Purchased Produce"
          value={`${analytics?.total_quantity?.toLocaleString() ?? 0} kg`}
          subtitle="Total volume sourced"
          icon={Package}
          color="violet"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Over Time */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Procurement Spending Trend</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Historical outlay from confirmed farm supply contracts</p>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200/60">
              Live Database
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {analytics?.spending_timeline && analytics.spending_timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.spending_timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(v) => [`₹${v.toLocaleString()}`, 'Direct Spend']}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                  />
                  <Area type="monotone" dataKey="spending" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#spendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <TrendingUp className="w-8 h-8 stroke-[1.5] mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No spend records yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">Your expenditure graph will populate automatically after your first confirmed shipment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Spending by Crop Pie */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Crop Allocation</h3>
            </div>
            <p className="text-xs text-slate-400">Procurement budget per commodity</p>
          </div>

          <div className="h-52 w-full my-2">
            {analytics?.spending_by_crop && analytics.spending_by_crop.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.spending_by_crop}
                    dataKey="spending"
                    nameKey="crop"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {analytics.spending_by_crop.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BUYER_COLORS[index % BUYER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`₹${v.toLocaleString()}`, 'Expenditure']}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                <Package className="w-7 h-7 stroke-[1.5] mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No crop allocation yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Place orders to see portfolio distribution</p>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100 max-h-28 overflow-y-auto text-xs">
            {analytics?.spending_by_crop?.map((item, idx) => (
              <div key={item.crop} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: BUYER_COLORS[idx % BUYER_COLORS.length] }} />
                  <span className="font-bold text-slate-800 capitalize truncate max-w-[120px]">{item.crop}</span>
                </div>
                <span className="text-slate-600 font-extrabold tabular-nums">₹{item.spending?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Columns: Current Orders & Recommended Produce */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Active Orders */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-600" />
                  <h3 className="text-base font-bold text-slate-900">Current Shipments</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Active farm deliveries in transit</p>
              </div>
              <Link
                to="/buyer/orders"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                <span>Track all</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {currentOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Truck className="w-8 h-8 stroke-[1.5] mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No active shipments</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Confirmed purchase orders will show live delivery status here</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {currentOrders.map((ord) => (
                  <div key={ord.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 truncate">
                        <span className="font-mono text-slate-700">#{ord.order_number}</span>
                        <span className="text-slate-400 font-normal truncate">from {ord.farm_name || ord.farmer_name}</span>
                      </div>
                      <div className="text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="capitalize font-semibold text-slate-700">{ord.crop}</span>
                        <span>•</span>
                        <span>{ord.quantity?.toLocaleString()} kg</span>
                        <span>•</span>
                        <strong className="text-slate-900 font-black">₹{ord.total_amount?.toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/80">
                        {ord.status?.replace('_', ' ')}
                      </span>
                      <Link
                        to="/buyer/orders"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        title="View Shipment Details"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recommended Fresh Produce additions */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">Recommended Harvest</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Fresh produce ready for immediate contract</p>
              </div>
              <Link
                to="/marketplace"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
              >
                <span>Explore all</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {recommended.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingBag className="w-8 h-8 stroke-[1.5] mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No listings found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Explore the marketplace to discover active crops</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommended.map((item) => (
                  <Link
                    key={item.id}
                    to={`/marketplace/${item.id}`}
                    className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 rounded-2xl border border-slate-200/70 transition-all flex items-center gap-3.5 group"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400'}
                        alt={item.crop}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="font-bold text-slate-900 capitalize truncate group-hover:text-emerald-700 transition-colors">
                        {item.crop}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.farm_name || item.farmer_name} • {item.location}
                      </div>
                      <div className="font-black text-emerald-700 mt-1 tabular-nums">
                        ₹{item.expected_price}/{item.unit || 'kg'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
