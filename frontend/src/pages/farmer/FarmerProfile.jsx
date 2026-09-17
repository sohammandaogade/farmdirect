import React, { useState, useEffect } from 'react';
import { User, Save, Sprout, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { farmerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export const FarmerProfile = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [farmName, setFarmName] = useState(user?.farmer_profile?.farm_name || '');
  const [location, setLocation] = useState(user?.farmer_profile?.location || '');
  const [farmSize, setFarmSize] = useState(user?.farmer_profile?.farm_size || '');
  const [primaryCrops, setPrimaryCrops] = useState(user?.farmer_profile?.primary_crops || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    farmerAPI.getProfile().then((res) => {
      if (res.data.success) {
        const p = res.data.data;
        setFarmName(p.farm_name || '');
        setLocation(p.location || '');
        setFarmSize(p.farm_size || '');
        setPrimaryCrops(p.primary_crops || '');
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await farmerAPI.updateProfile({
        name,
        phone,
        farm_name: farmName,
        location,
        farm_size: farmSize,
        primary_crops: primaryCrops,
      });
      if (res.data.success) {
        showToast('Farmer profile updated successfully!');
        refreshUser();
      }
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Account</span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Farm Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Manage public farm credentials and contact information</p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Farmer Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Farm Name *</label>
              <input
                type="text"
                required
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Location / District *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Farm Size</label>
              <input
                type="text"
                value={farmSize}
                onChange={(e) => setFarmSize(e.target.value)}
                placeholder="e.g. 25 acres"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Primary Harvest Crops</label>
            <input
              type="text"
              value={primaryCrops}
              onChange={(e) => setPrimaryCrops(e.target.value)}
              placeholder="e.g. Tomato, Onion, Potato"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FarmerProfile;
