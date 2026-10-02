import React, { useState, useEffect } from 'react';
import { History, Package, Download, CheckCircle2, Search } from 'lucide-react';
import { ordersAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export const PurchaseHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersAPI.getOrders().then((res) => {
      if (res.data.success) {
        // filter delivered or past orders
        setOrders(res.data.data);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalSpent = orders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
  const totalVolume = orders.reduce((acc, o) => acc + (o.quantity || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Audit & Archives</span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Purchase History</h1>
          <p className="text-xs text-slate-500 mt-1">Complete log of historical procurement contracts and fulfillments</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Total Volume</span>
            <strong className="text-slate-800">{totalVolume.toLocaleString()} kg</strong>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400 block text-[11px]">Total Spent</span>
            <strong className="text-emerald-700">₹{totalSpent.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading purchase history..." />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Purchase History"
          message="Completed contracts and orders will be archived here."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Supplier Farm</th>
                  <th className="py-3.5 px-4">Crop</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Agreed Rate</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      {ord.order_number}
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800">
                      {ord.farm_name || ord.farmer_name}
                      <span className="block text-[11px] text-slate-400 font-normal">{ord.farmer_location}</span>
                    </td>
                    <td className="py-4 px-4 font-bold capitalize text-slate-800">
                      {ord.crop}
                    </td>
                    <td className="py-4 px-4">
                      {ord.quantity?.toLocaleString()} kg
                    </td>
                    <td className="py-4 px-4">
                      ₹{ord.agreed_price}/kg
                    </td>
                    <td className="py-4 px-4 font-black text-slate-900">
                      ₹{ord.total_amount?.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          ord.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {ord.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseHistory;
