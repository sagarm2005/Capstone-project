import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { FileText, Plus, X, CheckCircle, AlertTriangle, XCircle, Stethoscope } from "lucide-react";

type Medicine = { name: string; dosage: string; frequency: string; duration: string; route: string };
type Validation = { type: "success" | "warning" | "error"; message: string };
type Prescription = {
  id: number; patientId: number; patientName: string; doctorId: number; doctorName: string;
  doctorLicense: string; hospital: string; diagnosis: string; medicines: Medicine[];
  labTests: string[]; followupDate: string; validations: Validation[]; createdAt: string;
};
type Patient = { id: number; fullName: string; email: string };

export default function Prescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<Prescription | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ patientId: 0, diagnosis: "", labTests: "", followupDate: "", medicines: [{ name: "", dosage: "", frequency: "", duration: "", route: "Oral" }] });
  const [loading, setLoading] = useState(false);

  const fetchRx = () => {
    const param = user?.role === "patient" ? `?patientId=${user.id}` : user?.role === "doctor" ? `?doctorId=${user.id}` : "";
    api.get<Prescription[]>(`/prescriptions${param}`).then(setPrescriptions).catch(console.error);
  };

  useEffect(() => {
    fetchRx();
    if (user?.role === "doctor") {
      api.get<any>("/patients?limit=50").then((d) => setPatients(d.patients)).catch(console.error);
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/prescriptions", {
        patientId: form.patientId, doctorId: user?.id, diagnosis: form.diagnosis,
        medicines: form.medicines.filter((m) => m.name),
        labTests: form.labTests.split(",").map((t) => t.trim()).filter(Boolean),
        followupDate: form.followupDate || null,
      });
      fetchRx();
      setShowCreate(false);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const addMedicine = () => setForm({ ...form, medicines: [...form.medicines, { name: "", dosage: "", frequency: "", duration: "", route: "Oral" }] });
  const updateMed = (i: number, field: string, value: string) => {
    const meds = [...form.medicines];
    (meds[i] as any)[field] = value;
    setForm({ ...form, medicines: meds });
  };

  const ValidationIcon = ({ type }: { type: string }) => {
    if (type === "success") return <CheckCircle size={14} className="text-green-500 shrink-0" />;
    if (type === "warning") return <AlertTriangle size={14} className="text-amber-500 shrink-0" />;
    return <XCircle size={14} className="text-red-500 shrink-0" />;
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-500 text-sm">AI-validated smart prescriptions</p>
        </div>
        {user?.role === "doctor" && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0d6e7e] text-white rounded-lg hover:bg-[#0a5566] text-sm font-medium">
            <Plus size={16} /> New Prescription
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {prescriptions.map((rx) => (
          <button key={rx.id} onClick={() => setSelected(rx)}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-teal-300 text-left transition-colors">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                <FileText size={16} className="text-teal-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">{user?.role === "patient" ? rx.doctorName : rx.patientName}</p>
                <p className="text-xs text-gray-400">{new Date(rx.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 font-medium truncate">{rx.diagnosis}</p>
            <p className="text-xs text-gray-400 mt-1">{rx.medicines.length} medicine{rx.medicines.length !== 1 ? "s" : ""}</p>
            <div className="flex gap-1 mt-2">
              {rx.validations.slice(0, 3).map((v, i) => (
                <ValidationIcon key={i} type={v.type} />
              ))}
            </div>
          </button>
        ))}
        {prescriptions.length === 0 && (
          <div className="col-span-3 py-12 text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p>No prescriptions yet</p>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Prescription #{selected.id}</h2>
                <p className="text-xs text-gray-400">{selected.hospital} • {selected.doctorLicense}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500 mb-0.5">Patient</p><p className="font-medium">{selected.patientName}</p></div>
                <div><p className="text-gray-500 mb-0.5">Doctor</p><p className="font-medium">{selected.doctorName}</p></div>
                <div className="col-span-2"><p className="text-gray-500 mb-0.5">Diagnosis</p><p className="font-medium">{selected.diagnosis}</p></div>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-3 text-sm">Medicines</h3>
                <div className="space-y-2">
                  {selected.medicines.map((med, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="w-7 h-7 rounded-full bg-[#0d6e7e] flex items-center justify-center text-white text-xs font-bold shrink-0">{i + 1}</div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">{med.name}</span>
                        <span className="text-gray-500"> — {med.dosage} • {med.frequency} • {med.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {selected.labTests.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2 text-sm">Lab Tests Ordered</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.labTests.map((t, i) => <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs">{t}</span>)}
                  </div>
                </div>
              )}
              <div>
                <h3 className="font-medium text-gray-700 mb-2 text-sm">AI Validation</h3>
                <div className="space-y-2">
                  {selected.validations.map((v, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2.5 rounded-lg text-xs ${
                      v.type === "success" ? "bg-green-50 text-green-800" :
                      v.type === "warning" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-red-800"
                    }`}>
                      <ValidationIcon type={v.type} /> {v.message}
                    </div>
                  ))}
                </div>
              </div>
              {selected.followupDate && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm">
                  <span className="text-gray-500">Follow-up due: </span>
                  <span className="font-medium text-blue-700">{selected.followupDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreate && user?.role === "doctor" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">New Prescription</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Patient</label>
                <select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: Number(e.target.value) })} required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select patient...</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Diagnosis</label>
                <input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Primary diagnosis" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Medicines</label>
                  <button type="button" onClick={addMedicine} className="text-xs text-[#0d6e7e] hover:underline">+ Add</button>
                </div>
                <div className="space-y-2">
                  {form.medicines.map((med, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2">
                      <input placeholder="Drug name" value={med.name} onChange={(e) => updateMed(i, "name", e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      <input placeholder="Dosage (e.g. 500mg)" value={med.dosage} onChange={(e) => updateMed(i, "dosage", e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      <input placeholder="Frequency" value={med.frequency} onChange={(e) => updateMed(i, "frequency", e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      <input placeholder="Duration (e.g. 7 days)" value={med.duration} onChange={(e) => updateMed(i, "duration", e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Lab Tests (comma separated)</label>
                <input value={form.labTests} onChange={(e) => setForm({ ...form, labTests: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="HbA1c, CBC, Lipid Panel" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Follow-up Date</label>
                <input type="date" value={form.followupDate} onChange={(e) => setForm({ ...form, followupDate: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-[#0d6e7e] text-white rounded-lg font-medium text-sm hover:bg-[#0a5566] disabled:opacity-60">
                {loading ? "Saving..." : "Create Prescription (AI will validate)"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
