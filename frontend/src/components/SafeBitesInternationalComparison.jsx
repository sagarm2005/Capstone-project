import { Globe2, ShieldCheck, AlertTriangle, Scale, Info, CheckCircle2, Ban } from "lucide-react";

export default function SafeBitesInternationalComparison({ comparisonData, productName }) {
  if (!comparisonData && !productName) return null;

  const data = comparisonData || {
    headline: "International Formulation Discrepancy: Domestic vs. Europe & Japan",
    summary: "Multinational food brands formulate cleaner, safer recipes for the European Union and Japan to comply with strict overseas bans on petroleum food dyes and high fructose syrups.",
    regions: [
      {
        country: "Domestic / Scanned Recipe",
        flag: "🇺🇸 / 🇮🇳",
        sweetener: "High Fructose Corn Syrup & Refined Sugar",
        fats: "Refined Palm & Partially Hydrogenated Oils",
        additives: "Petroleum Dyes (Red 40, Yellow 5), TBHQ, Chemical Flavorings",
        regulation_status: "Standard mass-market recipe permitted by local limits"
      },
      {
        country: "European Union & United Kingdom",
        flag: "🇪🇺 🇬🇧",
        sweetener: "100% Real Sugar (No High Fructose Corn Syrup allowed)",
        fats: "Sustainable RSPO Non-Hydrogenated Oils (Trans fat < 2g)",
        additives: "Natural Plant Extracts (Turmeric, Paprika, Beetroot Red)",
        regulation_status: "Synthetic dyes eliminated to avoid mandatory EU health warning"
      },
      {
        country: "Japan",
        flag: "🇯🇵",
        sweetener: "Traditional Cane Sugar & Seasoned Rice Vinegar",
        fats: "High-purity unhydrogenated vegetable shortening",
        additives: "Zero synthetic unapproved colorants (MHLW Positive List)",
        regulation_status: "Strict Japanese Food Sanitation Act compliance"
      }
    ]
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
            <Globe2 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">
              International Recipe Comparison (Europe, Japan & Domestic)
            </h3>
            <p className="text-xs text-gray-500">
              Why multinational brands secretly clean up their ingredients in the EU and Japan
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 self-start sm:self-auto">
          Global Formulation Discrepancy
        </span>
      </div>

      {/* Summary Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-blue-50/80 border border-indigo-100 text-xs sm:text-sm text-indigo-950 font-medium leading-relaxed">
        <p className="font-bold text-indigo-900 text-sm mb-1">{data.headline}</p>
        <p className="text-gray-700">{data.summary}</p>
      </div>

      {/* 3-Column Regional Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {data.regions && data.regions.map((region, idx) => {
          const isDomestic = idx === 0;
          const isEU = idx === 1;
          const isJapan = idx === 2;

          return (
            <div
              key={idx}
              className={`rounded-2xl p-5 border flex flex-col justify-between space-y-4 transition-all ${
                isDomestic
                  ? "bg-rose-50/40 border-rose-200/80 hover:border-rose-400"
                  : isEU
                  ? "bg-blue-50/40 border-blue-200/80 hover:border-blue-400"
                  : "bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-400"
              }`}
            >
              <div>
                {/* Region Title & Flag */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-200/60">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{region.flag}</span>
                    <h4 className="font-black text-gray-900 text-sm sm:text-base">
                      {region.country}
                    </h4>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isDomestic
                      ? "bg-rose-100 text-rose-800"
                      : isEU
                      ? "bg-blue-100 text-blue-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {isDomestic ? "Lower Standard" : isEU ? "Strict EFSA" : "MHLW Approved"}
                  </span>
                </div>

                {/* Ingredients Comparison Specs */}
                <div className="space-y-3 pt-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                      Sweetener Source
                    </span>
                    <p className={`font-semibold ${isDomestic ? "text-rose-900" : "text-gray-800"}`}>
                      {region.sweetener}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                      Fats & Lipids
                    </span>
                    <p className={`font-semibold ${isDomestic ? "text-amber-900" : "text-gray-800"}`}>
                      {region.fats}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                      Additives & Colorants
                    </span>
                    <p className={`font-semibold ${isDomestic ? "text-rose-900 font-bold" : "text-emerald-900 font-bold"}`}>
                      {region.additives}
                    </p>
                  </div>
                </div>
              </div>

              {/* Regulatory Status Pill */}
              <div className="pt-3 border-t border-gray-200/60">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                  Legal / Health Compliance
                </span>
                <p className={`text-xs font-medium p-2 rounded-xl ${
                  isDomestic
                    ? "bg-rose-100/70 text-rose-950 border border-rose-200"
                    : isEU
                    ? "bg-blue-100/70 text-blue-950 border border-blue-200"
                    : "bg-emerald-100/70 text-emerald-950 border border-emerald-200"
                }`}>
                  {region.regulation_status}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanatory Takeaway Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-200 flex items-start gap-3.5">
        <Scale size={20} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-gray-700 leading-relaxed">
          <span className="font-extrabold text-gray-900 block mb-0.5">
            Why does the same brand formulate cleaner recipes abroad?
          </span>
          Strict food legislation in the <span className="font-bold text-gray-900">European Union</span> mandates explicit black-box warnings on foods containing artificial azo dyes (like Red 40 & Yellow 5), while <span className="font-bold text-gray-900">Japan</span> strictly restricts unvetted synthetic preservatives. Rather than placing a warning label on boxes in Europe or Japan, multinational brands replace synthetic petroleum chemicals with real cane sugar, beetroot, turmeric, and non-hydrogenated oils—yet continue selling the inferior formulation domestically.
        </div>
      </div>
    </div>
  );
}
