import React, { useState, useEffect } from 'react';
import { Truck, ArrowRight, Package, CheckCircle2 } from 'lucide-react';
import { ordersAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import OrderTimeline from '../../components/OrderTimeline';
import LogisticsCard from '../../components/LogisticsCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export const BuyerOrders = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Active Shipments</span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Order Tracking & Logistics</h1>
        <p className="text-xs text-slate-500 mt-1">Real-time status updates directly from farm suppliers</p>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching active orders..." />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No Active Orders"
          message="When an agreement is finalized with a farmer, your live order and delivery timeline will display here."
          actionText="Explore Marketplace"
          onAction={() => window.location.href = '/marketplace'}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders selector list */}
          <div className="space-y-3">
            {orders.map((order) => {
              const isSelected = selectedOrder?.id === order.id;
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
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
                    Supplier: {order.farm_name || order.farmer_name} ({order.farmer_location})
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-400 font-normal">Agreed: ₹{order.agreed_price}/kg</span>
                    <span className="text-slate-900 font-bold">Total: ₹{order.total_amount?.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline and details for selected order */}
          <div className="lg:col-span-2 space-y-6">
            {selectedOrder && (
              <>
                <OrderTimeline
                  order={selectedOrder}
                  isFarmer={false}
                />

                <LogisticsCard
                  logistics={{
                    distance_km: selectedOrder.distance_km || 25,
                    estimated_transport_cost: selectedOrder.estimated_transport_cost || 1280,
                    estimated_delivery_time: 'Same day (3-5 hours)',
                    suggested_vehicle: 'Mini Truck / 1.5T Pickup',
                    disclaimer: 'Real-time GPS dispatch estimate for agricultural haulage.'
                  }}
                  farmerLoc={selectedOrder.farmer_location}
                  buyerLoc={selectedOrder.buyer_location}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerOrders;
