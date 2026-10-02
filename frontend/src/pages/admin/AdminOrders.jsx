import React, { useState, useEffect } from 'react';
import { Truck } from 'lucide-react';
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
      <div className="pb-4 border-b border-[#F5EBDD]">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#403A34] bg-[#FFE5B8]/40 px-2.5 py-0.5 rounded-full border border-[#8B7A66]/20">
          Audit Trail
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
          Platform Orders & Contracts
        </h1>
        <p className="text-xs text-slate-500 mt-1">Audit agreements, price realizations, and carrier milestones</p>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching platform orders..." />
      ) : (
        <div className="bg-white rounded-3xl border border-[#F5EBDD] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#F5EBDD] text-slate-500 uppercase tracking-wider font-bold text-[10px]">
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
              <tbody className="divide-y divide-[#F5EBDD] font-medium text-slate-700">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
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
                    <td className="py-4 px-4 font-black text-[#8B7A66] text-sm">
                      ₹{o.total_amount?.toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
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
