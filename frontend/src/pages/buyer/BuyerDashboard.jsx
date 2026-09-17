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
} from 'recharts';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { analyticsAPI, ordersAPI, marketplaceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

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

      if (anRes.data.success) setAnalytics(anRes.data.data);
      if (ordRes.data.success) setCurrentOrders(ordRes.data.data.slice(0, 5));
      if (markRes.data.success) setRecommended(markRes.data.data.slice(0, 4));
    } catch (e) {
      console.error('Failed to load buyer dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading Commercial Buyer Portal..." />;

  const businessName = user?.buyer_profile?.business_name || `${user?.name} Enterprise`;

  return (
    <div className="space-y-8">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Commercial Buyer Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome, {businessName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Category: <strong className="text-slate-700">{user?.buyer_profile?.buyer_type || 'Restaurant'}</strong> • Operating in {user?.buyer_profile?.location || 'Pune'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/buyer/smart-match"
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Find Matches via AI</span>
          </Link>

          <Link
            to="/marketplace"
            className="py-2.5 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            Explore Market
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Requests"
          value={analytics?.active_requests ?? 0}
          subtitle="Offers pending farmer response"
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
          title="Total Spending"
          value={`₹${analytics?.total_spending?.toLocaleString() ?? 0}`}
          subtitle="Direct procurement spend"
          icon={TrendingUp}
          color="emerald"
        />

        <StatCard
          title="Purchased Produce"
          value={`${analytics?.total_quantity?.toLocaleString() ?? 0} kg`}
          subtitle="Total volume fulfilled"
          icon={Package}
          color="violet"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Over Time */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Procurement Spending Trend</h3>
              <p className="text-xs text-slate-400">Total expenditure from confirmed farm contracts</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
              Live Database Data
            </span>
          </div>

          <div className="h-64 w-full">
            {analytics?.spending_timeline && analytics.spending_timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.spending_timeline}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(v) => [`₹${v.toLocaleString()}`, 'Spend']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="spending" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#spendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Spend curve will display after confirmed orders.
              </div>
            )}
          </div>
        </div>

        {/* Spending by Crop Pie */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Spending by Crop</h3>
            <p className="text-xs text-slate-400">Portfolio allocation</p>
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
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {analytics.spending_by_crop.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`₹${v.toLocaleString()}`, 'Spent']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No orders placed yet.
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-24 overflow-y-auto text-xs">
            {analytics?.spending_by_crop?.map((item, idx) => (
              <div key={item.crop} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-semibold text-slate-700 capitalize">{item.crop}</span>
                </div>
                <span className="text-slate-500 font-medium">₹{item.spending?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Columns: Current Orders & Recommended Produce */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Active Orders */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Current Shipments</h3>
              <p className="text-xs text-slate-400">Active deliveries in transit</p>
            </div>
            <Link
              to="/buyer/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Track all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {currentOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No orders currently in flight.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {currentOrders.map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>#{ord.order_number}</span>
                      <span className="text-slate-400 font-normal">from {ord.farm_name || ord.farmer_name}</span>
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {ord.crop} • {ord.quantity?.toLocaleString()} kg • <strong className="text-slate-800">₹{ord.total_amount?.toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      {ord.status.replace('_', ' ')}
                    </span>
                    <Link
                      to="/buyer/orders"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Produce / Recent Marketplace additions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recommended Produce</h3>
              <p className="text-xs text-slate-400">Fresh harvest ready for direct procurement</p>
            </div>
            <Link
              to="/marketplace"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Explore all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommended.map((item) => (
              <Link
                key={item.id}
                to={`/marketplace/${item.id}`}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 transition-colors flex items-center gap-3 group"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400'}
                    alt={item.crop}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <div className="font-bold text-slate-800 capitalize truncate">{item.crop}</div>
                  <div className="text-[11px] text-slate-400 truncate">{item.farm_name || item.farmer_name} • {item.location}</div>
                  <div className="font-black text-emerald-700 mt-0.5">₹{item.expected_price}/{item.unit}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
