import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sprout, Save, AlertCircle, Sparkles } from 'lucide-react';
import { farmerAPI, priceAPI } from '../../services/api';
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
      priceAPI.getInsight(selectedCrop, location, expectedPrice).then((res) => {
        if (res.data.success) setPriceInsight(res.data.data);
      }).catch(() => {});
    }
  }, [crop, customCrop, location, expectedPrice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

    setLoading(true);
    try {
      const payload = {
        crop: finalCrop,
        quantity: parseFloat(quantity),
        unit,
        expected_price: parseFloat(expectedPrice),
        location,
        quality_grade: qualityGrade,
        availability_date: availabilityDate,
        description,
        image_url: imageUrl,
        status,
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

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isEdit ? 'Edit Produce Listing' : 'List New Produce'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Publish harvest availability directly to commercial buyers
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sprout className="w-6 h-6" />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
    </div>
  );
};

export default AddEditListing;
