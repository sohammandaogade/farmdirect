import React, { useState, useEffect } from 'react';
import {
  Activity,
  PlusCircle,
  TrendingUp,
  Droplets,
  Layers,
  Sparkles,
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  PieChart as PieIcon,
  X,
} from 'lucide-react';
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
import { digitalTwinAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const COLORS = ['#8B7A66', '#FFE5B8', '#6F655B', '#403A34', '#AFA190', '#D97706'];

export const FarmDigitalTwin = () => {
  const { user } = useAuth();
  const [twinData, setTwinData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showSoilModal, setShowSoilModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Form states
  const [soilForm, setSoilForm] = useState({
    ph: 6.8,
    nitrogen: 210,
    phosphorus: 45,
    potassium: 195,
    organic_carbon: 0.85,
    moisture_pct: 28,
    soil_type: 'Clay Loam',
    recommendation: 'Soil is well-conditioned for high-yield horticulture.',
  });

  const [cropForm, setCropForm] = useState({
    crop: 'Tomato',
    season: 'Rabi',
    year: 2025,
    yield_kg: 18000,
    revenue: 450000,
    area_acres: 3.5,
    notes: 'High yield harvest with drip fertigation.',
  });

  const [expenseForm, setExpenseForm] = useState({
    category: 'Fertilizers',
    amount: 15000,
    date: new Date().toISOString().split('T')[0],
    description: 'Organic compost and micronutrient mix',
  });

  useEffect(() => {
    fetchTwinData();
  }, [user]);

  const fetchTwinData = async () => {
    try {
      setLoading(true);
      // If user has farmer_profile, use its id; otherwise fallback to user.id
      const farmerId = user?.farmer_profile?.id || user?.id || 1;
      const res = await digitalTwinAPI.getTwin(farmerId);
      if (res.data.success) {
        setTwinData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load farm digital twin:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSoilSubmit = async (e) => {
    e.preventDefault();
    try {
      const farmerId = user?.farmer_profile?.id || user?.id || 1;
      await digitalTwinAPI.addSoilProfile({ ...soilForm, farmer_id: farmerId });
      setShowSoilModal(false);
      fetchTwinData();
    } catch (err) {
      console.error('Failed to save soil profile:', err);
    }
  };

  const handleCropSubmit = async (e) => {
    e.preventDefault();
    try {
      const farmerId = user?.farmer_profile?.id || user?.id || 1;
      await digitalTwinAPI.addCropHistory({ ...cropForm, farmer_id: farmerId });
      setShowCropModal(false);
      fetchTwinData();
    } catch (err) {
      console.error('Failed to save crop record:', err);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const farmerId = user?.farmer_profile?.id || user?.id || 1;
      await digitalTwinAPI.addFarmExpense({ ...expenseForm, farmer_id: farmerId });
      setShowExpenseModal(false);
      fetchTwinData();
    } catch (err) {
      console.error('Failed to save farm expense:', err);
    }
  };

  if (loading) return <LoadingSpinner text="Simulating Farm Digital Twin Telemetry..." />;

  const soil = twinData?.soil_profile || {};
  const cropHistory = twinData?.crop_history || [];
  const expenses = twinData?.expenses || [];
  const healthScore = twinData?.health_score ?? 88;

  // Aggregate expenses by category for PieChart
  const expenseByCategory = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
    return acc;
  }, {});
  const expensePieData = Object.keys(expenseByCategory).map((cat) => ({
    name: cat,
    value: expenseByCategory[cat],
  }));

  const totalExpense = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalHistoricRevenue = cropHistory.reduce((acc, curr) => acc + Number(curr.revenue), 0);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E8E2D8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8B7A66]">
              Agronomic Intelligence
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#FFE5B8] text-[#5E5142] border border-[#FED898]">
              Live Digital Twin
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#211C18] tracking-tight mt-1">
            {twinData?.farm_name || 'My Farm'} Digital Twin
          </h1>
          <p className="text-xs text-[#6F655B] mt-1">
            Real-time agro-ecological modeling for{' '}
            <strong className="text-[#211C18]">{twinData?.location || 'Maharashtra'}</strong> (
            {twinData?.total_acres || 5} Acres total area)
          </p>
        </div>

        {/* Health Score Pill */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-white border border-[#E8E2D8] shadow-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF9ED] border border-[#FED898] text-[#8B7A66] flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#AFA190] block">
                Agri Health Index
              </span>
              <span className="text-xl font-black text-[#211C18]">{healthScore} / 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Soil Telemetry Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
          <div>
            <h2 className="text-lg font-black text-[#211C18] flex items-center gap-2">
              <Droplets className="w-5 h-5 text-[#8B7A66]" />
              Soil Biomass & Telemetry
            </h2>
            <p className="text-xs text-[#6F655B]">
              Nutrient composition, organic carbon ratio, and active moisture retention
            </p>
          </div>
          <button
            onClick={() => setShowSoilModal(true)}
            className="px-4 py-2 btn-hawaiian-primary text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Update Soil Test</span>
          </button>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 block">pH Level</span>
            <span className="text-xl font-black text-slate-800 mt-1 block">
              {soil.ph ?? '6.8'}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600">Optimal (6.5 - 7.5)</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 block">Nitrogen (N)</span>
            <span className="text-xl font-black text-slate-800 mt-1 block">
              {soil.nitrogen ?? '210'} <span className="text-xs font-bold text-slate-400">kg/ha</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-600">Moderate High</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 block">Phosphorus (P)</span>
            <span className="text-xl font-black text-slate-800 mt-1 block">
              {soil.phosphorus ?? '45'} <span className="text-xs font-bold text-slate-400">kg/ha</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-600">Adequate</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 block">Potassium (K)</span>
            <span className="text-xl font-black text-slate-800 mt-1 block">
              {soil.potassium ?? '195'} <span className="text-xs font-bold text-slate-400">kg/ha</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-600">Strong</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 block">Organic Carbon</span>
            <span className="text-xl font-black text-slate-800 mt-1 block">
              {soil.organic_carbon ?? '0.85'}%
            </span>
            <span className="text-[10px] font-semibold text-emerald-600">Rich Biomass</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 block">Moisture Ratio</span>
            <span className="text-xl font-black text-slate-800 mt-1 block">
              {soil.moisture_pct ?? '28'}%
            </span>
            <span className="text-[10px] font-semibold text-blue-600">Well Irrigated</span>
          </div>
        </div>

        {/* AI Soil Advisory */}
        <div className="p-4 rounded-2xl bg-[#FFF9ED] border border-[#FED898] flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#8B7A66] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-[#5E5142] uppercase tracking-wider">
              Agronomic Soil Recommendation
            </h4>
            <p className="text-xs text-[#403A34] mt-1 font-medium leading-relaxed">
              {soil.recommendation ||
                'Soil is balanced for high-yield horticultural crops (Tomatoes, Onions, Grapes). Maintain organic carbon mulch to retain root moisture during dry spells.'}
            </p>
          </div>
        </div>
      </div>

      {/* Historical Yields & Expenses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Historical Crop Performance */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8]">
            <div>
              <h3 className="text-base font-black text-[#211C18] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#8B7A66]" />
                Historical Crop Yields & Revenue
              </h3>
              <p className="text-xs text-[#6F655B]">Yield harvest records across seasons</p>
            </div>
            <button
              onClick={() => setShowCropModal(true)}
              className="px-3.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F5EBDD] text-[#211C18] border border-[#E8E2D8] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#8B7A66]" />
              <span>Add Record</span>
            </button>
          </div>

          {/* Bar Chart of Yields */}
          <div className="h-60 w-full">
            {cropHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropHistory}>
                  <XAxis dataKey="crop" stroke="#AFA190" fontSize={11} />
                  <YAxis stroke="#AFA190" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#211C18',
                      borderRadius: '12px',
                      color: '#FFF9F0',
                      border: '1px solid #403A34',
                      fontSize: '12px',
                    }}
                    formatter={(val, name) => [
                      name === 'yield_kg' ? `${val} kg` : `₹${val.toLocaleString()}`,
                      name === 'yield_kg' ? 'Yield' : 'Revenue',
                    ]}
                  />
                  <Bar dataKey="yield_kg" fill="#8B7A66" radius={[6, 6, 0, 0]} name="yield_kg" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#AFA190]">
                No historical crop data logged yet.
              </div>
            )}
          </div>

          {/* Historic Crop Yield Summary Cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8]">
              <span className="text-[10px] font-bold text-[#AFA190] uppercase">
                Total Historic Revenue
              </span>
              <span className="text-lg font-black text-[#211C18] block mt-0.5">
                ₹{totalHistoricRevenue.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8]">
              <span className="text-[10px] font-bold text-[#AFA190] uppercase">Logged Seasons</span>
              <span className="text-lg font-black text-[#8B7A66] block mt-0.5">
                {cropHistory.length} Batches
              </span>
            </div>
          </div>
        </div>

        {/* Farm Operating Expenses */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Operating Expenses Breakdown
              </h3>
              <p className="text-xs text-slate-500">Fertilizers, labor, seeds, diesel & irrigation</p>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Log Expense</span>
            </button>
          </div>

          {/* Pie Chart of Expenses */}
          <div className="h-60 w-full flex items-center justify-center">
            {expensePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {expensePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`₹${val.toLocaleString()}`, 'Amount']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No expense entries logged yet.
              </div>
            )}
          </div>

          {/* Total Expense Summary */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Total Farm Expenses
              </span>
              <span className="text-lg font-black text-rose-600 block mt-0.5">
                ₹{totalExpense.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Net Farm Margin</span>
              <span className="text-lg font-black text-emerald-600 block mt-0.5">
                ₹{Math.max(0, totalHistoricRevenue - totalExpense).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Update Soil Modal */}
      {showSoilModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Update Soil Telemetry</h3>
              <button
                onClick={() => setShowSoilModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSoilSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700">pH Level</label>
                  <input
                    type="number"
                    step="0.1"
                    value={soilForm.ph}
                    onChange={(e) => setSoilForm({ ...soilForm, ph: parseFloat(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Soil Type</label>
                  <input
                    type="text"
                    value={soilForm.soil_type}
                    onChange={(e) => setSoilForm({ ...soilForm, soil_type: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Nitrogen (kg/ha)</label>
                  <input
                    type="number"
                    value={soilForm.nitrogen}
                    onChange={(e) => setSoilForm({ ...soilForm, nitrogen: parseFloat(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Phosphorus (kg/ha)</label>
                  <input
                    type="number"
                    value={soilForm.phosphorus}
                    onChange={(e) =>
                      setSoilForm({ ...soilForm, phosphorus: parseFloat(e.target.value) })
                    }
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Potassium (kg/ha)</label>
                  <input
                    type="number"
                    value={soilForm.potassium}
                    onChange={(e) =>
                      setSoilForm({ ...soilForm, potassium: parseFloat(e.target.value) })
                    }
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Moisture %</label>
                  <input
                    type="number"
                    value={soilForm.moisture_pct}
                    onChange={(e) =>
                      setSoilForm({ ...soilForm, moisture_pct: parseFloat(e.target.value) })
                    }
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">AI / Agronomist Notes</label>
                <textarea
                  value={soilForm.recommendation}
                  onChange={(e) => setSoilForm({ ...soilForm, recommendation: e.target.value })}
                  rows={2}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSoilModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 btn-hawaiian-primary text-xs font-bold rounded-xl shadow-md"
                >
                  Save Telemetry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Add Crop Season Record</h3>
              <button
                onClick={() => setShowCropModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCropSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700">Crop Name</label>
                  <input
                    type="text"
                    value={cropForm.crop}
                    onChange={(e) => setCropForm({ ...cropForm, crop: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Season</label>
                  <select
                    value={cropForm.season}
                    onChange={(e) => setCropForm({ ...cropForm, season: e.target.value })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    <option value="Kharif">Kharif (Monsoon)</option>
                    <option value="Rabi">Rabi (Winter)</option>
                    <option value="Zaid">Zaid (Summer)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Harvest Year</label>
                  <input
                    type="number"
                    value={cropForm.year}
                    onChange={(e) => setCropForm({ ...cropForm, year: parseInt(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Yield (kg)</label>
                  <input
                    type="number"
                    value={cropForm.yield_kg}
                    onChange={(e) => setCropForm({ ...cropForm, yield_kg: parseFloat(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Revenue (₹)</label>
                  <input
                    type="number"
                    value={cropForm.revenue}
                    onChange={(e) => setCropForm({ ...cropForm, revenue: parseFloat(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Area (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cropForm.area_acres}
                    onChange={(e) => setCropForm({ ...cropForm, area_acres: parseFloat(e.target.value) })}
                    className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCropModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 btn-hawaiian-primary text-xs font-bold rounded-xl shadow-md"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Log Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">Log Farm Expense</h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  <option value="Fertilizers">Fertilizers & Nutrients</option>
                  <option value="Seeds">Seeds & Saplings</option>
                  <option value="Labor">Harvest & Field Labor</option>
                  <option value="Fuel">Tractor / Diesel / Power</option>
                  <option value="Irrigation">Drip / Water Supply</option>
                  <option value="Other">Packaging & Miscellaneous</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Amount (₹)</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Description</label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 btn-hawaiian-primary text-xs font-bold rounded-xl shadow-md"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmDigitalTwin;
