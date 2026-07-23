import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { FlaskConical, Plus, X, Brain, AlertTriangle, CheckCircle, Clock } from "lucide-react";

type LabRequest = {
  id: number; patientId: number; patientName: string; doctorId: number; doctorName: string;
  testType: string; priority: string; status: string; reportUrl: string | null;
  aiAnalysis: { primaryCondition: string; confidence: number; secondaryConditions: any[]; disclaimer: string } | null;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  ready: "bg-green-100 text-green-700",
};

export default function Lab() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [selected, setSelected] = useState<LabRequest | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ testType: "", priority: "normal", patientId: 1, doctorId: 2 });
  const [loading, setLoading] = useState(false);

  const fetchLab = () => {
    api.get<LabRequest[]>("/lab/requests").then(setRequests).catch(console.error);
  };

  useEffect(() => { fetchLab(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/lab/requests", form);
      fetchLab();
      setShowCreate(false);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const markReady = async (id: number) => {
    await api.post(`/lab/requests/${id}/report`, { reportUrl: `/reports/report_${id}.pdf` });
    fetchLab();
  };

  const confidenceColor = (conf: number) => conf > 0.8 ? "text-red-600 bg-red-50" : conf > 0.6 ? "text-amber-600 bg-amber-50" : "text-green-600 bg-green-50";

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Integration</h1>
          <p className="text-gray-500 text-sm">AI-powered lab report analysis</p>
        </div>
        {(user?.role === "doctor" || user?.role === "lab") && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0d6e7e] text-white rounded-lg hover:bg-[#0a5566] text-sm font-medium">
            <Plus size={16} /> New Request
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {["pending", "processing", "ready"].map((s) => {
          const count = requests.filter((r) => r.status === s).length;
          return (
            <div key={s} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-gray-800">{count}</p>
              <p className="text-xs text-gray-500 capitalize mt-1">{s}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {requests.map((req) => (
            <div key={req.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <FlaskConical size={18} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-800 text-sm">{req.patientName}</p>
                  <span className="text-gray-400 text-sm">—</span>
                  <p className="text-sm text-gray-600">{req.testType}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${req.priority === "urgent" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                    {req.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[req.status] || "bg-gray-100 text-gray-600"}`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Dr. {req.doctorName} • {new Date(req.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {req.aiAnalysis && (
                  <button onClick={() => setSelected(req)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs hover:bg-purple-100">
                    <Brain size={12} /> AI Report
                  </button>
                )}
                {req.status !== "ready" && user?.role === "lab" && (
                  <button onClick={() => markReady(req.id)}
                    className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs hover:bg-green-100">
                    Mark Ready
                  </button>
                )}
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <FlaskConical size={40} className="mx-auto mb-3 opacity-40" />
              <p>No lab requests</p>
            </div>
          )}
        </div>
      </div>

      {selected?.aiAnalysis && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-800">AI Analysis Report</h2>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500 mb-1">Test Type</p>
                <p className="font-semibold text-gray-800">{selected.testType}</p>
                <p className="text-xs text-gray-500 mt-1">Patient: {selected.patientName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Primary Finding</p>
                <div className={`flex items-center justify-between p-4 rounded-xl ${confidenceColor(selected.aiAnalysis.confidence)}`}>
                  <div>
                    <p className="font-bold text-lg">{selected.aiAnalysis.primaryCondition}</p>
                    <p className="text-xs mt-0.5">Primary diagnosis</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{Math.round(selected.aiAnalysis.confidence * 100)}%</p>
                    <p className="text-xs">Confidence</p>
                  </div>
                </div>
              </div>
              {selected.aiAnalysis.secondaryConditions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Differential Diagnoses</p>
                  <div className="space-y-2">
                    {selected.aiAnalysis.secondaryConditions.map((sc: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                        <span className="text-gray-700">{sc.condition}</span>
                        <span className="font-medium text-gray-500">{Math.round(sc.confidence * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">{selected.aiAnalysis.disclaimer}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">New Lab Request</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Test Type</label>
                <input value={form.testType} onChange={(e) => setForm({ ...form, testType: e.target.value })} required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g. CBC, X-Ray, MRI" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-[#0d6e7e] text-white rounded-lg font-medium text-sm hover:bg-[#0a5566] disabled:opacity-60">
                {loading ? "Creating..." : "Create Lab Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
