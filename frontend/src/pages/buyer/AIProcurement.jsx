import React, { useState } from 'react';
import {
  Sparkles,
  Truck,
  TrendingDown,
  ShieldCheck,
  Send,
  Layers,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Leaf,
  MapPin,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { aiAPI, requestsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export const AIProcurement = () => {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('Source 2500 kg organic tomatoes under ₹30/kg delivered to Pune');
  const [crop, setCrop] = useState('Tomato');
  const [quantity, setQuantity] = useState(2500);
  const [maxBudget, setMaxBudget] = useState(75000);
  const [targetDistrict, setTargetDistrict] = useState('Pune');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [submittingOrders, setSubmittingOrders] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const samplePrompts = [
    'Source 2500 kg organic tomatoes under ₹30/kg delivered to Pune',
    'Procure 5000 kg Nashik Red Onions with consolidated pickup route',
    'Find 3000 kg Sharbati Wheat from verified Tier 1 farmers under ₹38/kg',
    'Procure 1000 kg fresh Grapes with lowest perishability transit risk to Mumbai',
  ];

  const handleRunOptimizer = async (e) => {
    e?.preventDefault();
    try {
      setLoading(true);
      setOrderSuccess(false);
      const res = await aiAPI.optimizeProcurement({
        query: prompt,
        crop,
        quantity: Number(quantity),
        location: targetDistrict,
        max_price: maxBudget / Number(quantity || 1),
      });

      if (res.data.success) {
        setResult(res.data.data);
        setSelectedPlanIndex(0);
      }
    } catch (err) {
      console.error('Procurement optimizer failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateProcurement = async () => {
    if (!result || !result.plans) return;
    const currentPlan = result.plans[selectedPlanIndex];
    if (!currentPlan || !currentPlan.allocations) return;

    try {
      setSubmittingOrders(true);
      // Create multi-supplier purchase requests for each allocated supplier
      for (const alloc of currentPlan.allocations) {
        await requestsAPI.createRequest({
          listing_id: alloc.listing_id,
          proposed_price: alloc.price_per_kg,
          requested_quantity: alloc.allocated_kg || alloc.quantity,
          delivery_notes: `Consolidated AI Procurement Allocation (${currentPlan.plan_name}). Destination: ${targetDistrict}`,
        });
      }
      setOrderSuccess(true);
    } catch (err) {
      console.error('Failed to initiate requests:', err);
    } finally {
      setSubmittingOrders(false);
    }
  };

  const currentPlan = result?.plans?.[selectedPlanIndex];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Procurement Intelligence
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
              Multi-Supplier Optimizer
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            AI Procurement & Route Optimizer
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Natural language requirement parsing, multi-supplier volume allocation, and freight consolidation
          </p>
        </div>
      </div>

      {/* Input Formulation Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
        <form onSubmit={handleRunOptimizer} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Enter Natural Language Procurement Request:</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Source 4000 kg A-grade tomatoes under ₹26/kg to Pune with pooled freight..."
                className="w-full px-4 py-3.5 pr-28 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loading ? 'Optimizing...' : 'Optimize'}</span>
              </button>
            </div>
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Quick Requests:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(p)}
                className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-medium px-3 py-1 rounded-xl border border-slate-200/60 transition-colors"
              >
                "{p}"
              </button>
            ))}
          </div>

          {/* Structured Parameter Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block">Target Crop</label>
              <input
                type="text"
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block">Target Quantity (kg)</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block">Max Budget (₹)</label>
              <input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block">Delivery District</label>
              <select
                value={targetDistrict}
                onChange={(e) => setTargetDistrict(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
              >
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Nashik">Nashik</option>
                <option value="Nagpur">Nagpur</option>
                <option value="Kolhapur">Kolhapur</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {loading && <LoadingSpinner text="Running multi-objective linear allocation & freight routing..." />}

      {/* Optimization Results */}
      {result && result.plans && (
        <div className="space-y-6">
          {/* Plan Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {result.plans.map((plan, idx) => {
              const isSelected = selectedPlanIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedPlanIndex(idx)}
                  className={`cursor-pointer rounded-3xl p-5 border-2 transition-all space-y-3 ${
                    isSelected
                      ? 'bg-emerald-50/50 border-emerald-500 shadow-md shadow-emerald-500/10'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        idx === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : idx === 1
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {plan.tag || `Plan ${idx + 1}`}
                    </span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900">{plan.plan_name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fulfills {plan.fulfilled_quantity_kg} kg ({plan.fulfillment_percentage}%) across {plan.suppliers_count} farms
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Landed Cost
                      </span>
                      <strong className="text-slate-800 text-sm font-black">
                        ₹{plan.total_landed_cost?.toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Effective Rate
                      </span>
                      <strong className="text-emerald-600 text-sm font-black">
                        ₹{plan.effective_landed_rate_per_kg?.toFixed(1)} / kg
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Plan Breakdown */}
          {currentPlan && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-emerald-600" />
                    Supplier Allocation Breakdown ({currentPlan.plan_name})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fulfills {currentPlan.fulfilled_quantity_kg} kg across {currentPlan.allocations?.length} farm suppliers
                  </p>
                </div>

                <button
                  onClick={handleInitiateProcurement}
                  disabled={submittingOrders || orderSuccess}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                    orderSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {orderSuccess
                      ? 'Allocated Requests Sent!'
                      : submittingOrders
                      ? 'Submitting...'
                      : 'Execute Multi-Supplier Allocation'}
                  </span>
                </button>
              </div>

              {orderSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Purchase requests have been dispatched to all allocated farmers. Track negotiation timelines in My Requests!
                  </span>
                </div>
              )}

              {/* Suppliers Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3 rounded-l-xl">Farmer / Farm Name</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Allocated Qty</th>
                      <th className="p-3">Price / kg</th>
                      <th className="p-3">Subtotal</th>
                      <th className="p-3">Transit Dist</th>
                      <th className="p-3 rounded-r-xl">Trust Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {currentPlan.allocations?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="p-3">
                          <strong className="text-slate-900 block font-bold">
                            {item.farmer_name}
                          </strong>
                          <span className="text-slate-400 text-[11px] block">
                            {item.farm_name}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">
                          {item.location || 'Maharashtra'}
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          {item.allocated_kg || item.quantity} kg
                        </td>
                        <td className="p-3 font-semibold text-slate-700">
                          ₹{item.price_per_kg} / kg
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          ₹{item.produce_subtotal?.toLocaleString() || ((item.allocated_kg || item.quantity) * item.price_per_kg).toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-600">
                          {item.distance_km || 45} km
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                            {item.trust_tier || 'Tier 1'} ({item.trust_score}%)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Consolidated Logistics Pooling Savings Card */}
              {currentPlan.consolidation_savings > 0 && (
                <div className="p-5 rounded-3xl bg-blue-50/70 border border-blue-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <span>Consolidated Multi-Stop Pickup Freight Pooling</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-200 text-blue-900">
                      Savings Enabled
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 rounded-2xl bg-white border border-blue-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Produce Cost
                      </span>
                      <span className="text-sm font-black text-slate-800 block mt-0.5">
                        ₹{currentPlan.total_produce_cost?.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white border border-blue-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Pooled Freight Cost
                      </span>
                      <span className="text-sm font-black text-slate-800 block mt-0.5">
                        ₹{currentPlan.total_freight_cost?.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white border border-blue-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Route Pooling Savings
                      </span>
                      <span className="text-sm font-black text-emerald-600 block mt-0.5">
                        ₹{currentPlan.consolidation_savings?.toLocaleString()} saved
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIProcurement;
