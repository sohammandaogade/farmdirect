import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Handshake, Sprout, Store } from 'lucide-react';
import { negotiationsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import NegotiationTimeline from '../../components/NegotiationTimeline';
import NegotiationCopilotCard from '../../components/NegotiationCopilotCard';
import LoadingSpinner from '../../components/LoadingSpinner';

export const FarmerNegotiations = () => {
  const { requestId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (requestId) {
      fetchTimeline();
    }
  }, [requestId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const res = await negotiationsAPI.getTimeline(requestId);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (e) {
      showToast('Failed to load negotiation timeline', 'error');
      navigate('/farmer/requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCounter = async (counterPayload) => {
    try {
      setActionLoading(true);
      const res = await negotiationsAPI.counter(requestId, counterPayload);
      if (res.data.success) {
        showToast('Counter-offer submitted to buyer!');
        fetchTimeline();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit counter-offer', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      const res = await negotiationsAPI.accept(requestId);
      if (res.data.success) {
        showToast(res.data.message || 'Offer accepted! Order created successfully.');
        fetchTimeline();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to accept offer', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason) => {
    try {
      setActionLoading(true);
      const res = await negotiationsAPI.reject(requestId, { reason });
      if (res.data.success) {
        showToast('Offer declined.');
        fetchTimeline();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject offer', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading negotiation thread..." />;

  const request = data?.request;
  const timeline = data?.timeline || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        to="/farmer/requests"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Purchase Requests</span>
      </Link>

      {/* Contract & Negotiation Header */}
      <div className="bg-white rounded-3xl p-6 border border-[#F5EBDD] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#FAF8F5] text-slate-700 border border-[#F5EBDD]">
              Request #{request?.id}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                request?.status === 'ACCEPTED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : request?.status === 'NEGOTIATING'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {request?.status}
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight capitalize">
            {request?.crop} Negotiation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Buyer: <strong className="text-slate-700">{request?.buyer_business || request?.buyer_name}</strong> ({request?.buyer_location})
          </p>
        </div>

        <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#F5EBDD] text-xs text-right">
          <span className="text-[11px] text-slate-400 block">Initial Listing Price</span>
          <span className="text-base font-extrabold text-slate-800">₹{request?.farmer_listed_price}/kg</span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Target: {request?.requested_quantity?.toLocaleString()} kg</span>
        </div>
      </div>

      {/* AI Negotiation Copilot Insights */}
      {request?.status === 'NEGOTIATING' && (
        <NegotiationCopilotCard
          requestId={requestId}
          userRole="farmer"
          onApplyCounter={(price) => {
            handleCounter({
              offered_price: price,
              offered_quantity: request.requested_quantity,
              message: `AI Copilot suggested counter-offer: ₹${price}/kg`,
            });
          }}
        />
      )}

      {/* Interactive Timeline Component */}
      <NegotiationTimeline
        request={request}
        timeline={timeline}
        currentUserId={user?.id}
        userRole="farmer"
        onCounter={handleCounter}
        onAccept={handleAccept}
        onReject={handleReject}
        loading={actionLoading}
      />
    </div>
  );
};

export default FarmerNegotiations;
