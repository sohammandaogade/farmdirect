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
} from 'recharts';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminAPI, commandCenterAPI } from '../../services/api';
import { Sparkles, MapPin, Zap, ShieldAlert, ArrowRight } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

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

      if (anRes.data.success) setAnalytics(anRes.data.data);
      if (uRes.data.success) setRecentUsers(uRes.data.data.slice(0, 5));
      if (oRes.data.success) setRecentOrders(oRes.data.data.slice(0, 5));
      if (cmdRes.data?.success) setCommandMetrics(cmdRes.data);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Compiling platform-wide metrics..." />;

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Platform Oversight</span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Marketplace Administration</h1>
        <p className="text-xs text-slate-500 mt-1">Direct-to-buyer network health, participants, and trade metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Farmers"
          value={analytics?.total_farmers ?? 0}
          subtitle="Registered agricultural producers"
          icon={Sprout}
          color="emerald"
        />

        <StatCard
          title="Total Buyers"
          value={analytics?.total_buyers ?? 0}
          subtitle="Restaurants, retailers, processors"
          icon={Store}
          color="blue"
        />

        <StatCard
          title="Traded Volume"
          value={`${analytics?.total_quantity_traded?.toLocaleString() ?? 0} kg`}
          subtitle="Fulfilled direct harvest"
          icon={Package}
          color="amber"
        />

        <StatCard
          title="Gross Transaction Value"
          value={`₹${analytics?.total_transaction_value?.toLocaleString() ?? 0}`}
          subtitle="Disintermediated GMV"
          icon={TrendingUp}
          color="violet"
        />
      </div>

      {/* AI Market Command Center Quick Launch Hub */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                AI Market Command Center
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight mt-1">
              Macro Intelligence & Market Integrity Sentinel
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Live geographic heatmaps, macroeconomic stress simulator, and fraud auditing
            </p>
          </div>
        </div>

        {/* 3 Quick Launch Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/market-intelligence"
            className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Supply-Demand Heatmap</span>
                <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Geographic volume, price bands, and risk clusters across 6 Maharashtra districts
              </p>
            </div>
          </Link>

          <Link
            to="/admin/simulator"
            className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>What-If Stress Simulator</span>
                <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Stress-test demand spikes, diesel fuel shocks, and monsoon rainfall delays
              </p>
            </div>
          </Link>

          <Link
            to="/admin/anomalies"
            className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Anomaly & Fraud Audit</span>
                <ArrowRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Real-time review queue for price outliers and duplicate produce listings
              </p>
            </div>
          </Link>
        </div>

        {/* AI Recommendations Banner */}
        {commandMetrics?.ai_strategic_recommendations && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
              Active Macro Strategic Insights:
            </span>
            <ul className="space-y-1 text-xs text-slate-200">
              {commandMetrics.ai_strategic_recommendations.map((rec, rIdx) => (
                <li key={rIdx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crop Demand Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Crop Trade Volume</h3>
              <p className="text-xs text-slate-400">Total kilograms traded per crop across marketplace</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
              Live Database Data
            </span>
          </div>

          <div className="h-64 w-full">
            {analytics?.crop_stats && analytics.crop_stats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.crop_stats}>
                  <XAxis dataKey="crop" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `${v} kg`} />
                  <Tooltip
                    formatter={(v) => [`${v.toLocaleString()} kg`, 'Volume']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="volume_kg" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Crop trade metrics will populate as orders complete.
              </div>
            )}
          </div>
        </div>

        {/* Regional Volume Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Regional Distribution</h3>
            <p className="text-xs text-slate-400">Trade origin by agricultural cluster</p>
          </div>

          <div className="h-52 w-full my-2">
            {analytics?.regional_distribution && analytics.regional_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.regional_distribution}
                    dataKey="volume_kg"
                    nameKey="region"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {analytics.regional_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`${v.toLocaleString()} kg`, 'Volume']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No regional data.
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-24 overflow-y-auto text-xs">
            {analytics?.regional_distribution?.map((item, idx) => (
              <div key={item.region} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-semibold text-slate-700">{item.region}</span>
                </div>
                <span className="text-slate-500 font-medium">{item.volume_kg?.toLocaleString()} kg</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Users & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registered Users */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Platform Participants</h3>
              <p className="text-xs text-slate-400">Farmers and buyers registered</p>
            </div>
            <Link
              to="/admin/users"
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentUsers.map((u) => (
              <div key={u.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">{u.name}</div>
                  <div className="text-[11px] text-slate-400">{u.email}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    u.role === 'farmer' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Marketplace Contracts</h3>
              <p className="text-xs text-slate-400">Auditable transaction log</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentOrders.map((o) => (
              <div key={o.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">{o.order_number} • {o.crop}</div>
                  <div className="text-[11px] text-slate-400">
                    {o.farmer_name} → {o.buyer_name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-emerald-700">₹{o.total_amount?.toLocaleString()}</div>
                  <span className="text-[10px] text-slate-400">{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
