import React, { useState, useEffect } from 'react';
import {
  Truck,
  ArrowRight,
  Package,
  CheckCircle2,
  Star,
  ShieldAlert,
  Send,
  MessageSquare,
  Clock,
  MapPin,
  FileText
} from 'lucide-react';
import { ordersAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import OrderTimeline from '../../components/OrderTimeline';
import LogisticsCard from '../../components/LogisticsCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import OrderComplaintModal from '../../components/OrderComplaintModal';

export const BuyerOrders = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ratings State (Keyed by order ID to persist locally in session)
  const [ratedOrders, setRatedOrders] = useState({});
  const [hoverRating, setHoverRating] = useState(0);
  const [activeRating, setActiveRating] = useState(5);
  const [reviewNote, setReviewNote] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Dispute / Complaint Modal State
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await ordersAPI.getOrders();
      if (res.data?.success) {
        setOrders(res.data.data || []);
        if (res.data.data?.length > 0 && !selectedOrder) {
          setSelectedOrder(res.data.data[0]);
        }
      }
    } catch (e) {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setSubmittingRating(true);
    setTimeout(() => {
      setRatedOrders((prev) => ({
        ...prev,
        [selectedOrder.id]: {
          stars: activeRating,
          review: reviewNote.trim() || 'Great harvest quality and timely delivery.',
          timestamp: new Date().toLocaleDateString(),
        },
      }));
      setSubmittingRating(false);
      setReviewNote('');
      showToast(`Thank you! Rating submitted for order ${selectedOrder.order_number}.`, 'success');
    }, 300);
  };

  const currentOrderRating = selectedOrder ? ratedOrders[selectedOrder.id] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
            Logistics & Fulfillment
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1.5">
            Active Orders & Dispatch Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time status updates directly from farm suppliers and dispatch hubs across Maharashtra.
          </p>
        </div>

        {selectedOrder && (
          <button
            onClick={() => setIsComplaintModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold flex items-center gap-2 shadow-subtle transition-all self-start sm:self-auto"
          >
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Report Order Issue</span>
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching active shipments..." />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No Active Shipments"
          message="When an offer is accepted by a farmer, your live order and delivery timeline will display here."
          actionText="Explore Marketplace"
          onAction={() => (window.location.href = '/marketplace')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders selector list */}
          <div className="space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
              Select Shipment ({orders.length})
            </div>

            {orders.map((order) => {
              const isSelected = selectedOrder?.id === order.id;
              const isDelivered = order.status === 'DELIVERED';
              const isRated = !!ratedOrders[order.id];

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-blue-50/40 border-blue-500 ring-2 ring-blue-500/20 shadow-card'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-subtle'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-blue-600" />
                  )}

                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono font-bold text-slate-900">#{order.order_number}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isDelivered
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'IN_TRANSIT'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-base font-bold text-slate-900 capitalize">
                    {order.crop} • {order.quantity?.toLocaleString()} kg
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{order.farm_name || order.farmer_name} ({order.farmer_location || 'Maharashtra'})</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">₹{order.agreed_price}/kg</span>
                    <div className="flex items-center gap-2">
                      {isDelivered && isRated && (
                        <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>Rated</span>
                        </span>
                      )}
                      <span className="text-slate-900 font-black tabular-nums">Total: ₹{order.total_amount?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline and details for selected order */}
          <div className="lg:col-span-2 space-y-6">
            {selectedOrder && (
              <>
                <OrderTimeline order={selectedOrder} isFarmer={false} />

                {/* POST-DELIVERY RATING UI (Strictly for Delivered Orders Only) */}
                {selectedOrder.status === 'DELIVERED' && (
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-card space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">Delivery Quality & Supplier Rating</h3>
                          <p className="text-xs text-slate-400">
                            Evaluate produce freshness, fulfillment accuracy, and delivery for {selectedOrder.farm_name || selectedOrder.farmer_name}
                          </p>
                        </div>
                      </div>

                      {currentOrderRating && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 self-start sm:self-auto">
                          Rating Recorded
                        </span>
                      )}
                    </div>

                    {currentOrderRating ? (
                      /* Already Rated Card */
                      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= currentOrderRating.stars
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                          <span className="font-black text-slate-800 ml-1.5">
                            {currentOrderRating.stars}.0 / 5.0
                          </span>
                        </div>
                        <p className="text-slate-700 font-medium italic">"{currentOrderRating.review}"</p>
                        <span className="text-[10px] text-slate-400 block">
                          Submitted on {currentOrderRating.timestamp}
                        </span>
                      </div>
                    ) : (
                      /* Interactive Rating Form */
                      <form onSubmit={handleRatingSubmit} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-700">Harvest Rating:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setActiveRating(star)}
                                className="p-1 hover:scale-125 transition-transform focus:outline-none"
                              >
                                <Star
                                  className={`w-6 h-6 transition-colors ${
                                    star <= (hoverRating || activeRating)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                          <span className="text-xs font-black text-amber-600 ml-2">
                            {hoverRating || activeRating} Star{activeRating > 1 ? 's' : ''}
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Written Feedback (Optional)
                          </label>
                          <textarea
                            rows={2}
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="Share feedback on produce grade freshness, accurate weight, crate packaging, or logistics..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={submittingRating}
                            className="px-5 py-2.5 bg-slate-900 hover:bg-black disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{submittingRating ? 'Saving...' : 'Submit Rating'}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                <LogisticsCard
                  logistics={{
                    distance_km: selectedOrder.distance_km || 25,
                    estimated_transport_cost: selectedOrder.estimated_transport_cost || 1280,
                    estimated_delivery_time: 'Same day (3-5 hours)',
                    suggested_vehicle: 'Mini Truck / 1.5T Pickup',
                    disclaimer: 'Real-time GPS dispatch estimate for agricultural haulage.',
                  }}
                  farmerLoc={selectedOrder.farmer_location}
                  buyerLoc={selectedOrder.buyer_location}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Order Dispute / Complaint Modal */}
      {selectedOrder && (
        <OrderComplaintModal
          order={selectedOrder}
          isOpen={isComplaintModalOpen}
          onClose={() => setIsComplaintModalOpen(false)}
          role="buyer"
        />
      )}
    </div>
  );
};

export default BuyerOrders;
