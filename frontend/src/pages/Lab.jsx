import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { FlaskConical, Plus, X, Brain, AlertTriangle, Download } from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  ready: "bg-green-100 text-green-700",
};

export default function Lab() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ testType: "", priority: "normal", patientId: 1, doctorId: 2 });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchLab = () => { 
    const param = user?.role === "lab" ? `?labId=${user.id}` : "";
    api.get(`/lab/requests${param}`).then(setRequests).catch(console.error); 
  };
  useEffect(() => { fetchLab(); }, []);

  useEffect(() => {
    if (!location || !requests.length) return;
    const params = new URLSearchParams(location.split("?")[1] || "");
    const requestId = params.get("requestId");
    const prescriptionId = params.get("prescriptionId");
    if (!requestId && !prescriptionId) return;

    const match = requests.find((req) => {
      if (requestId) return String(req.id) === requestId;
      return String(req.prescriptionId) === prescriptionId;
    });

    if (match) setSelected(match);
  }, [location, requests]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/lab/requests", form);
      fetchLab();
      setShowCreate(false);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const markReady = async (id) => {
    const requestToReady = requests.find((request) => request.id === id) || (selected?.id === id ? selected : null);
    if (!requestToReady?.reportUrl && !requestToReady?.reportImageUrl) return;
    await api.post(`/lab/requests/${id}/report`, { reportUrl: requestToReady.reportUrl || requestToReady.reportImageUrl });
    fetchLab();
    if (selected?.id === id) {
      const updated = requests.find((r) => r.id === id);
      if (updated) setSelected({ ...updated, status: "ready" });
    }
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selected) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assetType", "lab_report");
      formData.append("labRequestId", String(selected.id));
      const uploaded = await api.upload("/uploads", formData);
      fetchLab();
      setSelected({ ...selected, reportImageUrl: uploaded.url, reportUrl: uploaded.url, uploadId: uploaded.id });
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const isImageUrl = (url) => {
    if (!url) return false;
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
  };

  const confidenceColor = (conf) => conf > 0.8 ? "text-red-600 bg-red-50" : conf > 0.6 ? "text-amber-600 bg-amber-50" : "text-green-600 bg-green-50";

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
                </div>
                <p className="text-xs text-gray-500 mt-0.5">By {req.doctorName} • {new Date(req.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${req.priority === "urgent" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{req.priority}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[req.status]}`}>{req.status}</span>
                <button onClick={() => setSelected(req)} className="text-xs text-teal-600 hover:underline px-2">View</button>
                {user?.role === "lab" && req.status === "processing" && (
                  <button onClick={() => markReady(req.id)} className="text-xs text-green-600 hover:underline px-2">Mark Ready</button>
                )}
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <FlaskConical size={40} className="mx-auto mb-3 opacity-40" />
              <p>No lab requests found</p>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Lab Request Details</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-500">Patient</p><p className="font-medium">{selected.patientName}</p></div>
                <div><p className="text-gray-500">Doctor</p><p className="font-medium">{selected.doctorName}</p></div>
                <div><p className="text-gray-500">Age</p><p className="font-medium">{selected.patientAge || "—"}</p></div>
                <div><p className="text-gray-500">Blood Group</p><p className="font-medium">{selected.patientBloodGroup || "—"}</p></div>
                <div><p className="text-gray-500">Test Type</p><p className="font-medium">{selected.testType}</p></div>
                <div><p className="text-gray-500">Priority</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selected.priority === "urgent" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{selected.priority}</span>
                </div>
                {selected.diagnosis && (
                  <div className="col-span-2"><p className="text-gray-500">Diagnosis</p><p className="font-medium">{selected.diagnosis}</p></div>
                )}
              </div>
              {selected.reportImageUrl && (
                <div className="space-y-2 pt-3">
                  <p className="text-gray-500 text-sm">Uploaded Image / Scan</p>
                  <img src={selected.reportImageUrl} alt="Lab upload" className="w-full max-h-72 object-contain rounded-2xl border border-gray-200" />
                </div>
              )}
              {selected.reportUrl && isImageUrl(selected.reportUrl) && (
                <div className="space-y-2 pt-3">
                  <p className="text-gray-500 text-sm">Lab Report Preview</p>
                  <img src={selected.reportUrl} alt="Lab report preview" className="w-full max-h-72 object-contain rounded-2xl border border-gray-200" />
                </div>
              )}
              {selected.reportUrl && !isImageUrl(selected.reportUrl) && (
                <div className="pt-3">
                  <a href={selected.reportUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-3 bg-[#0d6e7e] text-white rounded-xl text-sm font-bold hover:bg-[#0a5566] transition-all">
                    <Download size={16} /> View Lab Report
                  </a>
                </div>
              )}
              {selected.aiAnalysis && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain size={16} className="text-[#0d6e7e]" />
                    <p className="text-sm font-semibold text-gray-800">AI Diagnosis Analysis</p>
                  </div>
                  <div className={`p-3 rounded-lg flex items-center justify-between ${confidenceColor(selected.aiAnalysis.confidence)}`}>
                    <span className="font-medium text-sm">{selected.aiAnalysis.primaryCondition}</span>
                    <span className="font-bold text-sm">{Math.round(selected.aiAnalysis.confidence * 100)}% confidence</span>
                  </div>
                  {selected.aiAnalysis.secondaryConditions?.map((sc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm border border-gray-100">
                      <span className="text-gray-700">{sc.condition}</span>
                      <span className="font-medium text-gray-500 font-mono tracking-tighter">{Math.round(sc.confidence * 100)}%</span>
                    </div>
                  ))}
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">{selected.aiAnalysis.disclaimer}</p>
                  </div>
                </div>
              )}
              {!selected.aiAnalysis && selected.status === "ready" && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center space-y-2">
                  <p className="text-sm font-bold text-gray-700">Report & Images Available</p>
                  <p className="text-xs text-gray-500 italic underline cursor-pointer hover:text-teal-600">View Diagnostic Images.zip</p>
                </div>
              )}
              {user?.role === "lab" && selected.status !== "ready" && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-3">Assistant Actions</p>
                  <div className="space-y-3">
                    <label className="w-full cursor-pointer rounded-xl border border-dashed border-gray-200 p-4 text-center hover:border-teal-400 transition-colors bg-white">
                      <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
                      <Plus size={20} className="mx-auto text-gray-300 group-hover:text-teal-500" />
                      <p className="text-xs text-gray-500 mt-2">Upload Scan Image or Report</p>
                      {uploading && <p className="mt-2 text-xs text-teal-600">Uploading...</p>}
                    </label>
                    <button onClick={() => markReady(selected.id)}
                      className="w-full py-2.5 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 shadow-md shadow-green-900/10">
                      Send Report
                    </button>
                  </div>
                </div>
              )}
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
