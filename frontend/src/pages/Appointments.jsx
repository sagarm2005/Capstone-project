import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Calendar, Plus, Search, X, User, Stethoscope, Building2, Eye, Image as ImageIcon } from "lucide-react";
import PrescriptionModal from "@/components/PrescriptionModal";
import DoctorPublicProfileModal from "@/components/DoctorPublicProfileModal";

const STATUS_COLORS = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

export default function Appointments() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [viewingDoctorProfile, setViewingDoctorProfile] = useState(null);
  const [slots, setSlots] = useState([]);
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ doctorId: 0, date: today, time: "", type: "normal", notes: "" });
  const [search, setSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRxModal, setShowRxModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [rxForm, setRxForm] = useState({ diagnosis: "", medicines: [{ name: "", dosage: "", frequency: "", duration: "", route: "Oral" }], labTests: "", followupDate: "", bp: "", sugar: "", heartRate: "", weight: "", severity: "Medium", labId: "", patientAge: "", bloodGroup: "" });
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [labRequestLoading, setLabRequestLoading] = useState(false);
  const [labRequestMessage, setLabRequestMessage] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [labsList, setLabsList] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [validating, setValidating] = useState(false);
  const isRxEditing = Boolean(selectedPrescription);

  const fetchAppointments = () => {
    const param = user?.role === "patient" ? `?patientId=${user.id}` : user?.role === "doctor" ? `?doctorId=${user.id}` : "";
    api.get(`/appointments${param}`).then(setAppointments).catch(console.error);
  };

  useEffect(() => {
    fetchAppointments();
    api.get("/doctors").then(setDoctors).catch(console.error);
    api.get("/labs").then(setLabsList).catch(console.error);
  }, []);

  const openBooking = (doctor) => {
    setSelectedDoctor(doctor);
    setForm({ ...form, doctorId: doctor.id, date: today });
    api.get(`/doctors/${doctor.id}/slots?date=${today}`).then(setSlots).catch(console.error);
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setForm({ ...form, date: newDate, time: "" });
    if (selectedDoctor) {
      api.get(`/doctors/${selectedDoctor.id}/slots?date=${newDate}`).then(setSlots).catch(console.error);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/appointments", { ...form, patientId: user?.id, doctorId: selectedDoctor?.id });
      fetchAppointments();
      setShowModal(false);
      setSelectedDoctor(null);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleConfirm = async (apptId) => {
    try {
      await api.patch(`/appointments/${apptId}`, { status: "confirmed" });
      fetchAppointments();
    } catch (err) { console.error(err); }
  };

  const calculateAge = (dob) => {
    if (!dob) return "";
    const diff = Date.now() - new Date(dob).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)));
  };

  const handleOpenRx = async (appt) => {
    setSelectedAppt(appt);
    setPatientInfo(null);
    setDoctorInfo(null);
    setSelectedPrescription(null);
    setValidationResult(null);
    setRxForm({ 
      diagnosis: "", 
      medicines: [{ name: "", dosage: "", frequency: "", duration: "", route: "Oral" }], 
      labTests: "", 
      followupDate: "",
      bp: "", sugar: "", heartRate: "", weight: "", severity: "Medium", labId: "", patientAge: "", bloodGroup: ""
    });

    try {
      const [patientRes, doctorRes, prescriptions] = await Promise.all([
        api.get(`/patients/${appt.patientId}`),
        api.get(`/doctors/${appt.doctorId}`),
        api.get(`/prescriptions?patientId=${appt.patientId}&doctorId=${appt.doctorId}`),
      ]);
      setPatientInfo(patientRes);
      setDoctorInfo(doctorRes);

      const existingRx = Array.isArray(prescriptions) && prescriptions.length ? prescriptions[0] : null;
      setSelectedPrescription(existingRx);

      const defaultForm = {
        diagnosis: "",
        medicines: [{ name: "", dosage: "", frequency: "", duration: "", route: "Oral" }],
        labTests: "",
        followupDate: existingRx?.followupDate || "",
        bp: existingRx?.vitals?.bp || "",
        sugar: existingRx?.vitals?.sugar || "",
        heartRate: existingRx?.vitals?.heartRate || "",
        weight: existingRx?.vitals?.weight || "",
        severity: existingRx?.severity || "Medium",
        labId: existingRx?.selectedLabId || "",
        patientAge: existingRx?.patientAge || calculateAge(patientRes.dateOfBirth) || "",
        bloodGroup: existingRx?.patientBloodGroup || patientRes.bloodGroup || "",
      };
      if (existingRx) {
        defaultForm.diagnosis = existingRx.diagnosis || "";
        defaultForm.medicines = existingRx.medicines?.length ? existingRx.medicines : [{ name: "", dosage: "", frequency: "", duration: "", route: "Oral" }];
        defaultForm.labTests = Array.isArray(existingRx.labTests) ? existingRx.labTests.join(", ") : existingRx.labTests || "";
      }
      setRxForm(defaultForm);
    } catch (err) {
      console.error(err);
    }

    setShowRxModal(true);
  };

  const addMed = () => setRxForm({ ...rxForm, medicines: [...rxForm.medicines, { name: "", dosage: "", frequency: "", duration: "", route: "Oral" }] });
  const updateRxMed = (i, field, value) => {
    const meds = [...rxForm.medicines];
    meds[i][field] = value;
    setRxForm({ ...rxForm, medicines: meds });
  };

  const handleSaveRx = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        patientId: selectedAppt.patientId,
        doctorId: user?.id,
        patientAge: rxForm.patientAge,
        bloodGroup: rxForm.bloodGroup,
        diagnosis: rxForm.diagnosis,
        severity: rxForm.severity,
        vitals: {
          bp: rxForm.bp,
          sugar: rxForm.sugar,
          heartRate: rxForm.heartRate,
          weight: rxForm.weight
        },
        selectedLabId: rxForm.labId,
        medicines: rxForm.medicines.filter(m => m.name),
        labTests: rxForm.labTests.split(",").map(t => t.trim()).filter(Boolean),
        followupDate: rxForm.followupDate || null
      };

      if (selectedPrescription) {
        await api.patch(`/prescriptions/${selectedPrescription.id}`, payload);
      } else {
        await api.post("/prescriptions", payload);
      }

      await api.patch(`/appointments/${selectedAppt.id}`, { status: "completed" });
      fetchAppointments();
      setShowRxModal(false);
      setSelectedPrescription(null);
      setValidationResult(null);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSendLabRequest = async () => {
    if (!rxForm.labId || !rxForm.labTests) {
      setLabRequestMessage("Please select a lab and specify tests before sending a request.");
      return;
    }
    setLabRequestLoading(true);
    setLabRequestMessage(null);
    try {
      const payload = {
        patientId: selectedAppt.patientId,
        doctorId: user?.id,
        doctorName: doctorInfo?.fullName || user?.fullName || selectedAppt?.doctorName,
        patientName: selectedAppt?.patientName,
        patientAge: rxForm.patientAge,
        patientBloodGroup: rxForm.bloodGroup,
        labId: Number(rxForm.labId),
        labName: labsList.find((lab) => String(lab.id) === String(rxForm.labId))?.labName || "Laboratory",
        testType: rxForm.labTests,
        priority: rxForm.severity === "High" ? "urgent" : "normal",
        diagnosis: rxForm.diagnosis,
        prescriptionId: selectedPrescription?.id
      };
      await api.post("/lab/requests", payload);
      setLabRequestMessage("Lab request sent to the lab assistant.");
    } catch (err) {
      console.error(err);
      setLabRequestMessage(err.message || "Unable to send lab request. Please try again.");
    }
    setLabRequestLoading(false);
  };

  const handleViewLabReports = () => {
    const query = selectedPrescription?.id ? `?prescriptionId=${selectedPrescription.id}` : selectedAppt?.patientId ? `?patientId=${selectedAppt.patientId}` : "";
    setShowRxModal(false);
    navigate(`/lab${query}`);
  };

  const handleValidateRx = async () => {
    if (!selectedAppt) return;
    setValidating(true);
    setValidationResult(null);
    try {
      const payload = {
        patientId: selectedAppt.patientId,
        doctorId: user?.id,
        patientAge: rxForm.patientAge,
        bloodGroup: rxForm.bloodGroup,
        diagnosis: rxForm.diagnosis,
        severity: rxForm.severity,
        vitals: {
          bp: rxForm.bp,
          sugar: rxForm.sugar,
          heartRate: rxForm.heartRate,
          weight: rxForm.weight
        },
        selectedLabId: rxForm.labId,
        medicines: rxForm.medicines.filter(m => m.name),
        labTests: rxForm.labTests.split(",").map(t => t.trim()).filter(Boolean),
        followupDate: rxForm.followupDate || null
      };
      const result = await api.post("/prescriptions/validate", payload);
      setValidationResult(result.validations || []);
    } catch (err) {
      console.error(err);
    }
    setValidating(false);
  };

  const filtered = appointments.filter((a) =>
    !search || a.doctorName?.toLowerCase().includes(search.toLowerCase()) ||
    a.patientName?.toLowerCase().includes(search.toLowerCase())
  );

  const availableSlots = slots.filter((s) => s.available);

  const filteredDoctors = doctors.filter((doc) =>
    !doctorSearch ||
    (doc.fullName && doc.fullName.toLowerCase().includes(doctorSearch.toLowerCase())) ||
    (doc.hospital && doc.hospital.toLowerCase().includes(doctorSearch.toLowerCase())) ||
    (doc.location && doc.location.toLowerCase().includes(doctorSearch.toLowerCase()))
  );

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 text-sm">Manage and book your appointments</p>
        </div>
        {(user?.role === "patient" || user?.role === "admin") && (
          <button onClick={() => { setSelectedDoctor(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#0d6e7e] text-white rounded-lg hover:bg-[#0a5566] text-sm font-medium">
            <Plus size={16} /> Book Appointment
          </button>
        )}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Search appointments..." />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-40" />
            <p>No appointments found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((appt) => (
              <div key={appt.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Calendar size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-800 text-sm">{appt.doctorName}</p>
                    <span className="text-gray-400 text-xs">→</span>
                    <p className="text-sm text-gray-600">{appt.patientName}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{appt.date} at {appt.time} • {appt.type}</p>
                  {appt.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{appt.notes}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-bold text-gray-800">₹{appt.fee}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[appt.status] || "bg-gray-100 text-gray-600"}`}>
                      {appt.status}
                    </span>
                  </div>
                  
                  {user?.role === "doctor" && appt.status === "pending" && (
                    <button onClick={() => handleConfirm(appt.id)}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors">
                      Confirm
                    </button>
                  )}
                  {user?.role === "doctor" && appt.status !== "cancelled" && (
                    <button onClick={() => handleOpenRx(appt)}
                      className="px-3 py-1.5 bg-[#0d6e7e] text-white text-xs font-bold rounded-lg hover:bg-[#0a5566] transition-colors">
                      Manage Prescription
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Book Appointment</h2>
              <button onClick={() => { setShowModal(false); setSelectedDoctor(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>

            {!selectedDoctor ? (
              <div className="p-6">
                <div className="mb-4">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={doctorSearch} onChange={(e) => setDoctorSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Search doctors by name, hospital, or city..." />
                  </div>
                </div>
                <div className="space-y-3">
                  {filteredDoctors.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-6 bg-gray-50 rounded-xl border border-gray-100">No doctors match your search.</p>
                  ) : (
                    filteredDoctors.map((doc) => (
                      <div key={doc.id}
                        className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50/40 transition-all bg-white text-left">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-[#0d6e7e] flex items-center justify-center shrink-0 shadow-xs">
                            <Stethoscope size={20} className="text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate">{doc.fullName}</p>
                            <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                              <span>{doc.specialty}</span>
                              <span>•</span>
                              <Building2 size={12} className="text-[#0d6e7e]" />
                              <span className="font-medium text-gray-700">{doc.hospital || "Hospital"}</span>
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                              <span>⭐ {doc.rating}</span>
                              <span>•</span>
                              <span>{doc.experience}y exp</span>
                              <span>•</span>
                              <span className="font-bold text-[#0d6e7e]">₹{doc.fee} (Visit)</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingDoctorProfile(doc);
                            }}
                            className="px-3 py-1.5 bg-gray-50 hover:bg-teal-50 text-[#0d6e7e] border border-gray-200 hover:border-teal-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                            title="View Doctor Bio, Hospital Photos & Service Price List"
                          >
                            <Building2 size={13} />
                            <span>Hospital & Rates</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openBooking(doc)}
                            className="px-4 py-1.5 bg-[#0d6e7e] hover:bg-[#0a5566] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                          >
                            Book Slot
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleBook} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0d6e7e] flex items-center justify-center shrink-0">
                      <User size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{selectedDoctor.fullName}</p>
                      <p className="text-xs text-gray-500">{selectedDoctor.specialty} • ₹{selectedDoctor.fee} visiting fee</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setViewingDoctorProfile(selectedDoctor)}
                      className="px-2.5 py-1 bg-white text-[#0d6e7e] border border-teal-200 rounded-lg text-xs font-bold hover:bg-teal-100/50 transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <Building2 size={12} /> Hospital & Rates
                    </button>
                    <button type="button" onClick={() => setSelectedDoctor(null)} className="text-xs text-teal-700 hover:underline font-medium px-2 py-1">Change</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={handleDateChange} required
                    min={today}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Available Slots</label>
                  {slots.length === 0 ? (
                    <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 italic">No slots available for this doctor on the selected day.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <button key={slot.time} type="button" onClick={() => setForm({ ...form, time: slot.time })}
                          className={`py-2 px-3 flex flex-col items-center justify-center rounded-lg text-xs border transition-colors ${form.time === slot.time ? "bg-[#0d6e7e] text-white border-[#0d6e7e]" : "bg-white border-gray-200 hover:border-teal-400"}`}>
                          <span className="font-medium">{slot.time}</span>
                          <span className={`${form.time === slot.time ? "text-teal-100" : "text-teal-600"} text-[10px] tracking-wide uppercase mt-0.5`}>
                            {slot.remaining} left
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="normal">Normal</option>
                    <option value="followup">Follow-up</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    placeholder="Any specific concerns..." />
                </div>
                <button type="submit" disabled={loading || !form.time || !form.date}
                  className="w-full py-2.5 bg-[#0d6e7e] text-white rounded-lg font-medium text-sm hover:bg-[#0a5566] disabled:opacity-60 transition-colors">
                  {loading ? "Booking..." : `Confirm Booking - ₹${selectedDoctor.fee}`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {showRxModal && (
        <PrescriptionModal
          isOpen={showRxModal}
          onClose={() => setShowRxModal(false)}
          initialPatientId={selectedAppt?.patientId}
          initialPatientName={selectedAppt?.patientName}
          appointmentId={selectedAppt?.id}
          doctor={user}
          onPrescriptionCreated={() => {
            fetchAppointments();
            setShowRxModal(false);
          }}
        />
      )}

      {viewingDoctorProfile && (
        <DoctorPublicProfileModal
          isOpen={Boolean(viewingDoctorProfile)}
          onClose={() => setViewingDoctorProfile(null)}
          doctor={viewingDoctorProfile}
          onBook={(doc) => {
            setViewingDoctorProfile(null);
            openBooking(doc);
          }}
        />
      )}
    </div>
  );
}

