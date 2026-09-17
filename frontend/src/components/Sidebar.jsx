import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  PlusCircle,
  Inbox,
  Truck,
  LineChart,
  User,
  LogOut,
  ShoppingBag,
  Sparkles,
  History,
  Users,
  Layers,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getLinks = () => {
    if (user.role === 'farmer') {
      return [
        { to: '/farmer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/farmer/listings', label: 'My Listings', icon: Sprout },
        { to: '/farmer/listings/new', label: 'Add Produce', icon: PlusCircle },
        { to: '/farmer/requests', label: 'Purchase Requests', icon: Inbox },
        { to: '/farmer/orders', label: 'Orders & Shipments', icon: Truck },
        { to: '/farmer/analytics', label: 'Sales Analytics', icon: LineChart },
        { to: '/farmer/profile', label: 'Farm Profile', icon: User },
      ];
    } else if (user.role === 'buyer') {
      return [
        { to: '/buyer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
        { to: '/buyer/smart-match', label: 'AI Smart Match', icon: Sparkles, badge: 'AI' },
        { to: '/buyer/requests', label: 'My Requests', icon: Inbox },
        { to: '/buyer/orders', label: 'Active Orders', icon: Truck },
        { to: '/buyer/history', label: 'Purchase History', icon: History },
        { to: '/buyer/analytics', label: 'Spend Analytics', icon: LineChart },
        { to: '/buyer/profile', label: 'Business Profile', icon: User },
      ];
    } else {
      // Admin
      return [
        { to: '/admin/dashboard', label: 'Admin Overview', icon: LayoutDashboard },
        { to: '/admin/users', label: 'User Directory', icon: Users },
        { to: '/admin/listings', label: 'All Listings', icon: Layers },
        { to: '/admin/orders', label: 'All Orders', icon: Truck },
        { to: '/admin/analytics', label: 'Platform Analytics', icon: LineChart },
      ];
    }
  };

  const links = getLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto space-y-1">
          {/* User info banner */}
          <div className="p-3 mb-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-slate-800 truncate">{user.name}</h4>
              <p className="text-[11px] text-slate-500 capitalize">
                {user.role === 'farmer'
                  ? user.farmer_profile?.farm_name || 'Farmer Account'
                  : user.role === 'buyer'
                  ? user.buyer_profile?.business_name || 'Buyer Account'
                  : 'Platform Admin'}
              </p>
            </div>
          </div>

          <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {user.role} Navigation
          </div>

          {/* Navigation Links */}
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-600 text-white shadow-xs">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom signout */}
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
