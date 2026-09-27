import React, { useState, useEffect } from 'react';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Layers,
  Activity,
  Filter,
  Eye,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { commandCenterAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export const MarketIntelligence = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [activeLayer, setActiveLayer] = useState('demand'); // 'demand', 'supply', 'risk', 'price'
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  useEffect(() => {
    fetchHeatmap();
  }, [activeLayer]);

  const fetchHeatmap = async () => {
    try {
      setLoading(true);
      const res = await commandCenterAPI.getHeatmap(activeLayer);
      if (res.data.success) {
        const points = res.data.points || [];
        setHeatmapData(points);
        if (points.length > 0 && !selectedDistrict) {
          setSelectedDistrict(points[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load heatmap data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDistrictColor = (item) => {
    if (activeLayer === 'demand') {
      const d = item.demand_index || 70;
      if (d > 85) return 'bg-rose-500 text-white border-rose-600';
      if (d > 75) return 'bg-amber-500 text-white border-amber-600';
      return 'bg-emerald-500 text-white border-emerald-600';
    } else if (activeLayer === 'supply') {
      const s = item.supply_volume_kg || 0;
      if (s > 10000) return 'bg-emerald-600 text-white border-emerald-700';
      if (s > 4000) return 'bg-blue-600 text-white border-blue-700';
      return 'bg-slate-500 text-white border-slate-600';
    } else if (activeLayer === 'risk') {
      const r = item.risk_level?.toLowerCase() || 'low';
      if (r === 'high' || r === 'severe') return 'bg-rose-600 text-white border-rose-700 animate-pulse';
      if (r === 'medium') return 'bg-amber-500 text-white border-amber-600';
      return 'bg-emerald-600 text-white border-emerald-700';
    } else {
      // price
      const p = item.avg_price || 30;
      if (p > 50) return 'bg-purple-600 text-white border-purple-700';
      if (p > 30) return 'bg-blue-600 text-white border-blue-700';
      return 'bg-teal-600 text-white border-teal-700';
    }
  };

  if (loading) return <LoadingSpinner text="Computing geographic supply-demand heatmaps across Maharashtra..." />;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Macro Intelligence
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
              Regional Heatmap
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Supply-Demand Intelligence Heatmap
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Geographic market pressure, supply volume distribution, and supply chain vulnerability across Maharashtra
          </p>
        </div>

        {/* Crop Selector Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-xl shadow-xs"
          >
            <option value="">All Commodities</option>
            <option value="Tomato">Tomato</option>
            <option value="Onion">Onion</option>
            <option value="Wheat">Wheat</option>
            <option value="Potato">Potato</option>
            <option value="Grapes">Grapes</option>
            <option value="Sugarcane">Sugarcane</option>
          </select>
        </div>
      </div>

      {/* Layer Switcher */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 px-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>Heatmap Layer Mode:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'demand', label: 'Demand Pressure Index' },
            { id: 'supply', label: 'Supply Volume Concentration' },
            { id: 'risk', label: 'Supply Chain Risk Level' },
            { id: 'price', label: 'Average Price Band' },
          ].map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeLayer === layer.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map Grid & District Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* District Grid Heatmap */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Regional Agro Hubs (Maharashtra State)
              </h3>
              <p className="text-xs text-slate-500">
                Click any district to inspect granular supply-demand microeconomics
              </p>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              Active Layer: <strong className="text-slate-700 capitalize">{activeLayer}</strong>
            </span>
          </div>

          {/* District Grid Cells */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {heatmapData.map((d) => {
              const isSelected = selectedDistrict?.district === d.district;
              const colorClass = getDistrictColor(d);

              return (
                <div
                  key={d.district}
                  onClick={() => setSelectedDistrict(d)}
                  className={`cursor-pointer rounded-3xl p-5 border-2 transition-all space-y-3 relative overflow-hidden ${
                    isSelected
                      ? 'border-emerald-500 ring-4 ring-emerald-500/10 shadow-lg'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900">{d.district}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase shadow-xs ${colorClass}`}
                    >
                      {activeLayer === 'demand'
                        ? `Demand: ${d.demand_index}`
                        : activeLayer === 'supply'
                        ? `${(d.supply_volume_kg / 1000).toFixed(1)}k kg`
                        : activeLayer === 'risk'
                        ? `${d.risk_level || 'Low'}`
                        : `₹${d.avg_price}/kg`}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium">
                    Primary: <strong>{d.primary_crops?.join(', ') || 'Horticulture'}</strong>
                  </p>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">
                        Supply
                      </span>
                      <strong className="text-slate-800 text-xs font-black">
                        {d.supply_volume_kg?.toLocaleString()} kg
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">
                        Avg Price
                      </span>
                      <strong className="text-emerald-600 text-xs font-black">
                        ₹{d.avg_price} / kg
                      </strong>
                    </div>
                  </div>

                  {d.anomaly_count > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{d.anomaly_count} Anomalies</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend Guide */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-600">Color Spectrum Guide:</span>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Optimal / Healthy
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" /> High Pressure / Moderate
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" /> Severe Deficit / Outlier
              </span>
            </div>
          </div>
        </div>

        {/* Selected District Deep-Dive Inspector */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              District Micro-Intelligence
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">
              {selectedDistrict ? selectedDistrict.district : 'Select a District'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Real-time agro-economic profile & logistics corridor
            </p>
          </div>

          {selectedDistrict ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Key Agricultural Commodities</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDistrict.primary_crops?.map((c, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white text-emerald-700 border border-emerald-100 shadow-2xs"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">
                    Demand Pressure
                  </span>
                  <strong className="text-slate-900 text-base font-black mt-1 block">
                    {selectedDistrict.demand_index} / 100
                  </strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">
                    Supply Deficit / Surplus
                  </span>
                  <strong
                    className={`text-base font-black mt-1 block ${
                      selectedDistrict.market_balance?.includes('Deficit')
                        ? 'text-rose-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {selectedDistrict.market_balance || 'Balanced'}
                  </strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
                  Logistics & Perishability Status
                </span>
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  Corridor transit access to Mumbai / Pune wholesale hubs is stable. Cold chain availability index: 82/100.
                </p>
              </div>

              {selectedDistrict.risk_level && selectedDistrict.risk_level !== 'Low' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 font-medium">
                    Supply chain risk flagged: localized weather or post-harvest storage constraints.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-slate-400">
              Select a district cell from the heatmap to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketIntelligence;
