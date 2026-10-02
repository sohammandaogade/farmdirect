import React from 'react';
import { Search, Filter, RotateCcw, SlidersHorizontal, MapPin, X } from 'lucide-react';

const CROPS = ['All', 'Tomato', 'Onion', 'Potato', 'Wheat', 'Rice', 'Carrot', 'Cabbage', 'Capsicum', 'Maize', 'Cauliflower', 'Strawberry'];

// All 36 Districts of Maharashtra
export const MAHARASHTRA_DISTRICTS = [
  { label: 'All Maharashtra', value: '' },
  { label: 'Ahmednagar / Ahilyanagar', value: 'Ahmednagar' },
  { label: 'Akola', value: 'Akola' },
  { label: 'Amravati', value: 'Amravati' },
  { label: 'Beed', value: 'Beed' },
  { label: 'Bhandara', value: 'Bhandara' },
  { label: 'Buldhana', value: 'Buldhana' },
  { label: 'Chandrapur', value: 'Chandrapur' },
  { label: 'Chhatrapati Sambhajinagar', value: 'Chhatrapati Sambhajinagar' },
  { label: 'Dharashiv', value: 'Dharashiv' },
  { label: 'Dhule', value: 'Dhule' },
  { label: 'Gadchiroli', value: 'Gadchiroli' },
  { label: 'Gondia', value: 'Gondia' },
  { label: 'Hingoli', value: 'Hingoli' },
  { label: 'Jalgaon', value: 'Jalgaon' },
  { label: 'Jalna', value: 'Jalna' },
  { label: 'Kolhapur', value: 'Kolhapur' },
  { label: 'Latur', value: 'Latur' },
  { label: 'Mumbai City', value: 'Mumbai' },
  { label: 'Mumbai Suburban', value: 'Mumbai' },
  { label: 'Nagpur', value: 'Nagpur' },
  { label: 'Nanded', value: 'Nanded' },
  { label: 'Nandurbar', value: 'Nandurbar' },
  { label: 'Nashik', value: 'Nashik' },
  { label: 'Palghar', value: 'Palghar' },
  { label: 'Parbhani', value: 'Parbhani' },
  { label: 'Pune', value: 'Pune' },
  { label: 'Raigad', value: 'Raigad' },
  { label: 'Ratnagiri', value: 'Ratnagiri' },
  { label: 'Sangli', value: 'Sangli' },
  { label: 'Satara', value: 'Satara' },
  { label: 'Sindhudurg', value: 'Sindhudurg' },
  { label: 'Solapur', value: 'Solapur' },
  { label: 'Thane', value: 'Thane' },
  { label: 'Wardha', value: 'Wardha' },
  { label: 'Washim', value: 'Washim' },
  { label: 'Yavatmal', value: 'Yavatmal' },
];

const QUALITIES = ['All', 'Grade A', 'Grade B', 'Organic'];

export const SearchFilters = ({ filters, onChange, onReset }) => {
  const activeFilterCount = [
    filters.q,
    filters.crop && filters.crop !== 'All',
    filters.location,
    filters.quality && filters.quality !== 'All',
    filters.max_price,
    filters.min_quantity,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-3xl border border-[#E8E2D8] p-5 sm:p-6 shadow-card mb-8 transition-all">
      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#AFA190]" />
          <input
            type="text"
            placeholder="Search produce by crop name, region, or keyword..."
            value={filters.q || ''}
            onChange={(e) => onChange('q', e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66] transition-all text-[#211C18] placeholder-[#AFA190]"
          />
          {filters.q && (
            <button
              onClick={() => onChange('q', '')}
              className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-[#AFA190] hover:text-[#211C18]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={onReset}
            className="px-4 py-3 rounded-2xl bg-[#F5EBDD] hover:bg-rose-50 text-[#403A34] hover:text-rose-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ({activeFilterCount})</span>
          </button>
        )}
      </div>

      {/* Quick Crop Selector Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none text-xs">
        <span className="text-[11px] font-bold text-[#AFA190] uppercase tracking-wider shrink-0 mr-1">
          Popular:
        </span>
        {CROPS.slice(0, 9).map((crop) => {
          const isSelected = (filters.crop || 'All') === crop || (!filters.crop && crop === 'All');
          return (
            <button
              key={crop}
              onClick={() => onChange('crop', crop === 'All' ? '' : crop)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#8B7A66] text-white shadow-subtle'
                  : 'bg-[#F5EBDD] text-[#403A34] hover:bg-[#E8E2D8] hover:text-[#211C18]'
              }`}
            >
              {crop}
            </button>
          );
        })}
      </div>

      {/* Grid of multi-faceted filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-[#E8E2D8]">
        {/* Location Filter: All 36 Districts of Maharashtra */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#AFA190] mb-1">
            District ({MAHARASHTRA_DISTRICTS.length - 1})
          </label>
          <div className="relative">
            <select
              value={filters.location || ''}
              onChange={(e) => onChange('location', e.target.value)}
              className="w-full py-2.5 px-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-xs font-semibold text-[#211C18] focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
            >
              {MAHARASHTRA_DISTRICTS.map((d) => (
                <option key={d.label} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quality Filter */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#AFA190] mb-1">
            Quality Grade
          </label>
          <select
            value={filters.quality || 'All'}
            onChange={(e) => onChange('quality', e.target.value === 'All' ? '' : e.target.value)}
            className="w-full py-2.5 px-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-xs font-semibold text-[#211C18] focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
          >
            {QUALITIES.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#AFA190] mb-1">
            Max Price (₹/kg)
          </label>
          <input
            type="number"
            placeholder="e.g. 45"
            value={filters.max_price || ''}
            onChange={(e) => onChange('max_price', e.target.value)}
            className="w-full py-2.5 px-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-xs font-semibold text-[#211C18] focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
          />
        </div>

        {/* Min Quantity */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#AFA190] mb-1">
            Min Qty (kg)
          </label>
          <input
            type="number"
            placeholder="e.g. 500"
            value={filters.min_quantity || ''}
            onChange={(e) => onChange('min_quantity', e.target.value)}
            className="w-full py-2.5 px-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-xs font-semibold text-[#211C18] focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
          />
        </div>

        {/* Sort */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#AFA190] mb-1">
            Sort Order
          </label>
          <select
            value={filters.sort || 'newest'}
            onChange={(e) => onChange('sort', e.target.value)}
            className="w-full py-2.5 px-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl text-xs font-semibold text-[#211C18] focus:outline-none focus:ring-2 focus:ring-[#8B7A66]/20 focus:border-[#8B7A66]"
          >
            <option value="newest">Newest Listed</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="quantity_desc">Quantity: High to Low</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
