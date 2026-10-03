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
  Upload,
  FileText,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Check,
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

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const FarmDigitalTwin = () => {
  const { user } = useAuth();
  const [twinData, setTwinData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showSoilModal, setShowSoilModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Soil Lab Report Upload State
  const [soilModalTab, setSoilModalTab] = useState('upload'); // 'upload' | 'manual'
  const [soilFile, setSoilFile] = useState(null);
  const [soilFilePreview, setSoilFilePreview] = useState(null);
  const [isAnalyzingSoil, setIsAnalyzingSoil] = useState(false);
  const [soilAnalysisResult, setSoilAnalysisResult] = useState(null);
  const [soilAnalysisError, setSoilAnalysisError] = useState('');

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

  const handleSoilFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
      setSoilAnalysisError('Invalid file type. Please upload a JPG, PNG, or PDF of your laboratory report.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setSoilAnalysisError('File size exceeds 8MB limit. Please upload a smaller image or scan.');
      return;
    }

    setSoilFile(file);
    setSoilAnalysisError('');
    setSoilAnalysisResult(null);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setSoilFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setSoilFilePreview(null);
    }
  };

  const handleAnalyzeSoilReport = async () => {
    if (!soilFile) {
      setSoilAnalysisError('Please select a soil lab report image or PDF first.');
      return;
    }

    setIsAnalyzingSoil(true);
    setSoilAnalysisError('');

    try {
      const formData = new FormData();
      formData.append('file', soilFile);
      const res = await digitalTwinAPI.analyzeSoilReport(formData);

      if (res.data?.success) {
        setSoilAnalysisResult(res.data);
        fetchTwinData();
      } else {
        setSoilAnalysisError(res.data?.message || 'Failed to extract soil parameters.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error communicating with soil analysis service.';
      setSoilAnalysisError(msg);
    } finally {
      setIsAnalyzingSoil(false);
    }
  };

  const handleSoilSubmit = async (e) => {
    e.preventDefault();
    try {
      await digitalTwinAPI.updateSoil({
        ph_level: soilForm.ph,
        nitrogen_kg_ha: soilForm.nitrogen,
        phosphorus_kg_ha: soilForm.phosphorus,
        potassium_kg_ha: soilForm.potassium,
        organic_carbon_pct: soilForm.organic_carbon,
        moisture_pct: soilForm.moisture_pct,
        soil_type: soilForm.soil_type,
      });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Agronomic Intelligence
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
              Live Digital Twin
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            {twinData?.farm_name || 'My Farm'} Digital Twin
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time agro-ecological modeling for{' '}
            <strong className="text-slate-700">{twinData?.location || 'Maharashtra'}</strong> (
            {twinData?.total_acres || 5} Acres total area)
          </p>
        </div>

        {/* Health Score Pill */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Agri Health Index
              </span>
              <span className="text-xl font-black text-emerald-600">{healthScore} / 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Soil Telemetry Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-emerald-600" />
                Soil Biomass & Laboratory Telemetry
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Source: Laboratory Report</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Certified laboratory soil test parameters with multimodal Gemini agronomic interpretation
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => {
                setSoilModalTab('upload');
                setShowSoilModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Lab Report</span>
            </button>
            <button
              onClick={() => {
                setSoilModalTab('manual');
                setShowSoilModal(true);
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span>Manual Entry</span>
            </button>
          </div>
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
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              Agronomic Soil Recommendation
            </h4>
            <p className="text-xs text-emerald-800 mt-1 font-medium leading-relaxed">
              {soil.recommendation ||
                'Soil is balanced for high-yield horticultural crops (Tomatoes, Onions, Grapes). Maintain organic carbon mulch to retain root moisture during dry spells.'}
            </p>
          </div>
        </div>
      </div>

      {/* Historical Yields & Expenses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Historical Crop Performance */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Historical Crop Yields & Revenue
              </h3>
              <p className="text-xs text-slate-500">Yield harvest records across seasons</p>
            </div>
            <button
              onClick={() => setShowCropModal(true)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Record</span>
            </button>
          </div>

          {/* Bar Chart of Yields */}
          <div className="h-60 w-full">
            {cropHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropHistory}>
                  <XAxis dataKey="crop" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val, name) => [
                      name === 'yield_kg' ? `${val} kg` : `₹${val.toLocaleString()}`,
                      name === 'yield_kg' ? 'Yield' : 'Revenue',
                    ]}
                  />
                  <Bar dataKey="yield_kg" fill="#10b981" radius={[6, 6, 0, 0]} name="yield_kg" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No historical crop data logged yet.
              </div>
            )}
          </div>

          {/* Historic Crop Yield Summary Cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Total Historic Revenue
              </span>
              <span className="text-lg font-black text-slate-900 block mt-0.5">
                ₹{totalHistoricRevenue.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Logged Seasons</span>
              <span className="text-lg font-black text-emerald-600 block mt-0.5">
                {cropHistory.length} Batches
              </span>
            </div>
          </div>
        </div>

        {/* Farm Operating Expenses */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
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
      {/* 1. Update Soil & Lab Report Modal */}
      {showSoilModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 space-y-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-emerald-600" />
                  Soil Fertility Laboratory Intelligence
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload an official soil health certificate or test report for automated multimodal extraction
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSoilModal(false);
                  setSoilAnalysisResult(null);
                  setSoilFile(null);
                  setSoilFilePreview(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Workflow Mode Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setSoilModalTab('upload')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  soilModalTab === 'upload'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Lab Report (Required)</span>
              </button>
              <button
                type="button"
                onClick={() => setSoilModalTab('manual')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  soilModalTab === 'manual'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Manual Telemetry Entry</span>
              </button>
            </div>

            {soilModalTab === 'upload' ? (
              <div className="space-y-6">
                {!soilAnalysisResult ? (
                  <>
                    {/* Upload Dropzone */}
                    <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
                      <input
                        type="file"
                        id="soil-lab-file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                        onChange={handleSoilFileSelect}
                        className="hidden"
                      />
                      <label htmlFor="soil-lab-file" className="cursor-pointer space-y-3 block">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Click to upload Soil Health Card or Lab Report
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Supported formats: JPG, PNG, PDF (Max 8MB)
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* File Preview */}
                    {soilFile && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {soilFilePreview ? (
                            <img
                              src={soilFilePreview}
                              alt="Soil Report Preview"
                              className="w-14 h-14 object-cover rounded-xl border border-slate-200"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
                              <FileText className="w-6 h-6" />
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-bold text-slate-800 truncate max-w-xs">
                              {soilFile.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {(soilFile.size / 1024).toFixed(1)} KB • Ready for extraction
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSoilFile(null);
                            setSoilFilePreview(null);
                          }}
                          className="text-xs font-semibold text-rose-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {/* Error Banner */}
                    {soilAnalysisError && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{soilAnalysisError}</span>
                      </div>
                    )}

                    {/* Action button */}
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowSoilModal(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!soilFile || isAnalyzingSoil}
                        onClick={handleAnalyzeSoilReport}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
                      >
                        {isAnalyzingSoil ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Analyzing Physical Report...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Extract & Analyze Report</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  /* Extracted Structured Results & Agronomic Interpretation */
                  <div className="space-y-6">
                    {/* Header: Lab & Source Attribution */}
                    <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                          {soilAnalysisResult.report_metadata?.lab_name || 'Laboratory Report'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Verified Certificate</span>
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 font-medium">
                        Soil Type: <strong>{soilAnalysisResult.report_metadata?.soil_type}</strong> • 
                        Source: <em>{soilAnalysisResult.report_metadata?.source_attribution}</em>
                      </p>
                    </div>

                    {/* Physical Measurements Table */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Physical Laboratory Measurements
                      </h4>
                      <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                            <tr>
                              <th className="py-2.5 px-3">Parameter</th>
                              <th className="py-2.5 px-3">Measured Value</th>
                              <th className="py-2.5 px-3">Optimal Benchmark</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Attribution</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {soilAnalysisResult.physical_measurements?.map((m) => (
                              <tr key={m.key} className="hover:bg-slate-50/60">
                                <td className="py-2.5 px-3 font-semibold text-slate-800">{m.parameter}</td>
                                <td className="py-2.5 px-3 font-bold text-slate-900">
                                  {m.status === 'NOT_PROVIDED' ? (
                                    <span className="text-slate-400 font-normal italic">Not provided</span>
                                  ) : m.status === 'UNREADABLE' ? (
                                    <span className="text-amber-600 font-normal italic">Not reliably readable</span>
                                  ) : (
                                    m.display_value
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-slate-400">{m.optimal_range}</td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      m.status === 'OPTIMAL'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : m.status === 'DEFICIENT'
                                        ? 'bg-rose-100 text-rose-800'
                                        : m.status === 'HIGH'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {m.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-[10px] text-slate-500 font-medium">
                                  Source: {m.source}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* AI Agronomic Interpretation (Separated from Lab Data) */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                          AI Agronomic Interpretation & Advisory
                        </h4>
                        <span className="text-[10px] text-slate-400 italic">
                          (Based on uploaded laboratory report)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Fertility Status</span>
                          <p className="font-bold text-slate-800 mt-0.5">
                            {soilAnalysisResult.ai_interpretation?.fertility_status}
                          </p>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">pH Classification</span>
                          <p className="font-bold text-slate-800 mt-0.5">
                            {soilAnalysisResult.ai_interpretation?.ph_status}
                          </p>
                        </div>
                      </div>

                      {/* Recommended Crops */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Recommended Crops for this Soil:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {soilAnalysisResult.ai_interpretation?.recommended_crops?.map((c, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Corrective Actions */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Agronomic Soil Actions:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-xs text-slate-700">
                          {soilAnalysisResult.ai_interpretation?.corrective_actions?.map((act, i) => (
                            <li key={i}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Completion actions */}
                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSoilAnalysisResult(null);
                          setSoilFile(null);
                          setSoilFilePreview(null);
                        }}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Upload Another Report
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSoilModal(false);
                          setSoilAnalysisResult(null);
                        }}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                      >
                        Apply & Update Digital Twin
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Manual Input Tab */
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
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    Save Telemetry
                  </button>
                </div>
              </form>
            )}
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md"
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md"
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
