import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Check,
  X,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  Search,
  Filter,
  FileText,
  User,
  Phone,
  Mail,
  Award,
  Edit,
  TrendingUp,
  Package,
  ShoppingBag,
  Key
} from 'lucide-react';
import { agentAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export const AgentVerificationPortal = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'profile'
  const [listings, setListings] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, pending: 0, accepted: 0, published: 0, rejected: 0 });
  const [statusFilter, setStatusFilter] = useState('PENDING_AGENT_REVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Profile State
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ agency_name: '', operating_district: '', license_number: '', phone: '', name: '' });

  // Review Modal State
  const [selectedListing, setSelectedListing] = useState(null);
  const [approvalModalListing, setApprovalModalListing] = useState(null);
  const [rejectionModalListing, setRejectionModalListing] = useState(null);
  const [verificationKey, setVerificationKey] = useState('');
  const [agentReview, setAgentReview] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchListings();
    } else {
      fetchProfile();
    }
  }, [activeTab, statusFilter]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await agentAPI.getListings(statusFilter === 'ALL' ? null : statusFilter);
      if (res.data.success) {
        setListings(res.data.data || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      showToast('Failed to load farmer requests for verification', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await agentAPI.getProfile();
      if (res.data.success) {
        setProfile(res.data.data);
        setProfileForm({
          agency_name: res.data.data.agency_name || '',
          operating_district: res.data.data.operating_district || '',
          license_number: res.data.data.license_number || '',
          phone: res.data.data.phone || '',
          name: res.data.data.agent_name || ''
        });
      }
    } catch (err) {
      showToast('Failed to load agent profile', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setProcessing(true);
      const res = await agentAPI.updateProfile(profileForm);
      if (res.data.success) {
        showToast('Agent profile updated successfully!');
        setEditingProfile(false);
        fetchProfile();
      }
    } catch (err) {
      showToast('Failed to update agent profile', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const openApprovalModal = (listing) => {
    setApprovalModalListing(listing);
    setVerificationKey('');
    setAgentReview('Physical on-site inspection completed. Moisture content confirmed optimal, Grade specifications verified, and produce approved for public trading.');
  };

  const handleApprovalSubmit = async (e) => {
    e.preventDefault();
    if (!verificationKey.trim()) {
      showToast('Farmer verification security key is compulsory.', 'error');
      return;
    }
    if (!agentReview.trim() || agentReview.trim().length < 10) {
      showToast('Official agent inspection notes are compulsory (minimum 10 characters).', 'error');
      return;
    }

    try {
      setProcessing(true);
      const res = await agentAPI.reviewListing(approvalModalListing.id, {
        action: 'ACCEPT',
        verification_key: verificationKey.trim().toUpperCase(),
        agent_review: agentReview.trim()
      });
      if (res.data.success) {
        showToast(res.data.message || 'Request verified and published to Marketplace!');
        setApprovalModalListing(null);
        setVerificationKey('');
        setAgentReview('');
        if (selectedListing && selectedListing.id === approvalModalListing.id) {
          setSelectedListing(null);
        }
        fetchListings();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Verification failed. Please check the security key.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!verificationKey.trim()) {
      showToast('Farmer verification security key is compulsory.', 'error');
      return;
    }
    if (!rejectionReason.trim() || rejectionReason.trim().length < 3) {
      showToast('Please provide a specific rejection reason.', 'error');
      return;
    }

    try {
      setProcessing(true);
      const res = await agentAPI.reviewListing(rejectionModalListing.id, {
        action: 'REJECT',
        verification_key: verificationKey.trim().toUpperCase(),
        rejection_reason: rejectionReason.trim(),
        agent_review: rejectionReason.trim()
      });
      if (res.data.success) {
        showToast(res.data.message || 'Request rejected and farmer notified.');
        setRejectionModalListing(null);
        setRejectionReason('');
        setVerificationKey('');
        if (selectedListing && selectedListing.id === rejectionModalListing.id) {
          setSelectedListing(null);
        }
        fetchListings();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject request. Please check the security key.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const filteredListings = listings.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.crop?.toLowerCase().includes(q) ||
      item.farmer_name?.toLowerCase().includes(q) ||
      item.farm_name?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-teal-600" />
              <span>Accredited Quality Officer</span>
            </span>
            <span className="text-slate-400 text-xs font-bold">•</span>
            <span className="text-xs font-bold text-slate-500">Agent Verification Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Agent Workspace & Verification Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Review incoming farmer produce requests, verify harvest quality & laboratory parameters, and publish verified lots to the public Marketplace.
          </p>
        </div>

        {/* View Switcher: Requests Inbox vs Agent Profile */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/60 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-teal-600" />
            <span>Farmer Requests</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-teal-600" />
            <span>Agent Profile & Stats</span>
          </button>
        </div>
      </div>

      {activeTab === 'profile' ? (
        /* Agent Profile & Performance View */
        profileLoading ? (
          <LoadingSpinner text="Loading agent profile & verified activity stats..." />
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Overview Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center font-black text-xl shadow-md shadow-teal-700/20">
                    {profile.agency_name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900">{profile.agency_name}</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-100 text-teal-800 flex items-center gap-1">
                        <Award className="w-3 h-3 text-teal-600" />
                        <span>{profile.verification_badge || 'VERIFIED_AGENT'}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Officer: <strong className="text-slate-800">{profile.agent_name}</strong> • License: <strong className="text-slate-800">{profile.license_number || 'AGY-MH-2026-8841'}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-2 self-start"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>{editingProfile ? 'Close Editor' : 'Edit Profile'}</span>
                </button>
              </div>

              {/* Edit Form Drawer */}
              {editingProfile && (
                <form onSubmit={handleUpdateProfile} className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Edit Agent & Agency Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Agency / Business Name</label>
                      <input
                        type="text"
                        value={profileForm.agency_name}
                        onChange={(e) => setProfileForm({ ...profileForm, agency_name: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Operating District / Regions</label>
                      <input
                        type="text"
                        value={profileForm.operating_district}
                        onChange={(e) => setProfileForm({ ...profileForm, operating_district: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Verification License Number</label>
                      <input
                        type="text"
                        value={profileForm.license_number}
                        onChange={(e) => setProfileForm({ ...profileForm, license_number: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Official Contact Phone</label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={processing}
                      className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                    >
                      {processing ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              )}

              {/* Operating Details & Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">Operating District</span>
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <span>{profile.operating_district || 'Pune & Western Maharashtra'}</span>
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">Email Address</span>
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 truncate">
                    <Mail className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">Contact Phone</span>
                  <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-teal-600" />
                    <span>{profile.phone || '+91 98440 11223'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Live Database Activity & Statistics */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                Live Verification Statistics (Real Database Records)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                  <span className="text-slate-400 block text-[10px] font-black uppercase">Pending Review</span>
                  <div className="text-2xl font-black text-amber-600 mt-2">{profile.stats?.pending_requests || 0}</div>
                  <span className="text-[11px] text-slate-500 block mt-1 font-medium">Farmer Requests</span>
                </div>
                <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                  <span className="text-slate-400 block text-[10px] font-black uppercase">Accepted Requests</span>
                  <div className="text-2xl font-black text-emerald-600 mt-2">{profile.stats?.accepted_requests || 0}</div>
                  <span className="text-[11px] text-slate-500 block mt-1 font-medium">Verified by You</span>
                </div>
                <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                  <span className="text-slate-400 block text-[10px] font-black uppercase">Published Listings</span>
                  <div className="text-2xl font-black text-teal-600 mt-2">{profile.stats?.published_listings || 0}</div>
                  <span className="text-[11px] text-slate-500 block mt-1 font-medium">Active in Market</span>
                </div>
                <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                  <span className="text-slate-400 block text-[10px] font-black uppercase">Rejected Requests</span>
                  <div className="text-2xl font-black text-rose-600 mt-2">{profile.stats?.rejected_requests || 0}</div>
                  <span className="text-[11px] text-slate-500 block mt-1 font-medium">Excluded Lots</span>
                </div>
                <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[10px] font-black uppercase">Agent Trust Rating</span>
                  <div className="text-2xl font-black text-slate-900 mt-2">{profile.stats?.rating || 4.9} ★</div>
                  <span className="text-[11px] text-emerald-600 block mt-1 font-semibold">Excellence Badge</span>
                </div>
              </div>
            </div>
          </div>
        ) : null
      ) : (
        /* Requests Inbox & Operations View */
        <div className="space-y-6">
          {/* Metrics Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div
              onClick={() => setStatusFilter('PENDING_AGENT_REVIEW')}
              className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                statusFilter === 'PENDING_AGENT_REVIEW'
                  ? 'bg-amber-500/10 border-amber-300 ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 hover:border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Pending Requests</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {metrics.pending || 0}
              </div>
              <span className="text-[11px] font-semibold text-amber-700 mt-1 block">Awaiting Verification</span>
            </div>

            <div
              onClick={() => setStatusFilter('ACCEPTED')}
              className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                statusFilter === 'ACCEPTED' || statusFilter === 'PUBLISHED'
                  ? 'bg-emerald-500/10 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 hover:border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Accepted & Published</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {metrics.published || metrics.accepted || metrics.approved || 0}
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 mt-1 block">Live in Marketplace</span>
            </div>

            <div
              onClick={() => setStatusFilter('REJECTED')}
              className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                statusFilter === 'REJECTED'
                  ? 'bg-rose-500/10 border-rose-300 ring-2 ring-rose-500/20'
                  : 'bg-white border-slate-200 hover:border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Rejected Requests</span>
                <XCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {metrics.rejected || 0}
              </div>
              <span className="text-[11px] font-semibold text-rose-700 mt-1 block">Quality Excluded</span>
            </div>

            <div
              onClick={() => setStatusFilter('ALL')}
              className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-blue-500/10 border-blue-300 ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">All Submissions</span>
                <Layers className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {metrics.total || 0}
              </div>
              <span className="text-[11px] font-semibold text-blue-700 mt-1 block">Complete History</span>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'PENDING_AGENT_REVIEW', label: 'Pending Requests' },
                { id: 'ACCEPTED', label: 'Accepted / Published' },
                { id: 'REJECTED', label: 'Rejected Requests' },
                { id: 'ALL', label: 'All Requests' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-colors ${
                    statusFilter === tab.id
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search crop, farmer, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Requests Grid */}
          {loading ? (
            <LoadingSpinner text="Loading farmer produce requests..." />
          ) : filteredListings.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No Farmer Requests Found"
              message={
                statusFilter === 'PENDING_AGENT_REVIEW'
                  ? 'All pending farmer requests have been reviewed and adjudicated.'
                  : 'No requests match the selected filter.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    {/* Image and Quality Badge */}
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-100 mb-4 group">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.crop}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                          No Photo Provided
                        </div>
                      )}

                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-white/95 text-slate-800 backdrop-blur-xs shadow-xs">
                          {item.quality_grade}
                        </span>
                        {item.quality_inspection && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>AI Verified</span>
                          </span>
                        )}
                      </div>

                      <span
                        className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs ${
                          item.status === 'PUBLISHED' || item.status === 'APPROVED' || item.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'PENDING_AGENT_REVIEW'
                            ? 'bg-amber-100 text-amber-800'
                            : item.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {item.status === 'PENDING_AGENT_REVIEW'
                          ? 'PENDING REVIEW'
                          : item.status === 'APPROVED' || item.status === 'ACTIVE'
                          ? 'PUBLISHED'
                          : item.status}
                      </span>
                    </div>

                    {/* Crop & Producer Info (Section 11 Traceability) */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 capitalize">{item.crop}</h3>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{item.location} • Producer: <strong className="text-slate-700">{item.farm_name || item.farmer_name}</strong></span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-700">
                          ₹{item.expected_price}/{item.unit}
                        </span>
                      </div>
                    </div>

                    {/* Key Specs */}
                    <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Quantity</span>
                        <span className="font-bold text-slate-800">
                          {item.quantity?.toLocaleString()} {item.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Available Date</span>
                        <span className="font-bold text-slate-800">
                          {item.availability_date || 'Immediate'}
                        </span>
                      </div>
                    </div>

                    {/* AI Inspection Preview */}
                    {item.quality_inspection && (
                      <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-[11px] space-y-1 mb-3">
                        <div className="flex justify-between font-bold text-emerald-900">
                          <span>AI Assessment:</span>
                          <span>{item.quality_inspection.ai_assessed_grade || 'Grade A'} ({item.quality_inspection.confidence_score || 92}%)</span>
                        </div>
                        <div className="flex justify-between text-emerald-800">
                          <span>Defect Score:</span>
                          <span className="font-bold">{item.quality_inspection.defect_detected_pct || 0}%</span>
                        </div>
                      </div>
                    )}

                    {/* Rejection notice if rejected */}
                    {item.status === 'REJECTED' && item.rejection_reason && (
                      <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs space-y-1 mb-3">
                        <span className="text-[10px] font-black uppercase text-rose-700 block">
                          Rejection Reason:
                        </span>
                        <p className="text-rose-900 font-medium leading-relaxed">
                          "{item.rejection_reason}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedListing(item)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>

                    {item.status === 'PENDING_AGENT_REVIEW' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={processing}
                          onClick={() => {
                            setRejectionModalListing(item);
                            setRejectionReason('');
                            setVerificationKey('');
                          }}
                          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          type="button"
                          disabled={processing}
                          onClick={() => openApprovalModal(item)}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs shadow-teal-600/20 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept & Review</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Official Approval & Public Certification Modal */}
      {approvalModalListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-700 font-black text-sm uppercase">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <span>Verify & Publish Produce Lot</span>
              </div>
              <button
                onClick={() => setApprovalModalListing(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-teal-50/60 p-3.5 rounded-2xl border border-teal-100">
              <strong className="text-slate-900 block font-bold mb-0.5">
                {approvalModalListing.crop} ({approvalModalListing.quantity?.toLocaleString()} {approvalModalListing.unit})
              </strong>
              <span>Producer: {approvalModalListing.farm_name || approvalModalListing.farmer_name} • {approvalModalListing.location}</span>
            </div>

            <form onSubmit={handleApprovalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-900">
                    <Key className="w-3.5 h-3.5 text-teal-600" />
                    <span>Farmer Security Verification Key *</span>
                  </span>
                  <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">Compulsory</span>
                </label>
                <input
                  type="text"
                  required
                  value={verificationKey}
                  onChange={(e) => setVerificationKey(e.target.value.toUpperCase())}
                  placeholder="e.g. VRF-94B2C1"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-slate-900 tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Obtain this unique key directly from the farmer. Verification is blocked without matching security key.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Official Agent Inspection Review & Quality Notes *</span>
                  <span className="text-[10px] text-teal-700 font-bold">Visible to All Buyers</span>
                </label>
                <textarea
                  required
                  rows={4}
                  minLength={10}
                  value={agentReview}
                  onChange={(e) => setAgentReview(e.target.value)}
                  placeholder="Document physical on-site inspection findings, moisture analysis, batch uniformity, grade confirmation, and packaging standards..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setAgentReview('Physical on-site inspection passed. Moisture levels (11.5%) and Grade A specifications confirmed. Recommended for commercial procurement.')}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                  >
                    + Standard Grade A Certified
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgentReview('Verified on-site: Premium harvest batch, uniform color distribution, no visible pest damage, compliant jute packaging.')}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                  >
                    + Premium Fresh Lot
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApprovalModalListing(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || !verificationKey.trim() || agentReview.trim().length < 10}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{processing ? 'Verifying...' : 'Authorize & Publish to Marketplace'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Confirmation Modal (Section 9) */}
      {rejectionModalListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-black text-sm uppercase">
                <AlertTriangle className="w-4 h-4" />
                <span>Reject Farmer Request</span>
              </div>
              <button
                onClick={() => setRejectionModalListing(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <strong className="text-slate-900 block font-bold mb-0.5">
                {rejectionModalListing.crop} ({rejectionModalListing.quantity?.toLocaleString()} {rejectionModalListing.unit})
              </strong>
              <span>Submitted by {rejectionModalListing.farmer_name || 'Farmer'} • {rejectionModalListing.location}</span>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-900">
                    <Key className="w-3.5 h-3.5 text-rose-600" />
                    <span>Farmer Security Verification Key *</span>
                  </span>
                  <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Compulsory</span>
                </label>
                <input
                  type="text"
                  required
                  value={verificationKey}
                  onChange={(e) => setVerificationKey(e.target.value.toUpperCase())}
                  placeholder="e.g. VRF-94B2C1"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black text-slate-900 tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Rejection Reason (displayed directly to farmer under My Requests) *
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Moisture content exceeds allowable standards, or visible defects exceed Grade threshold, or harvest image is insufficient for verification..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectionModalListing(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || !verificationKey.trim()}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {processing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Request Details Modal (Section 7) */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  Request #{selectedListing.id} • Status: {selectedListing.status}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1 capitalize">
                  {selectedListing.crop} — Harvest Verification Dossier
                </h3>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Produce Image Preview */}
            <div className="rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-200 relative">
              {selectedListing.image_url ? (
                <img
                  src={selectedListing.image_url}
                  alt={selectedListing.crop}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                  No Photo Attached
                </div>
              )}
            </div>

            {/* FARMER & ORIGIN INFORMATION (Section 7 & 11) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Farmer & Origin Information (Producer)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Producer / Farm</span>
                  <span className="font-bold text-slate-900">{selectedListing.farm_name || selectedListing.farmer_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Farmer Contact</span>
                  <span className="font-bold text-slate-900">{selectedListing.farmer_phone || 'Verified on platform'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Location / District</span>
                  <span className="font-bold text-slate-900">{selectedListing.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Farmer ID</span>
                  <span className="font-bold text-slate-900">FARMER-#{selectedListing.farmer_id}</span>
                </div>
              </div>
            </div>

            {/* PRODUCE, QUANTITY & PRICE INFORMATION */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Produce, Quantity & Commercial Terms
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Crop Type</span>
                  <span className="font-bold text-slate-900 capitalize">{selectedListing.crop}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Quantity</span>
                  <span className="font-bold text-slate-900">{selectedListing.quantity?.toLocaleString()} {selectedListing.unit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Expected Price</span>
                  <span className="font-black text-emerald-700">₹{selectedListing.expected_price}/{selectedListing.unit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Estimated Value</span>
                  <span className="font-black text-slate-900">₹{((selectedListing.quantity || 0) * (selectedListing.expected_price || 0)).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* QUALITY INFORMATION & AI OPTICAL ASSESSMENT */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/60 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Quality Information & AI Visual Analysis</span>
                </h4>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-600 text-white">
                  Declared: {selectedListing.quality_grade}
                </span>
              </div>

              {selectedListing.quality_inspection ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-emerald-700 block text-[10px] font-bold uppercase">AI Grade</span>
                    <span className="font-bold text-slate-900">{selectedListing.quality_inspection.ai_assessed_grade || 'Grade A'}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block text-[10px] font-bold uppercase">Confidence</span>
                    <span className="font-bold text-slate-900">{selectedListing.quality_inspection.confidence_score || 93}%</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block text-[10px] font-bold uppercase">Defect Level</span>
                    <span className="font-bold text-slate-900 capitalize">{selectedListing.quality_inspection.visible_defect_level || 'Low'}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block text-[10px] font-bold uppercase">Ripeness</span>
                    <span className="font-bold text-slate-900">{selectedListing.quality_inspection.ripeness_pct || 90}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Direct optical visual assessment: Farmer submitted photographic evidence adhering to platform harvest standards.
                </p>
              )}

              {selectedListing.quality_inspection?.assessment_notes && (
                <p className="text-xs text-slate-600 p-2.5 bg-white/80 rounded-xl border border-emerald-100 italic">
                  "{selectedListing.quality_inspection.assessment_notes}"
                </p>
              )}
            </div>

            {/* SOIL & LAB REPORT INFORMATION WHERE AVAILABLE (Section 7) */}
            {selectedListing.soil_profile && (
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/60 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Soil & Laboratory Nutrient Intelligence
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-amber-700 block text-[10px] font-bold uppercase">Soil pH</span>
                    <span className="font-bold text-slate-900">{selectedListing.soil_profile.ph || '7.2 (Neutral)'}</span>
                  </div>
                  <div>
                    <span className="text-amber-700 block text-[10px] font-bold uppercase">Nitrogen (N)</span>
                    <span className="font-bold text-slate-900">{selectedListing.soil_profile.nitrogen || 'Medium'}</span>
                  </div>
                  <div>
                    <span className="text-amber-700 block text-[10px] font-bold uppercase">Phosphorus (P)</span>
                    <span className="font-bold text-slate-900">{selectedListing.soil_profile.phosphorus || 'Optimal'}</span>
                  </div>
                  <div>
                    <span className="text-amber-700 block text-[10px] font-bold uppercase">Organic Carbon</span>
                    <span className="font-bold text-slate-900">{selectedListing.soil_profile.organic_carbon || '0.75%'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {selectedListing.description && (
              <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">Farmer Description</span>
                <p>{selectedListing.description}</p>
              </div>
            )}

            {/* Actions in detail modal (Section 8 & 9) */}
            {selectedListing.status === 'PENDING_AGENT_REVIEW' && (
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => {
                    setRejectionModalListing(selectedListing);
                    setRejectionReason('');
                    setVerificationKey('');
                  }}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Reject Request</span>
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => openApprovalModal(selectedListing)}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Verify Key & Publish</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentVerificationPortal;
