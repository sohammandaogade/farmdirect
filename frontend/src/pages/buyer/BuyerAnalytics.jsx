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
} from 'recharts';
import { TrendingUp, ShoppingBag, Package, DollarSign, LineChart } from 'lucide-react';
import { analyticsAPI } from '../../services/api';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const BuyerAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getBuyer().then((res) => {
      if (res.data.success) setData(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Computing buyer analytics..." />;

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Intelligence</span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Procurement & Spend Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">Direct breakdown of purchases, commodities, and unit prices</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Expenditure"
          value={`₹${data?.total_spending?.toLocaleString() ?? 0}`}
          subtitle="Direct agricultural purchases"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Total Volume Fulfilled"
          value={`${data?.total_quantity?.toLocaleString() ?? 0} kg`}
          subtitle="Across all orders"
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Confirmed Orders"
          value={data?.total_orders ?? 0}
          subtitle={`${data?.current_orders ?? 0} active currently`}
          icon={ShoppingBag}
          color="amber"
        />
        <StatCard
          title="Active Requests"
          value={data?.active_requests ?? 0}
          subtitle="Pending negotiations"
          icon={TrendingUp}
          color="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Over Time */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Expenditure Timeline</h3>
          <p className="text-xs text-slate-400 mb-6">Cumulative procurement spend over dates</p>

          <div className="h-64 w-full">
            {data?.spending_timeline && data.spending_timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.spending_timeline}>
                  <defs>
                    <linearGradient id="buyerSpendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(v) => [`₹${v.toLocaleString()}`, 'Spent']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="spending" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#buyerSpendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Spend timeline will populate after orders.
              </div>
            )}
          </div>
        </div>

        {/* Average Purchase Price by Crop */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Average Purchase Price (₹/kg)</h3>
          <p className="text-xs text-slate-400 mb-6">Unit costs achieved through direct negotiation</p>

          <div className="h-64 w-full">
            {data?.avg_prices_by_crop && data.avg_prices_by_crop.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.avg_prices_by_crop}>
                  <XAxis dataKey="crop" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(v) => [`₹${v}/kg`, 'Average Price']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="avg_price" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No commodity unit pricing recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerAnalytics;
