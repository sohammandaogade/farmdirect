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
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-xl border-b border-[#E8E2D8] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            {user && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-xl text-[#6F655B] hover:text-[#211C18] hover:bg-[#F5EBDD] transition-colors focus:outline-none"
                aria-label="Toggle Navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-[#8B7A66] text-[#FFE5B8] flex items-center justify-center shadow-md shadow-[#8B7A66]/20 group-hover:scale-105 transition-transform duration-300">
                {/* Brand leaf icon in semantic agricultural green per user specification */}
                <Sprout className="w-5 h-5 text-[#2E7D32] stroke-[2.4]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-[#211C18] leading-none">
                  Farm<span className="text-[#8B7A66]">Direct</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest text-[#AFA190] mt-1">
                  B2B Commodity Exchange
                </span>
              </div>
            </Link>
          </div>

          {/* Center Links (Public or Quick Links) */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-bold text-[#6F655B]">
            <Link
              to="/marketplace"
              className={`px-3.5 py-2 rounded-xl transition-all ${
                isNavActive('/marketplace')
                  ? 'bg-[#8B7A66] text-white shadow-subtle'
                  : 'hover:text-[#211C18] hover:bg-[#F5EBDD]'
              }`}
            >
              Marketplace
            </Link>
            <Link
              to="/buyer/smart-match"
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                isNavActive('/buyer/smart-match')
                  ? 'bg-[#8B7A66] text-white shadow-subtle'
                  : 'hover:text-[#211C18] hover:bg-[#F5EBDD]'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isNavActive('/buyer/smart-match') ? 'text-[#FFE5B8]' : 'text-[#8B7A66]'}`} />
              <span>Smart Match</span>
            </Link>
            <Link
              to="/waste-marketplace"
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                isNavActive('/waste-marketplace')
                  ? 'bg-[#8B7A66] text-white shadow-subtle'
                  : 'hover:text-[#211C18] hover:bg-[#F5EBDD]'
              }`}
            >
              <Recycle className={`w-3.5 h-3.5 ${isNavActive('/waste-marketplace') ? 'text-[#FFE5B8]' : 'text-[#8B7A66]'}`} />
              <span>Waste Market</span>
            </Link>
            <Link
              to="/#how-it-works"
              className="px-3.5 py-2 rounded-xl hover:text-[#211C18] hover:bg-[#F5EBDD] transition-all"
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
                  className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                    user.role === 'farmer'
                      ? 'bg-[#FFE5B8] text-[#5E5142] border border-[#FED898] shadow-subtle'
                      : user.role === 'buyer'
                      ? 'bg-[#F5EBDD] text-[#332A22] border border-[#E8E2D8] shadow-subtle'
                      : 'bg-[#FAF8F5] text-[#211C18] border border-[#D1C6B7] shadow-subtle'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    user.role === 'farmer' ? 'bg-[#8B7A66]' : user.role === 'buyer' ? 'bg-[#766654]' : 'bg-[#211C18]'
                  }`} />
                  <span>{user.role}</span>
                </div>

                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="relative p-2.5 rounded-xl text-[#6F655B] hover:text-[#211C18] hover:bg-[#F5EBDD] transition-colors focus:outline-none"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5 stroke-[1.8]" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#8B7A66] rounded-full ring-2 ring-white animate-pulse" />
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {showNotifs && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-elevated border border-[#E8E2D8] p-4 z-50 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#211C18]">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFE5B8] text-[#4D4236]">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-[#8B7A66] hover:text-[#5E5142] font-bold flex items-center gap-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-[#F5EBDD] my-2 pr-1">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-[#AFA190]">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`py-3 px-3 rounded-2xl transition-colors ${
                                !n.is_read ? 'bg-[#FFF9F0]' : 'hover:bg-[#FAF8F5]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="text-xs font-bold text-[#211C18] leading-snug">{n.title}</div>
                                {!n.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-[#8B7A66] shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-xs text-[#6F655B] mt-1 font-normal leading-relaxed">{n.message}</p>
                              <span className="text-[10px] font-medium text-[#AFA190] mt-1.5 block">
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
                    className="flex items-center gap-2 p-1 sm:p-1.5 rounded-2xl hover:bg-[#F5EBDD] transition-colors focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#8B7A66] text-[#FFE5B8] flex items-center justify-center font-black text-xs shadow-subtle">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-xs font-bold text-[#211C18] leading-tight truncate max-w-[120px]">
                        {user.name}
                      </div>
                      <div className="text-[10px] font-semibold text-[#AFA190] capitalize">{user.role}</div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#6F655B]" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-52 bg-white rounded-3xl shadow-elevated border border-[#E8E2D8] p-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-2 border-b border-[#F5EBDD] mb-1">
                        <p className="text-xs font-bold text-[#211C18] truncate">{user.name}</p>
                        <p className="text-[10px] text-[#AFA190] truncate">{user.email || `${user.role}@farmdirect.in`}</p>
                      </div>

                      <Link
                        to={`/${user.role}/dashboard`}
                        onClick={() => setShowUserMenu(false)}
                        className="block px-3 py-2 rounded-xl text-xs font-semibold text-[#403A34] hover:bg-[#F5EBDD] transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to={`/${user.role}/profile`}
                        onClick={() => setShowUserMenu(false)}
                        className="block px-3 py-2 rounded-xl text-xs font-semibold text-[#403A34] hover:bg-[#F5EBDD] transition-colors"
                      >
                        Profile & Settings
                      </Link>
                      <div className="my-1 border-t border-[#F5EBDD]" />
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
                  className="px-4 py-2 text-xs font-bold text-[#403A34] hover:text-[#8B7A66] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 btn-hawaiian-primary text-xs font-bold rounded-xl shadow-md transition-all"
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
