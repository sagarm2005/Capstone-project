import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  FlaskConical,
  Plus,
  X,
  Brain,
  AlertTriangle,
  Download,
  CheckCircle2,
  Sparkles,
  Check,
  FileText,
  Layers,
  Send,
  RefreshCw,
  Search,
  DollarSign
} from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  ready: "bg-purple-100 text-purple-700 border-purple-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
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
  const [activeTab, setActiveTab] = useState("requests"); // "requests" | "menu"
  
  // Rate Card Menu Editor state
  const [myLab, setMyLab] = useState(null);
  const [menuServices, setMenuServices] = useState([]);
  const [savingMenu, setSavingMenu] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState("Imaging & Radiology");

  // AI Prediction & Diagnosis Confirmation state
  const [predicting, setPredicting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmedDiagnosisInput, setConfirmedDiagnosisInput] = useState("");
  const [doctorNotesInput, setDoctorNotesInput] = useState("");

  const fetchLab = () => {
    const param = user?.role === "lab" ? `?labId=${user.id}` : "";
    api.get(`/lab/requests${param}`).then(setRequests).catch(console.error);
  };

  const fetchLabProfile = () => {
    api.get("/labs")
      .then((labs) => {
        if (Array.isArray(labs)) {
          const found = labs.find((l) => l.id === user?.id || l.email === user?.email) || labs[0];
          if (found) {
            setMyLab(found);
            setMenuServices(found.services || []);
          }
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchLab();
    if (user?.role === "lab") {
      fetchLabProfile();
    }
  }, [user]);

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

    if (match) {
      setSelected(match);
      if (match.confirmedDiagnosis) {
        setConfirmedDiagnosisInput(match.confirmedDiagnosis);
      } else if (match.aiAnalysis?.condition) {
        setConfirmedDiagnosisInput(match.aiAnalysis.condition);
      }
    }
  }, [location, requests]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/lab/requests", form);
      fetchLab();
      setShowCreate(false);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Lab assistant sends uploaded report to doctor
  const markReady = async (id) => {
    const requestToReady = requests.find((request) => request.id === id) || (selected?.id === id ? selected : null);
    if (!requestToReady?.reportUrl && !requestToReady?.reportImageUrl) return;
    try {
      const res = await api.post(`/lab/requests/${id}/report`, {
        reportUrl: requestToReady.reportUrl || requestToReady.reportImageUrl
      });
      fetchLab();
      if (selected?.id === id) {
        setSelected(res);
      }
    } catch (err) {
      console.error("Failed to send report:", err);
    }
  };

  // Lab assistant uploads scan or test report
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
      setSelected({
        ...selected,
        reportImageUrl: uploaded.url,
        reportUrl: uploaded.url,
        uploadId: uploaded.id
      });
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  // Doctor runs AI model disease prediction on the uploaded report
  const runDiseasePrediction = async (id) => {
    setPredicting(true);
    try {
      const res = await api.post(`/lab/requests/${id}/predict`, {});
      setSelected(res);
      if (res.aiAnalysis?.condition) {
        setConfirmedDiagnosisInput(res.aiAnalysis.condition);
      } else if (res.aiAnalysis?.prediction) {
        setConfirmedDiagnosisInput(res.aiAnalysis.prediction);
      }
      fetchLab();
    } catch (err) {
      console.error("AI prediction failed:", err);
    } finally {
      setPredicting(false);
    }
  };

  // Doctor confirms diagnosis and saves to both doctor & patient records
  const confirmLabDiagnosis = async (id) => {
    setConfirming(true);
    try {
      const res = await api.post(`/lab/requests/${id}/confirm`, {
        confirmedDiagnosis: confirmedDiagnosisInput || selected?.aiAnalysis?.condition || "Pneumonia",
        doctorNotes: doctorNotesInput
      });
      if (res?.labRequest) {
        setSelected(res.labRequest);
      }
      fetchLab();
    } catch (err) {
      console.error("Confirmation error:", err);
    } finally {
      setConfirming(false);
    }
  };

  // Save modified Menu Card services
  const saveRateCard = async () => {
    if (!myLab?.id) return;
    setSavingMenu(true);
    try {
      const res = await api.patch(`/labs/${myLab.id}/services`, {
        services: menuServices
      });
      if (res?.services) {
        setMenuServices(res.services);
        setMyLab(res);
      }
      alert("Rate Card / Menu Card successfully updated!");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingMenu(false);
    }
  };

  const handleAddService = (e) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServicePrice) return;
    const newService = {
      id: `svc-${Date.now()}`,
      name: newServiceName.trim(),
      category: newServiceCategory,
      price: parseFloat(newServicePrice) || 500,
      sample: newServiceCategory.includes("Imaging") ? "Digital Radiography" : "Blood / Specimen",
      turnaround: "2-4 hours",
      description: "Diagnostic laboratory clinical examination service."
    };
    setMenuServices([...menuServices, newService]);
    setNewServiceName("");
    setNewServicePrice("");
  };

  const updateServicePrice = (id, newPrice) => {
    setMenuServices(
      menuServices.map((s) => (s.id === id ? { ...s, price: parseFloat(newPrice) || 0 } : s))
    );
  };

  const removeService = (id) => {
    setMenuServices(menuServices.filter((s) => s.id !== id));
  };

  const isImageUrl = (url) => {
    if (!url) return false;
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
  };

  const confidenceColor = (conf) =>
    conf > 0.8
      ? "text-red-700 bg-red-50 border-red-200"
      : conf > 0.6
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : "text-green-700 bg-green-50 border-green-200";

  return (
    <div className="max-w-5xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical className="text-[#0d6e7e]" size={26} /> Diagnostic Laboratory Console
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Diagnostic test orders, rate card menu management, and AI disease classification
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user?.role === "lab" && (
            <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200">
              <button
                onClick={() => setActiveTab("requests")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "requests" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Requests ({requests.length})
              </button>
              <button
                onClick={() => setActiveTab("menu")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "menu" ? "bg-white text-[#0d6e7e] shadow-xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                My Menu Card ({menuServices.length})
              </button>
            </div>
          )}

          {(user?.role === "doctor" || user?.role === "admin") && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0d6e7e] text-white rounded-xl hover:bg-[#0a5566] text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus size={16} /> New Request
            </button>
          )}
        </div>
      </div>

      {/* Lab Tech Rate Card / Menu Card View */}
      {user?.role === "lab" && activeTab === "menu" ? (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Layers size={18} className="text-[#0d6e7e]" /> {myLab?.labName || "Diagnostic Center"} · Menu Card & Rate Card
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Doctors selecting your lab will see these exact services and prices when ordering tests.
                </p>
              </div>
              <button
                onClick={saveRateCard}
                disabled={savingMenu}
                className="px-5 py-2.5 bg-[#0d6e7e] text-white rounded-xl text-xs font-bold hover:bg-[#0a5566] disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
              >
                {savingMenu ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Save Rate Card</span>
              </button>
            </div>

            {/* Quick Add Service Form */}
            <form onSubmit={handleAddService} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Test / Investigation Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chest X-Ray (PA View), Digital Mammography"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-[#0d6e7e]"
                  required
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Category
                </label>
                <select
                  value={newServiceCategory}
                  onChange={(e) => setNewServiceCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-[#0d6e7e]"
                >
                  <option value="Imaging & Radiology">Imaging & Radiology</option>
                  <option value="Pathology & Blood">Pathology & Blood</option>
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Microbiology & Serology">Microbiology & Serology</option>
                  <option value="Cardiology & Emergency">Cardiology & Emergency</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  placeholder="550"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-[#0d6e7e]"
                  required
                />
              </div>

              <div className="md:col-span-1">
                <button
                  type="submit"
                  className="w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>
            </form>

            {/* Current Rate Card Services List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {menuServices.map((service) => (
                <div key={service.id} className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-teal-300 transition-all flex items-center justify-between gap-3 shadow-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-900 truncate">{service.name}</p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">{service.category}</span>
                      <span>• {service.sample || "Specimen"}</span>
                      <span>• {service.turnaround || "Fast"}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-gray-400">₹</span>
                    <input
                      type="number"
                      value={service.price}
                      onChange={(e) => updateServicePrice(service.id, e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-xs font-black text-gray-900 text-right outline-none focus:ring-2 focus:ring-[#0d6e7e]"
                    />
                    <button
                      type="button"
                      onClick={() => removeService(service.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100 transition-colors"
                      title="Remove service"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Requests View */
        <>
          {/* Status summary counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {["pending", "processing", "ready", "completed"].map((s) => {
              const count = requests.filter((r) => r.status === s).length;
              return (
                <div key={s} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                  <p className="text-2xl font-bold text-gray-800">{count}</p>
                  <p className="text-xs text-gray-500 capitalize mt-1">{s}</p>
                </div>
              );
            })}
          </div>

          {/* Requests table list */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {requests.map((req) => (
                <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                      <FlaskConical size={18} className="text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm">{req.patientName}</p>
                        <span className="text-gray-400 text-xs">—</span>
                        <p className="text-sm font-semibold text-teal-800">{req.testType}</p>
                        {req.totalPrice > 0 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                            ₹{req.totalPrice}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>Ordered by Dr. {req.doctorName}</span>
                        <span>•</span>
                        <span>Lab: {req.labName}</span>
                        <span>•</span>
                        <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                        {req.confirmedDiagnosis && (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200">
                            Confirmed: {req.confirmedDiagnosis}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${req.priority === "urgent" ? "bg-red-100 text-red-700 border-red-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      {req.priority}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_COLORS[req.status] || "bg-gray-100 text-gray-700"}`}>
                      {req.status}
                    </span>
                    <button
                      onClick={() => {
                        setSelected(req);
                        if (req.confirmedDiagnosis) {
                          setConfirmedDiagnosisInput(req.confirmedDiagnosis);
                        } else if (req.aiAnalysis?.condition) {
                          setConfirmedDiagnosisInput(req.aiAnalysis.condition);
                        }
                      }}
                      className="px-3 py-1.5 bg-[#0d6e7e] text-white rounded-lg text-xs font-bold hover:bg-[#0a5566] transition-colors cursor-pointer"
                    >
                      View & Manage
                    </button>
                  </div>
                </div>
              ))}

              {requests.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  <FlaskConical size={40} className="mx-auto mb-3 opacity-40 text-purple-600" />
                  <p className="font-semibold text-gray-600">No diagnostic requests found</p>
                  <p className="text-xs text-gray-400 mt-1">Prescriptions ordering lab investigations will appear here</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Detailed Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 my-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FlaskConical size={20} className="text-[#0d6e7e]" /> Diagnostic Investigation #{selected.id}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selected.labName} • Ordered for {selected.patientName}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Demographics & Clinical Context */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Patient</p>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">{selected.patientName}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Referring Physician</p>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">Dr. {selected.doctorName}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Age & Blood Group</p>
                  <p className="font-medium text-gray-700 mt-0.5">
                    {selected.patientAge || "28"} yrs • {selected.patientBloodGroup || "O+"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Total Rate Card Fee</p>
                  <p className="font-black text-purple-700 text-sm mt-0.5">
                    ₹{selected.totalPrice || 500}
                  </p>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Requested Tests</p>
                  <p className="font-bold text-teal-800 text-xs mt-0.5">{selected.testType}</p>
                </div>
                {selected.diagnosis && (
                  <div className="col-span-2">
                    <p className="text-gray-400 font-bold uppercase text-[10px]">Initial Clinical Diagnosis</p>
                    <p className="font-medium text-gray-700 mt-0.5">{selected.diagnosis}</p>
                  </div>
                )}
              </div>

              {/* Uploaded Scan or PDF Document */}
              {selected.reportImageUrl || selected.reportUrl ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center justify-between">
                    <span>Uploaded Diagnostic Scan / Document</span>
                    <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                      File Attached
                    </span>
                  </p>
                  {isImageUrl(selected.reportImageUrl || selected.reportUrl) ? (
                    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black/5 p-1">
                      <img
                        src={selected.reportImageUrl || selected.reportUrl}
                        alt="Diagnostic scan"
                        className="w-full max-h-72 object-contain rounded-xl mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={24} className="text-[#0d6e7e]" />
                        <div>
                          <p className="text-xs font-bold text-gray-900">Diagnostic PDF Report</p>
                          <p className="text-[10px] text-gray-500">Document ready for download</p>
                        </div>
                      </div>
                      <a
                        href={selected.reportUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-[#0d6e7e] text-white rounded-xl text-xs font-bold hover:bg-[#0a5566] flex items-center gap-1.5"
                      >
                        <Download size={14} /> Open Document
                      </a>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Lab Assistant Upload & Send Action Section */}
              {user?.role === "lab" && selected.status !== "completed" && (
                <div className="bg-purple-50/70 p-4.5 rounded-2xl border border-purple-200 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                    <FlaskConical size={14} /> Lab Assistant Actions
                  </p>
                  <label className="w-full cursor-pointer rounded-xl border border-dashed border-purple-300 p-4 text-center hover:border-purple-500 transition-colors bg-white flex flex-col items-center justify-center gap-1">
                    <input type="file" accept="image/*,application/pdf" onChange={uploadImage} className="hidden" />
                    <Plus size={22} className="text-purple-600" />
                    <span className="text-xs font-bold text-gray-800">
                      {selected.reportUrl ? "Replace Diagnostic Scan / PDF" : "Upload Scan Image (X-Ray / MRI) or Report PDF"}
                    </span>
                    <span className="text-[10px] text-gray-400">PNG, JPG, WEBP, or PDF up to 15 MB</span>
                    {uploading && <p className="text-xs text-purple-600 font-bold mt-1">Uploading...</p>}
                  </label>

                  <button
                    onClick={() => markReady(selected.id)}
                    disabled={!selected.reportUrl && !selected.reportImageUrl}
                    className="w-full py-2.5 bg-purple-700 text-white rounded-xl font-bold text-xs hover:bg-purple-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Send size={14} /> Send Report to Doctor & Patient
                  </button>
                </div>
              )}

              {/* Doctor AI Prediction & Disease Confirmation Section */}
              {(user?.role === "doctor" || user?.role === "admin") && (
                <div className="bg-teal-50/70 p-4.5 rounded-2xl border border-teal-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain size={18} className="text-[#0d6e7e]" />
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        AI Clinical Diagnostic Model
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => runDiseasePrediction(selected.id)}
                      disabled={predicting || (!selected.reportUrl && !selected.reportImageUrl)}
                      className="px-3.5 py-1.5 bg-[#0d6e7e] text-white rounded-xl text-xs font-bold hover:bg-[#0a5566] disabled:opacity-50 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      {predicting ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" /> Analyzing Scan...
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} /> Run AI Prediction
                        </>
                      )}
                    </button>
                  </div>

                  {/* AI Results Display */}
                  {selected.aiAnalysis && (
                    <div className="space-y-3 bg-white p-4 rounded-xl border border-teal-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Predicted Condition</p>
                          <p className="text-base font-black text-gray-900">
                            {selected.aiAnalysis.condition || selected.aiAnalysis.prediction}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${confidenceColor(selected.aiAnalysis.confidence)}`}>
                          {Math.round(selected.aiAnalysis.confidence * 100)}% Confidence
                        </span>
                      </div>

                      {selected.aiAnalysis.findings && (
                        <p className="text-xs text-gray-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                          <span className="font-bold text-gray-800">Findings: </span>
                          {selected.aiAnalysis.findings}
                        </p>
                      )}

                      {selected.aiAnalysis.secondaryConditions?.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-bold text-gray-700">Differential:</span>
                          {selected.aiAnalysis.secondaryConditions.map((sc, i) => (
                            <span key={i} className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-medium text-gray-700">
                              {sc.condition} ({Math.round(sc.confidence * 100)}%)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Doctor Diagnosis Confirmation & Sync */}
                  <div className="pt-2 border-t border-teal-200/60 space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                        Doctor Confirmed Clinical Diagnosis:
                      </label>
                      <input
                        type="text"
                        value={confirmedDiagnosisInput}
                        onChange={(e) => setConfirmedDiagnosisInput(e.target.value)}
                        placeholder="e.g. Community-Acquired Pneumonia (Confirmed)"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#0d6e7e]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                        Clinical Remarks / Action Plan:
                      </label>
                      <textarea
                        rows={2}
                        value={doctorNotesInput}
                        onChange={(e) => setDoctorNotesInput(e.target.value)}
                        placeholder="e.g. Right lower lobe infiltration verified on chest radiograph. Initiating oral antibiotic regimen."
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0d6e7e] resize-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => confirmLabDiagnosis(selected.id)}
                      disabled={confirming || !confirmedDiagnosisInput}
                      className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      {confirming ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Saving to Both Records...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} /> Confirm Diagnosis & Sync to Doctor & Patient Accounts
                        </>
                      )}
                    </button>

                    {selected.status === "completed" && (
                      <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-xl text-center text-xs font-bold text-emerald-900 flex items-center justify-center gap-2">
                        <Check size={16} className="text-emerald-700" />
                        <span>Confirmed & Synced: {selected.confirmedDiagnosis}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">Create Diagnostic Request</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Investigation Name</label>
                <input
                  value={form.testType}
                  onChange={(e) => setForm({ ...form, testType: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0d6e7e]"
                  placeholder="e.g. Chest X-Ray PA View, CBC, LFT"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0d6e7e]"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#0d6e7e] text-white rounded-xl font-bold text-xs hover:bg-[#0a5566] disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Submitting..." : "Send to Diagnostic Center"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
