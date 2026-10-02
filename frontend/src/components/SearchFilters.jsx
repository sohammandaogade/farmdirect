import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';

const CROPS = ['All', 'Tomato', 'Onion', 'Potato', 'Wheat', 'Rice', 'Carrot', 'Cabbage', 'Capsicum', 'Maize', 'Cauliflower'];

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
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs mb-8">
      {/* Search Input Bar */}
      <div className="relative mb-4">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by crop name, region, or description..."
          value={filters.q || ''}
          onChange={(e) => onChange('q', e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Grid of multi-faceted filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Crop Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Produce</label>
          <select
            value={filters.crop || 'All'}
            onChange={(e) => onChange('crop', e.target.value === 'All' ? '' : e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {CROPS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Location Filter: All 36 Districts of Maharashtra */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            District / Region ({MAHARASHTRA_DISTRICTS.length - 1})
          </label>
          <select
            value={filters.location || ''}
            onChange={(e) => onChange('location', e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {MAHARASHTRA_DISTRICTS.map((d) => (
              <option key={d.label} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Quality Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Quality</label>
          <select
            value={filters.quality || 'All'}
            onChange={(e) => onChange('quality', e.target.value === 'All' ? '' : e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {QUALITIES.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Max Price (₹/kg)</label>
          <input
            type="number"
            placeholder="e.g. 30"
            value={filters.max_price || ''}
            onChange={(e) => onChange('max_price', e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Min Quantity */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Min Qty (kg)</label>
          <input
            type="number"
            placeholder="e.g. 500"
            value={filters.min_quantity || ''}
            onChange={(e) => onChange('min_quantity', e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Sort */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Sort By</label>
          <select
            value={filters.sort || 'newest'}
            onChange={(e) => onChange('sort', e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="quantity_desc">Quantity: High to Low</option>
          </select>
        </div>
      </div>

      {/* Reset Bar */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 font-semibold transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;
