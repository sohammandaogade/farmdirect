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

const WARM_ANALYTICS_COLORS = ['#8B7A66', '#FFE5B8', '#6F655B', '#403A34', '#AFA190', '#D97706'];

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
      <div className="pb-3 border-b border-[#E8E2D8]">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#5E5142] bg-[#FFE5B8] px-3 py-1 rounded-full border border-[#FED898]">
          Financial Analytics Engine
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#211C18] tracking-tight mt-2">
          Sales & Revenue Analytics
        </h1>
        <p className="text-xs sm:text-sm text-[#6F655B] mt-1">
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
          color="hawaiian"
        />
        <StatCard
          title="Total Quantity Sold"
          value={`${data?.quantity_sold?.toLocaleString('en-IN') ?? 0} kg`}
          subtitle="Fulfilled harvest delivered"
          icon={Package}
          color="mocassin"
        />
        <StatCard
          title="Total Orders Count"
          value={data?.total_orders ?? 0}
          subtitle={`${data?.active_orders ?? 0} active now`}
          icon={ShoppingCart}
          color="coffee"
        />
        <StatCard
          title="Active Listings"
          value={data?.active_listings ?? 0}
          subtitle={`Across ${data?.total_listings ?? 0} all-time`}
          icon={Sprout}
          color="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Timeline */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D8] shadow-card">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E8E2D8]">
            <div>
              <div className="flex items-center gap-2">
                <LineChart className="w-4 h-4 text-[#8B7A66]" />
                <h3 className="text-base font-bold text-[#211C18]">Revenue Realization Curve</h3>
              </div>
              <p className="text-xs text-[#6F655B] mt-0.5">Cumulative contract revenue settlements</p>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 bg-[#F5EBDD] text-[#5E5142] rounded-full border border-[#E8E2D8]">
              Live SQL Data
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {data?.revenue_timeline && data.revenue_timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenue_timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="warmAreaColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B7A66" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#FFE5B8" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5EBDD" vertical={false} />
                  <XAxis dataKey="date" stroke="#AFA190" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#AFA190" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#211C18',
                      borderRadius: '16px',
                      border: '1px solid #403A34',
                      color: '#FFF9F0',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#8B7A66" strokeWidth={3} fillOpacity={1} fill="url(#warmAreaColor)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#AFA190]">
                <LineChart className="w-8 h-8 stroke-[1.5] mb-2 text-[#D1C6B7]" />
                <p className="text-xs font-semibold text-[#6F655B]">No revenue data yet</p>
                <p className="text-[11px] text-[#AFA190] mt-0.5">Timeline data will populate after orders are fulfilled</p>
              </div>
            )}
          </div>
        </div>

        {/* Sales by Crop (Bar Chart) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D8] shadow-card">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E8E2D8]">
            <div>
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#8B7A66]" />
                <h3 className="text-base font-bold text-[#211C18]">Harvest Volume by Crop (kg)</h3>
              </div>
              <p className="text-xs text-[#6F655B] mt-0.5">Delivered tonnage per crop variety</p>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 bg-[#F5EBDD] text-[#5E5142] rounded-full border border-[#E8E2D8]">
              Harvest Distribution
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {data?.sales_by_crop && data.sales_by_crop.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.sales_by_crop} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5EBDD" vertical={false} />
                  <XAxis dataKey="crop" stroke="#AFA190" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#AFA190" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}kg`} />
                  <Tooltip
                    formatter={(v) => [`${Number(v).toLocaleString('en-IN')} kg`, 'Volume']}
                    contentStyle={{
                      backgroundColor: '#211C18',
                      borderRadius: '16px',
                      border: '1px solid #403A34',
                      color: '#FFF9F0',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="quantity" fill="#8B7A66" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#AFA190]">
                <Scale className="w-8 h-8 stroke-[1.5] mb-2 text-[#D1C6B7]" />
                <p className="text-xs font-semibold text-[#6F655B]">No volume records</p>
                <p className="text-[11px] text-[#AFA190] mt-0.5">Volumes will aggregate automatically from delivered orders</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerAnalytics;
