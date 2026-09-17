import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Truck,
  Sparkles,
  Handshake,
  BarChart3,
  CheckCircle2,
  Store,
  Users,
  Building2,
} from 'lucide-react';

export const Landing = () => {
  return (
    <div className="bg-slate-50 min-h-screen flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32 bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Top pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-6 shadow-xs animate-in fade-in slide-in-from-top-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AG-03 Hackathon: Direct-to-Buyer Digital Agriculture</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Sell Direct. Buy Fresh. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800">
              Grow Together.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            FarmDirect connects farmers directly with commercial buyers like restaurants, retailers, wholesalers, and food processors—eliminating middlemen, securing fair prices, and streamlining logistics.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register?role=farmer"
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 active:scale-95 transition-all flex items-center gap-2"
            >
              <Sprout className="w-4 h-4" />
              <span>I'm a Farmer</span>
            </Link>

            <Link
              to="/register?role=buyer"
              className="px-6 py-3.5 bg-slate-900 hover:bg-black text-white font-bold text-sm rounded-2xl shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Store className="w-4 h-4" />
              <span>I'm a Commercial Buyer</span>
            </Link>

            <Link
              to="/marketplace"
              className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl border border-slate-200 shadow-xs transition-all flex items-center gap-2"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          {/* Visual: Farmer -> FarmDirect -> Commercial Buyer */}
          <div className="mt-16 max-w-3xl mx-auto bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-xl">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
              The Direct Disintermediation Flow
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs">
                  <Sprout className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Farmers</h4>
                <p className="text-xs text-slate-500 mt-1">List harvest, set minimum rates, negotiate directly</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col items-center text-center shadow-md">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white text-sm">FarmDirect Platform</h4>
                <p className="text-xs text-slate-300 mt-1">AI Smart Matching, Fair Benchmarks & Freight Estimator</p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-xs">
                  <Building2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Commercial Buyers</h4>
                <p className="text-xs text-slate-500 mt-1">Bulk procurement for restaurants, retail, processing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Workflow Process</h2>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How FarmDirect Reinvents Agricultural Trade
          </h3>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            From field harvest to restaurant kitchen in a seamless, transparent, data-driven cycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'List Produce',
              desc: 'Farmers publish crop details, volume, grade, harvest availability, and fair expected pricing.',
              icon: Sprout,
            },
            {
              step: '02',
              title: 'AI Smart Match',
              desc: 'Buyers submit exact volume and quality requirements; our explainable matching engine ranks optimal farm partners.',
              icon: Sparkles,
            },
            {
              step: '03',
              title: 'Transparent Negotiation',
              desc: 'Submit offers and counter-offers in an auditable timeline with zero broker manipulation.',
              icon: Handshake,
            },
            {
              step: '04',
              title: 'Order & Logistics',
              desc: 'Contract generates automatically upon agreement with freight estimates and 4-step delivery tracking.',
              icon: Truck,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-shadow">
                <div className="text-3xl font-black text-slate-200 mb-4">{item.step}</div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Value Props for Farmers & Buyers */}
      <section className="py-20 bg-emerald-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-800">
                Direct Value
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Built for Both Sides of Agricultural Commerce
              </h2>
              <p className="mt-4 text-emerald-200/80 text-sm leading-relaxed">
                Traditional agricultural supply chains shave 30–50% of value through multiple layers of middlemen. FarmDirect gives that margin back to farmers while lowering purchasing costs for businesses.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-sm block">For Farmers</strong>
                    <span className="text-xs text-emerald-200/70">
                      Receive purchase requests directly, counter offers on your own terms, and track payment receivables on live analytics dashboards.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-sm block">For Commercial Buyers</strong>
                    <span className="text-xs text-emerald-200/70">
                      Procure graded, farm-fresh produce with complete provenance, compare against historical reference price corridors, and estimate transport costs upfront.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-900/60 p-6 rounded-3xl border border-emerald-800/80">
                <div className="text-3xl font-black text-emerald-400 mb-1">100%</div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Explainable AI Match</div>
                <p className="text-xs text-emerald-200/70 mt-2">Weighted algorithmic breakdown: Crop 30%, Qty 20%, Price 20%, Location 15%, Quality 10%, Schedule 5%.</p>
              </div>

              <div className="bg-emerald-900/60 p-6 rounded-3xl border border-emerald-800/80">
                <div className="text-3xl font-black text-emerald-400 mb-1">0%</div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Hidden Intermediary Fees</div>
                <p className="text-xs text-emerald-200/70 mt-2">Direct buyer-to-farmer agreements with transparent counter-offer negotiation records.</p>
              </div>

              <div className="bg-emerald-900/60 p-6 rounded-3xl border border-emerald-800/80">
                <div className="text-3xl font-black text-emerald-400 mb-1">4 Steps</div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">End-to-End Tracking</div>
                <p className="text-xs text-emerald-200/70 mt-2">From Confirmed to Pickup Scheduled, In Transit, and Delivered with complete operational audit trails.</p>
              </div>

              <div className="bg-emerald-900/60 p-6 rounded-3xl border border-emerald-800/80">
                <div className="text-3xl font-black text-emerald-400 mb-1">Dynamic</div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Live SQL Analytics</div>
                <p className="text-xs text-emerald-200/70 mt-2">Real-time revenue, spend, and crop demand aggregations rendered with interactive Recharts.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Sprout className="w-5 h-5" />
            </div>
            <span className="text-base font-black text-slate-900">
              Farm<span className="text-emerald-600">Direct</span>
            </span>
          </div>

          <p className="text-xs text-slate-500">
            FarmDirect • Smart Direct-to-Buyer Agricultural Marketplace • Built for AG-03 Hackathon
          </p>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <Link to="/marketplace" className="hover:text-emerald-600">Marketplace</Link>
            <Link to="/buyer/smart-match" className="hover:text-emerald-600">AI Match</Link>
            <Link to="/login" className="hover:text-emerald-600">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
