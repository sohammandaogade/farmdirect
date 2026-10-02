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
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Wallet,
  Receipt,
  Scale,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { analyticsAPI } from '../../services/api';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

export const BuyerAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await analyticsAPI.getBuyer();
      if (res.data?.success) {
        setData(res.data.data);
      } else {
        setError('Failed to compute procurement metrics.');
      }
    } catch (err) {
      console.error('Failed to load buyer analytics:', err);
      setError('Unable to reach analytics service. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Computing procurement spend analytics..." />;

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Analytics Unavailable</h3>
        <p className="text-xs text-slate-500">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
        >
          Retry
        </button>
      </div>
    );
  }

  const hasSpendingData = data?.spending_timeline && data.spending_timeline.length > 0;
  const hasCropData = data?.spending_by_crop && data.spending_by_crop.length > 0;
  const hasPriceData = data?.avg_prices_by_crop && data.avg_prices_by_crop.length > 0;

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          Commercial Procurement Intelligence
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
          Spend Analysis & Budget Summary
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time expenditure tracking, commodity volume distribution, and direct contract unit rates
        </p>
      </div>

      {/* KPI Cards (All in ₹ and Indian formatting, no $ symbols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Expenditure"
          value={`₹${(data?.total_spending || 0).toLocaleString('en-IN')}`}
          subtitle="Direct agricultural procurement"
          icon={Wallet}
          color="emerald"
        />
        <StatCard
          title="Total Volume Fulfilled"
          value={`${(data?.total_quantity || 0).toLocaleString('en-IN')} kg`}
          subtitle="Across confirmed farm deliveries"
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Confirmed Orders"
          value={data?.total_orders ?? 0}
          subtitle={`${data?.current_orders ?? 0} active in transit`}
          icon={ShoppingBag}
          color="amber"
        />
        <StatCard
          title="Active Requests"
          value={data?.active_requests ?? 0}
          subtitle="Negotiations awaiting confirmation"
          icon={Receipt}
          color="violet"
        />
      </div>

      {/* Primary Graphs Row: Spend Timeline & Spending by Crop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Over Time (Area Chart) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cumulative Spend Timeline</h3>
              <p className="text-xs text-slate-400">Total expenditure from finalized farm contracts over dates</p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
              Verified Order Data
            </span>
          </div>

          <div className="h-64 w-full">
            {hasSpendingData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.spending_timeline}>
                  <defs>
                    <linearGradient id="buyerSpendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`}
                  />
                  <Tooltip
                    formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Expenditure']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="spending"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#buyerSpendGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Expenditure curve will populate after orders are confirmed.
              </div>
            )}
          </div>
        </div>

        {/* Spending Allocation by Crop (Donut Pie Chart) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Spending by Commodity</h3>
            <p className="text-xs text-slate-400">Portfolio allocation across crops</p>
          </div>

          <div className="h-52 w-full my-2">
            {hasCropData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.spending_by_crop}
                    dataKey="spending"
                    nameKey="crop"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {data.spending_by_crop.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Expenditure']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No commodity purchases recorded yet.
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-28 overflow-y-auto text-xs">
            {data?.spending_by_crop?.map((item, idx) => (
              <div key={item.crop} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="font-semibold text-slate-700 capitalize truncate">{item.crop}</span>
                </div>
                <span className="text-slate-600 font-bold shrink-0">
                  ₹{Number(item.spending).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Graphs Row: Purchase Volumes & Average Negotiated Prices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quantity Traded by Crop */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Procured Volume by Crop (kg)</h3>
              <p className="text-xs text-slate-400">Total volume purchased per agricultural category</p>
            </div>
            <Scale className="w-4 h-4 text-blue-500" />
          </div>

          <div className="h-64 w-full">
            {hasCropData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.spending_by_crop}>
                  <XAxis dataKey="crop" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `${Number(v).toLocaleString('en-IN')} kg`}
                  />
                  <Tooltip
                    formatter={(v, name) => [
                      name === 'quantity' ? `${Number(v).toLocaleString('en-IN')} kg` : v,
                      name === 'quantity' ? 'Volume' : 'Orders',
                    ]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="quantity" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No volume fulfilled yet.
              </div>
            )}
          </div>
        </div>

        {/* Average Purchase Price (₹/kg) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Average Unit Price Achieved (₹/kg)</h3>
              <p className="text-xs text-slate-400">Effective unit costs achieved via direct farmer negotiations</p>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="h-64 w-full">
            {hasPriceData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.avg_prices_by_crop}>
                  <XAxis dataKey="crop" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}/kg`, 'Average Price']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="avg_price" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Unit price records will appear after transactions.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerAnalytics;
