import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  Calendar,
  Plus,
  Search,
  X,
  User,
  Stethoscope,
  Building2,
  Eye,
  Image as ImageIcon,
  MapPin,
  Star,
  Filter,
  ArrowUpDown,
  SlidersHorizontal,
  RefreshCw,
  Check,
  Sparkles,
  Navigation,
  Clock,
  ShieldCheck,
  Tag
} from "lucide-react";
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

  // Advanced Doctor Search & Filters
  const [treatmentFilter, setTreatmentFilter] = useState("all");
  const [maxDistance, setMaxDistance] = useState("all"); // "all", "3", "5", "10", "25"
  const [priceRange, setPriceRange] = useState("all"); // "all", "under-200", "200-500", "500-1000", "above-1000"
  const [minRating, setMinRating] = useState("all"); // "all", "4.5", "4.0", "3.5"
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState("recommended"); // "recommended", "price-low", "price-high", "rating-high", "distance-near", "experience-high"
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

  const getDoctorDistance = (doc) => {
    if (doc.distance !== undefined && doc.distance !== null) return Number(doc.distance);
    return Number((((doc.id * 7) % 22) * 0.5 + 1.4).toFixed(1));
  };

  const treatmentOptions = [
    { label: "All Treatments", value: "all" },
    ...Array.from(
      new Set(
        doctors
          .map((d) => d.specialty?.trim())
          .filter(Boolean)
      )
    ).map((t) => ({ label: t, value: t }))
  ];

  const filteredDoctors = doctors
    .map((doc) => ({
      ...doc,
      computedDistance: getDoctorDistance(doc)
    }))
    .filter((doc) => {
      // 1. Text Search across doctor name, hospital, location, specialty, and services
      if (doctorSearch.trim()) {
        const query = doctorSearch.toLowerCase().trim();
        const matchesName = doc.fullName && doc.fullName.toLowerCase().includes(query);
        const matchesSpecialty = doc.specialty && doc.specialty.toLowerCase().includes(query);
        const matchesHospital = doc.hospital && doc.hospital.toLowerCase().includes(query);
        const matchesLocation = doc.location && doc.location.toLowerCase().includes(query);
        const matchesServices = doc.services && doc.services.some(
          (s) => (s.name && s.name.toLowerCase().includes(query)) || (s.category && s.category.toLowerCase().includes(query))
        );
        if (!matchesName && !matchesSpecialty && !matchesHospital && !matchesLocation && !matchesServices) {
          return false;
        }
      }

      // 2. Treatment / Specialty filter
      if (treatmentFilter !== "all") {
        const tf = treatmentFilter.toLowerCase();
        const specMatch = doc.specialty && doc.specialty.toLowerCase().includes(tf);
        const serviceMatch = doc.services && doc.services.some(
          (s) => (s.category && s.category.toLowerCase().includes(tf)) || (s.name && s.name.toLowerCase().includes(tf))
        );
        if (!specMatch && !serviceMatch) {
          return false;
        }
      }

      // 3. Distance filter
      if (maxDistance !== "all") {
        const maxD = parseFloat(maxDistance);
        if (doc.computedDistance > maxD) return false;
      }

      // 4. Price filter
      const fee = Number(doc.fee || 0);
      if (priceRange === "under-200" && fee > 200) return false;
      if (priceRange === "200-500" && (fee < 200 || fee > 500)) return false;
      if (priceRange === "500-1000" && (fee < 500 || fee > 1000)) return false;
      if (priceRange === "above-1000" && fee < 1000) return false;

      // 5. Rating filter
      if (minRating !== "all") {
        const minR = parseFloat(minRating);
        if (Number(doc.rating || 0) < minR) return false;
      }

      // 6. Available only
      if (availableOnly && doc.status !== "active") {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return (a.fee || 0) - (b.fee || 0);
      if (sortBy === "price-high") return (b.fee || 0) - (a.fee || 0);
      if (sortBy === "rating-high") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "distance-near") return a.computedDistance - b.computedDistance;
      if (sortBy === "experience-high") return (b.experience || 0) - (a.experience || 0);
      return 0; // recommended
    });

  const resetDoctorFilters = () => {
    setDoctorSearch("");
    setTreatmentFilter("all");
    setMaxDistance("all");
    setPriceRange("all");
    setMinRating("all");
    setAvailableOnly(false);
    setSortBy("recommended");
  };

  const hasActiveFilters = Boolean(
    doctorSearch ||
    treatmentFilter !== "all" ||
    maxDistance !== "all" ||
    priceRange !== "all" ||
    minRating !== "all" ||
    availableOnly ||
    sortBy !== "recommended"
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
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col">
            <div className="bg-gradient-to-r from-[#0d6e7e] to-[#0a4f5c] text-white p-5 sm:p-6 rounded-t-3xl flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-400/20 text-teal-200 border border-teal-400/30">
                    Find Specialists
                  </span>
                  <span className="text-xs text-teal-100/90 font-medium">• Search by Treatment, Distance, Price & Rating</span>
                </div>
                <h2 className="text-xl font-black">Book In-Person Consultation</h2>
              </div>
              <button
                onClick={() => { setShowModal(false); setSelectedDoctor(null); }}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {!selectedDoctor ? (
              <div className="p-5 sm:p-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all shadow-xs"
                    placeholder="Search by doctor name, treatment, specialty, hospital, city, or service..."
                  />
                  {doctorSearch && (
                    <button
                      onClick={() => setDoctorSearch("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Treatment / Specialty Quick Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-gray-400 font-bold uppercase text-[10px] shrink-0 tracking-wider flex items-center gap-1 mr-1">
                    <Tag size={12} className="text-[#0d6e7e]" /> Treatments:
                  </span>
                  {treatmentOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTreatmentFilter(opt.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                        treatmentFilter === opt.value
                          ? "bg-[#0d6e7e] text-white shadow-xs"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Filter Controls Toolbar: Distance, Price, Rating, Sort */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200/80">
                  {/* Distance Filter */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Navigation size={11} className="text-[#0d6e7e]" /> Distance
                    </label>
                    <select
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:ring-1 focus:ring-teal-500 outline-none"
                    >
                      <option value="all">Any Distance</option>
                      <option value="3">Within 3 km</option>
                      <option value="5">Within 5 km</option>
                      <option value="10">Within 10 km</option>
                      <option value="25">Within 25 km</option>
                    </select>
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Tag size={11} className="text-[#0d6e7e]" /> Max Visiting Fee
                    </label>
                    <select
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:ring-1 focus:ring-teal-500 outline-none"
                    >
                      <option value="all">Any Price</option>
                      <option value="under-200">Budget (≤ ₹200)</option>
                      <option value="200-500">Standard (₹200 - ₹500)</option>
                      <option value="500-1000">Specialist (₹500 - ₹1000)</option>
                      <option value="above-1000">Senior Consultant (&gt; ₹1000)</option>
                    </select>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Star size={11} className="text-amber-500" /> Minimum Rating
                    </label>
                    <select
                      value={minRating}
                      onChange={(e) => setMinRating(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:ring-1 focus:ring-teal-500 outline-none"
                    >
                      <option value="all">All Ratings</option>
                      <option value="4.8">⭐ 4.8 & above</option>
                      <option value="4.5">⭐ 4.5 & above</option>
                      <option value="4.0">⭐ 4.0 & above</option>
                      <option value="3.5">⭐ 3.5 & above</option>
                    </select>
                  </div>

                  {/* Sort By Filter */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <ArrowUpDown size={11} className="text-[#0d6e7e]" /> Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:ring-1 focus:ring-teal-500 outline-none"
                    >
                      <option value="recommended">Best Match</option>
                      <option value="distance-near">Distance: Nearest First 📍</option>
                      <option value="price-low">Fee: Low to High</option>
                      <option value="price-high">Fee: High to Low</option>
                      <option value="rating-high">Rating: Highest First ⭐</option>
                      <option value="experience-high">Experience: Highest</option>
                    </select>
                  </div>
                </div>

                {/* Active Filter Chips & Results Count Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-gray-500 font-medium">
                      Showing <span className="font-bold text-gray-900">{filteredDoctors.length}</span> of {doctors.length} doctors
                    </span>
                    {treatmentFilter !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0d6e7e] border border-teal-200 font-semibold text-[11px]">
                        Treatment: {treatmentFilter}
                        <button onClick={() => setTreatmentFilter("all")} className="hover:text-teal-900"><X size={11} /></button>
                      </span>
                    )}
                    {maxDistance !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[11px]">
                        Distance: ≤ {maxDistance} km
                        <button onClick={() => setMaxDistance("all")} className="hover:text-blue-900"><X size={11} /></button>
                      </span>
                    )}
                    {priceRange !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[11px]">
                        Fee: {priceRange}
                        <button onClick={() => setPriceRange("all")} className="hover:text-amber-900"><X size={11} /></button>
                      </span>
                    )}
                    {minRating !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold text-[11px]">
                        Rating: ≥ {minRating} ⭐
                        <button onClick={() => setMinRating("all")} className="hover:text-purple-900"><X size={11} /></button>
                      </span>
                    )}
                    {availableOnly && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-semibold text-[11px]">
                        Available today
                        <button onClick={() => setAvailableOnly(false)} className="hover:text-green-900"><X size={11} /></button>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAvailableOnly(!availableOnly)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                        availableOnly
                          ? "bg-green-100 text-green-800 border-green-300"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${availableOnly ? "bg-green-600" : "bg-gray-400"}`} />
                      Available Today
                    </button>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetDoctorFilters}
                        className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <RefreshCw size={12} /> Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Doctor Cards List */}
                <div className="space-y-3">
                  {filteredDoctors.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-gray-50/70 rounded-2xl border border-dashed border-gray-200">
                      <div className="w-14 h-14 rounded-full bg-teal-50 text-[#0d6e7e] mx-auto flex items-center justify-center mb-3">
                        <Filter size={24} />
                      </div>
                      <h3 className="font-bold text-gray-800 text-base">No doctors match your filter criteria</h3>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        Try clearing some filters (distance, price, or treatment) to discover available specialists.
                      </p>
                      <button
                        type="button"
                        onClick={resetDoctorFilters}
                        className="mt-4 px-4 py-2 bg-[#0d6e7e] text-white text-xs font-bold rounded-xl hover:bg-[#0a5566] transition-colors inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <RefreshCw size={13} /> Reset All Filters
                      </button>
                    </div>
                  ) : (
                    filteredDoctors.map((doc) => (
                      <div
                        key={doc.id}
                        className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50/30 transition-all bg-white text-left shadow-xs hover:shadow-sm"
                      >
                        <div className="flex items-start gap-4 min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0d6e7e] to-[#084b56] flex items-center justify-center text-white shadow-xs">
                              <Stethoscope size={24} />
                            </div>
                            <span
                              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                doc.status === "active" ? "bg-green-500" : "bg-gray-400"
                              }`}
                              title={doc.status === "active" ? "Available Today" : "On Leave"}
                            />
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="font-bold text-gray-900 text-sm">{doc.fullName}</p>
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-[#0d6e7e] border border-teal-100">
                                {doc.specialty || "Specialist"}
                              </span>
                              {doc.rating && (
                                <span className="flex items-center gap-0.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                  <Star size={11} className="fill-amber-400 text-amber-400" /> {doc.rating}
                                </span>
                              )}
                              {doc.experience && (
                                <span className="text-[11px] text-gray-500 font-medium">
                                  • {doc.experience}y exp
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1 font-medium text-gray-700">
                                <Building2 size={13} className="text-[#0d6e7e]" />
                                <span>{doc.hospital || "Hospital"}</span>
                              </span>
                              {(doc.location || doc.hospitalAddress) && (
                                <span className="flex items-center gap-1 text-gray-500">
                                  <MapPin size={12} className="text-red-500" />
                                  <span>{doc.location || doc.hospitalAddress}</span>
                                </span>
                              )}
                            </div>

                            {/* Distance Badge & Key Treatments preview */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                                <Navigation size={11} /> {doc.computedDistance} km away
                              </span>
                              {(doc.services || []).slice(0, 3).map((srv, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-medium">
                                  {srv.name}
                                </span>
                              ))}
                              {(doc.services || []).length > 3 && (
                                <span className="text-[10px] text-gray-400 font-medium">
                                  +{doc.services.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Price and Action Buttons */}
                        <div className="flex items-center md:flex-col md:items-end justify-between md:justify-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                          <div className="text-left md:text-right">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block">OPD Visiting Fee</span>
                            <span className="text-lg font-black text-[#0d6e7e]">₹{doc.fee || 500}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingDoctorProfile(doc);
                              }}
                              className="px-3 py-2 bg-gray-50 hover:bg-teal-50 text-[#0d6e7e] border border-gray-200 hover:border-teal-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                              title="View Hospital Details, Photos & Service Price List"
                            >
                              <Building2 size={13} />
                              <span>Hospital & Rates</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openBooking(doc)}
                              className="px-4 py-2 bg-[#0d6e7e] hover:bg-[#0a5566] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                            >
                              <Calendar size={13} />
                              <span>Book Slot</span>
                            </button>
                          </div>
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

