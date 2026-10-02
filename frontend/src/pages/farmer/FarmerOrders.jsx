import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, Clock, AlertCircle, Eye, ArrowRight, ShieldAlert, MapPin } from 'lucide-react';
import { ordersAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import OrderTimeline from '../../components/OrderTimeline';
import LogisticsCard from '../../components/LogisticsCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import OrderComplaintModal from '../../components/OrderComplaintModal';

export const FarmerOrders = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
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

  const handleUpdateStatus = async (newStatus, note) => {
    if (!selectedOrder) return;
    try {
      setUpdating(true);
      const res = await ordersAPI.updateStatus(selectedOrder.id, {
        status: newStatus,
        note,
      });
      if (res.data?.success) {
        showToast(`Order updated to ${newStatus.replace('_', ' ')}!`);
        setSelectedOrder(res.data.data);
        fetchOrders();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update order status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#211C18] bg-[#FFE5B8] px-2.5 py-0.5 rounded-full border border-[#FFE5B8]">
            Fulfillment & Carrier Dispatch
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1.5">
            Confirmed Orders & Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Update harvest prep, carrier dispatch stages, and monitor delivery milestones.
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
        <LoadingSpinner text="Fetching active farm orders..." />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No Confirmed Orders"
          message="When a buyer's offer is accepted or direct order placed, confirmed shipment details appear here."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Cards List (Left side) */}
          <div className="space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
              Fulfillment Queue ({orders.length})
            </div>

            {orders.map((order) => {
              const isSelected = selectedOrder?.id === order.id;
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-[#FFE5B8]/20 border-[#8B7A66] ring-2 ring-[#8B7A66]/20 shadow-md'
                      : 'bg-white border-[#F5EBDD] hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#8B7A66]" />
                  )}

                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono font-bold text-slate-900">#{order.order_number}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        order.status === 'DELIVERED'
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
                  <div className="text-xs text-slate-500 mt-1">
                    Buyer: <strong className="text-slate-700">{order.buyer_business || order.buyer_name}</strong>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-900 font-black tabular-nums">Total: ₹{order.total_amount?.toLocaleString()}</span>
                    <span className="text-[#8B7A66] font-bold flex items-center gap-1 text-[11px]">
                      <span>Manage</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Order Timeline & Operational Actions (Right side) */}
          <div className="lg:col-span-2 space-y-6">
            {selectedOrder && (
              <>
                <OrderTimeline
                  order={selectedOrder}
                  isFarmer={true}
                  onUpdateStatus={handleUpdateStatus}
                  updating={updating}
                />

                {/* Logistics Info */}
                <LogisticsCard
                  logistics={{
                    distance_km: selectedOrder.distance_km || 25,
                    estimated_transport_cost: selectedOrder.estimated_transport_cost || 1280,
                    estimated_delivery_time: 'Same day (3-5 hours)',
                    suggested_vehicle: 'Mini Truck / 1.5T Pickup',
                    disclaimer: 'Estimated carrier charges based on regional distance matrix.'
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
          role="farmer"
        />
      )}
    </div>
  );
};

export default FarmerOrders;
