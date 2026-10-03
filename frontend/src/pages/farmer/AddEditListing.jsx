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
  AlertTriangle,
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

  const isProduceRejected = Boolean(
    inspectionResult?.listing_decision?.status === 'REJECT' ||
    inspectionResult?.quality_assessment?.status === 'ROTTEN' ||
    inspectionResult?.verification_status === 'REJECTED' ||
    inspectionResult?.visible_defect_level === 'CRITICAL_SPOILAGE'
  );

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
        if (insp.image_url) {
          setImageUrl(insp.image_url);
        }
        
        // Handle specific verification feedback without overwriting farmer declaration
        if (
          insp.listing_decision?.status === 'REJECT' ||
          insp.quality_assessment?.status === 'ROTTEN' ||
          insp.verification_status === 'REJECTED' ||
          insp.visible_defect_level === 'CRITICAL_SPOILAGE'
        ) {
          showToast(`🚫 Produce Rejected: Rotten or spoiled produce cannot be listed.`, 'error');
        } else if (insp.verification_status === 'CROP_MISMATCH') {
          showToast(`⚠️ Crop mismatch: Image resembles ${insp.detected_crop || 'different produce'}.`, 'error');
        } else if (insp.verification_status === 'IMAGE_UNSUITABLE') {
          showToast(`⚠️ Image unsuitable: ${insp.image_quality_status || 'Poor image quality'}.`, 'error');
        } else if (insp.verification_status === 'VISIBLE_DEFECTS') {
          showToast(`⚠️ High defects detected (${insp.defect_detected_pct}%). AI Grade: ${insp.ai_assessed_grade}.`, 'error');
        } else if (insp.verification_status === 'REVIEW_REQUIRED') {
          showToast(`Inspection review: AI Grade ${insp.ai_assessed_grade} vs Declared ${qualityGrade}.`, 'info');
        } else {
          showToast(`✅ Quality Verified: Grade ${insp.ai_assessed_grade || 'A'} (${insp.confidence_score}% confidence)`);
        }
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

    const qtyVal = parseFloat(quantity);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    if (qtyVal < 5000) {
      setError('Minimum listing quantity is 5,000 kg.');
      showToast('Minimum listing quantity is 5,000 kg.', 'error');
      return;
    }
    if (qtyVal > 50000) {
      setError('Maximum listing quantity is 50,000 kg.');
      showToast('Maximum listing quantity is 50,000 kg.', 'error');
      return;
    }

    if (parseFloat(expectedPrice) <= 0) {
      setError('Expected price must be greater than 0.');
      return;
    }

    if (!imageUrl) {
      setError('Produce photo is compulsory. Please upload a clear photo of your harvested produce for AI quality verification before creating a listing.');
      showToast('Produce photo is compulsory for listing verification', 'error');
      return;
    }

    if (isProduceRejected) {
      const reason =
        inspectionResult?.listing_decision?.reason ||
        inspectionResult?.assessment_notes ||
        'The uploaded produce was verified as rotten, spoiled, or unfit for sale.';
      setError(`Cannot create listing: ${reason} FarmDirect strictly prohibits listing spoiled produce.`);
      showToast('Listing blocked: Rotten produce cannot be listed.', 'error');
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
              <span>Produce Photo & AI Quality Verification</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                Compulsory *
              </span>
            </div>
            <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>{inspectingImage ? 'Scanning Image...' : imageUrl ? 'Replace Photo' : 'Upload Produce Photo *'}</span>
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
            <div className="space-y-2 animate-in fade-in">
              {isProduceRejected && (
                <div className="p-4 bg-rose-50 rounded-2xl border-2 border-rose-500 text-xs space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-rose-950 flex items-center gap-2 text-sm">
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                      Listing Blocked: Produce Verified as Rotten / Unfit for Sale
                    </span>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-rose-600 text-white tracking-wide">
                      Rejected
                    </span>
                  </div>
                  <p className="text-rose-900 text-xs leading-relaxed font-semibold">
                    {inspectionResult.listing_decision?.reason ||
                      inspectionResult.assessment_notes ||
                      'The uploaded produce exhibits clear signs of mold, fungal growth, or advanced rot, making it unfit for sale.'}
                  </p>
                  <div className="p-3 bg-rose-100/80 rounded-xl text-rose-950 text-[11px] font-medium flex items-start gap-2 border border-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                    <span>
                      FarmDirect strictly prohibits listing rotten, spoiled, or moldy crops. This listing cannot be created or published. Please upload a clear photo of healthy, marketable produce to proceed.
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="p-2 bg-white rounded-lg border border-rose-200">
                      <span className="text-[10px] font-bold text-slate-400 block">Ripeness</span>
                      <strong className="text-slate-700">
                        {inspectionResult.ripeness_pct ?? inspectionResult.legacy_cv_telemetry?.ripeness_pct ?? 30}%
                      </strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-rose-200">
                      <span className="text-[10px] font-bold text-slate-400 block">Uniformity</span>
                      <strong className="text-slate-700">
                        {inspectionResult.uniformity_score ?? inspectionResult.legacy_cv_telemetry?.uniformity_score ?? 25}%
                      </strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-rose-200">
                      <span className="text-[10px] font-bold text-rose-600 block">Defect Area</span>
                      <strong className="text-rose-700">
                        {inspectionResult.defect_detected_pct ?? inspectionResult.legacy_cv_telemetry?.defect_detected_pct ?? 45}%
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {!isProduceRejected && inspectionResult.verification_status === 'CROP_MISMATCH' && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      Crop Mismatch Detected
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      Rejected
                    </span>
                  </div>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    Listing specifies <strong>{inspectionResult.expected_crop}</strong>, but optical inspection detected <strong>{inspectionResult.detected_crop}</strong> features ({inspectionResult.crop_confidence}% confidence).
                  </p>
                  <p className="text-amber-700 text-[11px] italic">
                    {inspectionResult.assessment_notes}
                  </p>
                  <div className="text-[10px] text-amber-900 bg-amber-100/70 p-2 rounded-lg font-medium">
                    ⚠️ AI verification grade cannot be assigned. Please upload a photo of your actual {crop === 'Other' ? customCrop : crop} harvest.
                  </div>
                </div>
              )}

              {inspectionResult.verification_status === 'IMAGE_UNSUITABLE' && (
                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-300 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      Image Unsuitable for Verification ({inspectionResult.image_quality_status || 'BLURRY'})
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                      Unverified
                    </span>
                  </div>
                  <p className="text-rose-800 text-[11px] leading-relaxed">
                    {inspectionResult.assessment_notes || 'Image clarity or lighting is insufficient to perform optical defect analysis.'}
                  </p>
                  <div className="text-[10px] text-rose-900 bg-rose-100/70 p-2 rounded-lg font-medium">
                    💡 Tip: Capture produce in bright natural light, hold camera steady, and place produce centrally.
                  </div>
                </div>
              )}

              {inspectionResult.verification_status === 'VISIBLE_DEFECTS' && (
                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-300 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      Visible Defects Detected: AI Grade {inspectionResult.ai_assessed_grade}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                      Defect Area: {inspectionResult.defect_detected_pct}%
                    </span>
                  </div>
                  <p className="text-rose-800 text-[11px] leading-relaxed">
                    {inspectionResult.assessment_notes}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                    <div className="p-2 bg-white rounded-lg border border-rose-200">
                      <span className="text-[10px] font-bold text-slate-400 block">Farmer Declared</span>
                      <strong className="text-slate-800">{qualityGrade}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-rose-200">
                      <span className="text-[10px] font-bold text-rose-600 block">AI Verified Grade</span>
                      <strong className="text-rose-700">{inspectionResult.ai_assessed_grade}</strong>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="p-2 bg-white rounded-lg border border-rose-100">
                      <span className="text-[10px] font-bold text-slate-400 block">Ripeness</span>
                      <strong className="text-slate-800">
                        {inspectionResult.ripeness_pct ?? inspectionResult.legacy_cv_telemetry?.ripeness_pct ?? 75}%
                      </strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-rose-100">
                      <span className="text-[10px] font-bold text-slate-400 block">Uniformity</span>
                      <strong className="text-slate-800">
                        {inspectionResult.uniformity_score ?? inspectionResult.legacy_cv_telemetry?.uniformity_score ?? 70}%
                      </strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-rose-100">
                      <span className="text-[10px] font-bold text-rose-600 block">Defects</span>
                      <strong className="text-rose-700">
                        {inspectionResult.defect_detected_pct ?? inspectionResult.legacy_cv_telemetry?.defect_detected_pct ?? 12}%
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {inspectionResult.verification_status === 'REVIEW_REQUIRED' && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      Quality Grade Divergence
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      AI: {inspectionResult.ai_assessed_grade}
                    </span>
                  </div>
                  <p className="text-amber-800 text-[11px]">
                    {inspectionResult.assessment_notes}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 bg-white rounded-lg border border-amber-200">
                      <span className="text-[10px] font-bold text-slate-400 block">Declared Grade</span>
                      <strong className="text-slate-800">{qualityGrade}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-amber-200">
                      <span className="text-[10px] font-bold text-amber-700 block">AI Suggestion</span>
                      <strong className="text-amber-800">{inspectionResult.ai_assessed_grade}</strong>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="p-2 bg-white rounded-lg border border-amber-100">
                      <span className="text-[10px] font-bold text-slate-400 block">Ripeness</span>
                      <strong className="text-slate-800">
                        {inspectionResult.ripeness_pct ?? inspectionResult.legacy_cv_telemetry?.ripeness_pct ?? 82}%
                      </strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-amber-100">
                      <span className="text-[10px] font-bold text-slate-400 block">Uniformity</span>
                      <strong className="text-slate-800">
                        {inspectionResult.uniformity_score ?? inspectionResult.legacy_cv_telemetry?.uniformity_score ?? 78}%
                      </strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-amber-100">
                      <span className="text-[10px] font-bold text-slate-400 block">Defects</span>
                      <strong className="text-slate-800">
                        {inspectionResult.defect_detected_pct ?? inspectionResult.legacy_cv_telemetry?.defect_detected_pct ?? 5}%
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {(inspectionResult.verification_status === 'VERIFIED_ALIGNED' || inspectionResult.verification_status === 'VERIFIED_SUPERIOR') && (
                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      AI Quality Certified: <strong>{inspectionResult.ai_assessed_grade}</strong>
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                      Confidence: {inspectionResult.confidence_score}%
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    {inspectionResult.assessment_notes}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="p-2 bg-white rounded-lg border border-emerald-100">
                      <span className="text-[10px] font-bold text-slate-400 block">Ripeness</span>
                      <strong className="text-slate-800">
                        {inspectionResult.ripeness_pct ?? inspectionResult.legacy_cv_telemetry?.ripeness_pct ?? 88}%
                      </strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-emerald-100">
                      <span className="text-[10px] font-bold text-slate-400 block">Uniformity</span>
                      <strong className="text-slate-800">
                        {inspectionResult.uniformity_score ?? inspectionResult.legacy_cv_telemetry?.uniformity_score ?? 82}%
                      </strong>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-emerald-100">
                      <span className="text-[10px] font-bold text-slate-400 block">Defects</span>
                      <strong className="text-slate-800">
                        {inspectionResult.defect_detected_pct ?? inspectionResult.legacy_cv_telemetry?.defect_detected_pct ?? 2.5}%
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/90 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4 text-amber-700" />
              </div>
              <div className="text-[11px] text-amber-900 leading-snug">
                <strong className="font-bold text-amber-950 block">Produce photo upload is compulsory *</strong>
                Upload a clear photo of your harvested produce. Our multimodal AI performs universal crop identification, freshness verification, and rot/mold detection before publishing to the marketplace.
              </div>
            </div>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Harvest Quantity *</label>
                <span className="text-[10px] text-slate-400 font-semibold">5,000 – 50,000 kg</span>
              </div>
              <input
                type="number"
                step="any"
                min="5000"
                max="50000"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="5000 – 50000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Listing quantity must be between 5,000 kg and 50,000 kg.</p>
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

          {/* Produce Photo (Compulsory) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Produce Photo (Compulsory) *
              </label>
              {imageUrl && (
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isProduceRejected
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {isProduceRejected ? '✕ Rotten / Rejected' : '✓ Photo Attached & Inspected'}
                </span>
              )}
            </div>

            {imageUrl ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                <img
                  src={imageUrl}
                  alt="Harvested produce preview"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">Harvest Produce Image</p>
                  <p className="text-[11px] text-slate-500 truncate">{imageUrl}</p>
                  {isProduceRejected ? (
                    <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                      ⚠️ Rotten / spoiled produce detected. Please replace this photo with fresh produce above.
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-600 block mt-0.5">
                      ✓ AI visual inspection attached to this listing.
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Photo required:</strong> Please upload a photo of your harvest using the inspection tool at the top of the form.
                </span>
              </div>
            )}
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
              disabled={loading || isProduceRejected}
              className={`py-2.5 px-6 font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 ${
                isProduceRejected
                  ? 'bg-rose-100 text-rose-500 border border-rose-200 cursor-not-allowed shadow-none'
                  : !imageUrl
                  ? 'bg-emerald-600/70 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              {isProduceRejected ? <ShieldAlert className="w-4 h-4 text-rose-500" /> : <Save className="w-4 h-4" />}
              <span>
                {loading
                  ? 'Saving Produce...'
                  : isProduceRejected
                  ? 'Listing Blocked (Rotten Produce)'
                  : !imageUrl
                  ? 'Upload Photo to Publish'
                  : isEdit
                  ? 'Update Listing'
                  : 'Publish Listing'}
              </span>
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
