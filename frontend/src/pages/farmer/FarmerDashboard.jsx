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

// Warm Agritech Palette for Charts (Hawaiian Shack & Mocassin harmony)
const WARM_CHART_COLORS = ['#8B7A66', '#FFE5B8', '#6F655B', '#403A34', '#AFA190', '#D97706', '#E2A74F'];

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

  if (loading) return <LoadingSpinner text="Compiling Producer Operations..." />;

  const farmName = user?.farmer_profile?.farm_name || `${user?.name}'s Farm`;
  const location = user?.farmer_profile?.location || 'Maharashtra';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Editorial Opening Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#211C18] via-[#332A22] to-[#211C18] text-white p-6 sm:p-9 shadow-elevated border border-[#6F655B]/30">
        {/* Subtle warm ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFE5B8]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#8B7A66]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#FFE5B8]/15 text-[#FFE5B8] border border-[#FFE5B8]/25">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FFE5B8]" />
                Verified Producer
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-[#F5EBDD] border border-white/10">
                {location}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Welcome back, {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#F5EBDD] max-w-2xl font-normal leading-relaxed">
              Operating <strong className="text-[#FFE5B8] font-semibold">{farmName}</strong>. Your harvest inventory is live on the direct B2B commodity exchange.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/farmer/listings/new"
              className="px-5 py-3 btn-hawaiian-primary font-bold text-xs rounded-2xl shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List New Harvest</span>
            </Link>

            <Link
              to="/farmer/copilot"
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-2xl border border-white/15 backdrop-blur-md transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#FFE5B8]" />
              <span>AI Farm Advisory</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Asymmetric Editorial KPI Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Large Featured Revenue Card */}
        <div className="lg:col-span-2 group relative bg-gradient-to-br from-[#332A22] to-[#211C18] text-white rounded-3xl p-6 sm:p-7 border border-[#6F655B]/40 shadow-card flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFE5B8]/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#FFE5B8] block">
                Primary Financial Metric
              </span>
              <h4 className="text-sm font-bold text-[#F5EBDD] mt-0.5">
                Total Realized Revenue
              </h4>
            </div>
            <div className="p-3 rounded-2xl bg-white/10 border border-white/15 text-[#FFE5B8]">
              <TrendingUp className="w-6 h-6 stroke-[2]" />
            </div>
          </div>

          <div className="my-5 relative z-10">
            <div className="text-3xl sm:text-5xl font-black tracking-tight text-white tabular-nums">
              ₹{analytics?.total_revenue?.toLocaleString() ?? 0}
            </div>
            <p className="text-xs text-[#F5EBDD]/80 mt-1 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FFE5B8] animate-pulse" />
              <span>Settled through direct bank settlement • Zero platform commission deducted</span>
            </p>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#F5EBDD] relative z-10">
            <span>Fulfilled volume: <strong>{analytics?.quantity_sold?.toLocaleString() ?? 0} kg</strong></span>
            <Link to="/farmer/analytics" className="text-[#FFE5B8] font-bold hover:underline flex items-center gap-1">
              <span>View Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Compact Metric 1: Active Listings */}
        <StatCard
          title="Active Listings"
          value={analytics?.active_listings ?? 0}
          subtitle={`Total ${analytics?.total_listings ?? 0} in catalog`}
          icon={Sprout}
          color="hawaiian"
        />

        {/* Compact Metric 2: Shipments */}
        <StatCard
          title="Active Shipments"
          value={analytics?.active_orders ?? 0}
          subtitle="Orders in active transit"
          icon={Truck}
          color="mocassin"
        />
      </div>

      {/* Analytics Charts Row: Warm Surfaces */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Realization Timeline */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D8] shadow-card">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E8E2D8]">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF9ED] border border-[#FED898] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#8B7A66]" />
                </div>
                <h3 className="text-base font-bold text-[#211C18]">Revenue Performance</h3>
              </div>
              <p className="text-xs text-[#6F655B] mt-0.5">Historical and current order realizations</p>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 bg-[#F5EBDD] text-[#5E5142] rounded-full border border-[#E8E2D8]">
              Live Database
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {analytics?.revenue_timeline && analytics.revenue_timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.revenue_timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGradWarm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B7A66" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#FFE5B8" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5EBDD" vertical={false} />
                  <XAxis dataKey="date" stroke="#AFA190" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#AFA190" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Settled Revenue']}
                    contentStyle={{
                      backgroundColor: '#211C18',
                      borderRadius: '16px',
                      border: '1px solid #403A34',
                      color: '#FFF9F0',
                      fontSize: '12px',
                      boxShadow: '0 8px 30px rgba(33, 28, 24, 0.25)'
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#8B7A66" strokeWidth={3} fillOpacity={1} fill="url(#revGradWarm)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#AFA190]">
                <TrendingUp className="w-8 h-8 stroke-[1.5] mb-2 text-[#D1C6B7]" />
                <p className="text-xs font-semibold text-[#6F655B]">No revenue data yet</p>
                <p className="text-[11px] text-[#AFA190] mt-1 max-w-xs">Your revenue timeline will display automatically as orders are accepted and completed.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sales by Crop Donut Chart */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D8] shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-[#FFF9ED] border border-[#FED898] flex items-center justify-center">
                <Sprout className="w-4 h-4 text-[#8B7A66]" />
              </div>
              <h3 className="text-base font-bold text-[#211C18]">Crop Portfolio Share</h3>
            </div>
            <p className="text-xs text-[#6F655B]">Revenue contribution per crop</p>
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
                      <Cell key={`cell-${index}`} fill={WARM_CHART_COLORS[index % WARM_CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#211C18',
                      borderRadius: '16px',
                      border: '1px solid #403A34',
                      color: '#FFF9F0',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-[#AFA190] p-4">
                <Sprout className="w-7 h-7 stroke-[1.5] mb-2 text-[#D1C6B7]" />
                <p className="text-xs font-semibold text-[#6F655B]">No crop sales recorded</p>
                <p className="text-[11px] text-[#AFA190] mt-0.5">Produce breakdown appears here</p>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-[#E8E2D8] max-h-28 overflow-y-auto text-xs">
            {analytics?.sales_by_crop?.map((item, idx) => (
              <div key={item.crop} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: WARM_CHART_COLORS[idx % WARM_CHART_COLORS.length] }} />
                  <span className="font-bold text-[#211C18] capitalize truncate max-w-[120px]">{item.crop}</span>
                </div>
                <span className="text-[#6F655B] font-extrabold tabular-nums">₹{item.revenue?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stepped Funnel Order Fulfillment Progression (Reference 2) */}
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
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D8] shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8E2D8]">
              <div>
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-[#8B7A66]" />
                  <h3 className="text-base font-bold text-[#211C18]">Inbound Purchase Requests</h3>
                </div>
                <p className="text-xs text-[#6F655B] mt-0.5">Buyer trade offers awaiting response</p>
              </div>
              <Link
                to="/farmer/requests"
                className="text-xs font-bold text-[#8B7A66] hover:text-[#5E5142] flex items-center gap-1 group"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {recentRequests.length === 0 ? (
              <div className="py-12 text-center text-[#AFA190]">
                <Inbox className="w-8 h-8 stroke-[1.5] mx-auto mb-2 text-[#D1C6B7]" />
                <p className="text-xs font-semibold text-[#6F655B]">No active purchase requests</p>
                <p className="text-[11px] text-[#AFA190] mt-0.5">Buyer offers for your crops will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F5EBDD]">
                {recentRequests.map((req) => (
                  <div key={req.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[#211C18] truncate">
                        {req.buyer_business || req.buyer_name}
                      </div>
                      <div className="text-[#6F655B] mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="capitalize font-semibold text-[#403A34]">{req.crop}</span>
                        <span>•</span>
                        <span>{req.requested_quantity?.toLocaleString()} kg</span>
                        <span>•</span>
                        <span className="font-black text-[#8B7A66]">₹{req.offered_price}/kg</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          req.status === 'ACCEPTED'
                            ? 'bg-[#FFE5B8] text-[#5E5142] border border-[#FED898]'
                            : req.status === 'NEGOTIATING'
                            ? 'bg-[#F5EBDD] text-[#332A22] border border-[#E8E2D8]'
                            : 'bg-[#FAF8F5] text-[#403A34] border border-[#D1C6B7]'
                        }`}
                      >
                        {req.status}
                      </span>
                      <Link
                        to={`/farmer/negotiations/${req.id}`}
                        className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F5EBDD] hover:text-[#211C18] text-[#6F655B] transition-colors border border-[#E8E2D8]"
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
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D8] shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8E2D8]">
              <div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#8B7A66]" />
                  <h3 className="text-base font-bold text-[#211C18]">Recent Confirmed Orders</h3>
                </div>
                <p className="text-xs text-[#6F655B] mt-0.5">Active fulfillment & delivery pipeline</p>
              </div>
              <Link
                to="/farmer/orders"
                className="text-xs font-bold text-[#8B7A66] hover:text-[#5E5142] flex items-center gap-1 group"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-12 text-center text-[#AFA190]">
                <Truck className="w-8 h-8 stroke-[1.5] mx-auto mb-2 text-[#D1C6B7]" />
                <p className="text-xs font-semibold text-[#6F655B]">No confirmed orders yet</p>
                <p className="text-[11px] text-[#AFA190] mt-0.5">Accepted deals will convert into shipments here</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F5EBDD]">
                {recentOrders.map((ord) => (
                  <div key={ord.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[#211C18] flex items-center gap-1.5 truncate">
                        <span className="font-mono text-[#6F655B]">#{ord.order_number}</span>
                        <span className="text-[#AFA190] font-normal truncate">to {ord.buyer_business || ord.buyer_name}</span>
                      </div>
                      <div className="text-[#6F655B] mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="capitalize font-semibold text-[#403A34]">{ord.crop}</span>
                        <span>•</span>
                        <span>{ord.quantity?.toLocaleString()} kg</span>
                        <span>•</span>
                        <strong className="text-[#211C18] font-black">₹{ord.total_amount?.toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F5EBDD] text-[#5E5142] border border-[#E8E2D8]">
                        {ord.status?.replace('_', ' ')}
                      </span>
                      <Link
                        to="/farmer/orders"
                        className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F5EBDD] hover:text-[#211C18] text-[#6F655B] transition-colors border border-[#E8E2D8]"
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
