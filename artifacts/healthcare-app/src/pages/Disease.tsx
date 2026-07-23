import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Activity, MapPin, X } from "lucide-react";

type DiseaseData = {
  id: number; name: string; activeCases: number; newCasesToday: number;
  trend: string; severity: string; affectedAreas: string[];
};
type Prediction = { zone: string; risk: string; predictedCases: number; disease: string; week: string };

const SEVERITY_COLORS: Record<string, string> = {
  critical: "border-red-500 bg-red-50",
  high: "border-orange-400 bg-orange-50",
  medium: "border-amber-400 bg-amber-50",
  low: "border-green-400 bg-green-50",
};
const RISK_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

export default function Disease() {
  const [diseases, setDiseases] = useState<DiseaseData[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get<DiseaseData[]>("/admin/disease-data").then(setDiseases).catch(console.error);
    api.get<Prediction[]>("/admin/spread-prediction").then(setPredictions).catch(console.error);
  }, []);

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "rising") return <TrendingUp size={14} className="text-red-500" />;
    if (trend === "declining") return <TrendingDown size={14} className="text-green-500" />;
    return <Minus size={14} className="text-amber-500" />;
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disease Monitor</h1>
          <p className="text-gray-500 text-sm">Real-time disease surveillance & AI spread prediction</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0d6e7e] text-white rounded-lg text-sm font-medium hover:bg-[#0a5566]">
          <Activity size={16} /> AI Spread Prediction
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {diseases.map((d) => (
          <div key={d.id} className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${SEVERITY_COLORS[d.severity]?.split(" ")[0] || "border-gray-200"}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{d.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${SEVERITY_COLORS[d.severity]}`}>{d.severity}</span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <TrendIcon trend={d.trend} /> <span className="capitalize">{d.trend}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{d.activeCases.toLocaleString()}</p>
                <p className="text-xs text-gray-500">active cases</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">New today</p>
                <p className={`text-sm font-bold ${d.trend === "rising" ? "text-red-600" : d.trend === "declining" ? "text-green-600" : "text-amber-600"}`}>
                  +{d.newCasesToday}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Affected Areas</p>
                <div className="flex flex-wrap gap-1 justify-end">
                  {d.affectedAreas.slice(0, 2).map((area, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                      <MapPin size={10} /> {area}
                    </span>
                  ))}
                  {d.affectedAreas.length > 2 && <span className="text-xs text-gray-400">+{d.affectedAreas.length - 2}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-[#0d6e7e]" />
                <h2 className="text-lg font-semibold text-gray-800">AI Spread Predictions</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                <AlertTriangle size={14} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">AI predictions for week: {predictions[0]?.week || "Apr 14–20 2026"}. Based on historical trends, seasonal patterns, and current case data.</p>
              </div>
              <div className="space-y-3">
                {predictions.map((pred, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800 text-sm">{pred.zone}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${RISK_BADGE[pred.risk] || "bg-gray-100 text-gray-600"}`}>{pred.risk} risk</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{pred.disease}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-800">{pred.predictedCases}</p>
                      <p className="text-xs text-gray-500">predicted cases</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
