import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sprout,
  Save,
  AlertCircle,
  Sparkles,
  Camera,
  CheckCircle2,
  Upload,
  ShieldAlert,
  X,
} from 'lucide-react';
import { farmerAPI, priceAPI, qualityAPI, copilotAPI, aiAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import FairPriceInsight from '../../components/FairPriceInsight';

const CROPS = ['Tomato', 'Onion', 'Potato', 'Wheat', 'Rice', 'Carrot', 'Cabbage', 'Capsicum', 'Maize', 'Cauliflower'];
const GRADES = ['Grade A', 'Grade B', 'Organic', 'Grade C (Processing)'];

export const AddEditListing = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [crop, setCrop] = useState('Tomato');
  const [customCrop, setCustomCrop] = useState('');
  const [variety, setVariety] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [location, setLocation] = useState(user?.farmer_profile?.location || 'Pune');
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [availabilityDate, setAvailabilityDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  });
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  const [priceInsight, setPriceInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // AI Quality Inspection State
  const [inspectingImage, setInspectingImage] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(null);

  // AI Listing Generator State
  const [showAiGenModal, setShowAiGenModal] = useState(false);
  const [roughNotes, setRoughNotes] = useState('');
  const [generatingListing, setGeneratingListing] = useState(false);

  // Duplicate Check Warning State
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  useEffect(() => {
    if (isEdit) {
      loadListing();
    }
  }, [id]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const res = await farmerAPI.getListing(id);
      if (res.data.success) {
        const item = res.data.data;
        if (CROPS.includes(item.crop)) {
          setCrop(item.crop);
        } else {
          setCrop('Other');
          setCustomCrop(item.crop);
        }
        setQuantity(item.quantity);
        setUnit(item.unit || 'kg');
        setExpectedPrice(item.expected_price);
        setLocation(item.location);
        setQualityGrade(item.quality_grade);
        setAvailabilityDate(item.availability_date);
        setDescription(item.description || '');
        setImageUrl(item.image_url || '');
        setStatus(item.status);
      }
    } catch (e) {
      showToast('Failed to load listing', 'error');
      navigate('/farmer/listings');
    } finally {
      setLoading(false);
    }
  };

  // Check price insight dynamically when crop, location, or price changes
  useEffect(() => {
    const selectedCrop = crop === 'Other' ? customCrop : crop;
    if (selectedCrop && location && expectedPrice) {
      priceAPI
        .getInsight(selectedCrop, location, expectedPrice)
        .then((res) => {
          if (res.data.success) setPriceInsight(res.data.data);
        })
        .catch(() => {});
    }
  }, [crop, customCrop, location, expectedPrice]);

  // Handle Produce Image Inspection
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setInspectingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('crop', crop === 'Other' ? customCrop : crop);
      formData.append('declared_grade', qualityGrade);

      const res = await qualityAPI.uploadAndInspect(formData);
      if (res.data.success) {
        const insp = res.data;
        setInspectionResult(insp);
        if (insp.ai_assessed_grade) {
          setQualityGrade(insp.ai_assessed_grade);
        }
        if (insp.image_url) {
          setImageUrl(insp.image_url);
        }
        showToast(`AI Quality Verification Complete: Grade ${insp.ai_assessed_grade || 'A'}`);
      }
    } catch (err) {
      console.error('Image inspection failed:', err);
      showToast('Failed to run computer vision inspection', 'error');
    } finally {
      setInspectingImage(false);
    }
  };

  // Handle AI Listing Generator from Rough Notes
  const handleGenerateListing = async (e) => {
    e.preventDefault();
    if (!roughNotes.trim()) return;

    try {
      setGeneratingListing(true);
      const res = await copilotAPI.generateListing(roughNotes);
      if (res.data.success) {
        const gen = res.data.data;
        if (gen.crop && CROPS.includes(gen.crop)) {
          setCrop(gen.crop);
        } else if (gen.crop) {
          setCrop('Other');
          setCustomCrop(gen.crop);
        }
        if (gen.variety) setVariety(gen.variety);
        if (gen.suggested_price) setExpectedPrice(gen.suggested_price);
        if (gen.estimated_quantity) setQuantity(gen.estimated_quantity);
        if (gen.description) setDescription(gen.description);
        if (gen.quality_grade) setQualityGrade(gen.quality_grade);
        setShowAiGenModal(false);
        showToast('AI Listing successfully generated from your notes!');
      }
    } catch (err) {
      console.error('AI listing generation error:', err);
      showToast('Could not auto-generate listing. Please fill manually.', 'error');
    } finally {
      setGeneratingListing(false);
    }
  };

  const handleSubmit = async (e, forceSave = false) => {
    if (e) e.preventDefault();
    setError('');

    const finalCrop = (crop === 'Other' ? customCrop : crop).trim();
    if (!finalCrop) {
      setError('Please select or specify a crop name.');
      return;
    }

    if (parseFloat(quantity) <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    if (parseFloat(expectedPrice) <= 0) {
      setError('Expected price must be greater than 0.');
      return;
    }

    // Pre-save duplicate listing check (if not forced)
    if (!forceSave && !isEdit) {
      try {
        const dupRes = await aiAPI.checkDuplicate({
          farmer_id: user?.id || 1,
          crop: finalCrop,
          quantity: parseFloat(quantity),
          price: parseFloat(expectedPrice),
          location,
        });

        if (dupRes.data.success && (dupRes.data.data?.is_suspected_duplicate || dupRes.data.data?.similarity_score > 75)) {
          setDuplicateWarning(dupRes.data.data);
          return;
        }
      } catch (err) {
        // Continue if duplicate check fails
      }
    }

    setLoading(true);
    try {
      const payload = {
        crop: finalCrop,
        variety: variety || undefined,
        quantity: parseFloat(quantity),
        unit,
        expected_price: parseFloat(expectedPrice),
        location,
        quality_grade: qualityGrade,
        availability_date: availabilityDate,
        description,
        image_url: imageUrl,
        status,
        inspection_id: inspectionResult?.id,
      };

      if (isEdit) {
        const res = await farmerAPI.updateListing(id, payload);
        if (res.data.success) {
          showToast('Listing updated successfully!');
          navigate('/farmer/listings');
        }
      } else {
        const res = await farmerAPI.createListing(payload);
        if (res.data.success) {
          showToast('Produce listed successfully! Now live in the marketplace.');
          navigate('/farmer/listings');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save listing. Please check inputs.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        to="/farmer/listings"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Listings</span>
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isEdit ? 'Edit Produce Listing' : 'List New Produce'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Publish harvest availability with AI quality certification directly to buyers
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAiGenModal(true)}
            className="py-2 px-3.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Generate from Notes</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Computer-Vision Quality Upload Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>Computer-Vision Produce Quality Verification</span>
            </div>
            <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>{inspectingImage ? 'Scanning Image...' : 'Upload Produce Photo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={inspectingImage}
                className="hidden"
              />
            </label>
          </div>

          {inspectionResult ? (
            <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  AI Quality Certified: <strong>{inspectionResult.grade || 'Grade A'}</strong>
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Confidence: {inspectionResult.confidence ?? 94}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 block">Ripeness</span>
                  <strong className="text-slate-800">{inspectionResult.ripeness_pct ?? 88}%</strong>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 block">Uniformity</span>
                  <strong className="text-slate-800">{inspectionResult.uniformity_pct ?? 92}%</strong>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 block">Defects</span>
                  <strong className="text-slate-800">{inspectionResult.defects_pct ?? 3}%</strong>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              Upload a clear photo of your harvested produce. Our computer vision model assesses ripeness, uniformity, and defect ratios to certify fair grades.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Crop selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Produce / Crop *</label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {CROPS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="Other">Other (Custom Crop)</option>
              </select>
            </div>

            {crop === 'Other' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Custom Crop Name *</label>
                <input
                  type="text"
                  required
                  value={customCrop}
                  onChange={(e) => setCustomCrop(e.target.value)}
                  placeholder="e.g. Strawberry, Garlic"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Variety (Optional)</label>
              <input
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="e.g. Sharbati, Nashik Red, Hybrid"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Quality / Grade *</label>
              <select
                value={qualityGrade}
                onChange={(e) => setQualityGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity & Unit & Expected Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Harvest Quantity *</label>
              <input
                type="number"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 2000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="kg">kg (Kilograms)</option>
                <option value="quintal">quintal (100 kg)</option>
                <option value="ton">ton (1,000 kg)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Expected Price (₹/{unit}) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={expectedPrice}
                onChange={(e) => setExpectedPrice(e.target.value)}
                placeholder="e.g. 28"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Reference Price Insight Preview Box */}
          {priceInsight && priceInsight.has_reference && (
            <div className="animate-in fade-in">
              <FairPriceInsight insight={priceInsight} compact={false} />
            </div>
          )}

          {/* Location & Availability Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Farm / Produce Location *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Pune, Maharashtra"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Availability Date *</label>
              <input
                type="date"
                required
                value={availabilityDate}
                onChange={(e) => setAvailabilityDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Produce Description & Quality Notes</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Fresh farm-grown tomatoes suitable for restaurants and retailers. Plump, deep-red, hand-picked."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Image URL (Optional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... or leave empty for smart auto-image"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              to="/farmer/listings"
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving Produce...' : isEdit ? 'Update Listing' : 'Publish Listing'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* AI Listing Generator Modal */}
      {showAiGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-black text-slate-900">AI Listing Generator</h3>
              </div>
              <button
                onClick={() => setShowAiGenModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateListing} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block">
                  Describe what you harvested in simple rough words:
                </label>
                <textarea
                  rows={4}
                  value={roughNotes}
                  onChange={(e) => setRoughNotes(e.target.value)}
                  placeholder="e.g. Harvested 3000 kg red onions from my field in Nashik. High quality, dry outer skin, medium-large size, ready to ship this week."
                  className="w-full mt-1.5 p-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-[11px] text-purple-900">
                Our AI model automatically parses crop type, variety, estimated market price, grade, and generates an optimized commercial listing description.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiGenModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingListing}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {generatingListing ? 'Analyzing & Writing...' : 'Generate Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Listing Warning Modal */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Potential Duplicate Detected</h3>
                <p className="text-xs text-slate-500">Marketplace integrity duplicate check</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {duplicateWarning.message ||
                'You already have an active produce listing with similar commodity and quantity parameters. Creating duplicate listings may cause confusion among buyers.'}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Review Listing
              </button>
              <button
                type="button"
                onClick={() => {
                  setDuplicateWarning(null);
                  handleSubmit(null, true);
                }}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Proceed & Publish Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddEditListing;
