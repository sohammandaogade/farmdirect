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
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Package, ShoppingCart, Sprout, BarChart3, LineChart, Scale } from 'lucide-react';
import { analyticsAPI } from '../../services/api';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const FarmerAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getFarmer().then((res) => {
      if (res.data?.success) setData(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Computing SQL sales analytics..." />;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
          Financial Intelligence
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1.5">
          Sales & Revenue Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Historical yield monetization, crop revenue distribution, and realized payment settlements.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Realized Revenue"
          value={`₹${data?.total_revenue?.toLocaleString('en-IN') ?? 0}`}
          subtitle="Non-cancelled orders"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Total Quantity Sold"
          value={`${data?.quantity_sold?.toLocaleString('en-IN') ?? 0} kg`}
          subtitle="Fulfilled harvest delivered"
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
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <LineChart className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Revenue Realization Curve</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Cumulative contract revenue settlements</p>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/60">
              Live SQL Data
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {data?.revenue_timeline && data.revenue_timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenue_timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#areaColor)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <LineChart className="w-8 h-8 stroke-[1.5] mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No revenue data yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Timeline data will populate after orders are fulfilled</p>
              </div>
            )}
          </div>
        </div>

        {/* Sales by Crop (Bar Chart) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Harvest Volume by Crop (kg)</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Delivered tonnage per crop variety</p>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200/60">
              Harvest Distribution
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {data?.sales_by_crop && data.sales_by_crop.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.sales_by_crop} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="crop" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}kg`} />
                  <Tooltip
                    formatter={(v) => [`${Number(v).toLocaleString('en-IN')} kg`, 'Volume']}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="quantity" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Scale className="w-8 h-8 stroke-[1.5] mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No crop volume data</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Produce metrics will populate once shipments complete</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerAnalytics;
