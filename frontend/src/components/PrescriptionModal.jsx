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
  TrendingDown
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
        labTests: labTests ? labTests.split(",").map((t) => t.trim()).filter(Boolean) : [],
        followupDate: followupDate || null,
        vitals: { bp, sugar, heartRate, weight },
        patientAge: patientData ? calculateAge(patientData.dateOfBirth) : "28",
        bloodGroup: patientData?.bloodGroup || "O+",
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
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-800 via-[#0d6e7e] to-teal-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              <Pill size={22} className="text-teal-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Doctor Prescription Console</h2>
              <p className="text-xs text-teal-100 font-medium">
                AI Active Compounds & Allergy Safety · HealthPilot.ai & Indian Medicine Dataset Live Pricing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
              <AlertTriangle size={18} className="shrink-0" />
              <p className="font-semibold">{errorMsg}</p>
            </div>
          )}

          {/* Patient Selection & Allergy Summary Bar */}
          <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/80 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User size={13} className="text-[#0d6e7e]" /> Patient Name *
                </label>
                <select
                  value={selectedPatientId}
                  onChange={handlePatientSelect}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                >
                  <option value={0}>Select patient from registry...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} (ID #{p.id}) {p.allergies?.length ? `— [${p.allergies.length} Allergies]` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Age & Blood Group
                </label>
                <div className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700">
                  {patientData
                    ? `${calculateAge(patientData.dateOfBirth) || "—"} yrs · Blood: ${patientData.bloodGroup || "N/A"}`
                    : "Select patient to view vitals"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Severity Level
                </label>
                <div className="flex gap-2">
                  {["Low", "Medium", "High"].map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setSeverity(lvl)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        severity === lvl
                          ? lvl === "High"
                            ? "bg-red-600 text-white border-red-600 shadow-sm"
                            : lvl === "Medium"
                            ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                            : "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Patient Allergies Banner */}
            <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-red-500" /> Pre-given Patient Allergies:
                </span>
                {patientData?.allergies?.length > 0 ? (
                  patientData.allergies.map((a, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-red-100 text-red-800 border border-red-200 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1"
                    >
                      ⚠️ {a}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic font-medium">
                    No documented drug allergies on record.
                  </span>
                )}
              </div>

              {selectedPatientId > 0 && (
                <div className="flex items-center gap-2">
                  {showAddAllergy ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. Penicillin, Aspirin"
                        value={newAllergyInput}
                        onChange={(e) => setNewAllergyInput(e.target.value)}
                        className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-teal-500 outline-none w-44"
                      />
                      <button
                        type="button"
                        onClick={addAllergyToPatient}
                        className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddAllergy(false)}
                        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddAllergy(true)}
                      className="text-xs text-red-600 hover:text-red-700 font-bold underline flex items-center gap-1"
                    >
                      + Add Known Allergy
                    </button>
                  )}
                </div>
              )}
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
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-[#0d6e7e]">
                  <Pill size={16} />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Prescribed Medicines</h3>
                <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
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
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Medicine / Brand Name *
                        </label>
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

                        {/* Autocomplete Dropdown from Indian Medicine Dataset */}
                        {med.showSuggestions && med.searchSuggestions?.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-gray-100">
                            <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              Indian Medicine Dataset (250,000+ Meds)
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

                      {/* Price from Indian Dataset */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Dataset Price
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
                            {med.name ? "Querying HealthPilot.ai..." : "Enter medicine to query active compounds"}
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

                    {/* Generic Medicine Available Section: shown if NO allergy conflict and generic is present */}
                    {!isConflict && med.genericInfo?.available && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Sparkles size={14} className="text-emerald-600" />
                            <span className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                              Generic Alternative Available:
                            </span>
                            <span className="text-xs font-bold text-gray-900">
                              {med.genericInfo.genericName}
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-700 flex items-center gap-1.5">
                            <TrendingDown size={13} />
                            Generic Price: <span className="font-black text-gray-900">₹{med.genericInfo.price}</span>{" "}
                            {med.price > med.genericInfo.price && (
                              <span className="text-emerald-800 font-bold bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                (Patient saves ₹{(med.price - med.genericInfo.price).toFixed(2)})
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => applyGenericMedicine(idx)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                          >
                            <RefreshCw size={12} /> Switch to Generic
                          </button>
                          <button
                            type="button"
                            onClick={() => addGenericAsNewRow(idx)}
                            className="px-2.5 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-lg text-xs font-bold transition-all"
                          >
                            + Add Generic
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Follow-up & Vitals Grid */}
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
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
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
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
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
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
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
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Pricing & Total Amount Card at Last */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-teal-950 text-white rounded-2xl p-5 shadow-lg border border-teal-900/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Receipt size={18} className="text-teal-400" />
                  <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                    Prescription Invoice Preview
                  </span>
                </div>
                <p className="text-xs text-gray-300">
                  Item prices retrieved live from Indian Medicine Dataset (253,973 verified medicines)
                </p>
                <div className="flex items-center gap-3 pt-1 text-xs text-gray-400">
                  <span>{medicines.filter((m) => m.name.trim()).length} Medicines prescribed</span>
                  <span>•</span>
                  <span>Auto-synced to Patient Healthcare Expenses</span>
                </div>
              </div>

              {/* Total Amount Display */}
              <div className="text-right sm:border-l sm:border-gray-700 sm:pl-6">
                <p className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">
                  Total Prescription Amount
                </p>
                <p className="text-3xl font-black text-white tracking-tight mt-0.5">
                  ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {hasAnyAllergyConflict && (
                  <span className="inline-block mt-1 text-[10px] font-bold bg-red-500/30 text-red-300 px-2 py-0.5 rounded-full border border-red-500/40">
                    ⚠️ Allergy Conflict Detected
                  </span>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {hasAnyAllergyConflict && (
              <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                <AlertTriangle size={14} /> Allergy Warning Active
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !selectedPatientId}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 ${
                hasAnyAllergyConflict
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/20"
                  : "bg-[#0d6e7e] hover:bg-[#0a5566] text-white shadow-teal-900/20"
              } disabled:opacity-50`}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Saving Prescription...
                </>
              ) : (
                <>
                  <span>Issue Prescription (Total: ₹{totalAmount.toFixed(2)})</span>
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
