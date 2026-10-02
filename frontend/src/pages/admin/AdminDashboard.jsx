import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Sprout,
  Store,
  Truck,
  TrendingUp,
  Package,
  Layers,
  ArrowUpRight,
  Sparkles,
  MapPin,
  Zap,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Sliders
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
import { adminAPI, commandCenterAPI } from '../../services/api';

const ADMIN_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [commandMetrics, setCommandMetrics] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [anRes, uRes, oRes, cmdRes] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getUsers(),
        adminAPI.getOrders(),
        commandCenterAPI.getMetrics().catch(() => ({ data: { success: false } })),
      ]);

      if (anRes.data?.success) setAnalytics(anRes.data.data);
      if (uRes.data?.success) setRecentUsers((uRes.data.data || []).slice(0, 5));
      if (oRes.data?.success) setRecentOrders((oRes.data.data || []).slice(0, 5));
      if (cmdRes.data?.success) setCommandMetrics(cmdRes.data);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Compiling Platform Command Center..." />;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200/60">
              System Administration
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1.5">
            Platform Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time oversight of direct-to-buyer network health, participants, GMV, and systemic integrity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/users"
            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-subtle transition-all flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-slate-400" />
            <span>Manage Users</span>
          </Link>
          <Link
            to="/admin/market-intelligence"
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Macro Heatmap</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Registered Farmers"
          value={analytics?.total_farmers ?? 0}
          subtitle="Direct agricultural producers"
          icon={Sprout}
          color="emerald"
        />

        <StatCard
          title="Commercial Buyers"
          value={analytics?.total_buyers ?? 0}
          subtitle="Restaurants, retail & processors"
          icon={Store}
          color="blue"
        />

        <StatCard
          title="Traded Volume"
          value={`${analytics?.total_quantity_traded?.toLocaleString() ?? 0} kg`}
          subtitle="Fulfilled direct crop volume"
          icon={Package}
          color="amber"
        />

        <StatCard
          title="Gross Transaction Value"
          value={`₹${analytics?.total_transaction_value?.toLocaleString() ?? 0}`}
          subtitle="Disintermediated market GMV"
          icon={TrendingUp}
          color="violet"
        />
      </div>

      {/* AI Market Command Center Quick Launch Hub */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 p-6 sm:p-8 text-white space-y-6 shadow-elevated border border-purple-900/30">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                AI Market Intelligence Suite
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1 text-white">
              Macroeconomic Modeling & Market Integrity Sentinel
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Geographic price-supply heatmaps, policy stress simulator, and automated algorithmic fraud surveillance.
            </p>
          </div>
        </div>

        {/* 3 Quick Launch Action Cards */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/market-intelligence"
            className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all space-y-3 group hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Supply-Demand Heatmap</span>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Regional price disparity and harvest density across 36 Maharashtra districts.
              </p>
            </div>
          </Link>

          <Link
            to="/admin/simulator"
            className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all space-y-3 group hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>What-If Stress Simulator</span>
                <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Simulate diesel tariff shocks, monsoon delays, and crop price elasticities.
              </p>
            </div>
          </Link>

          <Link
            to="/admin/anomalies"
            className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all space-y-3 group hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Fraud & Anomaly Sentinel</span>
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Audit anomalous bid patterns, wash trading rings, and suspicious rating velocity.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Traded Crops Bar Chart */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Top Crops by Volume</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Disintermediated harvest weight (kg)</p>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/60">
              Database Aggregate
            </span>
          </div>

          <div className="h-64 w-full">
            {analytics?.top_crops && analytics.top_crops.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.top_crops} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="crop" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}kg`} />
                  <Tooltip
                    formatter={(v) => [`${v.toLocaleString()} kg`, 'Traded Weight']}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="quantity" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Package className="w-8 h-8 stroke-[1.5] mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No crop volume data</p>
                <p className="text-[11px] text-slate-400 mt-1">Produce metrics will aggregate as trades conclude</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Status Distribution Pie */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900">Platform Order Pipeline</h3>
            </div>
            <p className="text-xs text-slate-400">Status breakdown of current orders</p>
          </div>

          <div className="h-52 w-full my-2">
            {analytics?.orders_by_status && analytics.orders_by_status.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.orders_by_status}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {analytics.orders_by_status.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ADMIN_COLORS[index % ADMIN_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [v, 'Orders']}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                <Layers className="w-7 h-7 stroke-[1.5] mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No orders recorded</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Status breakdown appears here</p>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100 max-h-24 overflow-y-auto text-xs">
            {analytics?.orders_by_status?.map((item, idx) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ADMIN_COLORS[idx % ADMIN_COLORS.length] }} />
                  <span className="font-bold text-slate-800 uppercase text-[11px]">{item.status.replace('_', ' ')}</span>
                </div>
                <span className="text-slate-600 font-extrabold tabular-nums">{item.count} orders</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Users & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Recent Registrations</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Newly onboarded market participants</p>
            </div>
            <Link
              to="/admin/users"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {recentUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Users className="w-8 h-8 stroke-[1.5] mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentUsers.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black text-xs shrink-0">
                      {u.name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{u.name}</div>
                      <div className="text-slate-400 text-[11px] truncate">{u.email}</div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      u.role === 'farmer'
                        ? 'bg-amber-100 text-amber-800'
                        : u.role === 'buyer'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Platform Orders</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Live platform transactions and settlements</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Truck className="w-8 h-8 stroke-[1.5] mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No platform transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 truncate">
                      <span className="font-mono">#{ord.order_number}</span>
                      <span className="text-slate-400 font-normal truncate">• {ord.crop}</span>
                    </div>
                    <div className="text-slate-500 text-[11px] truncate">
                      {ord.farmer_name} → {ord.buyer_name}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-black text-slate-900 tabular-nums">₹{ord.total_amount?.toLocaleString()}</div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {ord.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
