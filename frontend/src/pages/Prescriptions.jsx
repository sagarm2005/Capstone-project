import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { jsPDF } from "jspdf";
import { api } from "@/lib/api";
import { FileText, Plus, X, CheckCircle, AlertTriangle, XCircle, Printer, Download, Mail, Phone, MapPin } from "lucide-react";

function ValidationIcon({ type }) {
  if (type === "success") return <CheckCircle size={14} className="text-green-500 shrink-0" />;
  if (type === "warning") return <AlertTriangle size={14} className="text-amber-500 shrink-0" />;
  return <XCircle size={14} className="text-red-500 shrink-0" />;
}

export default function Prescriptions() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    patientId: 0,
    diagnosis: "",
    labTests: "",
    followupDate: "",
    medicines: [{ name: "", dosage: "", frequency: "", duration: "", route: "Oral" }],
    patientAge: "",
    patientBloodGroup: "",
    doctorHospital: "",
    doctorAddress: "",
    doctorPhone: "",
    doctorEmail: "",
    doctorDegree: "",
    doctorRegistrationNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [attachedReport, setAttachedReport] = useState(null);

  const getAgeFromDob = (dob) => {
    if (!dob) return "";
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return "";
    const age = new Date(Date.now() - birth.getTime()).getUTCFullYear() - 1970;
    return age > 0 ? String(age) : "";
  };

  const handlePatientChange = (value) => {
    const patientId = Number(value);
    const patient = patients.find((p) => p.id === patientId);
    setForm({
      ...form,
      patientId,
      patientAge: patient ? getAgeFromDob(patient.dateOfBirth) : "",
      patientBloodGroup: patient ? patient.bloodGroup || "" : "",
    });
  };

  const openCreateModal = () => {
    setForm({
      patientId: 0,
      diagnosis: "",
      labTests: "",
      followupDate: "",
      medicines: [{ name: "", dosage: "", frequency: "", duration: "", route: "Oral" }],
      patientAge: "",
      patientBloodGroup: "",
      doctorHospital: user?.hospital || "",
      doctorAddress: "",
      doctorPhone: user?.phone || "",
      doctorEmail: user?.email || "",
      doctorDegree: user?.degree || "",
      doctorRegistrationNumber: user?.registrationNumber || "",
    });
    setShowCreate(true);
  };

  const fetchRx = () => {
    const param = user?.role === "patient" ? `?patientId=${user.id}` : user?.role === "doctor" ? `?doctorId=${user.id}` : "";
    api.get(`/prescriptions${param}`).then(setPrescriptions).catch(console.error);
  };

  useEffect(() => {
    fetchRx();
    if (user?.role === "doctor") {
      api.get("/patients?limit=50").then((d) => setPatients(d.patients)).catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== "doctor" || !location.startsWith("/prescriptions")) return;
    const pending = sessionStorage.getItem("pending_model_report");
    if (!pending) return;
    try {
      setAttachedReport(JSON.parse(pending));
      setShowCreate(true);
      sessionStorage.removeItem("pending_model_report");
    } catch {
      sessionStorage.removeItem("pending_model_report");
    }
  }, [location, user]);

  const buildPrescriptionPdf = (prescription, report) => {
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text("MediCore Prescription and Model Report", 20, 20);
    pdf.setFontSize(11);
    pdf.text(`Prescription ID: ${prescription.id}`, 20, 30);
    pdf.text(`Patient: ${prescription.patientName}`, 20, 38);
    pdf.text(`Doctor: ${prescription.doctorName}`, 20, 46);
    pdf.text(`Diagnosis: ${prescription.diagnosis}`, 20, 54);
    pdf.text("Medicines:", 20, 68);
    prescription.medicines.forEach((medicine, index) => {
      pdf.text(`${index + 1}. ${medicine.name} - ${medicine.dosage}, ${medicine.frequency}, ${medicine.duration}`, 25, 76 + index * 8);
    });
    let nextY = 84 + prescription.medicines.length * 8;
    if (prescription.labTests?.length) {
      pdf.text(`Lab tests: ${prescription.labTests.join(", ")}`, 20, nextY);
      nextY += 10;
    }
    if (report?.dataUrl) {
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text("Attached Pneumonia Model Report", 20, 20);
      pdf.setFontSize(11);
      pdf.text(`Prediction: ${report.result.prediction}`, 20, 30);
      pdf.text(`Confidence: ${Math.round(report.result.confidence * 100)}%`, 20, 38);
      const imageFormat = report.dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
      pdf.addImage(report.dataUrl, imageFormat, 20, 50, 170, 120, undefined, "MEDIUM");
      pdf.setFontSize(9);
      pdf.text(report.result.disclaimer, 20, 180, { maxWidth: 170 });
    }
    return pdf;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const prescription = await api.post("/prescriptions", {
        patientId: form.patientId, doctorId: user?.id, diagnosis: form.diagnosis,
        medicines: form.medicines.filter((m) => m.name),
        labTests: form.labTests.split(",").map((t) => t.trim()).filter(Boolean),
        followupDate: form.followupDate || null,
      });
      if (attachedReport) {
        const pdf = buildPrescriptionPdf(prescription, attachedReport);
        const pdfBlob = pdf.output("blob");
        const formData = new FormData();
        formData.append("file", pdfBlob, `prescription-${prescription.id}.pdf`);
        formData.append("assetType", "prescription");
        formData.append("prescriptionId", String(prescription.id));
        const uploaded = await api.upload("/uploads", formData);
        await api.patch(`/prescriptions/${prescription.id}`, { prescriptionPdfUrl: uploaded.url, prescriptionPdfUploadId: uploaded.id });
        setAttachedReport(null);
      }
      fetchRx();
      setShowCreate(false);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const addMedicine = () => setForm({ ...form, medicines: [...form.medicines, { name: "", dosage: "", frequency: "", duration: "", route: "Oral" }] });
  const updateMed = (i, field, value) => {
    const meds = [...form.medicines];
    meds[i][field] = value;
    setForm({ ...form, medicines: meds });
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
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <FileText size={16} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{rx.patientName}</p>
                <p className="text-xs text-gray-500 truncate">{rx.doctorName}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 font-medium truncate mb-2">{rx.diagnosis}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">{rx.medicines?.length} medicine(s)</p>
              <p className="text-xs text-gray-400">{new Date(rx.createdAt).toLocaleDateString()}</p>
            </div>
            {rx.validations?.some((v) => v.type === "error") && (
              <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                <XCircle size={12} /> Allergy conflict detected
              </div>
            )}
          </button>
        ))}
        {prescriptions.length === 0 && (
          <div className="col-span-3 p-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100">
            <FileText size={40} className="mx-auto mb-3 opacity-40" />
            <p>No prescriptions found</p>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none shadow-2xl overflow-hidden relative" id="prescription-detail">
            <div className="flex items-center justify-between p-6 border-b print:hidden absolute top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-20">
              <div className="flex items-center gap-3">
                <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-black text-xs font-bold transition-all">
                  <Printer size={14} /> Print / Save PDF
                </button>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-8 mt-12 print:mt-0 space-y-8 bg-white" id="printable-area">
              {/* Letterhead Header */}
              <div className="flex justify-between border-b-2 border-teal-600 pb-6 mb-8">
                <div className="space-y-1">
                  <h1 className="text-3xl font-black text-teal-800 tracking-tight">{selected.hospital || "MEDICORE HOSPITAL"}</h1>
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold">
                    <MapPin size={12} /> <span>{selected.hospitalAddress || "123 Healthcare Way, Metro City, 560001"}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                      <Phone size={12} className="text-teal-600" /> <span>{selected.doctorPhone || "+91 98765 43210"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                      <Mail size={12} className="text-teal-600" /> <span>{selected.doctorEmail || "hospital@medicore.com"}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-xl font-black text-gray-900 uppercase"> {selected.doctorName}</p>
                  <p className="text-sm font-bold text-teal-700">{selected.specialty || "General Physician"}</p>
                  <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest bg-gray-50 px-2 py-1 inline-block rounded">Reg No: {selected.doctorLicense}</p>
                </div>
              </div>

              {/* Patient & Vitals Section */}
              <div className="grid grid-cols-2 gap-8 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">Patient Details</p>
                  <div className="space-y-1">
                    <p className="text-lg font-black text-gray-900">{selected.patientName}</p>
                    <div className="flex gap-4 text-xs font-bold text-gray-500">
                      <span>Age: {selected.patientAge || "28"}</span>
                      <span>Gender: {selected.gender || "Male"}</span>
                      <span className="text-teal-700">Blood: {selected.patientBloodGroup || "O+"}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">Vitals Info</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                      <span className="text-gray-400 font-bold uppercase tracking-tighter">BP</span>
                      <span className="font-black text-gray-900">{selected.vitals?.bp || "120/80"}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                      <span className="text-gray-400 font-bold uppercase tracking-tighter">Sugar</span>
                      <span className="font-black text-gray-900">{selected.vitals?.sugar || "N/A"}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                      <span className="text-gray-400 font-bold uppercase tracking-tighter">Heart</span>
                      <span className="font-black text-gray-900">{selected.vitals?.heartRate || "72"} bpm</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                      <span className="text-gray-400 font-bold uppercase tracking-tighter">Weight</span>
                      <span className="font-black text-gray-900">{selected.vitals?.weight || "70"} kg</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnosis Section */}
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 space-y-1">
                  <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Diagnosis</p>
                  <p className="text-xl font-black text-gray-800 italic underline decoration-teal-500/30 underline-offset-4">{selected.diagnosis}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Severity</p>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mt-1 inline-block ${
                    selected.severity === "High" ? "bg-red-100 text-red-700" : selected.severity === "Medium" ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-700"
                  }`}>
                    {selected.severity || "NORMAL"}
                  </span>
                </div>
              </div>

              {/* Medicines Table */}
              <div className="space-y-4">
                <div className="bg-teal-800 text-white rounded-t-xl px-4 py-3 flex justify-between items-center">
                  <p className="text-xs font-black uppercase tracking-widest">Prescribed Medicines</p>
                  <p className="text-[10px] font-bold text-teal-300">Total: {selected.medicines?.length || 0} Items</p>
                </div>
                <div className="border border-t-0 border-gray-200 rounded-b-xl overflow-hidden">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 font-bold text-gray-500 text-[10px] uppercase">Drug Name</th>
                        <th className="px-4 py-3 font-bold text-gray-500 text-[10px] uppercase text-center">Dosage</th>
                        <th className="px-4 py-3 font-bold text-gray-500 text-[10px] uppercase text-center">Freq / Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                      {selected.medicines?.map((med, i) => (
                        <tr key={i}>
                          <td className="px-4 py-4 font-black text-gray-900">{med.name}</td>
                          <td className="px-4 py-4 text-center text-teal-700 font-black tracking-tight">{med.dosage}</td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-gray-500">{med.frequency}</span>
                            <span className="mx-2 text-gray-300">|</span>
                            <span className="text-gray-900 font-bold italic">{med.duration}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lab & Notes */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Lab Tests Required</p>
                  <div className="space-y-2">
                    {selected.labTests?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selected.labTests.map((t, i) => <span key={i} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-black border border-purple-100 tracking-tight underline italic decoration-purple-300 underline-offset-2">{t}</span>)}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No lab tests recommended.</p>
                    )}
                    {selected.selectedLabId && (
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 mt-2">
                        <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Assigned Lab</p>
                        <p className="text-xs font-bold text-amber-900 flex items-center gap-2 italic">
                          <span>Request sent to specialized diagnostic center.</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">AI Safety Validation</p>
                  <div className="space-y-2">
                    {selected.validations?.map((v, i) => (
                      <div key={i} className={`flex items-start gap-2 p-3 rounded-xl border text-xs leading-relaxed ${
                        v.type === "error" ? "bg-red-50 border-red-100 text-red-700" : "bg-green-50 border-green-100 text-green-700"
                      }`}>
                        <ValidationIcon type={v.type} />
                        <span className="font-bold">{v.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-12 flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 mb-4">Follow-up: <span className="text-gray-900 font-black">{selected.followupDate || "N/A"}</span></p>
                  <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100">
                     <p className="text-[8px] font-bold text-teal-600 uppercase tracking-tighter leading-none mb-1 italic opacity-60">System Generated ID</p>
                     <p className="text-[12px] font-black text-gray-400 tracking-tighter">RX-2026-MED-{selected.id.toString().padStart(4, "0")}</p>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-32 h-1 border-b-2 border-dashed border-gray-400 mb-2"></div>
                  <p className="text-[10px] font-black text-gray-900">Digital Signature</p>
                  <p className="text-[8px] font-bold text-gray-400 tracking-tighter italic">MediCore Secure Verification</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">New Prescription</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {attachedReport && (
                <div className="flex items-center gap-3 rounded-lg border border-teal-100 bg-teal-50 p-3">
                  <FileText size={18} className="text-teal-700 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-teal-900">Model report attached</p>
                    <p className="text-xs text-teal-700 truncate">{attachedReport.fileName} · {attachedReport.result.prediction} ({Math.round(attachedReport.result.confidence * 100)}%)</p>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Patient</label>
                <select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: Number(e.target.value) })} required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value={0}>Select patient</option>
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
