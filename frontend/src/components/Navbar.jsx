import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sprout,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Check,
  Recycle,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll();
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      // ignore
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isNavActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            {user && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
                aria-label="Toggle Navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform duration-300">
                <Sprout className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
                  Farm<span className="text-emerald-600">Direct</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">
                  B2B Agritech Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Center Links (Public or Quick Links) */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-600">
            <Link
              to="/marketplace"
              className={`px-3.5 py-2 rounded-xl transition-all ${
                isNavActive('/marketplace')
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              Marketplace
            </Link>
            <Link
              to="/buyer/smart-match"
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                isNavActive('/buyer/smart-match')
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Smart Match</span>
            </Link>
            <Link
              to="/waste-marketplace"
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                isNavActive('/waste-marketplace')
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Recycle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Waste Market</span>
            </Link>
            <Link
              to="/#how-it-works"
              className="px-3.5 py-2 rounded-xl hover:text-slate-900 hover:bg-slate-100/70 transition-all"
            >
              How It Works
            </Link>
          </nav>

          {/* Right Navigation / User controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                {/* Role Pill */}
                <div
                  className={`hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                    user.role === 'farmer'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200/80 shadow-subtle'
                      : user.role === 'buyer'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200/80 shadow-subtle'
                      : 'bg-purple-50 text-purple-800 border border-purple-200/80 shadow-subtle'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    user.role === 'farmer' ? 'bg-amber-500' : user.role === 'buyer' ? 'bg-blue-500' : 'bg-purple-500'
                  }`} />
                  <span>{user.role}</span>
                </div>

                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5 stroke-[1.8]" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-600 rounded-full ring-2 ring-white animate-pulse" />
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {showNotifs && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-elevated border border-slate-200/80 p-4 z-50 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 my-2 pr-1">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`py-3 px-3 rounded-2xl transition-colors ${
                                !n.is_read ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="text-xs font-bold text-slate-800 leading-snug">{n.title}</div>
                                {!n.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-1 font-normal leading-relaxed">{n.message}</p>
                              <span className="text-[10px] font-medium text-slate-400 mt-1.5 block">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 sm:p-1.5 rounded-2xl hover:bg-slate-100 transition-colors focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-xs shadow-subtle">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                        {user.name}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400 capitalize">{user.role}</div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-52 bg-white rounded-3xl shadow-elevated border border-slate-200/80 p-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-2 border-b border-slate-100 mb-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{user.email || `${user.role}@farmdirect.in`}</p>
                      </div>

                      <Link
                        to={`/${user.role}/dashboard`}
                        onClick={() => setShowUserMenu(false)}
                        className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to={`/${user.role}/profile`}
                        onClick={() => setShowUserMenu(false)}
                        className="block px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Profile & Settings
                      </Link>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
