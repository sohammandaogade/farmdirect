import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sprout, Store, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const Register = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState(searchParams.get('role') === 'buyer' ? 'buyer' : 'farmer');

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Farmer specific fields
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('Pune');
  const [farmSize, setFarmSize] = useState('');
  const [primaryCrops, setPrimaryCrops] = useState('');

  // Buyer specific fields
  const [businessName, setBusinessName] = useState('');
  const [buyerType, setBuyerType] = useState('Restaurant');
  const [businessLocation, setBusinessLocation] = useState('Pune');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'buyer' || roleParam === 'farmer') {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Mandatory Indian Mobile Number Validation
    const cleanPhone = phone.trim().replace(/^(\+91|91|0)/, '').replace(/\D/g, '');
    if (!cleanPhone) {
      setError('Mobile number is required to create an account.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        role,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanPhone,
        password,
      };

      if (role === 'farmer') {
        payload.farm_name = farmName || `${name}'s Farm`;
        payload.farm_location = farmLocation;
        payload.farm_size = farmSize;
        payload.primary_crops = primaryCrops;
      } else {
        payload.business_name = businessName || `${name} Enterprise`;
        payload.buyer_type = buyerType;
        payload.business_location = businessLocation;
      }

      const user = await register(payload);
      showToast('Registration successful! Welcome to FarmDirect.');
      if (user.role === 'farmer') navigate('/farmer/dashboard');
      else navigate('/buyer/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please check your inputs.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4 py-12 relative overflow-hidden selection:bg-[#FFE5B8] selection:text-[#403A34]">
      {/* Ambient background glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FFE5B8]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-10 w-80 h-80 bg-[#8B7A66]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full relative z-10">
        {/* Brand logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-[#8B7A66] text-white flex items-center justify-center shadow-lg shadow-[#8B7A66]/25 group-hover:scale-105 transition-transform duration-300">
              <Sprout className="w-6 h-6 stroke-[2.2] text-emerald-400" />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              Farm<span className="text-[#8B7A66]">Direct</span>
            </span>
          </Link>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-4 tracking-tight">
            Create Your Trading Account
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Join Maharashtra's direct-to-buyer agricultural marketplace
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F5EBDD] shadow-xs">
          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#FAF8F5] rounded-2xl mb-6 border border-[#F5EBDD]">
            <button
              type="button"
              onClick={() => setRole('farmer')}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                role === 'farmer'
                  ? 'bg-[#8B7A66] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sprout className="w-4 h-4 text-[#FFE5B8]" />
              <span>I am a Farmer</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('buyer')}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                role === 'buyer'
                  ? 'bg-[#211C18] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4 text-[#FFE5B8]" />
              <span>I am a Commercial Buyer</span>
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Account Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Patil"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#F5EBDD] rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66] transition-all text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#F5EBDD] rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66] transition-all text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile (e.g. 9876543210)"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#F5EBDD] rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66] transition-all text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Password (min 6 chars) *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#F5EBDD] rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66] transition-all text-slate-900"
                />
              </div>
            </div>

            {/* Role-specific fields */}
            {role === 'farmer' ? (
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#F5EBDD] space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#403A34] block">
                  Producer & Farm Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Farm Name *</label>
                    <input
                      type="text"
                      required
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      placeholder="e.g. Rajesh Farms"
                      className="w-full px-3 py-2 bg-white border border-[#F5EBDD] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Farm Location (District) *</label>
                    <input
                      type="text"
                      required
                      value={farmLocation}
                      onChange={(e) => setFarmLocation(e.target.value)}
                      placeholder="e.g. Pune, Nashik, Satara"
                      className="w-full px-3 py-2 bg-white border border-[#F5EBDD] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Farm Size</label>
                    <input
                      type="text"
                      value={farmSize}
                      onChange={(e) => setFarmSize(e.target.value)}
                      placeholder="e.g. 25 acres"
                      className="w-full px-3 py-2 bg-white border border-[#F5EBDD] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Primary Harvest Crops</label>
                    <input
                      type="text"
                      value={primaryCrops}
                      onChange={(e) => setPrimaryCrops(e.target.value)}
                      placeholder="e.g. Tomato, Onion, Potato"
                      className="w-full px-3 py-2 bg-white border border-[#F5EBDD] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 text-slate-900"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#F5EBDD] space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#403A34] block">
                  Commercial Buyer Profile
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Business Name *</label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. ABC Restaurant / Hotel"
                      className="w-full px-3 py-2 bg-white border border-[#F5EBDD] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Buyer Category *</label>
                    <select
                      value={buyerType}
                      onChange={(e) => setBuyerType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#F5EBDD] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 text-slate-900"
                    >
                      <option value="Restaurant">Restaurant / Hotel</option>
                      <option value="Retailer">Retailer / Supermarket</option>
                      <option value="Wholesaler">Wholesaler / Trader</option>
                      <option value="Food Processor">Food Processing Unit</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Operating Location (City/District) *</label>
                  <input
                    type="text"
                    required
                    value={businessLocation}
                    onChange={(e) => setBusinessLocation(e.target.value)}
                    placeholder="e.g. Pune, Mumbai, Nagpur"
                    className="w-full px-3 py-2 bg-white border border-[#F5EBDD] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 text-slate-900"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 text-white font-bold text-xs rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 ${
                role === 'farmer'
                  ? 'bg-[#8B7A66] hover:bg-[#726352] shadow-[#8B7A66]/25'
                  : 'bg-[#211C18] hover:bg-[#332A22] shadow-black/20'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creating Account...' : `Register as ${role === 'farmer' ? 'Farmer' : 'Commercial Buyer'}`}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#F5EBDD] text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="text-[#8B7A66] font-bold hover:underline">
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
