import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  Stethoscope,
  Activity,
  HeartPulse,
  Pill,
  Droplet,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  ShieldCheck,
  Users
} from "lucide-react";
import { api } from "@/lib/api";

const COMMON_SURGERIES = [
  "Appendectomy",
  "Cholecystectomy (Gallbladder)",
  "C-Section",
  "Knee Arthroscopy",
  "Hernia Repair",
  "Cataract Surgery",
  "Tonsillectomy",
  "CABG (Bypass Surgery)"
];

const COMMON_CONDITIONS = [
  "Hypertension (High BP)",
  "Type 2 Diabetes",
  "Asthma",
  "Thyroid Disorder",
  "High Cholesterol",
  "Arthritis",
  "Migraine",
  "Heart Disease"
];

export default function PatientProfileModal({ isOpen, onClose, patientId, initialData, onUpdated }) {
  const [activeTab, setActiveTab] = useState("basic"); // basic | medical | bloodGroupNetwork
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Basic contact and doctor info
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [primaryDoctorName, setPrimaryDoctorName] = useState("");
  const [primaryDoctorContact, setPrimaryDoctorContact] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");

  // Medical history
  const [majorSurgeries, setMajorSurgeries] = useState([]);
  const [surgeryInput, setSurgeryInput] = useState("");

  const [existingConditions, setExistingConditions] = useState([]);
  const [conditionInput, setConditionInput] = useState("");

  const [currentMedicines, setCurrentMedicines] = useState([]);
  const [medicineInput, setMedicineInput] = useState("");

  const [allergies, setAllergies] = useState([]);
  const [allergyInput, setAllergyInput] = useState("");

  // Two contacts of same blood group
  const [contact1, setContact1] = useState({
    name: "",
    phone: "",
    address: "",
    relationship: ""
  });

  const [contact2, setContact2] = useState({
    name: "",
    phone: "",
    address: "",
    relationship: ""
  });

  // Populate from initial data or fetch
  useEffect(() => {
    if (!isOpen) return;

    const populate = (data) => {
      if (!data) return;
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setPrimaryDoctorName(data.primaryDoctorName || "");
      setPrimaryDoctorContact(data.primaryDoctorContact || "");
      setBloodGroup(data.bloodGroup || "O+");
      setDateOfBirth(data.dateOfBirth || "");
      setGender(data.gender || "Male");

      setMajorSurgeries(Array.isArray(data.majorSurgeries) ? data.majorSurgeries : []);
      setExistingConditions(Array.isArray(data.existingConditions) ? data.existingConditions : []);
      setCurrentMedicines(Array.isArray(data.currentMedicines) ? data.currentMedicines : []);
      setAllergies(Array.isArray(data.allergies) ? data.allergies : []);

      const bloodContacts = Array.isArray(data.sameBloodGroupContacts) ? data.sameBloodGroupContacts : [];
      setContact1({
        name: bloodContacts[0]?.name || "",
        phone: bloodContacts[0]?.phone || "",
        address: bloodContacts[0]?.address || "",
        relationship: bloodContacts[0]?.relationship || ""
      });
      setContact2({
        name: bloodContacts[1]?.name || "",
        phone: bloodContacts[1]?.phone || "",
        address: bloodContacts[1]?.address || "",
        relationship: bloodContacts[1]?.relationship || ""
      });
    };

    if (initialData) {
      populate(initialData);
    } else if (patientId) {
      api.get(`/patients/${patientId}`)
        .then((res) => populate(res))
        .catch(console.error);
    }
  }, [isOpen, initialData, patientId]);

  if (!isOpen) return null;

  // Tag helper adders
  const addSurgery = (name) => {
    const val = (name || surgeryInput).trim();
    if (!val) return;
    if (!majorSurgeries.includes(val)) {
      setMajorSurgeries([...majorSurgeries, val]);
    }
    setSurgeryInput("");
  };

  const removeSurgery = (idx) => {
    setMajorSurgeries(majorSurgeries.filter((_, i) => i !== idx));
  };

  const addCondition = (name) => {
    const val = (name || conditionInput).trim();
    if (!val) return;
    if (!existingConditions.includes(val)) {
      setExistingConditions([...existingConditions, val]);
    }
    setConditionInput("");
  };

  const removeCondition = (idx) => {
    setExistingConditions(existingConditions.filter((_, i) => i !== idx));
  };

  const addMedicine = (name) => {
    const val = (name || medicineInput).trim();
    if (!val) return;
    if (!currentMedicines.includes(val)) {
      setCurrentMedicines([...currentMedicines, val]);
    }
    setMedicineInput("");
  };

  const removeMedicine = (idx) => {
    setCurrentMedicines(currentMedicines.filter((_, i) => i !== idx));
  };

  const addAllergy = () => {
    const val = allergyInput.trim();
    if (!val) return;
    if (!allergies.includes(val)) {
      setAllergies([...allergies, val]);
    }
    setAllergyInput("");
  };

  const removeAllergy = (idx) => {
    setAllergies(allergies.filter((_, i) => i !== idx));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const payload = {
      phone,
      address,
      primaryDoctorName,
      primaryDoctorContact,
      bloodGroup,
      dateOfBirth,
      gender,
      majorSurgeries,
      existingConditions,
      currentMedicines,
      allergies,
      sameBloodGroupContacts: [
        {
          name: contact1.name.trim(),
          phone: contact1.phone.trim(),
          address: contact1.address.trim(),
          relationship: contact1.relationship.trim(),
          bloodGroup: bloodGroup
        },
        {
          name: contact2.name.trim(),
          phone: contact2.phone.trim(),
          address: contact2.address.trim(),
          relationship: contact2.relationship.trim(),
          bloodGroup: bloodGroup
        }
      ]
    };

    try {
      let updated;
      if (patientId) {
        updated = await api.patch(`/patients/${patientId}`, payload);
      } else {
        updated = await api.patch("/profile", payload);
      }

      setSaveSuccess(true);
      if (onUpdated) {
        onUpdated(updated || payload);
      }
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error("Failed to update patient profile:", err);
      setErrorMsg(err.message || "Failed to save profile. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-teal-50/50 via-white to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0d6e7e]/10 text-[#0d6e7e] flex items-center justify-center font-bold">
              <User size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Update Health Profile</h2>
              <p className="text-xs text-gray-500">Contact, primary care, medical history & emergency donor network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 px-6 gap-2 bg-gray-50/50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "basic"
                ? "border-[#0d6e7e] text-[#0d6e7e]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Phone size={14} /> Basic & Primary Care
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("medical")}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "medical"
                ? "border-[#0d6e7e] text-[#0d6e7e]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Activity size={14} /> Medical History & Meds
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bloodGroupNetwork")}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "bloodGroupNetwork"
                ? "border-[#0d6e7e] text-[#0d6e7e] bg-teal-50/40 rounded-t-lg"
                : "border-transparent text-gray-500 hover:text-[#0d6e7e]"
            }`}
          >
            <Droplet size={14} className="text-[#0d6e7e]" />
            <span>Same Blood Group Network (2)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-100 text-[#0d6e7e] font-extrabold">
              {bloodGroup}
            </span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: BASIC & PRIMARY CARE */}
          {activeTab === "basic" && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Phone size={13} className="text-[#0d6e7e]" /> Patient Phone / Contact
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#0d6e7e] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Droplet size={13} className="text-[#0d6e7e]" /> Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#0d6e7e] outline-none transition-all font-semibold text-gray-800"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#0d6e7e]" /> Residential Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Apartment / House No, Street, Landmark, City, Postal Code"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-[#0d6e7e] outline-none transition-all resize-none"
                />
              </div>

              {/* Primary Doctor Contact Section */}
              <div className="bg-teal-50/40 border border-teal-100 rounded-2xl p-4.5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-100/70 text-[#0d6e7e] flex items-center justify-center">
                    <Stethoscope size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-teal-950">Primary / Family Doctor</h3>
                    <p className="text-[11px] text-teal-700">Your regular consulting doctor's contact for critical clinical handovers</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Primary Doctor's Name
                    </label>
                    <input
                      type="text"
                      value={primaryDoctorName}
                      onChange={(e) => setPrimaryDoctorName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Kulkarni"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0d6e7e] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Doctor's Phone / Clinic Contact
                    </label>
                    <input
                      type="text"
                      value={primaryDoctorContact}
                      onChange={(e) => setPrimaryDoctorContact(e.target.value)}
                      placeholder="+91 94220 12345"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0d6e7e] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEDICAL HISTORY, CONDITIONS, MEDS & ALLERGIES */}
          {activeTab === "medical" && (
            <div className="space-y-6 animate-in fade-in-50 duration-150">
              {/* Major Surgeries */}
              <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Activity size={14} className="text-[#0d6e7e]" /> Major Surgeries & Procedures
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">Prior surgical operations & year</span>
                </div>

                {/* Chips */}
                <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                  {majorSurgeries.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-teal-200 text-[#0d6e7e] rounded-xl text-xs font-semibold shadow-xs"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSurgery(idx)}
                        className="hover:text-red-500 p-0.5 rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {majorSurgeries.length === 0 && (
                    <span className="text-xs text-gray-400 italic">No major surgeries recorded</span>
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={surgeryInput}
                    onChange={(e) => setSurgeryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSurgery();
                      }
                    }}
                    placeholder="e.g. Appendectomy (2021) or Gallbladder Surgery"
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0d6e7e] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addSurgery()}
                    className="px-3.5 py-2 bg-[#0d6e7e] text-white rounded-xl text-xs font-bold hover:bg-[#0a5566] transition-all flex items-center gap-1"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>

                {/* Quick suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Quick Add:</span>
                  {COMMON_SURGERIES.map((cs) => (
                    <button
                      key={cs}
                      type="button"
                      onClick={() => addSurgery(cs)}
                      className="text-[11px] px-2 py-0.5 bg-gray-100 hover:bg-teal-50 hover:text-[#0d6e7e] text-gray-600 rounded-md transition-colors"
                    >
                      + {cs}
                    </button>
                  ))}
                </div>
              </div>

              {/* Major Medical Conditions */}
              <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <HeartPulse size={14} className="text-amber-600" /> Major Medical Conditions (Chronic)
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">Ongoing illnesses & disorders</span>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                  {existingConditions.map((c, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold shadow-xs"
                    >
                      {c}
                      <button
                        type="button"
                        onClick={() => removeCondition(idx)}
                        className="hover:text-red-500 p-0.5 rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {existingConditions.length === 0 && (
                    <span className="text-xs text-gray-400 italic">No existing chronic conditions recorded</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={conditionInput}
                    onChange={(e) => setConditionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCondition();
                      }
                    }}
                    placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addCondition()}
                    className="px-3.5 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-all flex items-center gap-1"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Common:</span>
                  {COMMON_CONDITIONS.map((cc) => (
                    <button
                      key={cc}
                      type="button"
                      onClick={() => addCondition(cc)}
                      className="text-[11px] px-2 py-0.5 bg-gray-100 hover:bg-amber-50 hover:text-amber-800 text-gray-600 rounded-md transition-colors"
                    >
                      + {cc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Medicines */}
              <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Pill size={14} className="text-emerald-600" /> Current Medications
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">Daily doses & active prescriptions</span>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                  {currentMedicines.map((m, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold shadow-xs"
                    >
                      {m}
                      <button
                        type="button"
                        onClick={() => removeMedicine(idx)}
                        className="hover:text-red-500 p-0.5 rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {currentMedicines.length === 0 && (
                    <span className="text-xs text-gray-400 italic">No current medicines recorded</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={medicineInput}
                    onChange={(e) => setMedicineInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addMedicine();
                      }
                    }}
                    placeholder="e.g. Metformin 500mg (Daily morning), Amlodipine 5mg"
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addMedicine()}
                    className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>

              {/* Known Drug Allergies */}
              <div className="bg-amber-50/30 border border-amber-200/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-amber-600" /> Known Drug Allergies (Safety Alert)
                  </label>
                  <span className="text-[10px] text-amber-600/70 font-medium">Used in drug interaction checks</span>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                  {allergies.map((a, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-amber-300 text-amber-800 rounded-xl text-xs font-bold shadow-xs uppercase tracking-wider"
                    >
                      {a}
                      <button
                        type="button"
                        onClick={() => removeAllergy(idx)}
                        className="hover:text-amber-950 p-0.5 rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {allergies.length === 0 && (
                    <span className="text-xs text-gray-400 italic">No allergies listed</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addAllergy();
                      }
                    }}
                    placeholder="e.g. Penicillin, Sulfa, Aspirin"
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={addAllergy}
                    className="px-3.5 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-all flex items-center gap-1"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAME BLOOD GROUP EMERGENCY NETWORK (2 CONTACTS) */}
          {activeTab === "bloodGroupNetwork" && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              {/* Highlight Banner */}
              <div className="bg-gradient-to-r from-[#0d6e7e] to-[#0a5566] text-white rounded-2xl p-4 shadow-sm flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0">
                  <Users size={20} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm tracking-wide">
                      Same Blood Group Emergency Network
                    </h3>
                    <span className="px-2.5 py-0.5 bg-white/20 text-white border border-white/30 rounded-full text-[10px] font-black uppercase">
                      Blood Group: {bloodGroup}
                    </span>
                  </div>
                  <p className="text-xs text-teal-100 mt-1 leading-relaxed">
                    Provide details of <strong>two trusted persons who have your exact blood group ({bloodGroup})</strong> for urgent blood requirements or emergency hospital verification.
                  </p>
                </div>
              </div>

              {/* Contact #1 */}
              <div className="border border-gray-200 bg-gray-50/50 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0d6e7e] text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      Emergency Donor Contact #1
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#0d6e7e] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    Matches Blood Group: {bloodGroup}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={contact1.name}
                      onChange={(e) => setContact1({ ...contact1, name: e.target.value })}
                      placeholder="e.g. Ramesh Sharma"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0d6e7e] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Contact / Phone Number *
                    </label>
                    <input
                      type="text"
                      value={contact1.phone}
                      onChange={(e) => setContact1({ ...contact1, phone: e.target.value })}
                      placeholder="+91 98220 11223"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0d6e7e] outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <MapPin size={11} className="text-[#0d6e7e]" /> Residential / Work Address *
                    </label>
                    <input
                      type="text"
                      value={contact1.address}
                      onChange={(e) => setContact1({ ...contact1, address: e.target.value })}
                      placeholder="e.g. Flat 304, Green Heights, Jayanagar, Bengaluru"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0d6e7e] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Relationship
                    </label>
                    <input
                      type="text"
                      value={contact1.relationship}
                      onChange={(e) => setContact1({ ...contact1, relationship: e.target.value })}
                      placeholder="e.g. Brother / Friend"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0d6e7e] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Contact #2 */}
              <div className="border border-gray-200 bg-gray-50/50 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200/80">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0d6e7e] text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      Emergency Donor Contact #2
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#0d6e7e] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    Matches Blood Group: {bloodGroup}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={contact2.name}
                      onChange={(e) => setContact2({ ...contact2, name: e.target.value })}
                      placeholder="e.g. Priya Deshmukh"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0d6e7e] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Contact / Phone Number *
                    </label>
                    <input
                      type="text"
                      value={contact2.phone}
                      onChange={(e) => setContact2({ ...contact2, phone: e.target.value })}
                      placeholder="+91 97654 33221"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0d6e7e] outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <MapPin size={11} className="text-[#0d6e7e]" /> Residential / Work Address *
                    </label>
                    <input
                      type="text"
                      value={contact2.address}
                      onChange={(e) => setContact2({ ...contact2, address: e.target.value })}
                      placeholder="e.g. 12B, Lakeview Enclave, HSR Layout, Bengaluru"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0d6e7e] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Relationship
                    </label>
                    <input
                      type="text"
                      value={contact2.relationship}
                      onChange={(e) => setContact2({ ...contact2, relationship: e.target.value })}
                      placeholder="e.g. Colleague / Cousin"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0d6e7e] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 px-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/70 shrink-0">
          <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[#0d6e7e]" />
            <span>Information encrypted & accessible by emergency care units</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 shadow-sm ${
                saveSuccess
                  ? "bg-emerald-600"
                  : "bg-[#0d6e7e] hover:bg-[#0a5566]"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 size={15} />
                  Saved!
                </>
              ) : (
                <>
                  <Save size={15} />
                  Save Health Profile
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
