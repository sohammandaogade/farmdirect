import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
  Activity,
  Recycle,
  Sliders,
  ShieldAlert,
  Bot,
  MapPin,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavigationGroups = () => {
    if (user.role === 'farmer') {
      return [
        {
          groupTitle: 'Core Workspace',
          links: [
            { to: '/farmer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/farmer/listings', label: 'My Listings', icon: Sprout },
            { to: '/farmer/listings/new', label: 'Add Produce', icon: PlusCircle },
            { to: '/farmer/requests', label: 'Purchase Requests', icon: Inbox },
            { to: '/farmer/orders', label: 'Orders & Shipments', icon: Truck },
          ]
        },
        {
          groupTitle: 'Agritech AI & Twin',
          links: [
            { to: '/farmer/inventory-intelligence', label: 'Inventory & Timing', icon: Sparkles, badge: 'AI' },
            { to: '/farmer/digital-twin', label: 'Farm Digital Twin', icon: Activity, badge: 'AI' },
            { to: '/farmer/copilot', label: 'Farmer AI Copilot', icon: Bot, badge: 'AI' },
          ]
        },
        {
          groupTitle: 'Ecosystem & Insights',
          links: [
            { to: '/waste-marketplace', label: 'Waste Marketplace', icon: Recycle, badge: 'Eco' },
            { to: '/farmer/analytics', label: 'Sales Analytics', icon: LineChart },
            { to: '/farmer/profile', label: 'Farm Profile', icon: User },
          ]
        }
      ];
    } else if (user.role === 'buyer') {
      return [
        {
          groupTitle: 'Procurement Desk',
          links: [
            { to: '/buyer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
            { to: '/buyer/requests', label: 'My Requests', icon: Inbox },
            { to: '/buyer/orders', label: 'Active Orders', icon: Truck },
            { to: '/buyer/history', label: 'Purchase History', icon: History },
          ]
        },
        {
          groupTitle: 'AI Procurement & Copilot',
          links: [
            { to: '/buyer/smart-match', label: 'AI Smart Match', icon: Sparkles, badge: 'AI' },
            { to: '/buyer/copilot', label: 'Buyer AI Copilot', icon: Bot, badge: 'AI' },
          ]
        },
        {
          groupTitle: 'Intelligence & Waste',
          links: [
            { to: '/waste-marketplace', label: 'Waste Marketplace', icon: Recycle, badge: 'Eco' },
            { to: '/buyer/analytics', label: 'Spend Analytics', icon: LineChart },
            { to: '/buyer/profile', label: 'Business Profile', icon: User },
          ]
        }
      ];
    } else {
      // Admin
      return [
        {
          groupTitle: 'Command Center',
          links: [
            { to: '/admin/dashboard', label: 'Command Center', icon: LayoutDashboard },
            { to: '/admin/users', label: 'User Directory', icon: Users },
            { to: '/admin/listings', label: 'All Listings', icon: Layers },
            { to: '/admin/orders', label: 'All Orders', icon: Truck },
          ]
        },
        {
          groupTitle: 'Macro Intelligence',
          links: [
            { to: '/admin/market-intelligence', label: 'Regional Heatmap', icon: MapPin, badge: 'AI' },
            { to: '/admin/simulator', label: 'What-If Simulator', icon: Sliders, badge: 'AI' },
            { to: '/admin/anomalies', label: 'Fraud & Anomalies', icon: ShieldAlert, badge: 'Audit' },
            { to: '/admin/analytics', label: 'Platform Analytics', icon: LineChart },
          ]
        }
      ];
    }
  };

  const navGroups = getNavigationGroups();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-68 bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-elevated' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* User info banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200/70 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-sm shadow-subtle shrink-0">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">{user.name}</h4>
              <p className="text-[11px] text-slate-500 font-medium truncate capitalize">
                {user.role === 'farmer'
                  ? user.farmer_profile?.farm_name || 'Farmer Account'
                  : user.role === 'buyer'
                  ? user.buyer_profile?.business_name || 'Commercial Buyer'
                  : 'Platform Admin'}
              </p>
            </div>
          </div>

          {/* Grouped Nav Links */}
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                {group.groupTitle}
              </div>

              {group.links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={onClose}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 group ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'
                        }`}
                      />
                      <span className="truncate">{link.label}</span>
                    </div>

                    {link.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : link.badge === 'AI'
                            ? 'bg-purple-100 text-purple-800'
                            : link.badge === 'Eco'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {link.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom signout */}
        <div className="pt-3 border-t border-slate-100 mt-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
