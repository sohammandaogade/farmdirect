import React, { useState, useEffect } from 'react';
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
  Legend,
} from 'recharts';
import { adminAPI } from '../../services/api';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Sprout, Store, TrendingUp, Package } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAnalytics().then((res) => {
      if (res.data.success) setData(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Computing platform trade intelligence..." />;

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Platform Intelligence</span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Macro Agricultural Trade Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">Platform-wide disintermediation metrics and volume distribution</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Traded Volume"
          value={`${data?.total_quantity_traded?.toLocaleString() ?? 0} kg`}
          subtitle="Direct farmer-buyer trade"
          icon={Package}
          color="emerald"
        />
        <StatCard
          title="Platform GMV"
          value={`₹${data?.total_transaction_value?.toLocaleString() ?? 0}`}
          subtitle="Contract transaction value"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Producers Enrolled"
          value={data?.total_farmers ?? 0}
          subtitle="Verified regional farms"
          icon={Sprout}
          color="amber"
        />
        <StatCard
          title="Commercial Buyers"
          value={data?.total_buyers ?? 0}
          subtitle="Restaurants & Wholesalers"
          icon={Store}
          color="violet"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crop Trade Volume */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Crop Trade Volume (kg)</h3>
          <p className="text-xs text-slate-400 mb-6">Aggregate commodities fulfilled</p>

          <div className="h-64 w-full">
            {data?.crop_stats && data.crop_stats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.crop_stats}>
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
                No orders data yet.
              </div>
            )}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Order Status Pipeline</h3>
          <p className="text-xs text-slate-400 mb-6">Distribution across lifecycle states</p>

          <div className="h-64 w-full">
            {data?.status_distribution && data.status_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.status_distribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {data.status_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [v, 'Orders']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No pipeline data yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
