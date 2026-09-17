import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { TrendingUp, Package, ShoppingCart, Sprout, BarChart3 } from 'lucide-react';
import { analyticsAPI } from '../../services/api';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const FarmerAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getFarmer().then((res) => {
      if (res.data.success) setData(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Computing SQL analytics..." />;

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Performance</span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Sales & Revenue Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">Aggregated metrics calculated directly from database records</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Realized Revenue"
          value={`₹${data?.total_revenue?.toLocaleString() ?? 0}`}
          subtitle="Non-cancelled orders"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Total Quantity Sold"
          value={`${data?.quantity_sold?.toLocaleString() ?? 0} kg`}
          subtitle="Harvest delivered"
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Total Orders Count"
          value={data?.total_orders ?? 0}
          subtitle={`${data?.active_orders ?? 0} active now`}
          icon={ShoppingCart}
          color="amber"
        />
        <StatCard
          title="Active Listings"
          value={data?.active_listings ?? 0}
          subtitle={`Across ${data?.total_listings ?? 0} all-time`}
          icon={Sprout}
          color="violet"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Timeline */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Revenue Realization Timeline</h3>
          <p className="text-xs text-slate-400 mb-6">Cumulative contract revenues</p>

          <div className="h-64 w-full">
            {data?.revenue_timeline && data.revenue_timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenue_timeline}>
                  <defs>
                    <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#areaColor)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Timeline data will appear after orders.
              </div>
            )}
          </div>
        </div>

        {/* Sales by Crop (Bar Chart) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Harvest Volume by Crop (kg)</h3>
          <p className="text-xs text-slate-400 mb-6">Quantity traded per agricultural commodity</p>

          <div className="h-64 w-full">
            {data?.sales_by_crop && data.sales_by_crop.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.sales_by_crop}>
                  <XAxis dataKey="crop" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `${v} kg`} />
                  <Tooltip
                    formatter={(v) => [`${v.toLocaleString()} kg`, 'Volume']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="quantity" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No crop sales recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerAnalytics;
