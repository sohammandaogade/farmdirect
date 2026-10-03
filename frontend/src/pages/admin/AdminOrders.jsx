import React, { useState, useEffect } from 'react';
import { Truck, ArrowUpRight } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export const AdminOrders = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getOrders();
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (e) {
      showToast('Failed to fetch orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Audit Trail</span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Platform Orders & Contracts</h1>
        <p className="text-xs text-slate-500 mt-1">Audit agreements, price realizations, and carrier milestones</p>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching platform orders..." />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Order Number</th>
                  <th className="py-3.5 px-4">Farmer</th>
                  <th className="py-3.5 px-4">Commercial Buyer</th>
                  <th className="py-3.5 px-4">Crop & Volume</th>
                  <th className="py-3.5 px-4">Contract Value</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      {o.order_number}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800">{o.farm_name || o.farmer_name}</div>
                      <div className="text-[11px] text-slate-400">{o.farmer_location}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800">{o.buyer_business || o.buyer_name}</div>
                      <div className="text-[11px] text-slate-400">{o.buyer_location}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 capitalize">{o.crop}</div>
                      <div className="text-[11px] text-slate-500">{o.quantity?.toLocaleString()} kg @ ₹{o.agreed_price}/kg</div>
                    </td>
                    <td className="py-4 px-4 font-black text-emerald-700 text-sm">
                      ₹{o.total_amount?.toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            o.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.status === 'IN_TRANSIT'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {o.status.replace('_', ' ')}
                        </span>
                        {o.complaints && o.complaints.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                            {o.complaints.length} Dispute Ticket{o.complaints.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-400 text-[11px]">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString() : 'N/A'}
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

export default AdminOrders;
