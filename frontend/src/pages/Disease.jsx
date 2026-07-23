import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Activity, MapPin, X } from "lucide-react";

const SEVERITY_COLORS = {
  critical: "border-red-500",
  high: "border-orange-400",
  medium: "border-amber-400",
  low: "border-green-400",
};
const SEVERITY_BADGE = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};
const RISK_BADGE = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

function TrendIcon({ trend }) {
  if (trend === "rising") return <TrendingUp size={14} className="text-red-500" />;
  if (trend === "declining") return <TrendingDown size={14} className="text-green-500" />;
  return <Minus size={14} className="text-amber-500" />;
}

export default function Disease() {
  const [diseases, setDiseases] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get("/admin/disease-data").then(setDiseases).catch(console.error);
    api.get("/admin/spread-prediction").then(setPredictions).catch(console.error);
  }, []);

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
          <div key={d.id} className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${SEVERITY_COLORS[d.severity] || "border-gray-200"}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{d.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${SEVERITY_BADGE[d.severity]}`}>{d.severity}</span>
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
                    <span key={i} className="flex items-center gap-1 text-xs text-gray-600">
                      <MapPin size={10} /> {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">AI Spread Predictions</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">Predicted disease spread for {predictions[0]?.week}</p>
              <div className="space-y-3">
                {predictions.map((pred, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-800 text-sm">{pred.zone}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${RISK_BADGE[pred.risk]}`}>{pred.risk} risk</span>
                      </div>
                      <p className="text-xs text-gray-500">{pred.disease} — {pred.predictedCases} predicted cases</p>
                    </div>
                    <AlertTriangle size={18} className={pred.risk === "critical" ? "text-red-500" : pred.risk === "high" ? "text-orange-500" : "text-amber-400"} />
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
