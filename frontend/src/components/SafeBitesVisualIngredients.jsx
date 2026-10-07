import { useState } from "react";
import {
  PieChart as PieIcon, AlertTriangle, Flame, Droplet, Utensils,
  HeartCrack, Info, ShieldAlert, Sparkles, Activity
} from "lucide-react";

export default function SafeBitesVisualIngredients({ visualData, product }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!visualData) return null;

  const { sugar_spoons_count, breakdown_bars, pie_chart_slices, ingredient_cards } = visualData;
  const spoonCount = Math.round(sugar_spoons_count || 0);

  // Fallback slices if pie_chart_slices is missing or empty
  const slices = (pie_chart_slices && pie_chart_slices.length > 0)
    ? pie_chart_slices
    : [
        { label: "Added Sugars & Sweeteners", percentage: 35, color: "#f43f5e", amount: "High", harmful_flag: true, target_system: "Metabolic & Liver", health_cause: "Elevates blood glucose, fuels insulin resistance, and drives fatty liver lipid accumulation." },
        { label: "Refined Fats & Industrial Oils", percentage: 25, color: "#f59e0b", amount: "Medium", harmful_flag: true, target_system: "Cardiovascular", health_cause: "High saturated palmitic fatty acids promote systemic vascular inflammation." },
        { label: "Base Starches & Produce", percentage: 30, color: "#0d9488", amount: "Bulk", harmful_flag: false, target_system: "Digestive", health_cause: "Refined carbohydrate bulk with natural dietary fiber largely removed." },
        { label: "Proteins & Solids", percentage: 7, color: "#6366f1", amount: "Low", harmful_flag: false, target_system: "Musculoskeletal", health_cause: "Macronutrient protein fraction." },
        { label: "Chemical Additives", percentage: 3, color: "#a855f7", amount: "Additives", harmful_flag: true, target_system: "Gut & Brain", health_cause: "Synthetic emulsifiers and dyes irritate gut mucosa and induce hyperactivity." }
      ];

  // Calculate SVG arc paths for donut chart
  const cx = 160;
  const cy = 160;
  const outerR = 125;
  const innerR = 75;

  let cumulativeAngle = -90; // Start at top (12 o'clock)
  const arcSegments = slices.map((slice, idx) => {
    const angle = (slice.percentage / 100) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + outerR * Math.cos(startRad);
    const y1 = cy + outerR * Math.sin(startRad);
    const x2 = cx + outerR * Math.cos(endRad);
    const y2 = cy + outerR * Math.sin(endRad);

    const x3 = cx + innerR * Math.cos(endRad);
    const y3 = cy + innerR * Math.sin(endRad);
    const x4 = cx + innerR * Math.cos(startRad);
    const y4 = cy + innerR * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;

    // SVG path string for Donut Wedge
    const pathData = [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
      "Z"
    ].join(" ");

    return {
      ...slice,
      pathData,
      startAngle,
      endAngle
    };
  });

  // Active slice for center information
  const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : slices[0];

  // Harmful slices with specific physiological causes
  const harmfulSlices = slices.filter((s) => s.harmful_flag);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0d6e7e] shadow-inner">
            <PieIcon size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">
              Interactive Ingredient Pie Chart & Molecular Breakdown
            </h3>
            <p className="text-xs text-gray-500">
              Hover over pie slices to inspect proportional volume and physiological health impacts
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 self-start sm:self-auto">
          Forensic Lab Decomposition
        </span>
      </div>

      {/* SVG Interactive Pie / Donut Chart + Slices Legend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* SVG Pie Chart Renderer */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="relative w-72 h-72 sm:w-80 sm:h-80">
            <svg
              viewBox="0 0 320 320"
              className="w-full h-full filter drop-shadow-md overflow-visible"
            >
              {arcSegments.map((segment, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <path
                    key={idx}
                    d={segment.pathData}
                    fill={segment.color}
                    stroke="#ffffff"
                    strokeWidth={isHovered ? 3 : 2}
                    className="cursor-pointer transition-all duration-300 ease-out hover:opacity-95"
                    style={{
                      transform: isHovered ? "scale(1.04)" : "scale(1)",
                      transformOrigin: `${cx}px ${cy}px`,
                      filter: isHovered ? "drop-shadow(0 6px 12px rgba(0,0,0,0.18))" : "none"
                    }}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}

              {/* Center Donut Hole */}
              <circle cx={cx} cy={cy} r={innerR - 4} fill="#ffffff" />
            </svg>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
              <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                {activeSlice.percentage}%
              </span>
              <p className="text-xs font-bold text-gray-700 max-w-[130px] truncate mt-0.5">
                {activeSlice.label}
              </p>
              <span className="text-[10px] font-mono text-gray-500 mt-0.5">
                {activeSlice.amount}
              </span>
              {activeSlice.harmful_flag ? (
                <span className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  <span>Harm Risk</span>
                </span>
              ) : (
                <span className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-100 text-teal-800">
                  Base Matrix
                </span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 italic text-center">
            Tap or hover over any slice segment to view details
          </p>
        </div>

        {/* Slices Interactive Legend & Overview */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Formulation Proportions
            </span>
            <span className="text-xs font-mono text-gray-500">Total: 100%</span>
          </div>

          <div className="space-y-2.5">
            {slices.map((slice, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                    isHovered
                      ? "bg-gray-50 border-teal-400 shadow-md ring-1 ring-teal-400/50 scale-[1.01]"
                      : "bg-white border-gray-100 hover:border-gray-200 shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-4 h-4 rounded-lg shrink-0 shadow-xs"
                      style={{ backgroundColor: slice.color }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                          {slice.label}
                        </h5>
                        {slice.harmful_flag && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                            Harmful
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5 truncate">
                        {slice.amount} • {slice.target_system || "System"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-sm sm:text-base text-gray-900">
                      {slice.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* HARMFUL SUBSTANCES & BIOLOGICAL CAUSES (Crucial requirement) */}
      {harmfulSlices.length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-50/90 via-amber-50/50 to-orange-50/80 border-2 border-rose-300/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-2 border-b border-rose-200/60">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-900/20">
              <ShieldAlert size={22} className="animate-pulse" />
            </div>
            <div>
              <h4 className="font-black text-rose-950 text-base flex items-center gap-2">
                <span>Harmful Substances Detected: Biological & Physiological Causes</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[11px] font-black">
                  {harmfulSlices.length} Hazardous Slices
                </span>
              </h4>
              <p className="text-xs text-rose-800/90">
                Detailed clinical breakdown of what happens inside your body upon ingestion
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {harmfulSlices.map((slice, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white border border-rose-200/90 shadow-sm hover:border-rose-400 transition-all space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase text-white shadow-xs"
                      style={{ backgroundColor: slice.color }}
                    >
                      {slice.label}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      {slice.percentage}% of Product
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-2 text-xs font-black text-rose-900">
                    <Activity size={13} className="text-rose-600" />
                    <span>Target: {slice.target_system || "Systemic Cellular"}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-xs text-gray-800 leading-relaxed">
                  <span className="font-extrabold text-rose-950 block mb-0.5">Biological Harmful Cause:</span>
                  {slice.health_cause}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sugar Spoons Visual Counter */}
      {spoonCount > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥄</span>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900">
                  Hidden Sugar Impact: <span className="text-rose-600 font-black">{sugar_spoons_count} Teaspoons of Sugar</span>
                </h4>
                <p className="text-[11px] text-gray-600">Per 100g product (1 teaspoon = ~4.2g of sugar)</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
              spoonCount >= 6 ? "bg-rose-100 text-rose-800 border border-rose-300" : "bg-amber-100 text-amber-800"
            }`}>
              {spoonCount >= 6 ? "⚠️ Exceeds WHO Daily Free Sugar Limit (25g)" : "Moderate Sugar Content"}
            </span>
          </div>

          {/* Visual spoon glyphs */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {Array.from({ length: Math.min(spoonCount, 20) }).map((_, idx) => (
              <span
                key={idx}
                className="w-8 h-8 rounded-xl bg-white shadow-sm border border-rose-200 flex items-center justify-center text-sm"
                title={`Teaspoon ${idx + 1}`}
              >
                🥄
              </span>
            ))}
            {spoonCount > 20 && (
              <span className="h-8 px-2 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center">
                +{spoonCount - 20} more spoons!
              </span>
            )}
          </div>
        </div>
      )}

      {/* Visual Ingredient Highlight Cards */}
      {ingredient_cards && ingredient_cards.length > 0 && (
        <div className="space-y-3 pt-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Forensic Ingredient Factoids
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ingredient_cards.map((card, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200 hover:border-teal-400 transition-all flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      {card.category}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 shadow-xs">
                      {card.visual_flag}
                    </span>
                  </div>
                  <h5 className="font-bold text-gray-900 text-sm mt-1">{card.name}</h5>
                </div>
                <div>
                  <p className="text-xs text-gray-600 leading-relaxed bg-white p-2.5 rounded-xl border border-gray-100">
                    {card.fact}
                  </p>
                  <p className="text-[10px] font-mono text-teal-800 font-semibold mt-2">
                    Relative Volume: {card.proportion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
