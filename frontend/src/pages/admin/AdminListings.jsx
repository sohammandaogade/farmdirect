import React, { useState, useEffect } from 'react';
import { Layers, Trash2, Eye } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export const AdminListings = () => {
  const { showToast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getListings();
      if (res.data.success) {
        setListings(res.data.data);
      }
    } catch (e) {
      showToast('Failed to fetch listings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this listing?')) return;
    try {
      const res = await adminAPI.removeListing(id);
      if (res.data.success) {
        showToast('Listing removed by administrator');
        fetchListings();
      }
    } catch (err) {
      showToast('Failed to remove listing', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#F5EBDD]">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#403A34] bg-[#FFE5B8]/40 px-2.5 py-0.5 rounded-full border border-[#8B7A66]/20">
          Inventory Oversight
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
          Marketplace Produce Listings
        </h1>
        <p className="text-xs text-slate-500 mt-1">Audit all active and completed farmer listings</p>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching marketplace listings..." />
      ) : (
        <div className="bg-white rounded-3xl border border-[#F5EBDD] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#F5EBDD] text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Produce</th>
                  <th className="py-3.5 px-4">Farmer / Farm</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Available / Total</th>
                  <th className="py-3.5 px-4">Expected Rate</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5EBDD] font-medium text-slate-700">
                {listings.map((l) => (
                  <tr key={l.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-4 px-4 font-bold capitalize text-slate-900">
                      {l.crop} • <span className="text-xs text-slate-400 font-normal">{l.quality_grade}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800">{l.farm_name || l.farmer_name}</div>
                      <div className="text-[11px] text-slate-400">{l.farmer_phone}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-600">{l.location}</td>
                    <td className="py-4 px-4">
                      {l.available_quantity?.toLocaleString()} / {l.quantity?.toLocaleString()} {l.unit}
                    </td>
                    <td className="py-4 px-4 font-black text-[#8B7A66]">
                      ₹{l.expected_price}/{l.unit}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          l.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.status === 'PAUSED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/marketplace/${l.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-xl border border-[#F5EBDD] text-slate-600 hover:bg-[#FAF8F5]"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleRemove(l.id)}
                          className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

export default AdminListings;
