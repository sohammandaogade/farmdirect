import React, { useState } from 'react';
import {
  Sliders,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Truck,
  DollarSign,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { commandCenterAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export const WhatIfSimulator = () => {
  const [demandShock, setDemandShock] = useState(15);
  const [dieselPriceChange, setDieselPriceChange] = useState(10);
  const [monsoonDelay, setMonsoonDelay] = useState(7);
  const [supplyDrop, setSupplyDrop] = useState(10);
  const [targetCrop, setTargetCrop] = useState('Tomato');

  const [loading, setLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const handleSimulate = async () => {
    try {
      setLoading(true);
      const res = await commandCenterAPI.simulate({
        demand_change: Number(demandShock),
        supply_change: -Number(supplyDrop),
        transport_change: Number(dieselPriceChange),
        risk_change: Number(monsoonDelay),
      });

      if (res.data.success) {
        setSimResult(res.data.data);
      }
    } catch (err) {
      console.error('Market simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDemandShock(0);
    setDieselPriceChange(0);
    setMonsoonDelay(0);
    setSupplyDrop(0);
    setSimResult(null);
  };

  const projections = simResult?.projections;
  const baseline = simResult?.baseline;

  const comparisonData = simResult && projections
    ? [
        {
          metric: 'Price (₹/kg)',
          Baseline: baseline?.average_price_per_kg || 24.5,
          Simulated: projections?.projected_avg_price_per_kg || 28.5,
        },
        {
          metric: 'Supply (x100 kg)',
          Baseline: Math.round((baseline?.supply_volume_kg || 15000) / 100),
          Simulated: Math.round((projections?.projected_supply_kg || 13500) / 100),
        },
      ]
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Macroeconomic Engine
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800">
              What-If Simulator
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            What-If Market Stress Simulator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Simulate weather disruptions, diesel freight surges, supply-demand shocks, and equilibrium price elasticity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Sliders</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sliders Configuration Panel */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600" />
              Scenario Stress Levers
            </h3>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              Elasticity Model
            </span>
          </div>

          <div className="space-y-5">
            {/* Commodity Target */}
            <div>
              <label className="text-xs font-bold text-slate-700 block">Commodity Market</label>
              <select
                value={targetCrop}
                onChange={(e) => setTargetCrop(e.target.value)}
                className="w-full mt-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
              >
                <option value="Tomato">Tomato (Perishable Horticulture)</option>
                <option value="Onion">Onion (Storage Vegetable)</option>
                <option value="Wheat">Wheat (Grain Commodity)</option>
                <option value="Potato">Potato (Semi-perishable)</option>
                <option value="Grapes">Grapes (Export Horticulture)</option>
              </select>
            </div>

            {/* Slider 1: Demand Shock */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">Demand Shock:</span>
                <span
                  className={
                    demandShock > 0
                      ? 'text-emerald-600'
                      : demandShock < 0
                      ? 'text-rose-600'
                      : 'text-slate-500'
                  }
                >
                  {demandShock > 0 ? `+${demandShock}%` : `${demandShock}%`}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="100"
                step="5"
                value={demandShock}
                onChange={(e) => setDemandShock(e.target.value)}
                className="w-full mt-2 accent-emerald-600"
              />
              <span className="text-[10px] text-slate-400">Range: -50% (Slump) to +100% (Surge)</span>
            </div>

            {/* Slider 2: Diesel Price Change */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">Diesel / Fuel Shift:</span>
                <span
                  className={
                    dieselPriceChange > 0 ? 'text-amber-600' : 'text-slate-500'
                  }
                >
                  {dieselPriceChange > 0 ? `+${dieselPriceChange}%` : `${dieselPriceChange}%`}
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="50"
                step="5"
                value={dieselPriceChange}
                onChange={(e) => setDieselPriceChange(e.target.value)}
                className="w-full mt-2 accent-amber-500"
              />
              <span className="text-[10px] text-slate-400">Impacts freight and inter-district transport costs</span>
            </div>

            {/* Slider 3: Monsoon Delay */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">Monsoon Rain Delay:</span>
                <span className="text-blue-600">{monsoonDelay} Days</span>
              </div>
              <input
                type="range"
                min="0"
                max="45"
                step="1"
                value={monsoonDelay}
                onChange={(e) => setMonsoonDelay(e.target.value)}
                className="w-full mt-2 accent-blue-600"
              />
              <span className="text-[10px] text-slate-400">Shifts harvest window & sowing cycles</span>
            </div>

            {/* Slider 4: Supply Shock Drop */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">Supply Drop (Harvest Loss):</span>
                <span className="text-rose-600">{supplyDrop}% Drop</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={supplyDrop}
                onChange={(e) => setSupplyDrop(e.target.value)}
                className="w-full mt-2 accent-rose-500"
              />
              <span className="text-[10px] text-slate-400">Pest infestation / extreme weather crop failure</span>
            </div>

            <button
              onClick={handleSimulate}
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>{loading ? 'Running Microeconomic Simulation...' : 'Simulate Market Equilibrium'}</span>
            </button>
          </div>
        </div>

        {/* Simulation Output Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200">
              <LoadingSpinner text="Computing market equilibrium price elasticity..." />
            </div>
          ) : simResult ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Simulation Projections for Maharashtra
                  </h3>
                  <p className="text-xs text-slate-500">
                    State: <strong>{projections?.market_state || 'Balanced Equilibrium'}</strong>
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    (projections?.simulated_risk_score || 35) > 65
                      ? 'bg-rose-100 text-rose-800'
                      : (projections?.simulated_risk_score || 35) > 45
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  Risk Score: {projections?.simulated_risk_score || 35} / 100
                </span>
              </div>

              {/* Metric Impact Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Equilibrium Price
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-slate-900">
                      ₹{projections?.projected_avg_price_per_kg?.toFixed(2) || '28.50'}/kg
                    </span>
                    <span className="text-xs font-bold text-emerald-600">
                      ({projections?.projected_price_change_pct > 0 ? `+${projections?.projected_price_change_pct}%` : `${projections?.projected_price_change_pct}%`})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Baseline: ₹{baseline?.average_price_per_kg?.toFixed(2)}/kg
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Supply-Demand Gap
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-blue-600">
                      {projections?.supply_demand_gap_kg?.toLocaleString()} kg
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Target: {projections?.projected_demand_kg?.toLocaleString()} kg
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Freight Pressure Index
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-amber-600">
                      {projections?.freight_pressure_index} / 100
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Transport & pooling elasticity
                  </span>
                </div>
              </div>

              {/* Crop Breakdown Table */}
              {simResult.crop_breakdown && simResult.crop_breakdown.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Commodity Price Shifts & Vulnerability
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="p-2.5 rounded-l-xl">Commodity</th>
                          <th className="p-2.5">Baseline</th>
                          <th className="p-2.5">Simulated Rate</th>
                          <th className="p-2.5">Perishability</th>
                          <th className="p-2.5 rounded-r-xl">Vulnerability Profile</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {simResult.crop_breakdown.map((cb, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="p-2.5 font-bold text-slate-800">{cb.crop}</td>
                            <td className="p-2.5 text-slate-500">₹{cb.baseline_price}/kg</td>
                            <td className="p-2.5 font-bold text-emerald-600">₹{cb.projected_price}/kg</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                cb.perishability === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {cb.perishability}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-600 text-[11px]">{cb.vulnerability}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Strategic Policy Interventions */}
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Strategic AI Platform Recommendations</span>
                </div>
                <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                  {projections?.strategic_recommendation || 'Encourage forward contract lock-ins between wholesale buyers and cooperative farmer clusters to mitigate unseasonal price volatility.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
              <Zap className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                Ready to run macroeconomic simulation
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Adjust the scenario stress levers on the left and click "Simulate Market Equilibrium" to compute the price elasticity curve.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatIfSimulator;
