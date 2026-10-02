import React, { useState } from 'react';
import { Layers, ChevronRight, Info, TrendingUp, CheckCircle2, Clock, Truck, PackageCheck, AlertCircle } from 'lucide-react';

/**
 * SteppedStageChart
 * A stepped/funnel-like stage progression visualization inspired by high-end financial & SaaS funnels.
 * Uses real FarmDirect data with stepped elevation, angled transitions, and interactive tooltips.
 */
export const SteppedStageChart = ({
  title = "Order Fulfillment Pipeline",
  subtitle = "Real-time lifecycle distribution across stages",
  stages = [],
  totalCount = 0,
  unit = "orders"
}) => {
  const [hoveredStage, setHoveredStage] = useState(null);

  if (!stages || stages.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-warm-border shadow-card">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-5 h-5 text-hawaiian-500" />
          <h3 className="text-base font-bold text-warm-charcoal">{title}</h3>
        </div>
        <p className="text-xs text-hawaiian-400">{subtitle}</p>
        <div className="h-44 flex items-center justify-center text-xs text-hawaiian-400">
          No pipeline stages recorded yet.
        </div>
      </div>
    );
  }

  // Normalize stages to handle both { label, count } and { status, count }
  const normalizedStages = stages.map((s, idx) => {
    const rawLabel = s.label || s.status || `Stage ${idx + 1}`;
    const formattedLabel = String(rawLabel)
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      id: s.id || s.status || idx,
      label: formattedLabel,
      count: Number(s.count) || 0,
      description: s.description || `${Number(s.count) || 0} ${unit} in ${formattedLabel}`,
    };
  });

  // Find maximum count for proportional heights (with min floor so all steps render nicely)
  const maxCount = Math.max(...normalizedStages.map(s => s.count || 0), 1);
  const total = totalCount || normalizedStages.reduce((acc, s) => acc + (s.count || 0), 0) || 1;

  // Compute stage bar heights in pixels (ranging from 50px to 160px)
  const stepHeights = normalizedStages.map(s => {
    const ratio = (s.count || 0) / maxCount;
    return Math.max(50, Math.round(ratio * 120) + 40);
  });

  const numCols = normalizedStages.length;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-warm-border shadow-card space-y-6">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-warm-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-mocassin-200 text-hawaiian-700 flex items-center justify-center font-black">
              <Layers className="w-4 h-4 text-hawaiian-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-warm-charcoal">{title}</h3>
              <p className="text-xs text-hawaiian-400">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-hawaiian-700 bg-mocassin-100 px-3 py-1 rounded-full border border-mocassin-300">
            {total} Total {unit}
          </span>
          <span className="text-[11px] font-semibold text-hawaiian-500 bg-hawaiian-50 px-2.5 py-1 rounded-full border border-hawaiian-200">
            Live Database Data
          </span>
        </div>
      </div>

      {/* Stepped Progression Graphic with Angled Transitions */}
      <div className="relative pt-4 pb-2">
        {/* SVG Container for Angled Transition Facets */}
        <div className="relative w-full overflow-x-auto pb-4 scrollbar-none">
          <div className="min-w-[620px]">
            {/* Upper Value & Stage Metrics Row */}
            <div
              className="gap-3 mb-4"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`
              }}
            >
              {normalizedStages.map((stage, idx) => {
                const isHovered = hoveredStage === idx;
                const pct = total > 0 ? Math.round(((stage.count || 0) / total) * 100) : 0;

                return (
                  <div
                    key={stage.id || idx}
                    onMouseEnter={() => setHoveredStage(idx)}
                    onMouseLeave={() => setHoveredStage(null)}
                    className={`p-3 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      isHovered
                        ? 'bg-mocassin-100 border-hawaiian-500 shadow-md -translate-y-1'
                        : 'bg-warm-canvas border-warm-border hover:border-hawaiian-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-hawaiian-400">
                      <span>Stage 0{idx + 1}</span>
                      <span className="text-hawaiian-600 font-bold">{pct}%</span>
                    </div>
                    <div className="text-xl font-black text-warm-charcoal mt-1 tabular-nums">
                      {stage.count?.toLocaleString() ?? 0}
                    </div>
                    <div className="text-[11px] font-bold text-hawaiian-600 truncate mt-0.5" title={stage.label}>
                      {stage.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stepped Graphic Area */}
            <div className="relative h-44 flex items-end">
              {/* SVG Background for Angled Connector Polygons */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="steppedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B7A66" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#AFA190" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#FFE5B8" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient id="connectorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B7A66" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#FFE5B8" stopOpacity="0.4" />
                  </linearGradient>
                </defs>

                {/* Render angled connector polygon between each pair of steps */}
                {normalizedStages.map((_, idx) => {
                  if (idx >= normalizedStages.length - 1) return null;
                  const totalSteps = normalizedStages.length;
                  const stepWidthPct = 100 / totalSteps;

                  // X coordinates of step boundaries
                  const x1 = (idx * stepWidthPct) + (stepWidthPct * 0.85);
                  const x2 = ((idx + 1) * stepWidthPct) + (stepWidthPct * 0.15);

                  // Normalized heights (from bottom)
                  const h1 = stepHeights[idx];
                  const h2 = stepHeights[idx + 1];

                  // SVG Y coordinates (176px is chart height)
                  const y1 = 176 - h1;
                  const y2 = 176 - h2;

                  return (
                    <polygon
                      key={`connector-${idx}`}
                      points={`${x1}%,${y1} ${x2}%,${y2} ${x2}%,176 ${x1}%,176`}
                      fill="url(#connectorGrad)"
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>

              {/* Stepped Columns */}
              <div
                className="relative z-10 w-full gap-3 h-full items-end"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`
                }}
              >
                {normalizedStages.map((stage, idx) => {
                  const isHovered = hoveredStage === idx;
                  const height = stepHeights[idx];
                  const pct = total > 0 ? Math.round(((stage.count || 0) / total) * 100) : 0;

                  // Distinct color styling reflecting Hawaiian Shack -> Mocassin progression
                  const barGradients = [
                    'from-[#5E5142] to-[#766654]',
                    'from-[#766654] to-[#8B7A66]',
                    'from-[#8B7A66] to-[#AFA190]',
                    'from-[#AFA190] to-[#E5AA52]',
                    'from-[#E5AA52] to-[#FFE5B8]',
                    'from-[#FFE5B8] to-[#FFF3DC]'
                  ];
                  const gradient = barGradients[idx % barGradients.length];

                  return (
                    <div
                      key={stage.id || idx}
                      className="flex flex-col items-center justify-end h-full group"
                      onMouseEnter={() => setHoveredStage(idx)}
                      onMouseLeave={() => setHoveredStage(null)}
                    >
                      {/* Stepped Bar Body */}
                      <div
                        style={{ height: `${height}px` }}
                        className={`w-full rounded-2xl bg-gradient-to-t ${gradient} transition-all duration-300 relative flex flex-col justify-between p-2.5 shadow-subtle ${
                          isHovered
                            ? 'ring-4 ring-mocassin-300 -translate-y-1 shadow-card-hover'
                            : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        {/* Top Step Angled Cap Accent */}
                        <div className="w-full h-1.5 rounded-full bg-white/40 mb-1" />

                        {/* Middle Value Stamp */}
                        <div className="text-center my-auto">
                          <span className={`text-base font-black tabular-nums ${idx >= 4 ? 'text-warm-charcoal' : 'text-white'}`}>
                            {stage.count}
                          </span>
                          <span className={`block text-[10px] font-bold uppercase tracking-wider ${idx >= 4 ? 'text-hawaiian-700' : 'text-white/80'}`}>
                            {pct}%
                          </span>
                        </div>

                        {/* Bottom Mini Indicator */}
                        <div className="w-2 h-2 rounded-full bg-white/50 mx-auto" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage Names Underneath with Chevron Flow */}
            <div
              className="gap-3 mt-3 pt-3 border-t border-warm-border"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`
              }}
            >
              {normalizedStages.map((stage, idx) => (
                <div key={stage.id || idx} className="text-center">
                  <span className="text-xs font-bold text-warm-charcoal block capitalize truncate" title={stage.label}>
                    {stage.label}
                  </span>
                  <span className="text-[10px] text-hawaiian-400 font-medium block truncate mt-0.5">
                    {stage.description || `${stage.count} ${unit}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tooltip Card Display when a Stage is Hovered */}
      {hoveredStage !== null && normalizedStages[hoveredStage] && (
        <div className="p-4 rounded-2xl bg-mocassin-50 border border-mocassin-300 animate-in fade-in duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-hawaiian-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
              0{hoveredStage + 1}
            </div>
            <div>
              <div className="text-xs font-bold text-warm-charcoal flex items-center gap-2">
                <span>{normalizedStages[hoveredStage].label} Stage</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-mocassin-300 text-hawaiian-900">
                  {total > 0 ? Math.round(((normalizedStages[hoveredStage].count || 0) / total) * 100) : 0}% of pipeline
                </span>
              </div>
              <p className="text-[11px] text-hawaiian-600 mt-0.5">
                {normalizedStages[hoveredStage].description || 'Active fulfillment operational phase.'}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-hawaiian-400 block">
              Volume Record
            </span>
            <span className="text-lg font-black text-warm-charcoal tabular-nums">
              {normalizedStages[hoveredStage].count?.toLocaleString() || 0} {unit}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SteppedStageChart;
