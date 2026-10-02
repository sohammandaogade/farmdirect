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
  Zap,
  Recycle,
  Check,
  MapPin,
  ChevronRight
} from 'lucide-react';

export const Landing = () => {
  return (
    <div className="bg-[#F8FAF9] min-h-screen flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-36 bg-gradient-to-b from-emerald-50/70 via-white to-[#F8FAF9] border-b border-slate-200/80">
        {/* Ambient background glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Top pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-black uppercase tracking-wider mb-6 shadow-subtle animate-in fade-in slide-in-from-top-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Smart Direct-to-Buyer Agricultural Marketplace</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight max-w-5xl mx-auto leading-[1.08]">
            Direct Farm Trade. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700">
              Zero Intermediaries. Real Fair Prices.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
            FarmDirect bridges verified agricultural growers directly with commercial procurement desks—restaurants, retail chains, food processors, and biomass processors—with explainable AI matching, auditable negotiations, and direct logistics.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register?role=farmer"
              className="px-7 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-700/25 active:scale-95 transition-all flex items-center gap-2.5"
            >
              <Sprout className="w-4 h-4" />
              <span>Join as Producer / Farmer</span>
            </Link>

            <Link
              to="/register?role=buyer"
              className="px-7 py-4 bg-slate-900 hover:bg-black text-white font-bold text-sm rounded-2xl shadow-lg shadow-slate-950/20 active:scale-95 transition-all flex items-center gap-2.5"
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Join as Commercial Buyer</span>
            </Link>

            <Link
              to="/marketplace"
              className="px-6 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl border border-slate-200 shadow-subtle transition-all flex items-center gap-2"
            >
              <span>Explore Produce Catalog</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          {/* Trust Metric Strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-subtle text-center">
              <span className="text-2xl font-black text-slate-900 block tabular-nums">36</span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 block">Maharashtra Districts</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-subtle text-center">
              <span className="text-2xl font-black text-emerald-700 block tabular-nums">0%</span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 block">Middleman Commission</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-subtle text-center">
              <span className="text-2xl font-black text-blue-700 block tabular-nums">100%</span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 block">Explainable AI Match</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-subtle text-center">
              <span className="text-2xl font-black text-purple-700 block tabular-nums">₹ Real-Time</span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 block">Freight & Gate Pricing</span>
            </div>
          </div>

          {/* Visual: Farmer -> FarmDirect -> Commercial Buyer */}
          <div className="mt-12 max-w-4xl mx-auto bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-card">
            <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-6">
              The Disintermediated B2B Agricultural Flow
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-center">
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center mb-3 shadow-subtle">
                  <Sprout className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Verified Farmers</h4>
                <p className="text-xs text-slate-500 mt-1">List harvests, set minimum price floors, counter offers directly</p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950 text-white flex flex-col items-center text-center shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-3 shadow-subtle">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white text-sm">FarmDirect Platform</h4>
                <p className="text-xs text-slate-300 mt-1">AI Smart Matching, Fair Price Corridors, & GPS Freight Estimates</p>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center mb-3 shadow-subtle">
                  <Building2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Commercial Buyers</h4>
                <p className="text-xs text-slate-500 mt-1">Bulk procurement for restaurants, retail, hotels & processors</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 mb-3 inline-block">
            Seamless Execution
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
            How FarmDirect Powers Direct Agri Trade
          </h2>
          <p className="mt-3 text-slate-500 text-sm sm:text-base font-normal">
            From harvested field to commercial delivery with 100% transparency at every milestone.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'List Produce',
              desc: 'Farmers list harvest crop, quantity, quality grade, harvest readiness date, and gate price.',
              icon: Sprout,
            },
            {
              step: '02',
              title: 'AI Smart Match',
              desc: 'Buyers specify volume, quality, and budget. Our multi-variable model ranks optimal farm suppliers.',
              icon: Sparkles,
            },
            {
              step: '03',
              title: 'Direct Negotiation',
              desc: 'Propose offers and counter-offers in an auditable deal timeline with zero middleman interference.',
              icon: Handshake,
            },
            {
              step: '04',
              title: 'Fulfillment & Freight',
              desc: 'Automated digital contract upon acceptance with GPS dispatch tracking and transparent delivery stages.',
              icon: Truck,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                <div className="text-3xl font-black text-slate-200 mb-4">{item.step}</div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 shadow-subtle">
                  <Icon className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Value Props for Farmers & Buyers */}
      <section className="py-24 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-4 border border-emerald-400/30">
                Direct Value Proposition
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                Engineered for Both Sides of Agricultural Commerce
              </h2>
              <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                Conventional agricultural supply chains erode 30–50% of value through fragmented intermediaries. FarmDirect returns full gate revenue to farmers while drastically reducing bulk procurement overhead for businesses.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-sm block">For Farmers & Producers</strong>
                    <span className="text-xs text-slate-300 leading-relaxed block mt-0.5">
                      Receive purchase requests directly, counter offers on your own terms, access circular waste monetization, and monitor revenues on live analytics dashboards.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-sm block">For Commercial Buyers & Processors</strong>
                    <span className="text-xs text-slate-300 leading-relaxed block mt-0.5">
                      Source graded, farm-fresh produce with farm provenance, verify price corridors against regional market benchmarks, and track shipments to your kitchen or depot door.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-2">
                <div className="text-3xl font-black text-emerald-400 tabular-nums">100%</div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Explainable AI Matching</div>
                <p className="text-xs text-slate-300 leading-relaxed">Multi-factor model evaluating crop compatibility, volume, target price, geographic distance, and freshness.</p>
              </div>

              <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-2">
                <div className="text-3xl font-black text-emerald-400 tabular-nums">₹0</div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Brokerage Deductions</div>
                <p className="text-xs text-slate-300 leading-relaxed">Direct buyer-to-farmer agreements with transparent counter-offer negotiation audit logs.</p>
              </div>

              <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-2">
                <div className="text-3xl font-black text-emerald-400 tabular-nums">4 Stages</div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Fulfillment Lifecycle</div>
                <p className="text-xs text-slate-300 leading-relaxed">Confirmed, Harvest Scheduled, In Transit, and Delivered with GPS dispatch estimates.</p>
              </div>

              <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-2">
                <div className="text-3xl font-black text-emerald-400 tabular-nums">Circular</div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Biomass & Waste Exchange</div>
                <p className="text-xs text-slate-300 leading-relaxed">Monetize crop residues, prevent stubble burning, and supply green bio-energy power plants.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-subtle">
              <Sprout className="w-5 h-5" />
            </div>
            <span className="text-base font-black text-slate-900">
              Farm<span className="text-emerald-600">Direct</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 text-center sm:text-left">
            FarmDirect • Direct-to-Buyer Agricultural Marketplace & Intelligence Platform
          </p>

          <div className="flex items-center gap-5 text-xs font-bold text-slate-600">
            <Link to="/marketplace" className="hover:text-emerald-600 transition-colors">Marketplace</Link>
            <Link to="/buyer/smart-match" className="hover:text-emerald-600 transition-colors">AI Match</Link>
            <Link to="/waste-marketplace" className="hover:text-emerald-600 transition-colors">Waste Market</Link>
            <Link to="/login" className="hover:text-emerald-600 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
