import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sprout, LogIn, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const Login = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setError('Demo login failed. Please ensure backend is running and seeded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Brand logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Sprout className="w-7 h-7" />
            </div>
          </Link>
          <h2 className="text-2xl font-black text-slate-900 mt-4 tracking-tight">
            Sign In to Farm<span className="text-emerald-600">Direct</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Smart Direct-to-Buyer Agricultural Marketplace
          </p>
        </div>

        {/* Quick Demo Accounts Banner for Hackathon evaluation */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-6">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>1-Click Hackathon Demo Logins</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('farmer@farmdirect.demo', 'password123')}
              className="p-2.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-xl text-left transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Farmer</span>
              <span className="text-xs font-bold text-slate-800 block truncate">Rajesh Farms</span>
              <span className="text-[10px] text-slate-400 block truncate">Pune • Tomatoes</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('buyer@farmdirect.demo', 'password123')}
              className="p-2.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-xl text-left transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">Buyer</span>
              <span className="text-xs font-bold text-slate-800 block truncate">ABC Restaurant</span>
              <span className="text-[10px] text-slate-400 block truncate">Pune • Buyer</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin@farmdirect.demo', 'admin123')}
              className="p-2.5 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 rounded-xl text-left transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">Admin</span>
              <span className="text-xs font-bold text-slate-800 block truncate">Administrator</span>
              <span className="text-[10px] text-slate-400 block truncate">Full Access</span>
            </button>
          </div>
        </div>

        {/* Regular Login Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-200/50">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-emerald-600 font-bold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
