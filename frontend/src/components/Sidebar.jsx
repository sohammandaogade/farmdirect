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
          groupTitle: 'Core Farm Operations',
          links: [
            { to: '/farmer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/farmer/listings', label: 'My Harvest Listings', icon: Sprout },
            { to: '/farmer/listings/new', label: 'List Fresh Produce', icon: PlusCircle },
            { to: '/farmer/requests', label: 'Purchase Requests', icon: Inbox },
            { to: '/farmer/orders', label: 'Fulfillment & Orders', icon: Truck },
          ]
        },
        {
          groupTitle: 'Agritech AI & Intelligence',
          links: [
            { to: '/farmer/inventory-intelligence', label: 'Inventory Timing', icon: Sparkles, badge: 'AI' },
            { to: '/farmer/digital-twin', label: 'Farm Digital Twin', icon: Activity, badge: 'Twin' },
            { to: '/farmer/copilot', label: 'Farmer AI Copilot', icon: Bot, badge: 'AI' },
          ]
        },
        {
          groupTitle: 'Circular Market & Analytics',
          links: [
            { to: '/waste-marketplace', label: 'Waste Marketplace', icon: Recycle, badge: 'Bio' },
            { to: '/farmer/analytics', label: 'Sales & Revenue', icon: LineChart },
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
            { to: '/marketplace', label: 'Produce Exchange', icon: ShoppingBag },
            { to: '/buyer/requests', label: 'My Requests', icon: Inbox },
            { to: '/buyer/orders', label: 'Active Shipments', icon: Truck },
            { to: '/buyer/history', label: 'Purchase History', icon: History },
          ]
        },
        {
          groupTitle: 'AI Sourcing & Copilot',
          links: [
            { to: '/buyer/smart-match', label: 'AI Smart Match', icon: Sparkles, badge: 'AI' },
            { to: '/buyer/copilot', label: 'Buyer AI Copilot', icon: Bot, badge: 'AI' },
          ]
        },
        {
          groupTitle: 'Intelligence & Circular',
          links: [
            { to: '/waste-marketplace', label: 'Waste Marketplace', icon: Recycle, badge: 'Bio' },
            { to: '/buyer/analytics', label: 'Spend Analysis', icon: LineChart },
            { to: '/buyer/profile', label: 'Business Profile', icon: User },
          ]
        }
      ];
    } else {
      // Admin
      return [
        {
          groupTitle: 'Executive Command',
          links: [
            { to: '/admin/dashboard', label: 'Command Center', icon: LayoutDashboard },
            { to: '/admin/users', label: 'User Directory', icon: Users },
            { to: '/admin/listings', label: 'All Produce Listings', icon: Layers },
            { to: '/admin/orders', label: 'Platform Orders', icon: Truck },
          ]
        },
        {
          groupTitle: 'Macro Analytics & Audits',
          links: [
            { to: '/admin/market-intelligence', label: 'Regional Heatmap', icon: MapPin, badge: 'Geo' },
            { to: '/admin/simulator', label: 'What-If Simulator', icon: Sliders, badge: 'Sim' },
            { to: '/admin/anomalies', label: 'Fraud & Sentinel', icon: ShieldAlert, badge: 'Audit' },
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
          className="fixed inset-0 z-40 bg-[#211C18]/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container: Editorial Warm Surface */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-72 bg-[#FFF9F0] border-r border-[#E8E2D8] p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-elevated' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* User info banner: Warm Sand Card with Hawaiian Shack Avatar */}
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D8] flex items-center gap-3 shadow-subtle">
            <div className="w-10 h-10 rounded-xl bg-[#8B7A66] text-[#FFE5B8] flex items-center justify-center font-black text-sm shadow-subtle shrink-0">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden min-w-0">
              <h4 className="text-xs font-bold text-[#211C18] truncate">{user.name}</h4>
              <p className="text-[11px] text-[#6F655B] font-medium truncate capitalize">
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
              <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-[#AFA190]">
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
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-[#8B7A66] text-white font-bold shadow-md shadow-[#8B7A66]/25'
                        : 'text-[#403A34] hover:bg-[#F5EBDD] hover:text-[#211C18]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                          isActive ? 'text-[#FFE5B8]' : 'text-[#6F655B] group-hover:text-[#332A22]'
                        }`}
                      />
                      <span className="truncate">{link.label}</span>
                    </div>

                    {link.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight ${
                          isActive
                            ? 'bg-[#FFE5B8] text-[#332A22]'
                            : 'bg-[#F5EBDD] text-[#5E5142] border border-[#E8E2D8]'
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
        <div className="pt-3 border-t border-[#E8E2D8] mt-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#8B7A66] hover:bg-[#F5EBDD] hover:text-[#403A34] transition-colors"
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
