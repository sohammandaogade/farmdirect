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
  BarChart,
  Bar,
} from 'recharts';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { analyticsAPI, requestsAPI, ordersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

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

      if (anRes.data.success) setAnalytics(anRes.data.data);
      if (reqRes.data.success) setRecentRequests(reqRes.data.data.slice(0, 5));
      if (ordRes.data.success) setRecentOrders(ordRes.data.data.slice(0, 5));
    } catch (e) {
      console.error('Failed to load farmer dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading Farmer Dashboard..." />;

  const farmName = user?.farmer_profile?.farm_name || `${user?.name}'s Farm`;

  return (
    <div className="space-y-8">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Farmer Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Managing <strong className="text-slate-700">{farmName}</strong> in {user?.farmer_profile?.location || 'Maharashtra'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/farmer/listings/new"
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Quick Add Produce</span>
          </Link>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Listings"
          value={analytics?.active_listings ?? 0}
          subtitle={`Total ${analytics?.total_listings ?? 0} listed`}
          icon={Sprout}
          color="emerald"
        />

        <StatCard
          title="Active Orders"
          value={analytics?.active_orders ?? 0}
          subtitle="Orders in progress"
          icon={Truck}
          color="blue"
        />

        <StatCard
          title="Quantity Sold"
          value={`${analytics?.quantity_sold?.toLocaleString() ?? 0} kg`}
          subtitle="Completed trade volume"
          icon={Package}
          color="amber"
        />

        <StatCard
          title="Total Revenue"
          value={`₹${analytics?.total_revenue?.toLocaleString() ?? 0}`}
          subtitle="Realized direct payments"
          icon={TrendingUp}
          color="violet"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Over Time Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue Performance</h3>
              <p className="text-xs text-slate-400">Order revenue over time</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
              Live Database Data
            </span>
          </div>

          <div className="h-64 w-full">
            {analytics?.revenue_timeline && analytics.revenue_timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.revenue_timeline}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Revenue trends will populate after confirmed orders.
              </div>
            )}
          </div>
        </div>

        {/* Sales by Crop Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Sales by Crop</h3>
            <p className="text-xs text-slate-400">Revenue share breakdown</p>
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
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {analytics.sales_by_crop.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No crop sales recorded yet.
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-24 overflow-y-auto text-xs">
            {analytics?.sales_by_crop?.map((item, idx) => (
              <div key={item.crop} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-semibold text-slate-700 capitalize">{item.crop}</span>
                </div>
                <span className="text-slate-500 font-medium">₹{item.revenue?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Order Fulfillment Lifecycle Breakdown */}
      {analytics?.status_distribution && analytics.status_distribution.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Order Fulfillment Lifecycle</h3>
              <p className="text-xs text-slate-400">Current live order stages from database records</p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              {analytics.total_orders} Total Orders
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {analytics.status_distribution.map((st) => (
              <div key={st.status} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  {st.status.replace('_', ' ')}
                </span>
                <span className="text-xl font-black text-slate-900 block mt-1">
                  {st.count}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 block mt-0.5">
                  {analytics.total_orders > 0 ? Math.round((st.count / analytics.total_orders) * 100) : 0}% of pipeline
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tables Row: Inbound Purchase Requests & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Purchase Requests */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Purchase Requests</h3>
              <p className="text-xs text-slate-400">Buyer offers requiring your response</p>
            </div>
            <Link
              to="/farmer/requests"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No inbound requests right now.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentRequests.map((req) => (
                <div key={req.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">
                      {req.buyer_business || req.buyer_name}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {req.crop} • {req.requested_quantity?.toLocaleString()} kg @ <strong className="text-slate-800">₹{req.offered_price}/kg</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
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
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Confirmed Orders</h3>
              <p className="text-xs text-slate-400">Shipments and fulfillment</p>
            </div>
            <Link
              to="/farmer/orders"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No orders generated yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>#{ord.order_number}</span>
                      <span className="text-slate-400 font-normal">to {ord.buyer_business || ord.buyer_name}</span>
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      {ord.crop} • {ord.quantity?.toLocaleString()} kg • <strong className="text-emerald-700">₹{ord.total_amount?.toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {ord.status.replace('_', ' ')}
                    </span>
                    <Link
                      to="/farmer/orders"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors"
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
  );
};

export default FarmerDashboard;
