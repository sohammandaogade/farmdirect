import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  ShieldAlert,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { farmerAPI, aiAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export const FarmerInventoryIntelligence = () => {
  const [listings, setListings] = useState([]);
  const [selectedListingId, setSelectedListingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  // AI intelligence states
  const [smartSelling, setSmartSelling] = useState(null);
  const [demandForecast, setDemandForecast] = useState(null);
  const [profitIntel, setProfitIntel] = useState(null);

  // Interactive calculator
  const [costPerKg, setCostPerKg] = useState(18);
  const [targetPrice, setTargetPrice] = useState(28);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await farmerAPI.getListings('active');
      if (res.data.success && res.data.data.length > 0) {
        setListings(res.data.data);
        setSelectedListingId(res.data.data[0].id.toString());
        loadIntelligenceForListing(res.data.data[0]);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to load listings for inventory intelligence:', err);
      setLoading(false);
    }
  };

  const loadIntelligenceForListing = async (listing) => {
    try {
      setEvaluating(true);
      const crop = listing.crop;
      const region = listing.location || 'Pune';

      const [smartRes, demandRes, profitRes] = await Promise.all([
        aiAPI.getSmartSelling({
          crop,
          price: listing.expected_price,
          quantity: listing.quantity,
          region,
        }),
        aiAPI.getDemand(crop, region),
        aiAPI.calculateProfit({
          crop,
          acres: 2.0,
          cost: costPerKg * listing.quantity,
          yield_kg: listing.quantity,
          price: targetPrice,
        }),
      ]);

      if (smartRes.data.success) setSmartSelling(smartRes.data.data);
      if (demandRes.data.success) setDemandForecast(demandRes.data.data);
      if (profitRes.data.success) {
        setProfitIntel(profitRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load listing AI intelligence:', err);
    } finally {
      setEvaluating(false);
      setLoading(false);
    }
  };

  const handleSelectListing = (e) => {
    const id = e.target.value;
    setSelectedListingId(id);
    const chosen = listings.find((l) => l.id.toString() === id);
    if (chosen) {
      loadIntelligenceForListing(chosen);
    }
  };

  const handleRecalculateProfit = async () => {
    const chosen = listings.find((l) => l.id.toString() === selectedListingId);
    if (!chosen) return;
    try {
      const res = await aiAPI.calculateProfit({
        crop: chosen.crop,
        acres: 2.0,
        cost: costPerKg * chosen.quantity,
        yield_kg: chosen.quantity,
        price: targetPrice,
      });
      if (res.data.success) {
        setProfitIntel(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <LoadingSpinner text="Computing inventory & perishability intelligence..." />;

  const currentListing = listings.find((l) => l.id.toString() === selectedListingId);
  const decision = smartSelling?.decision || 'SELL NOW';
  const decisionColor =
    decision === 'SELL NOW'
      ? 'bg-emerald-600 text-white'
      : decision === 'WAIT / HOLD'
      ? 'bg-amber-500 text-white'
      : 'bg-blue-600 text-white';

  // Calculator figures
  const qty = currentListing?.quantity || 1000;
  const totalRevenue = targetPrice * qty;
  const totalCost = costPerKg * qty;
  const netProfit = totalRevenue - totalCost;
  const profitMarginPct = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Chart data for 7-day / 14-day demand forecast
  const forecastChartData = [
    { day: 'Day 1', demand: demandForecast?.forecast_7d?.[0] || 78, price: 28 },
    { day: 'Day 3', demand: demandForecast?.forecast_7d?.[2] || 82, price: 29 },
    { day: 'Day 5', demand: demandForecast?.forecast_7d?.[4] || 85, price: 31 },
    { day: 'Day 7', demand: demandForecast?.forecast_7d?.[6] || 89, price: 32 },
    { day: 'Day 10', demand: demandForecast?.forecast_14d?.[9] || 92, price: 33 },
    { day: 'Day 14', demand: demandForecast?.forecast_14d?.[13] || 88, price: 31 },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Supply Chain Engine
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
              Smart Inventory & Selling Timing
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Inventory & Selling Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time perishability shelf-life modeling, demand elasticity, and profit optimization
          </p>
        </div>

        {/* Listing Selector Dropdown */}
        {listings.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Analyze Produce:</span>
            <select
              value={selectedListingId}
              onChange={handleSelectListing}
              className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-emerald-500/20"
            >
              {listings.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.quantity} {item.unit}) - ₹{item.price_per_unit}/{item.unit}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {listings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No active produce listings found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Create an active crop listing first to unlock automated shelf-life modeling and smart selling time recommendations.
          </p>
        </div>
      ) : (
        <>
          {/* Smart Selling Decision Hero Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  AI Decision Engine Recommendation
                </span>
                <div className="flex items-center gap-4">
                  <div
                    className={`px-5 py-2.5 rounded-2xl text-lg font-black tracking-tight shadow-md ${decisionColor}`}
                  >
                    {decision}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      {currentListing?.crop} ({currentListing?.variety || 'Standard'})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Location: {currentListing?.location_district || 'Maharashtra'} | Current Stock:{' '}
                      <strong>
                        {currentListing?.quantity} {currentListing?.unit}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Confidence Score Pill */}
              <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Model Confidence
                  </span>
                  <span className="text-base font-black text-emerald-600">
                    {smartSelling?.confidence_score ?? 91}%
                  </span>
                </div>
              </div>
            </div>

            {/* Decision Rationale & Risks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Remaining Shelf Life</span>
                </div>
                <span className="text-xl font-black text-slate-900 block pt-1">
                  {smartSelling?.perishability?.remaining_shelf_life_days ?? 7} Days
                </span>
                <span className="text-[10px] text-slate-500">
                  Total baseline: {smartSelling?.perishability?.shelf_life_days ?? 10} days
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Regional Demand Trend</span>
                </div>
                <span className="text-xl font-black text-blue-600 block pt-1 capitalize">
                  {smartSelling?.price_trend?.trend || 'Bullish (+6%)'}
                </span>
                <span className="text-[10px] text-slate-500">
                  Fair price band: ₹{smartSelling?.price_trend?.projected_fair_min ?? 26} - ₹
                  {smartSelling?.price_trend?.projected_fair_max ?? 32} / kg
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Perishability & Transit Risk</span>
                </div>
                <span className="text-xl font-black text-slate-900 block pt-1">
                  {smartSelling?.risk_score ?? 'Low'} Risk
                </span>
                <span className="text-[10px] text-slate-500">
                  Max Safe Transit: {smartSelling?.perishability?.max_transit_km ?? 450} km
                </span>
              </div>
            </div>

            {/* Narrative Explanation */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Strategic AI Rationale
                </h4>
                <p className="text-xs text-emerald-800 mt-1 font-medium leading-relaxed">
                  {smartSelling?.explanation ||
                    'High regional market demand combined with optimal produce freshness suggests listing immediately to capture premium price margins before local wholesale arrivals peak.'}
                </p>
              </div>
            </div>
          </div>

          {/* Demand Forecast Chart & Profit Calculator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 14-Day Demand Forecast */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    14-Day Regional Crop Demand Curve
                  </h3>
                  <p className="text-xs text-slate-500">
                    Demand forecast index for {currentListing?.crop} in {currentListing?.location_district || 'Maharashtra'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">
                  Demand Index: {demandForecast?.demand_index ?? 85} / 100
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastChartData}>
                    <defs>
                      <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={[60, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      formatter={(val) => [`${val} pts`, 'Demand Index']}
                    />
                    <Area
                      type="monotone"
                      dataKey="demand"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#demandGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Supply-Demand Balance:</span>
                <span className="text-emerald-700 font-bold capitalize">
                  {demandForecast?.market_balance || 'Demand Exceeds Supply (+18%)'}
                </span>
              </div>
            </div>

            {/* Interactive Crop Profit Margin Calculator */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Interactive Margin & Profit Simulator
                  </h3>
                  <p className="text-xs text-slate-500">
                    Input your production cost to identify optimal net earnings
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block">
                      Cultivation Cost (₹ / kg)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={costPerKg}
                      onChange={(e) => setCostPerKg(parseFloat(e.target.value) || 0)}
                      className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block">
                      Target Selling Price (₹ / kg)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                      className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRecalculateProfit}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
                >
                  Recalculate AI Profit Band
                </button>

                {/* Profit Metrics Result Cards */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Revenue</span>
                    <span className="text-sm font-black text-slate-800 block mt-0.5">
                      ₹{totalRevenue.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Expenses</span>
                    <span className="text-sm font-black text-rose-600 block mt-0.5">
                      ₹{totalCost.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase">Net Margin</span>
                    <span className="text-sm font-black text-emerald-700 block mt-0.5">
                      {profitMarginPct}% (₹{netProfit.toLocaleString()})
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200/80 text-xs text-blue-900 flex items-center justify-between">
                  <span>Breakeven Selling Price:</span>
                  <strong className="text-blue-800 font-bold">₹{costPerKg} / kg</strong>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FarmerInventoryIntelligence;
