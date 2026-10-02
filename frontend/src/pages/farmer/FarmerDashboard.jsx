import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  Truck,
  TrendingUp,
  Package,
  PlusCircle,
  ArrowUpRight,
  Inbox,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Clock,
  Layers,
  ChevronRight,
  AlertCircle
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
import SteppedStageChart from '../../components/SteppedStageChart';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { analyticsAPI, requestsAPI, ordersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CROP_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

export const FarmerDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [anRes, reqRes, ordRes] = await Promise.all([
        analyticsAPI.getFarmer(),
        requestsAPI.getRequests(),
        ordersAPI.getOrders(),
      ]);

      if (anRes.data?.success) setAnalytics(anRes.data.data);
      if (reqRes.data?.success) setRecentRequests((reqRes.data.data || []).slice(0, 5));
      if (ordRes.data?.success) setRecentOrders((ordRes.data.data || []).slice(0, 5));
    } catch (e) {
      console.error('Failed to load farmer dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading Farmer Command Center..." />;

  const farmName = user?.farmer_profile?.farm_name || `${user?.name}'s Farm`;
  const location = user?.farmer_profile?.location || 'Maharashtra';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Hero Command Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 shadow-elevated border border-emerald-900/30">
        {/* Subtle background ambient mesh */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Producer
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-slate-300 border border-white/10">
                {location}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Welcome back, {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
              Operating <strong className="text-emerald-300 font-semibold">{farmName}</strong>. Your harvest inventory is live on the direct B2B commodity exchange.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/farmer/listings/new"
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-900/40 active:scale-95 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List New Harvest</span>
            </Link>

            <Link
              to="/farmer/copilot"
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/15 backdrop-blur-md transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>AI Farm Advisory</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Listings"
          value={analytics?.active_listings ?? 0}
          subtitle={`Total ${analytics?.total_listings ?? 0} listed in catalog`}
          icon={Sprout}
          color="emerald"
        />

        <StatCard
          title="Active Orders"
          value={analytics?.active_orders ?? 0}
          subtitle="Shipments in fulfillment"
          icon={Truck}
          color="blue"
        />

        <StatCard
          title="Quantity Sold"
          value={`${analytics?.quantity_sold?.toLocaleString() ?? 0} kg`}
          subtitle="Fulfilled direct trade volume"
          icon={Package}
          color="amber"
        />

        <StatCard
          title="Total Realized Revenue"
          value={`₹${analytics?.total_revenue?.toLocaleString() ?? 0}`}
          subtitle="Direct payment settlements"
          icon={TrendingUp}
          color="violet"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Over Time Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Revenue Performance</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Historical and current order realizations</p>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/60">
              Live Database
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {analytics?.revenue_timeline && analytics.revenue_timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.revenue_timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Settled Revenue']}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <TrendingUp className="w-8 h-8 stroke-[1.5] mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No revenue data yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">Your revenue timeline will display automatically as orders are accepted and completed.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sales by Crop Donut Chart */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sprout className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Crop Portfolio Share</h3>
            </div>
            <p className="text-xs text-slate-400">Revenue contribution per crop</p>
          </div>

          <div className="h-52 w-full my-2">
            {analytics?.sales_by_crop && analytics.sales_by_crop.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.sales_by_crop}
                    dataKey="revenue"
                    nameKey="crop"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {analytics.sales_by_crop.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CROP_COLORS[index % CROP_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                <Sprout className="w-7 h-7 stroke-[1.5] mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No crop sales recorded</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Produce breakdown appears here</p>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100 max-h-28 overflow-y-auto text-xs">
            {analytics?.sales_by_crop?.map((item, idx) => (
              <div key={item.crop} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CROP_COLORS[idx % CROP_COLORS.length] }} />
                  <span className="font-bold text-slate-800 capitalize truncate max-w-[120px]">{item.crop}</span>
                </div>
                <span className="text-slate-600 font-extrabold tabular-nums">₹{item.revenue?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Order Fulfillment Lifecycle Stepped Funnel */}
      {analytics?.status_distribution && analytics.status_distribution.length > 0 && (
        <SteppedStageChart
          title="Harvest Order Fulfillment Pipeline"
          subtitle="Real-time order stage progression from placement to confirmed delivery"
          stages={analytics.status_distribution}
          totalCount={analytics.total_orders}
          unit="orders"
        />
      )}

      {/* Tables Row: Inbound Purchase Requests & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Purchase Requests */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Inbound Purchase Requests</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Offers and counter-offers awaiting action</p>
              </div>
              <Link
                to="/farmer/requests"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {recentRequests.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Inbox className="w-8 h-8 stroke-[1.5] mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No active purchase requests</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Buyer offers for your crops will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentRequests.map((req) => (
                  <div key={req.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 truncate">
                        {req.buyer_business || req.buyer_name}
                      </div>
                      <div className="text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="capitalize font-semibold text-slate-700">{req.crop}</span>
                        <span>•</span>
                        <span>{req.requested_quantity?.toLocaleString()} kg</span>
                        <span>•</span>
                        <span className="font-black text-emerald-700">₹{req.offered_price}/kg</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          req.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'NEGOTIATING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {req.status}
                      </span>
                      <Link
                        to={`/farmer/negotiations/${req.id}`}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors"
                        title="Open Negotiation"
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

        {/* Recent Confirmed Orders */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">Recent Confirmed Orders</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Active fulfillment & delivery pipeline</p>
              </div>
              <Link
                to="/farmer/orders"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Truck className="w-8 h-8 stroke-[1.5] mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No confirmed orders yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Accepted deals will convert into shipments here</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentOrders.map((ord) => (
                  <div key={ord.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5 truncate">
                        <span className="font-mono text-slate-700">#{ord.order_number}</span>
                        <span className="text-slate-400 font-normal truncate">to {ord.buyer_business || ord.buyer_name}</span>
                      </div>
                      <div className="text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="capitalize font-semibold text-slate-700">{ord.crop}</span>
                        <span>•</span>
                        <span>{ord.quantity?.toLocaleString()} kg</span>
                        <span>•</span>
                        <strong className="text-emerald-700 font-black">₹{ord.total_amount?.toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                        {ord.status?.replace('_', ' ')}
                      </span>
                      <Link
                        to="/farmer/orders"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors"
                        title="View Order"
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
      </div>
    </div>
  );
};

export default FarmerDashboard;
