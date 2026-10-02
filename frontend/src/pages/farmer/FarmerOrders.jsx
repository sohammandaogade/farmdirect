import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, Clock, AlertCircle, Eye, ArrowRight, ShieldAlert } from 'lucide-react';
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
      if (res.data.success) {
        setOrders(res.data.data);
        if (res.data.data.length > 0 && !selectedOrder) {
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
      if (res.data.success) {
        showToast(`Order updated to ${newStatus.replace('_', ' ')}!`);
        setSelectedOrder(res.data.data);
        // Refresh orders list
        fetchOrders();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update order status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Fulfillment</span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Orders & Shipments</h1>
          <p className="text-xs text-slate-500 mt-1">Manage operational status and track carrier delivery</p>
        </div>

        {selectedOrder && (
          <button
            onClick={() => setIsComplaintModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Report Order Issue</span>
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching orders..." />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No Orders Yet"
          message="When a buyer accepts an offer or negotiation concludes, confirmed orders appear here."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Cards List (Left side) */}
          <div className="space-y-3">
            {orders.map((order) => {
              const isSelected = selectedOrder?.id === order.id;
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-900">{order.order_number}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        order.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'IN_TRANSIT'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-slate-800 capitalize">
                    {order.crop} • {order.quantity?.toLocaleString()} kg
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Buyer: {order.buyer_business || order.buyer_name}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400 font-normal">Total: ₹{order.total_amount?.toLocaleString()}</span>
                    <span className="text-emerald-700 flex items-center gap-1 text-[11px]">
                      <span>View Progress</span>
                      <ArrowRight className="w-3 h-3" />
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
