import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';

// Pages - Public
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Marketplace from './pages/buyer/Marketplace';
import ListingDetails from './pages/buyer/ListingDetails';

// Pages - Farmer
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import FarmerListings from './pages/farmer/FarmerListings';
import AddEditListing from './pages/farmer/AddEditListing';
import FarmerRequests from './pages/farmer/FarmerRequests';
import FarmerNegotiations from './pages/farmer/FarmerNegotiations';
import FarmerOrders from './pages/farmer/FarmerOrders';
import FarmerAnalytics from './pages/farmer/FarmerAnalytics';
import FarmerProfile from './pages/farmer/FarmerProfile';

// Pages - Buyer
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import SmartMatch from './pages/buyer/SmartMatch';
import BuyerRequests from './pages/buyer/BuyerRequests';
import BuyerNegotiations from './pages/buyer/BuyerNegotiations';
import BuyerOrders from './pages/buyer/BuyerOrders';
import PurchaseHistory from './pages/buyer/PurchaseHistory';
import BuyerAnalytics from './pages/buyer/BuyerAnalytics';
import BuyerProfile from './pages/buyer/BuyerProfile';

// Pages - Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminListings from './pages/admin/AdminListings';
import AdminOrders from './pages/admin/AdminOrders';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Authenticating user session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's assigned dashboard
    if (user.role === 'farmer') return <Navigate to="/farmer/dashboard" replace />;
    if (user.role === 'buyer') return <Navigate to="/buyer/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

// Portal Layout with Sidebar & Header
const PortalLayout = ({ children }) => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex-1 flex">
        {user && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 transition-all ${user ? 'lg:pl-72' : 'max-w-7xl mx-auto w-full'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PortalLayout><Landing /></PortalLayout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/marketplace" element={<PortalLayout><Marketplace /></PortalLayout>} />
            <Route path="/marketplace/:id" element={<PortalLayout><ListingDetails /></PortalLayout>} />

            {/* Farmer Routes */}
            <Route
              path="/farmer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <PortalLayout><FarmerDashboard /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/listings"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <PortalLayout><FarmerListings /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/listings/new"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <PortalLayout><AddEditListing /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/listings/edit/:id"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <PortalLayout><AddEditListing /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/requests"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <PortalLayout><FarmerRequests /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/negotiations/:requestId"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <PortalLayout><FarmerNegotiations /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/orders"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <PortalLayout><FarmerOrders /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/analytics"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <PortalLayout><FarmerAnalytics /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/farmer/profile"
              element={
                <ProtectedRoute allowedRoles={['farmer']}>
                  <PortalLayout><FarmerProfile /></PortalLayout>
                </ProtectedRoute>
              }
            />

            {/* Buyer Routes */}
            <Route
              path="/buyer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <PortalLayout><BuyerDashboard /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyer/smart-match"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <PortalLayout><SmartMatch /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyer/requests"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <PortalLayout><BuyerRequests /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyer/negotiations/:requestId"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <PortalLayout><BuyerNegotiations /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyer/orders"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <PortalLayout><BuyerOrders /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyer/history"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <PortalLayout><PurchaseHistory /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyer/analytics"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <PortalLayout><BuyerAnalytics /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/buyer/profile"
              element={
                <ProtectedRoute allowedRoles={['buyer']}>
                  <PortalLayout><BuyerProfile /></PortalLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PortalLayout><AdminDashboard /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PortalLayout><AdminUsers /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/listings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PortalLayout><AdminListings /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PortalLayout><AdminOrders /></PortalLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PortalLayout><AdminAnalytics /></PortalLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}
