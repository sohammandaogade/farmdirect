import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, PlusCircle, Edit3, PauseCircle, PlayCircle, CheckCircle, Trash2, Eye } from 'lucide-react';
import { farmerAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export const FarmerListings = () => {
  const { showToast } = useToast();
  const [listings, setListings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, [statusFilter]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await farmerAPI.getListings(statusFilter === 'ALL' ? null : statusFilter);
      if (res.data.success) {
        setListings(res.data.data);
      }
    } catch (e) {
      showToast('Failed to load listings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await farmerAPI.toggleStatus(id, nextStatus);
      if (res.data.success) {
        showToast(`Listing marked as ${nextStatus}`);
        fetchListings();
      }
    } catch (e) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleMarkSold = async (id) => {
    try {
      const res = await farmerAPI.toggleStatus(id, 'SOLD');
      if (res.data.success) {
        showToast('Listing marked as SOLD');
        fetchListings();
      }
    } catch (e) {
      showToast('Failed to mark sold', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      const res = await farmerAPI.deleteListing(id);
      if (res.data.success) {
        showToast('Listing removed successfully');
        fetchListings();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete listing', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8B7A66]">Active Catalog</span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#211C18] tracking-tight">My Produce Listings</h1>
          <p className="text-xs text-[#6F655B] mt-1">Manage crop availability, harvest prices, and inventory stocks</p>
        </div>

        <Link
          to="/farmer/listings/new"
          className="py-2.5 px-5 btn-hawaiian-primary font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2 self-start"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Produce</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E8E2D8]">
        {['ALL', 'ACTIVE', 'PAUSED', 'SOLD'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === st
                ? 'bg-[#8B7A66] text-white shadow-subtle'
                : 'bg-white text-[#403A34] hover:bg-[#F5EBDD] border border-[#E8E2D8]'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching inventory catalog..." />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="No Produce Listed"
          message="You haven't listed any produce under this category yet."
          actionText="Create Listing"
          onAction={() => window.location.href = '/farmer/listings/new'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-[#E8E2D8] p-5 sm:p-6 shadow-card hover:shadow-card-hover hover:border-[#8B7A66] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#F5EBDD] text-[#5E5142]">
                      {item.quality_grade}
                    </span>
                    <h3 className="text-xl font-black text-[#211C18] capitalize mt-1.5">{item.crop}</h3>
                    <p className="text-xs text-[#AFA190]">{item.location} • Ready: {item.availability_date}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      item.status === 'ACTIVE'
                        ? 'bg-[#FFE5B8] text-[#5E5142] border border-[#FED898]'
                        : item.status === 'PAUSED'
                        ? 'bg-[#F5EBDD] text-[#332A22] border border-[#E8E2D8]'
                        : 'bg-[#FAF8F5] text-[#AFA190] border border-[#D1C6B7]'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 my-4 bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E8E2D8] text-xs">
                  <div>
                    <span className="text-[#AFA190] block text-[10px] uppercase font-bold">Available / Total</span>
                    <span className="font-bold text-[#211C18]">
                      {item.available_quantity?.toLocaleString()} / {item.quantity?.toLocaleString()} {item.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#AFA190] block text-[10px] uppercase font-bold">Asking Price</span>
                    <span className="font-black text-[#211C18]">
                      ₹{item.expected_price}/{item.unit}
                    </span>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-[#6F655B] line-clamp-2 mb-4 leading-relaxed">{item.description}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between gap-1 text-xs">
                <Link
                  to={`/marketplace/${item.id}`}
                  className="p-2 rounded-xl text-[#6F655B] hover:bg-[#F5EBDD] hover:text-[#211C18] transition-colors"
                  title="View in Marketplace"
                >
                  <Eye className="w-4 h-4" />
                </Link>

                <Link
                  to={`/farmer/listings/edit/${item.id}`}
                  className="p-2 rounded-xl text-[#6F655B] hover:bg-[#F5EBDD] hover:text-[#211C18] transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </Link>

                {item.status !== 'SOLD' && (
                  <button
                    onClick={() => handleToggleStatus(item.id, item.status)}
                    className="p-2 rounded-xl text-[#6F655B] hover:bg-[#F5EBDD] transition-colors"
                    title={item.status === 'ACTIVE' ? 'Pause Listing' : 'Activate Listing'}
                  >
                    {item.status === 'ACTIVE' ? (
                      <PauseCircle className="w-4 h-4 text-[#D97706]" />
                    ) : (
                      <PlayCircle className="w-4 h-4 text-[#8B7A66]" />
                    )}
                  </button>
                )}

                {item.status !== 'SOLD' && (
                  <button
                    onClick={() => handleMarkSold(item.id)}
                    className="p-2 rounded-xl text-[#6F655B] hover:bg-[#F5EBDD] transition-colors"
                    title="Mark Sold"
                  >
                    <CheckCircle className="w-4 h-4 text-[#332A22]" />
                  </button>
                )}

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors ml-auto"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FarmerListings;
