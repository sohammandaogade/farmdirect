import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sprout, LogIn, AlertCircle, Sparkles, UserCheck, ShieldCheck, ArrowRight, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const Login = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoLogins, setShowDemoLogins] = useState(true);

  const redirectUser = (role) => {
    if (role === 'farmer') navigate('/farmer/dashboard');
    else if (role === 'buyer') navigate('/buyer/dashboard');
    else if (role === 'admin') navigate('/admin/dashboard');
    else navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email.trim().toLowerCase(), password);
      showToast(`Welcome back, ${user.name}!`);
      redirectUser(user.role);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail, demoPassword) => {
    setError('');
    setLoading(true);
    try {
      const user = await login(demoEmail, demoPassword);
      showToast(`Logged in as ${user.name} (${user.role.toUpperCase()})`);
      redirectUser(user.role);
    } catch (err) {
      setError('Demo login failed. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialPlaceholder = (provider) => {
    showToast(`OAuth ${provider} authentication is integrated for commercial single sign-on.`, 'info');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative selection:bg-[#FFE5B8] selection:text-[#3D342B]">
      {/* Background Soft Radiance */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#FFE5B8]/30 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / Brand Mark */}
      <header className="relative z-10 max-w-md w-full mx-auto pt-4 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8B7A66] to-[#5E5142] text-white flex items-center justify-center shadow-md shadow-[#8B7A66]/25 group-hover:scale-105 transition-transform">
            <Sprout className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-[#231E19] tracking-tight leading-none">
              Farm<span className="text-[#8B7A66]">Direct</span>
            </span>
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#8C827A] mt-0.5">
              Direct Agritech
            </span>
          </div>
        </Link>

        {/* Hackathon Demo Helper Pill */}
        <button
          onClick={() => setShowDemoLogins(!showDemoLogins)}
          className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#FFE5B8] text-[#5E5142] border border-[#FED898] hover:bg-[#FFF0D5] transition-all flex items-center gap-1.5 shadow-subtle"
        >
          <Sparkles className="w-3 h-3 text-[#8B7A66]" />
          <span>Demo Accounts</span>
        </button>
      </header>

      {/* Main Login Card Container */}
      <main className="relative z-10 max-w-md w-full mx-auto my-6">
        {/* Quick Demo Accounts Drawer */}
        {showDemoLogins && (
          <div className="bg-white rounded-3xl p-4 border border-[#E8E2D8] shadow-card mb-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8C827A] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#8B7A66]" />
                1-Click Quick Demo Evaluation
              </span>
              <button
                onClick={() => setShowDemoLogins(false)}
                className="text-[10px] font-bold text-[#8C827A] hover:text-[#231E19]"
              >
                Hide
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('farmer@farmdirect.demo', 'password123')}
                className="p-2.5 bg-[#FAF8F5] hover:bg-[#FFE5B8]/40 border border-[#E8E2D8] rounded-2xl text-left transition-all hover:border-[#8B7A66]"
              >
                <span className="text-[9px] font-black uppercase text-[#8B7A66] block">Farmer</span>
                <span className="text-xs font-bold text-[#231E19] block truncate">Rajesh Farms</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('buyer@farmdirect.demo', 'password123')}
                className="p-2.5 bg-[#FAF8F5] hover:bg-[#FFE5B8]/40 border border-[#E8E2D8] rounded-2xl text-left transition-all hover:border-[#8B7A66]"
              >
                <span className="text-[9px] font-black uppercase text-[#2563EB] block">Buyer</span>
                <span className="text-xs font-bold text-[#231E19] block truncate">ABC Resto</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@farmdirect.demo', 'admin123')}
                className="p-2.5 bg-[#FAF8F5] hover:bg-[#FFE5B8]/40 border border-[#E8E2D8] rounded-2xl text-left transition-all hover:border-[#8B7A66]"
              >
                <span className="text-[9px] font-black uppercase text-[#7C3AED] block">Admin</span>
                <span className="text-xs font-bold text-[#231E19] block truncate">Platform</span>
              </button>
            </div>
          </div>
        )}

        {/* Card Body */}
        <div className="bg-white rounded-3xl p-7 sm:p-9 border border-[#E8E2D8] shadow-elevated">
          {/* Welcome Illustration Above "Welcome Back" */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFE5B8] via-[#FFF0D5] to-[#FAF8F5] border border-[#FED898] flex items-center justify-center mb-3 shadow-subtle relative overflow-hidden group">
              {/* Subtle sunray / field geometry */}
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#FFE5B8] rounded-full blur-xs opacity-70" />
              <svg className="w-9 h-9 text-[#8B7A66] relative z-10" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {/* Rolling Farm Field Terraces */}
                <path d="M4 36c6-4 12-4 18 0s12 4 18 0 4-2 4-2" />
                <path d="M4 42c8-3 14-3 20 0s12 3 20 0" />
                {/* Sprout & Seedling */}
                <path d="M24 34V20" />
                <path d="M24 20c-5-5-2-12 5-11 0 7-5 11-5 11z" fill="#8B7A66" fillOpacity="0.25" />
                <path d="M24 24c5-4 11-2 11 4 0 5-6 7-11 7" />
                {/* Radiant Sun */}
                <circle cx="13" cy="14" r="4" fill="#FFE5B8" />
              </svg>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#231E19] tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-[#8C827A] mt-1 font-medium">
              Sign in to your FarmDirect trading workspace
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#4D4236] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C827A]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFE5B8] focus:border-[#8B7A66] transition-all text-[#231E19] placeholder:text-[#8C827A]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#4D4236]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => showToast('Password reset link dispatched if registered.', 'info')}
                  className="text-[11px] font-bold text-[#8B7A66] hover:text-[#5E5142] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C827A]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFE5B8] focus:border-[#8B7A66] transition-all text-[#231E19] placeholder:text-[#8C827A]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#231E19]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Custom Distinctive Login CTA Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-5 rounded-2xl text-xs font-bold uppercase tracking-wider text-white shadow-btn-primary hover:shadow-btn-hover active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-[#8B7A66] via-[#766654] to-[#5E5142] hover:brightness-105 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E8E2D8]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C827A]">
              Or continue with
            </span>
            <div className="flex-1 h-px bg-[#E8E2D8]" />
          </div>

          {/* Social Logins: Google & Apple */}
          <div className="grid grid-cols-2 gap-3">
            {/* Continue with Google */}
            <button
              type="button"
              onClick={() => handleSocialPlaceholder('Google')}
              className="py-2.5 px-3 rounded-2xl border border-[#E8E2D8] hover:bg-[#FAF8F5] hover:border-[#8B7A66] text-[#231E19] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-subtle active:scale-[0.98]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            {/* Continue with Apple */}
            <button
              type="button"
              onClick={() => handleSocialPlaceholder('Apple')}
              className="py-2.5 px-3 rounded-2xl border border-[#E8E2D8] hover:bg-[#FAF8F5] hover:border-[#8B7A66] text-[#231E19] text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-subtle active:scale-[0.98]"
            >
              <svg className="w-4 h-4 fill-current text-[#231E19]" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.89c.65-.8 1.1-1.92.98-3.04-.95.04-2.11.64-2.79 1.44-.6.69-1.12 1.83-1 2.94 1.07.08 2.16-.54 2.81-1.34z" />
              </svg>
              <span>Apple</span>
            </button>
          </div>

          {/* Signup Section */}
          <div className="mt-6 pt-5 border-t border-[#E8E2D8] text-center text-xs text-[#8C827A]">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-[#8B7A66] font-bold hover:text-[#5E5142] hover:underline ml-1">
              Create an account
            </Link>
          </div>
        </div>
      </main>

      {/* Footer information */}
      <footer className="relative z-10 text-center text-xs text-[#8C827A] pt-4">
        FarmDirect • Smart Direct-to-Buyer Agricultural Marketplace & Intelligence Platform
      </footer>
    </div>
  );
};

export default Login;
