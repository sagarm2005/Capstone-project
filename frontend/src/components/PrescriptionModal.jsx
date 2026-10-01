import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Pill,
  Sparkles,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  User,
  Activity,
  Receipt,
  ArrowRight,
  TrendingDown,
  Building2,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  ChevronDown,
  FileText,
  FlaskConical,
  Check,
  CheckSquare,
  Square
} from "lucide-react";

export default function PrescriptionModal({
  isOpen,
  onClose,
  initialPatientId = null,
  initialPatientName = "",
  appointmentId = null,
  onPrescriptionCreated,
  doctor = null
}) {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || 0);
  const [patientData, setPatientData] = useState(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [labTests, setLabTests] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [bp, setBp] = useState("");
  const [sugar, setSugar] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [newAllergyInput, setNewAllergyInput] = useState("");
  const [showAddAllergy, setShowAddAllergy] = useState(false);
  const [advice, setAdvice] = useState("");
  const [docDetails, setDocDetails] = useState(doctor || null);
  const [openGenericPopupIndex, setOpenGenericPopupIndex] = useState(null);

  // Diagnostic Lab & Menu Card State
  const [labs, setLabs] = useState([]);
  const [selectedLabId, setSelectedLabId] = useState(null);
  const [selectedLabCategory, setSelectedLabCategory] = useState("All");
  const [selectedTests, setSelectedTests] = useState([]);
  const [showLabSection, setShowLabSection] = useState(false);

  // Fetch full doctor profile details for real clinical header
  useEffect(() => {
    if (doctor?.id) {
      api.get(`/doctors/${doctor.id}`)
        .then((res) => {
          if (res) setDocDetails(res);
        })
        .catch(() => {
          setDocDetails(doctor);
        });
    } else if (doctor) {
      setDocDetails(doctor);
    }
  }, [doctor, isOpen]);

  // Close generic popover on global click
  useEffect(() => {
    const handleGlobalClick = () => {
      setOpenGenericPopupIndex(null);
    };
    if (openGenericPopupIndex !== null) {
      window.addEventListener("click", handleGlobalClick);
      return () => window.removeEventListener("click", handleGlobalClick);
    }
  }, [openGenericPopupIndex]);

  // Medicines state
  const [medicines, setMedicines] = useState([
    {
      id: Date.now(),
      name: "",
      dosage: "500mg",
      frequency: "1-0-1 (After meals)",
      duration: "5 days",
      route: "Oral",
      price: 0,
      manufacturer: "",
      packSize: "",
      activeCompounds: [],
      hasAllergyConflict: false,
      allergyAlerts: [],
      genericInfo: null,
      analyzing: false,
      searchSuggestions: [],
      showSuggestions: false
    }
  ]);

  // Load patients list on mount
  useEffect(() => {
    if (!isOpen) return;
    api.get("/patients?limit=50")
      .then((data) => {
        setPatients(data.patients || []);
      })
      .catch(console.error);
  }, [isOpen]);

  // Load diagnostic labs and their menu cards on mount
  useEffect(() => {
    if (!isOpen) return;
    api.get("/labs")
      .then((data) => {
        const labList = Array.isArray(data) ? data : [];
        setLabs(labList);
        if (labList.length > 0) {
          setSelectedLabId((prev) => prev || labList[0].id);
        }
      })
      .catch(console.error);
  }, [isOpen]);

  const currentLab = labs.find((l) => l.id === selectedLabId) || labs[0] || null;
  const currentLabServices = currentLab?.services || [];

  const filteredLabServices = currentLabServices.filter((s) => {
    if (selectedLabCategory === "All") return true;
    if (selectedLabCategory === "Imaging & Radiology") {
      const cat = (s.category || "").toLowerCase();
      const n = (s.name || "").toLowerCase();
      return (
        cat.includes("imaging") ||
        cat.includes("radiology") ||
        n.includes("x-ray") ||
        n.includes("xray") ||
        n.includes("scan") ||
        n.includes("ultrasound")
      );
    }
    return (s.category || "").toLowerCase().includes(selectedLabCategory.toLowerCase());
  });

  const toggleTestSelection = (test) => {
    const exists = selectedTests.some((t) => t.name.toLowerCase() === test.name.toLowerCase());
    if (exists) {
      setSelectedTests(selectedTests.filter((t) => t.name.toLowerCase() !== test.name.toLowerCase()));
    } else {
      setSelectedTests([
        ...selectedTests,
        {
          id: test.id,
          name: test.name,
          category: test.category || "General Diagnostics",
          price: parseFloat(test.price) || 0,
          sample: test.sample || "Standard Specimen",
          turnaround: test.turnaround || "2-4 hours",
          labId: currentLab?.id || selectedLabId,
          labName: currentLab?.labName || "Diagnostic Lab"
        }
      ]);
    }
  };

  const totalLabAmount = selectedTests.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);

  // If initialPatientId changes or is provided
  useEffect(() => {
    if (initialPatientId) {
      setSelectedPatientId(initialPatientId);
    }
  }, [initialPatientId]);

  // Fetch full details of selected patient (including allergies)
  useEffect(() => {
    if (selectedPatientId && selectedPatientId > 0) {
      api.get(`/patients/${selectedPatientId}`)
        .then((p) => {
          setPatientData(p);
          // Re-analyze all currently entered medicines against this patient's allergies
          reanalyzeAllMedicines(p.allergies || []);
        })
        .catch(console.error);
    } else {
      setPatientData(null);
    }
  }, [selectedPatientId]);

  // Re-analyze all medicines whenever patient allergies update
  const reanalyzeAllMedicines = (allergies) => {
    medicines.forEach((med, idx) => {
      if (med.name && med.name.trim().length >= 2) {
        triggerAnalyze(idx, med.name, allergies);
      }
    });
  };

  const handlePatientSelect = (e) => {
    const id = Number(e.target.value);
    setSelectedPatientId(id);
  };

  const addAllergyToPatient = async () => {
    if (!newAllergyInput.trim() || !selectedPatientId) return;
    try {
      await api.post(`/patients/${selectedPatientId}/allergies`, {
        allergy: newAllergyInput.trim()
      });
      const updated = await api.get(`/patients/${selectedPatientId}`);
      setPatientData(updated);
      setNewAllergyInput("");
      setShowAddAllergy(false);
      reanalyzeAllMedicines(updated.allergies || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Medicine list actions
  const addMedicineRow = () => {
    setMedicines([
      ...medicines,
      {
        id: Date.now() + Math.random(),
        name: "",
        dosage: "500mg",
        frequency: "1-0-1 (After meals)",
        duration: "5 days",
        route: "Oral",
        price: 0,
        manufacturer: "",
        packSize: "",
        activeCompounds: [],
        hasAllergyConflict: false,
        allergyAlerts: [],
        genericInfo: null,
        analyzing: false,
        searchSuggestions: [],
        showSuggestions: false
      }
    ]);
  };

  const removeMedicineRow = (index) => {
    if (medicines.length <= 1) {
      // Clear instead of removing
      setMedicines([
        {
          id: Date.now(),
          name: "",
          dosage: "500mg",
          frequency: "1-0-1 (After meals)",
          duration: "5 days",
          route: "Oral",
          price: 0,
          manufacturer: "",
          packSize: "",
          activeCompounds: [],
          hasAllergyConflict: false,
          allergyAlerts: [],
          genericInfo: null,
          analyzing: false,
          searchSuggestions: [],
          showSuggestions: false
        }
      ]);
      return;
    }
    const updated = medicines.filter((_, i) => i !== index);
    setMedicines(updated);
  };

  const updateMedField = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  // Autocomplete search from Indian Medicine Dataset
  const handleNameInput = async (index, val) => {
    const updated = [...medicines];
    updated[index].name = val;
    setMedicines(updated);

    if (val.trim().length >= 2) {
      try {
        const results = await api.get(`/medicines/search?q=${encodeURIComponent(val)}&limit=6`);
        const latest = [...medicines];
        if (latest[index]) {
          latest[index].searchSuggestions = results || [];
          latest[index].showSuggestions = true;
          setMedicines(latest);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      updated[index].searchSuggestions = [];
      updated[index].showSuggestions = false;
      setMedicines(updated);
    }
  };

  // Select medicine from autocomplete suggestions
  const selectSuggestion = (index, suggestion) => {
    const updated = [...medicines];
    updated[index].name = suggestion.name;
    updated[index].price = suggestion.price || 0;
    updated[index].manufacturer = suggestion.manufacturer_name || "";
    updated[index].packSize = suggestion.pack_size_label || "";
    updated[index].showSuggestions = false;
    setMedicines(updated);

    triggerAnalyze(index, suggestion.name, patientData?.allergies || []);
  };

  // Call HealthPilot API & Allergy Check & Pricing
  const triggerAnalyze = async (index, medName, allergiesList = null) => {
    if (!medName || medName.trim().length < 2) return;

    const allergies = allergiesList || patientData?.allergies || [];
    const updated = [...medicines];
    if (updated[index]) {
      updated[index].analyzing = true;
      setMedicines(updated);
    }

    try {
      const res = await api.get(
        `/medicines/analyze?name=${encodeURIComponent(medName)}&patientId=${selectedPatientId || 0}&allergies=${encodeURIComponent(allergies.join(","))}`
      );

      setMedicines((prev) => {
        const next = [...prev];
        if (!next[index]) return prev;
        next[index].analyzing = false;
        next[index].activeCompounds = res.activeCompounds || [];
        next[index].hasAllergyConflict = res.hasAllergyConflict || false;
        next[index].allergyAlerts = res.allergyCheck?.alerts || [];
        next[index].genericInfo = res.generic || null;
        
        // Take price from Indian Medicine Dataset if not manually overridden
        if (res.pricing?.price && (!next[index].price || next[index].price <= 0 || next[index].price === 100)) {
          next[index].price = res.pricing.price;
          next[index].manufacturer = res.pricing.manufacturer || "";
          next[index].packSize = res.pricing.packSize || "";
        }
        return next;
      });
    } catch (err) {
      console.error(err);
      setMedicines((prev) => {
        const next = [...prev];
        if (next[index]) next[index].analyzing = false;
        return next;
      });
    }
  };

  // Apply Generic Alternative button handler
  const applyGenericMedicine = (index) => {
    const med = medicines[index];
    if (!med || !med.genericInfo?.genericName) return;

    const updated = [...medicines];
    const genName = med.genericInfo.genericName;
    const genPrice = med.genericInfo.price || Math.round(med.price * 0.45);

    updated[index].name = genName;
    updated[index].price = genPrice;
    updated[index].manufacturer = med.genericInfo.manufacturer || "Generic Formulation";
    updated[index].packSize = med.genericInfo.packSize || "Standard Pack";
    updated[index].genericInfo = null; // Cleared since now using generic
    setMedicines(updated);

    // Re-verify generic medicine
    triggerAnalyze(index, genName, patientData?.allergies || []);
  };

  // Add Generic Medicine as a new row
  const addGenericAsNewRow = (index) => {
    const med = medicines[index];
    if (!med || !med.genericInfo?.genericName) return;

    const genName = med.genericInfo.genericName;
    const genPrice = med.genericInfo.price || Math.round(med.price * 0.45);

    const newRow = {
      id: Date.now() + Math.random(),
      name: genName,
      dosage: med.dosage || "500mg",
      frequency: med.frequency || "1-0-1 (After meals)",
      duration: med.duration || "5 days",
      route: med.route || "Oral",
      price: genPrice,
      manufacturer: med.genericInfo.manufacturer || "Generic Formulation",
      packSize: med.genericInfo.packSize || "Standard Pack",
      activeCompounds: med.activeCompounds || [],
      hasAllergyConflict: false,
      allergyAlerts: [],
      genericInfo: null,
      analyzing: false,
      searchSuggestions: [],
      showSuggestions: false
    };

    setMedicines([...medicines, newRow]);
    const newIdx = medicines.length;
    triggerAnalyze(newIdx, genName, patientData?.allergies || []);
  };

  // Total Amount Calculation from Indian Medicine Dataset
  const totalAmount = medicines.reduce((sum, m) => {
    const p = parseFloat(m.price) || 0;
    return sum + (m.name.trim() ? p : 0);
  }, 0);

  // Check if any medicine has active allergy conflict
  const hasAnyAllergyConflict = medicines.some((m) => m.hasAllergyConflict);

  // Handle Save
  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setErrorMsg("Please select a patient.");
      return;
    }
    const validMeds = medicines.filter((m) => m.name && m.name.trim());
    if (validMeds.length === 0) {
      setErrorMsg("Please prescribe at least one medicine.");
      return;
    }
    if (!diagnosis.trim()) {
      setErrorMsg("Please enter a diagnosis.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const payload = {
        patientId: selectedPatientId,
        doctorId: doctor?.id,
        diagnosis,
        severity,
        medicines: validMeds.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          route: m.route,
          price: m.price,
          packSize: m.packSize,
          manufacturer: m.manufacturer,
          activeCompounds: m.activeCompounds,
          hasAllergyConflict: m.hasAllergyConflict
        })),
        labTests: selectedTests.map((t) => t.name),
        selectedLabId: selectedTests.length > 0 ? (selectedLabId || currentLab?.id) : null,
        selectedLabName: selectedTests.length > 0 ? (currentLab?.labName || "Diagnostic Center") : "",
        labOrderDetails: selectedTests,
        labTotalCost: totalLabAmount,
        followupDate: followupDate || null,
        vitals: { bp, sugar, heartRate, weight },
        patientAge: patientData ? calculateAge(patientData.dateOfBirth) : "28",
        bloodGroup: patientData?.bloodGroup || "O+",
        advice,
        notes: advice,
        appointmentId
      };

      const res = await api.post("/prescriptions", payload);

      if (appointmentId) {
        await api.patch(`/appointments/${appointmentId}`, { status: "completed" }).catch(console.error);
      }

      if (onPrescriptionCreated) {
        onPrescriptionCreated(res);
      }

      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to create prescription");
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return "";
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return "";
    const age = new Date(Date.now() - birth.getTime()).getUTCFullYear() - 1970;
    return age > 0 ? String(age) : "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Real-time Hospital & Doctor Prescription Pad Header */}
        <div className="bg-white border-b border-gray-200 relative">
          {/* Top Medical Accent Stripe */}
          <div className="h-1.5 bg-gradient-to-r from-teal-800 via-[#0d6e7e] to-teal-600" />
          
          <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Hospital & Doctor Details */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-[#0d6e7e] flex items-center justify-center shrink-0 shadow-xs">
                <Building2 size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight uppercase">
                    {docDetails?.hospital || "MediCore Super Specialty Hospital"}
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-teal-50 text-[#0d6e7e] border border-teal-200 rounded-full">
                    OPD Prescription Slip
                  </span>
                </div>
                
                {/* Hospital Address & Contact Details */}
                <div className="text-xs text-gray-500 flex items-center gap-x-3 gap-y-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-[#0d6e7e] shrink-0" />
                    {docDetails?.hospitalAddress || "123 Healthcare Way, Medical District, Metro City 560001"}
                  </span>
                  {(docDetails?.hospitalPhone || docDetails?.phone) && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-[#0d6e7e] shrink-0" />
                      {docDetails?.hospitalPhone || docDetails?.phone}
                    </span>
                  )}
                  {(docDetails?.hospitalEmail || docDetails?.email) && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} className="text-[#0d6e7e] shrink-0" />
                      {docDetails?.hospitalEmail || docDetails?.email}
                    </span>
                  )}
                </div>

                {/* Doctor Details */}
                <div className="pt-1 flex items-center gap-2 flex-wrap text-xs text-gray-700">
                  <span className="font-bold text-gray-900 flex items-center gap-1">
                    <Stethoscope size={13} className="text-[#0d6e7e]" />
                    {docDetails?.fullName?.startsWith("Dr.") ? docDetails.fullName : `Dr. ${docDetails?.fullName || "Consulting Physician"}`}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-600 font-medium">
                    {docDetails?.degree || "MBBS, MD"} ({docDetails?.specialty || "General Medicine"})
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-[11px] font-semibold text-gray-500 font-mono">
                    Reg No: {docDetails?.registrationNumber || "MCI-48291"}
                  </span>
                </div>
              </div>
            </div>

            {/* Date, Prescription Reference & Close Button */}
            <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2.5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Date</span>
                  <span className="text-xs font-bold text-gray-800">
                    {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Rx Reference</span>
                <span className="text-xs font-mono font-bold text-[#0d6e7e] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  RX-{new Date().getFullYear()}-{appointmentId ? String(appointmentId).padStart(4, "0") : String(selectedPatientId || 101).padStart(4, "0")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
              <AlertTriangle size={18} className="shrink-0" />
              <p className="font-semibold">{errorMsg}</p>
            </div>
          )}

          {/* Patient Information & Demographics (Real-time clinical card) */}
          <div className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-100/70 text-[#0d6e7e] flex items-center justify-center">
                  <User size={15} />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-gray-700">
                  Patient Demographics & Clinical Records
                </span>
              </div>

              {/* Patient Selection Dropdown & Add Allergy option */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-600 shrink-0">Select Patient:</label>
                  <select
                    value={selectedPatientId}
                    onChange={handlePatientSelect}
                    required
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#0d6e7e] outline-none"
                  >
                    <option value={0}>Choose registered patient...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} (ID #{p.id})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPatientId > 0 && (
                  showAddAllergy ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Allergy (e.g. Penicillin)"
                        value={newAllergyInput}
                        onChange={(e) => setNewAllergyInput(e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#0d6e7e] outline-none w-36"
                      />
                      <button
                        type="button"
                        onClick={addAllergyToPatient}
                        className="px-2 py-1 bg-[#0d6e7e] text-white rounded-lg text-xs font-bold hover:bg-[#0a5566]"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddAllergy(false)}
                        className="px-1.5 py-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddAllergy(true)}
                      className="text-xs text-[#0d6e7e] hover:underline font-bold"
                    >
                      + Add Allergy
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Demographics Columns: Name, Age, Gender, Blood Group, Severity */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Patient Name</span>
                <p className="font-bold text-gray-900 text-sm truncate mt-0.5">
                  {patientData?.fullName || (selectedPatientId ? `Patient #${selectedPatientId}` : "—")}
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Age</span>
                <p className="font-bold text-gray-900 text-sm mt-0.5">
                  {calculateAge(patientData?.dateOfBirth) ? `${calculateAge(patientData.dateOfBirth)} Yrs` : (patientData?.age ? `${patientData.age} Yrs` : "—")}
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Gender</span>
                <p className="font-bold text-gray-900 text-sm mt-0.5 capitalize">
                  {patientData?.gender || "—"}
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Blood Group</span>
                <p className="font-bold text-[#0d6e7e] text-sm mt-0.5">
                  {patientData?.bloodGroup || "—"}
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Severity Priority</span>
                <div className="flex gap-1 mt-1">
                  {["Low", "Medium", "High"].map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setSeverity(lvl)}
                      className={`flex-1 py-0.5 text-[10px] font-bold rounded transition-colors ${
                        severity === lvl
                          ? lvl === "High"
                            ? "bg-red-600 text-white"
                            : lvl === "Medium"
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Follow-up & Vitals Grid (Shifted below Patient Demographics & Clinical Records) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Blood Pressure
              </label>
              <input
                type="text"
                placeholder="120/80 mmHg"
                value={bp}
                onChange={(e) => setBp(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#0d6e7e] outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Blood Sugar
              </label>
              <input
                type="text"
                placeholder="100 mg/dL"
                value={sugar}
                onChange={(e) => setSugar(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#0d6e7e] outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Heart Rate
              </label>
              <input
                type="text"
                placeholder="72 bpm"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#0d6e7e] outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Follow-up Date
              </label>
              <input
                type="date"
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#0d6e7e] outline-none"
              />
            </div>
          </div>

          {/* Diagnosis Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Clinical Diagnosis *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acute Bacterial Sinusitis, Type 2 Diabetes, Upper RTI"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Lab Tests Required (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Complete Blood Count (CBC), Serum Creatinine, Liver Function Test"
                value={labTests}
                onChange={(e) => setLabTests(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Medicines Prescription Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-serif font-black italic text-[#0d6e7e] leading-none select-none">
                  ℞
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 text-base leading-tight">Prescribed Medications</h3>
                  <p className="text-[11px] text-gray-400">Dosage, frequency, duration & active compounds</p>
                </div>
                <span className="text-xs bg-teal-50 text-[#0d6e7e] border border-teal-200 font-bold px-2 py-0.5 rounded-full ml-1">
                  {medicines.length} Item(s)
                </span>
              </div>
              <button
                type="button"
                onClick={addMedicineRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0d6e7e] text-white rounded-xl text-xs font-bold hover:bg-[#0a5566] transition-all shadow-sm"
              >
                <Plus size={14} /> Add Medicine
              </button>
            </div>

            {/* Individual Medicine Cards */}
            <div className="space-y-4">
              {medicines.map((med, idx) => {
                // If allergy conflict: RED THE BLOCK
                const isConflict = med.hasAllergyConflict;

                return (
                  <div
                    key={med.id || idx}
                    className={`rounded-2xl p-5 transition-all duration-200 border-2 ${
                      isConflict
                        ? "bg-red-50/90 border-red-500 shadow-md ring-2 ring-red-200/60"
                        : med.activeCompounds?.length > 0
                        ? "bg-white border-teal-200 hover:border-teal-400 shadow-sm"
                        : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
                    }`}
                  >
                    {/* Allergy Alert Header if Conflict Detected */}
                    {isConflict && (
                      <div className="mb-4 p-3 bg-red-600 text-white rounded-xl flex items-start gap-3 shadow-md animate-pulse">
                        <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-300" />
                        <div className="flex-1 text-xs">
                          <p className="font-black text-sm uppercase tracking-wide">
                            🚨 CRITICAL ALLERGY CONFLICT DETECTED!
                          </p>
                          {med.allergyAlerts?.map((alert, aIdx) => (
                            <p key={aIdx} className="mt-1 font-medium text-red-100">
                              • <span className="font-bold underline text-white">{alert.conflictingCompound}</span>:{" "}
                              {alert.reason}
                            </p>
                          ))}
                          <p className="mt-1 font-bold text-amber-200">
                            Action required: Change medication or proceed with extreme clinical caution.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Inputs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                      {/* Medicine Name with Autocomplete */}
                      <div className="sm:col-span-4 relative">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Medicine / Brand Name *
                          </label>

                          {/* Small Generic Pop-up Trigger Directly Over Prescribed Medicine */}
                          {!isConflict && med.genericInfo?.available && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenGenericPopupIndex(openGenericPopupIndex === idx ? null : idx);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                                title="Generic medicine alternative available"
                              >
                                <Sparkles size={11} className="text-emerald-600 shrink-0" />
                                <span>Generic: ₹{med.genericInfo.price}</span>
                                {med.price > med.genericInfo.price && (
                                  <span className="bg-emerald-200/80 text-emerald-900 px-1 rounded font-black">
                                    -₹{(med.price - med.genericInfo.price).toFixed(0)}
                                  </span>
                                )}
                                <ChevronDown size={11} className={`transition-transform duration-150 ${openGenericPopupIndex === idx ? "rotate-180" : ""}`} />
                              </button>

                              {/* Small Popover Floating Over The Prescribed Medicine */}
                              {openGenericPopupIndex === idx && (
                                <div
                                  className="absolute right-0 top-full mt-1.5 z-40 bg-white border border-emerald-300 shadow-2xl rounded-2xl p-3.5 w-72 text-left animate-in fade-in zoom-in-95 duration-150 ring-4 ring-emerald-500/10"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-gray-100">
                                    <div className="flex items-center gap-1.5">
                                      <Sparkles size={13} className="text-emerald-600" />
                                      <span className="text-xs font-bold text-gray-900">Generic Alternative Available</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setOpenGenericPopupIndex(null)}
                                      className="text-gray-400 hover:text-gray-600 p-0.5 rounded-md hover:bg-gray-100"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>

                                  <p className="text-xs font-bold text-gray-900 line-clamp-2">
                                    {med.genericInfo.genericName}
                                  </p>

                                  <div className="mt-1 mb-2.5 text-[11px] text-emerald-700 flex items-center justify-between">
                                    <span>Generic Price: <strong className="text-gray-900 font-black">₹{med.genericInfo.price}</strong></span>
                                    {med.price > med.genericInfo.price && (
                                      <span className="font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">
                                        Saves ₹{(med.price - med.genericInfo.price).toFixed(2)}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        applyGenericMedicine(idx);
                                        setOpenGenericPopupIndex(null);
                                      }}
                                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1"
                                    >
                                      <RefreshCw size={11} /> Switch to Generic
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        addGenericAsNewRow(idx);
                                        setOpenGenericPopupIndex(null);
                                      }}
                                      className="px-2.5 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-lg text-xs font-bold transition-all"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="Type drug name (e.g. Augmentin, Crocin)"
                            value={med.name}
                            onChange={(e) => handleNameInput(idx, e.target.value)}
                            onBlur={() => {
                              // delay closing suggestion to allow clicks
                              setTimeout(() => {
                                const next = [...medicines];
                                if (next[idx]) {
                                  next[idx].showSuggestions = false;
                                  setMedicines(next);
                                }
                              }, 250);
                              if (med.name.trim().length >= 2) {
                                triggerAnalyze(idx, med.name);
                              }
                            }}
                            className={`w-full px-3 py-2 border rounded-xl text-sm font-semibold outline-none transition-all ${
                              isConflict
                                ? "border-red-400 bg-red-50 text-red-900 focus:ring-2 focus:ring-red-500"
                                : "border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-teal-500"
                            }`}
                          />
                          {med.analyzing && (
                            <div className="absolute right-3 top-2.5">
                              <RefreshCw size={14} className="animate-spin text-[#0d6e7e]" />
                            </div>
                          )}
                        </div>

                        {/* Autocomplete Dropdown from Formulary */}
                        {med.showSuggestions && med.searchSuggestions?.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-gray-100">
                            <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              Hospital Formulary & Available Medicines
                            </div>
                            {med.searchSuggestions.map((sug) => (
                              <button
                                key={sug.id}
                                type="button"
                                onMouseDown={() => selectSuggestion(idx, sug)}
                                className="w-full text-left p-2.5 hover:bg-teal-50 transition-colors flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-900 truncate">{sug.name}</p>
                                  <p className="text-[10px] text-gray-500 truncate">
                                    {sug.short_composition1} · {sug.manufacturer_name}
                                  </p>
                                </div>
                                <span className="font-bold text-teal-800 text-xs shrink-0 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100">
                                  ₹{sug.price}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Dosage */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Dosage
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 500mg"
                          value={med.dosage}
                          onChange={(e) => updateMedField(idx, "dosage", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>

                      {/* Frequency */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Frequency
                        </label>
                        <select
                          value={med.frequency}
                          onChange={(e) => updateMedField(idx, "frequency", e.target.value)}
                          className="w-full px-2 py-2 border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                          <option value="1-0-1 (After meals)">1-0-1 (After meals)</option>
                          <option value="1-0-0 (Morning)">1-0-0 (Morning)</option>
                          <option value="0-0-1 (Night)">0-0-1 (Night)</option>
                          <option value="1-1-1 (Thrice daily)">1-1-1 (Thrice daily)</option>
                          <option value="Once daily">Once daily</option>
                          <option value="As needed (SOS)">As needed (SOS)</option>
                        </select>
                      </div>

                      {/* Duration */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Duration
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 5 days"
                          value={med.duration}
                          onChange={(e) => updateMedField(idx, "duration", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>

                      {/* Price */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Price (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-sm text-gray-400 font-bold">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            value={med.price || ""}
                            onChange={(e) => updateMedField(idx, "price", parseFloat(e.target.value) || 0)}
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-teal-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Active Compounds & Generic Medicine Bar */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      
                      {/* Active Compounds list */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-gray-600 flex items-center gap-1">
                          <Activity size={13} className="text-[#0d6e7e]" /> Active Compound(s):
                        </span>
                        {med.activeCompounds?.length > 0 ? (
                          med.activeCompounds.map((comp, cIdx) => (
                            <span
                              key={cIdx}
                              className={`px-2 py-0.5 rounded-md font-semibold text-[11px] border ${
                                isConflict
                                  ? "bg-red-100 text-red-800 border-red-200"
                                  : "bg-teal-50 text-teal-800 border-teal-200"
                              }`}
                            >
                              {comp}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic">
                            {med.name ? "Verifying active compounds..." : "Enter medicine formulation"}
                          </span>
                        )}

                        {/* Safety Status Pill */}
                        {!med.analyzing && med.name && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              isConflict
                                ? "bg-red-600 text-white"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {isConflict ? (
                              <>
                                <X size={10} /> Allergy Detected
                              </>
                            ) : (
                              <>
                                <CheckCircle size={10} /> Allergy Safe
                              </>
                            )}
                          </span>
                        )}
                      </div>

                      {/* Delete Medicine Button */}
                      <div className="flex items-center gap-3 self-end md:self-auto">
                        {med.manufacturer && (
                          <span className="text-[10px] text-gray-400 truncate max-w-xs">
                            {med.packSize ? `${med.packSize} • ` : ""}{med.manufacturer}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedicineRow(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Remove medicine"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>


                  </div>
                );
              })}
            </div>
          </div>

          {/* Diagnostic Lab Investigations & Rate Card Section */}
          <div className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-200 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
                  <FlaskConical size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    Diagnostic Lab Investigations & Tests
                    {selectedTests.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 lowercase">
                        {selectedTests.length} ordered • ₹{totalLabAmount.toFixed(2)}
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Select city laboratory to view their active test menu card and real-time rates
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLabSection(!showLabSection)}
                className="self-start sm:self-auto px-3 py-1.5 bg-white border border-gray-300 hover:border-purple-400 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Plus size={13} className={showLabSection ? "rotate-45 transition-transform" : "transition-transform"} />
                <span>{showLabSection ? "Close Lab Menu" : selectedTests.length > 0 ? "Edit Lab Tests" : "+ Order Diagnostic Tests"}</span>
              </button>
            </div>

            {/* Selected Tests Chips Bar (Always visible if tests are chosen) */}
            {selectedTests.length > 0 && (
              <div className="bg-white rounded-xl p-3 border border-purple-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600 inline-block animate-pulse"></span>
                    Assigned Diagnostic Center: <span className="text-purple-800 font-extrabold">{currentLab?.labName || "City Diagnostics"}</span>
                  </span>
                  <span className="text-xs font-black text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                    Total Lab Fee: ₹{totalLabAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedTests.map((t, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-900 border border-purple-200 shadow-xs"
                    >
                      <span>{t.name}</span>
                      <span className="font-bold text-purple-700 text-[11px]">₹{t.price}</span>
                      <button
                        type="button"
                        onClick={() => toggleTestSelection(t)}
                        className="hover:text-red-600 text-purple-400 p-0.5 transition-colors cursor-pointer"
                        title="Remove test"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Expandable Lab & Menu Card Browser */}
            {(showLabSection || selectedTests.length > 0) && (
              <div className="space-y-3 pt-1 border-t border-slate-200">
                {/* Lab Chooser */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-6">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Choose Laboratory in City:
                    </label>
                    <div className="relative">
                      <select
                        value={selectedLabId || ""}
                        onChange={(e) => {
                          const newId = Number(e.target.value);
                          setSelectedLabId(newId);
                        }}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#0d6e7e] cursor-pointer"
                      >
                        {labs.map((lab) => (
                          <option key={lab.id} value={lab.id}>
                            {lab.labName} • {lab.location || "City Hub"} ({lab.services?.length || 0} Tests)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Selected Lab Details Strip */}
                  <div className="md:col-span-6 bg-white p-2.5 rounded-xl border border-gray-200 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-800">{currentLab?.labName || "Laboratory"}</p>
                      <p className="text-[10px] text-gray-500">{currentLab?.location || "Metro City"} • {currentLab?.operatingHours || "07:00 AM - 09:00 PM"}</p>
                    </div>
                    <span className="px-2 py-1 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ⭐ {currentLab?.rating || 4.8} / 5.0
                    </span>
                  </div>
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {[
                    "All",
                    "Imaging & Radiology",
                    "Pathology & Blood",
                    "Biochemistry",
                    "Microbiology & Serology"
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedLabCategory(cat)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedLabCategory === cat
                          ? "bg-[#0d6e7e] text-white shadow-xs"
                          : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {cat} {cat === "All" ? `(${currentLabServices.length})` : ""}
                    </button>
                  ))}
                </div>

                {/* Test Menu Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {filteredLabServices.map((service) => {
                    const isSelected = selectedTests.some(
                      (t) => t.name.toLowerCase() === service.name.toLowerCase()
                    );
                    return (
                      <div
                        key={service.id}
                        onClick={() => toggleTestSelection(service)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                          isSelected
                            ? "bg-purple-50/70 border-purple-400 ring-2 ring-purple-300/40"
                            : "bg-white border-gray-200 hover:border-teal-300 hover:shadow-xs"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="font-bold text-xs text-gray-900 leading-tight">
                            {service.name}
                          </p>
                          <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${isSelected ? "bg-purple-600 text-white" : "border border-gray-300 bg-gray-50"}`}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-gray-500">
                            <span className="truncate max-w-[120px]">{service.sample || "Specimen"}</span>
                            <span>{service.turnaround || "Fast Report"}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                            <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                              {service.category?.split("&")[0]?.trim() || "Diagnostic"}
                            </span>
                            <span className="text-xs font-black text-purple-700">
                              ₹{service.price}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredLabServices.length === 0 && (
                    <div className="col-span-full py-6 text-center text-xs text-gray-400 italic bg-white rounded-xl border border-dashed border-gray-200">
                      No tests found in category "{selectedLabCategory}" for {currentLab?.labName}.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Doctor's Advice & Clinical Instructions */}
          <div className="bg-slate-50/70 rounded-2xl p-4.5 border border-slate-200">
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText size={14} className="text-[#0d6e7e]" /> Doctor's Advice & Dietary Guidelines
            </label>
            <textarea
              rows={2}
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              placeholder="e.g. Drink plenty of warm fluids, avoid oily foods, complete full antibiotic course as prescribed, take medicines after meals."
              className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#0d6e7e] outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Clinical Patient Caution & Doctor's Signature / Seal block */}
          <div className="pt-3 pb-1 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-t border-dashed border-gray-300">
            <div className="text-xs text-gray-500 space-y-1">
              <p className="font-bold text-gray-700">Patient Cautionary Notice:</p>
              <p className="text-[11px] text-gray-500 leading-relaxed max-w-md">
                Please follow exact dosage and duration. In case of unexpected adverse drug reactions, rash, or hypersensitivity, discontinue use immediately and consult the physician or emergency department.
              </p>
            </div>

            {/* Doctor Signature & Stamp Area */}
            <div className="text-right sm:min-w-64 shrink-0">
              <div className="inline-block text-center border-t border-gray-400 pt-2 px-6">
                <p className="font-serif italic font-bold text-gray-900 text-sm">
                  {docDetails?.fullName?.startsWith("Dr.") ? docDetails.fullName : `Dr. ${docDetails?.fullName || "Consulting Physician"}`}
                </p>
                <p className="text-[11px] text-gray-600 font-semibold">
                  {docDetails?.degree || "MBBS, MD"} • {docDetails?.specialty || "General Medicine"}
                </p>
                <p className="text-[10px] text-gray-400 font-mono">
                  Reg No: {docDetails?.registrationNumber || "MCI-48291"}
                </p>
                <span className="inline-block mt-1 text-[9px] uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-bold">
                  Authorized Medical Signature
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {hasAnyAllergyConflict && (
              <span className="text-xs font-bold text-amber-700 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <AlertTriangle size={14} className="text-amber-600" /> Caution: Allergy Active
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !selectedPatientId}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                hasAnyAllergyConflict
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-[#0d6e7e] hover:bg-[#0a5566] text-white"
              } disabled:opacity-50`}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Saving Prescription...
                </>
              ) : (
                <>
                  <span>Sign & Issue Prescription</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
