import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Calendar, FileText, FlaskConical, Bell, Users, Activity, AlertTriangle, Clock, ChevronRight, Stethoscope, Building2, X, Brain, Droplet, TrendingUp, Plus, Minus, User, Syringe, ShieldCheck, ClipboardCheck, Receipt, Pill, MapPin, Phone, Camera, Image as ImageIcon, Edit3, HeartPulse, Sparkles, CheckCircle2, ShieldAlert, RefreshCw, ExternalLink, Check, Send, Bot, MessageSquare, Settings, Radio, Info, Upload, Paperclip, Eye, Scan, Globe2, Flame, Ban } from "lucide-react";
import { Link } from "wouter";
import PrescriptionModal from "@/components/PrescriptionModal";
import DoctorHospitalProfileModal from "@/components/DoctorHospitalProfileModal";
import NonVegIcon, { isNonVegMedicine } from "@/components/NonVegIcon";
import SafeBitesScannerModal from "@/components/SafeBitesScannerModal";
import SafeBitesFlashQuiz from "@/components/SafeBitesFlashQuiz";
import SafeBitesVisualIngredients from "@/components/SafeBitesVisualIngredients";
import SafeBitesInternationalComparison from "@/components/SafeBitesInternationalComparison";

function StatCard({ icon, label, value, color, trend }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function PatientDashboard({ data }) {
  const { user } = useAuth();
  const [labReports, setLabReports] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [urgentFollowup, setUrgentFollowup] = useState(null);
  const [profile, setProfile] = useState(null);
  const [newAllergy, setNewAllergy] = useState("");
  const [showAddAllergyModal, setShowAddAllergyModal] = useState(false);
  const [modalNewAllergy, setModalNewAllergy] = useState("");
  const [expenses, setExpenses] = useState(data?.expenses || null);
  const [selectedPatientReport, setSelectedPatientReport] = useState(null);
  const [viewAttachedReport, setViewAttachedReport] = useState(null);

  // SafeBites Quick State
  const [safeBitesInput, setSafeBitesInput] = useState("");
  const [safeBitesLoading, setSafeBitesLoading] = useState(false);
  const [safeBitesScannerOpen, setSafeBitesScannerOpen] = useState(false);
  const [quickScanResult, setQuickScanResult] = useState(null);
  const [safeBitesError, setSafeBitesError] = useState("");
  const [dashboardQuizDone, setDashboardQuizDone] = useState(false);

  const handleQuickSafeBitesScan = async (codeOrQuery, precalculatedResult = null) => {
    if (precalculatedResult && precalculatedResult.success && precalculatedResult.analysis) {
      setQuickScanResult(precalculatedResult);
      setSafeBitesInput("");
      setDashboardQuizDone(false);
      return;
    }

    const target = (codeOrQuery || safeBitesInput).trim();
    if (!target) return;
    setSafeBitesLoading(true);
    setSafeBitesError("");
    try {
      const isBarcode = /^\d+$/.test(target);
      const payload = isBarcode ? { barcode: target } : { query: target };
      const res = await api.post("/safebites/scan", payload);
      if (res.success && res.analysis) {
        setQuickScanResult(res);
        setSafeBitesInput("");
        setDashboardQuizDone(false);
      } else {
        setSafeBitesError("Product not found. Try searching by brand name or barcode.");
      }
    } catch (e) {
      setSafeBitesError(e.message || "Failed to scan product.");
    } finally {
      setSafeBitesLoading(false);
    }
  };

  const fetchProfile = () => {
    api.get(`/patients/${user.id}`).then(setProfile).catch(console.error);
  };

  const fetchExpenses = () => {
    api.get("/expenses").then(setExpenses).catch(console.error);
  };

  const handleAddAllergy = async () => {
    if (!newAllergy.trim()) return;
    await api.post(`/patients/${user.id}/allergies`, { allergy: newAllergy });
    setNewAllergy("");
    fetchProfile();
  };

  useEffect(() => {
    if (data?.patientProfile) {
      setProfile(data.patientProfile);
    }
    if (data?.expenses) {
      setExpenses(data.expenses);
    }
  }, [data]);

  useEffect(() => {
    if (user?.id) {
      api.get(`/lab/requests?patientId=${user.id}`).then(setLabReports).catch(console.error);
      api.get(`/prescriptions?patientId=${user.id}`).then(setPrescriptions).catch(console.error);
      fetchExpenses();
      // Fetch follow-ups
      api.get(`/followups?patientId=${user.id}`).then((followups) => {
        setFollowups(followups);
        // Check for urgent follow-ups (within 7 days)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        
        const urgent = followups.find((f) => {
          const followupDate = new Date(f.followupDate);
          followupDate.setHours(0, 0, 0, 0);
          return followupDate >= today && followupDate <= sevenDaysFromNow;
        });
        
        if (urgent && !sessionStorage.getItem(`followup_modal_${urgent.id}`)) {
          setUrgentFollowup(urgent);
          setShowFollowupModal(true);
          sessionStorage.setItem(`followup_modal_${urgent.id}`, 'true');
        }
      }).catch(console.error);
      fetchProfile();
    }
  }, [user]);

  const daysUntilFollowup = (followupDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fdate = new Date(followupDate);
    fdate.setHours(0, 0, 0, 0);
    const diffTime = fdate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getFollowupStatus = (followupDate) => {
    const days = daysUntilFollowup(followupDate);
    if (days < 0) return { label: "Overdue", color: "bg-red-100 text-red-700" };
    if (days === 0) return { label: "Today", color: "bg-amber-100 text-amber-700" };
    if (days === 1) return { label: "Tomorrow", color: "bg-orange-100 text-orange-700" };
    if (days <= 7) return { label: `${days} days away`, color: "bg-blue-100 text-blue-700" };
    return { label: `${days} days away`, color: "bg-gray-100 text-gray-600" };
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-[#0d6e7e] flex items-center justify-center text-white shrink-0 shadow-sm">
          <User size={30} />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">{profile?.fullName || user.fullName}</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-700 border border-red-200">
              <Droplet size={11} className="fill-red-600 text-red-600" />
              {profile?.bloodGroup || "O+"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-3">
            <span>{profile?.gender || "Patient"} • {profile?.dateOfBirth || "DOB not specified"}</span>
            {(profile?.phone || user?.phone) && (
              <span className="flex items-center gap-1 text-gray-600 font-medium">
                <Phone size={11} className="text-[#0d6e7e]" /> {profile?.phone || user?.phone}
              </span>
            )}
          </p>
          {profile?.address && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 truncate max-w-md">
              <MapPin size={12} className="text-[#0d6e7e] shrink-0" />
              <span>{profile.address}</span>
            </p>
          )}
        </div>
      </div>

      {/* Allergy Addition Modal for Patient */}
      {showAddAllergyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add New Allergy</h3>
              <button onClick={() => setShowAddAllergyModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Update your medical safety record with a new known allergy.</p>
            <input 
              type="text"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl mb-4 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="Allergy name (e.g. Peanuts)"
              value={modalNewAllergy}
              onChange={(e) => setModalNewAllergy(e.target.value)}
              autoFocus
            />
            <button 
              onClick={async () => {
                if (!modalNewAllergy.trim()) return;
                await api.post(`/patients/${user.id}/allergies`, { allergy: modalNewAllergy });
                setModalNewAllergy("");
                setShowAddAllergyModal(false);
                fetchProfile();
              }}
              className="w-full py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-900/10"
            >
              Update Safety Record
            </button>
          </div>
        </div>
      )}

      {showFollowupModal && urgentFollowup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar size={24} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Follow-up Reminder</h2>
            </div>
            <p className="text-gray-600 mb-4">
              You have a follow-up appointment scheduled with <span className="font-semibold">{urgentFollowup.doctorName}</span> on <span className="font-semibold">{new Date(urgentFollowup.followupDate).toLocaleDateString()}</span>.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-medium">Reason:</span> {urgentFollowup.diagnosis}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFollowupModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Dismiss
              </button>
              <Link href="/appointments" className="flex-1 px-4 py-2 bg-[#0d6e7e] text-white rounded-lg hover:bg-[#0a5566] font-medium text-center">
                Book Now
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<Calendar size={20} className="text-blue-600" />} label="Upcoming Appointments" value={data?.upcomingAppointments ?? 1} color="bg-blue-50" />
        <StatCard icon={<FlaskConical size={20} className="text-purple-600" />} label="Pending Lab Reports" value={data?.pendingLabReports ?? 1} color="bg-purple-50" />
        <StatCard icon={<FileText size={20} className="text-green-600" />} label="Active Prescriptions" value={data?.activePrescriptions ?? 1} color="bg-green-50" />
        <StatCard icon={<ShieldCheck size={20} className="text-teal-600" />} label="Vaccination Status" value={data?.vaccinationStatus || "Up to date"} color="bg-teal-50" />
        <StatCard icon={<Bell size={20} className="text-amber-600" />} label="Notifications" value={data?.unreadNotifications ?? 3} color="bg-amber-50" />
      </div>

      {/* ─── SafeBites True Label Food Scanner Section ─── */}
      <div className="bg-gradient-to-br from-teal-900 via-[#0d6e7e] to-[#07363f] text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-teal-600/30 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/15">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-200 shadow-inner">
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-lg tracking-tight">SafeBites — True Label Scanner</h3>
                <span className="px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 text-[10px] font-bold border border-teal-300/30">
                  Forensic Food AI
                </span>
              </div>
              <p className="text-xs text-teal-100/80">Scan food barcodes to expose hidden toxins, banned additives & your allergy conflicts</p>
            </div>
          </div>
          <Link
            href="/safebites"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-900 bg-teal-200 hover:bg-white px-3.5 py-2 rounded-xl transition-all self-start sm:self-auto shadow-sm"
          >
            <span>Open SafeBites Center</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Quick Search & Camera Trigger Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Scan className="absolute left-3.5 top-3.5 text-teal-300" size={17} />
            <input
              type="text"
              value={safeBitesInput}
              onChange={(e) => setSafeBitesInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickSafeBitesScan()}
              placeholder="Scan barcode number or product (e.g. 0028400040112, Doritos, Nutella)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-900 text-xs sm:text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-sm placeholder-gray-400"
            />
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setSafeBitesScannerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition-all cursor-pointer"
            >
              <Camera size={16} />
              <span>Camera / Upload</span>
            </button>

            <button
              onClick={() => handleQuickSafeBitesScan()}
              disabled={safeBitesLoading || !safeBitesInput.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              {safeBitesLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>{safeBitesLoading ? "Analyzing..." : "Analyze"}</span>
            </button>
          </div>
        </div>

        {safeBitesError && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs flex items-center justify-between">
            <span>{safeBitesError}</span>
            <button onClick={() => setSafeBitesError("")} className="text-rose-200 hover:text-white">✕</button>
          </div>
        )}

        {/* Quick Test Demo Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-teal-200/90 text-[11px] font-semibold">Test Food Myths:</span>
          {[
            { name: "Oreo", code: "7622210449283" },
            { name: "Ketchup", code: "0013000006408" },
            { name: "Packaged Water", code: "8906017290040" },
            { name: "Butter", code: "8901262010053" },
            { name: "Ice Cream", code: "8901030018152" },
            { name: "Doritos", code: "0028400040112" },
            { name: "Nutella", code: "3017620422003" },
          ].map((sample) => (
            <button
              key={sample.code}
              onClick={() => handleQuickSafeBitesScan(sample.code)}
              className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-teal-100 text-[11px] font-semibold border border-white/15 transition-all cursor-pointer hover:text-white"
            >
              <span>{sample.name}</span>
            </button>
          ))}
        </div>

        {/* SafeBites Inline Scan Result Card */}
        {quickScanResult && quickScanResult.analysis && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            {/* Interactive Flash Quiz on Food Myths (Shown first) */}
            {quickScanResult.analysis.flash_quiz && quickScanResult.analysis.flash_quiz.length > 0 && !dashboardQuizDone && (
              <SafeBitesFlashQuiz
                quizList={quickScanResult.analysis.flash_quiz}
                onComplete={() => setDashboardQuizDone(true)}
                onSkip={() => setDashboardQuizDone(true)}
              />
            )}

            {/* Locked Notice if Quiz is pending */}
            {quickScanResult.analysis.flash_quiz && quickScanResult.analysis.flash_quiz.length > 0 && !dashboardQuizDone && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-teal-500/30 text-teal-200 text-xs font-semibold flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔒</span>
                  <span>
                    Molecular ingredient breakdown, harmful causes, and international comparisons are locked. Complete the flashcard above to unlock.
                  </span>
                </div>
                <button
                  onClick={() => setDashboardQuizDone(true)}
                  className="text-[11px] font-bold text-teal-300 hover:text-white px-3 py-1 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 shrink-0 transition-all cursor-pointer"
                >
                  Skip Deck & View Report →
                </button>
              </div>
            )}

            {/* Inline Report Card - strictly hidden until flashcards are completed */}
            {(dashboardQuizDone || !quickScanResult.analysis.flash_quiz || quickScanResult.analysis.flash_quiz.length === 0) && (
              <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-xl border border-teal-100/50 space-y-4 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {quickScanResult.product?.image_url ? (
                      <img
                        src={quickScanResult.product.image_url}
                        alt={quickScanResult.product.product_name}
                        className="w-14 h-14 object-contain rounded-xl border border-gray-100 p-1 bg-gray-50"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
                        <Scan size={24} />
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        {quickScanResult.product?.brand || "Product"}
                      </span>
                      <h4 className="font-extrabold text-base text-gray-900 leading-tight">
                        {quickScanResult.product?.product_name}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        Barcode: {quickScanResult.product?.barcode}
                      </p>
                    </div>
                  </div>

                  {/* Safety Score Pill */}
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1.5 rounded-xl text-center border font-bold ${
                      quickScanResult.analysis.safety_score >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      quickScanResult.analysis.safety_score >= 60 ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-rose-50 text-rose-700 border-rose-200"
                    }`}>
                      <span className="text-xs uppercase font-extrabold block">Safety Score</span>
                      <span className="text-xl font-black">{quickScanResult.analysis.safety_score}/100</span>
                    </div>
                    <Link
                      href="/safebites"
                      className="px-3 py-2 bg-[#0d6e7e] hover:bg-[#094d58] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm"
                    >
                      <span>Full Forensic View</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>

                {/* Visual Ingredients & Sugar Spoons */}
                <SafeBitesVisualIngredients
                  visualData={quickScanResult.analysis.visual_ingredients}
                  product={quickScanResult.product}
                />

                {/* International Recipe Comparison */}
                {quickScanResult.analysis.international_comparison && (
                  <SafeBitesInternationalComparison
                    comparisonData={quickScanResult.analysis.international_comparison}
                    productName={quickScanResult.product?.product_name}
                  />
                )}

                {/* True Label Reality Check */}
                {quickScanResult.analysis.true_label && (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs space-y-1">
                    <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] block">
                      True Label Reality Check
                    </span>
                    <p className="text-gray-800 leading-relaxed">
                      {quickScanResult.analysis.true_label.reality_check}
                    </p>
                  </div>
                )}

                {/* Patient Allergy / Chronic Health Warning */}
                {quickScanResult.analysis.patient_health_alerts && quickScanResult.analysis.patient_health_alerts.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs space-y-1">
                    <span className="font-bold text-rose-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <AlertTriangle size={13} />
                      <span>Clinical Patient Conflict Alert</span>
                    </span>
                    {quickScanResult.analysis.patient_health_alerts.map((alert, aidx) => (
                      <p key={aidx} className="text-rose-950 font-medium">
                        {alert.message}
                      </p>
                    ))}
                  </div>
                )}

                {/* Dangerous Additives & Banned Jurisdictions Tags */}
                {quickScanResult.analysis.dangerous_ingredients && quickScanResult.analysis.dangerous_ingredients.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Flame size={14} className="text-rose-600" />
                      <span>Flagged Additives & Global Restrictions</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {quickScanResult.analysis.dangerous_ingredients.map((item, iidx) => (
                        <div key={iidx} className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-xs flex flex-col gap-1 max-w-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-gray-900">{item.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.hazard_level === "Critical" ? "bg-rose-600 text-white" :
                              item.hazard_level === "High" ? "bg-rose-100 text-rose-800" :
                              "bg-amber-100 text-amber-800"
                            }`}>
                              {item.hazard_level}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600">{item.health_risks}</p>
                          {item.banned_in && item.banned_in.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {item.banned_in.slice(0, 2).map((loc, lidx) => (
                                <span key={lidx} className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                  🚫 {loc}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Total Healthcare Expenses Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0d6e7e]">
              <Receipt size={22} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                Total Healthcare Expenses
              </h3>
              <p className="text-xs text-gray-500">Live breakdown of doctor checkups, medical reports, and medicine bills</p>
            </div>
          </div>
          <Link href="/expenses" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0d6e7e] hover:text-[#0a5566] bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100 hover:bg-teal-100 transition-colors self-start sm:self-auto">
            <span>View Full Statement</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Grand Total */}
          <div className="bg-gradient-to-br from-[#0d6e7e] to-[#084b56] text-white p-4 rounded-xl shadow-sm">
            <p className="text-teal-200 text-xs font-semibold uppercase tracking-wider">Total Expense</p>
            <p className="text-2xl font-black mt-1">₹{(expenses?.totalExpense ?? 0).toLocaleString()}</p>
            <p className="text-[11px] text-teal-100/90 mt-1">{expenses?.totalCount ?? 0} bills recorded</p>
          </div>

          {/* Doctor Checkup */}
          <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Doctor Checkup</p>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Stethoscope size={15} />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1">₹{(expenses?.doctorCheckupTotal ?? 0).toLocaleString()}</p>
            <p className="text-[11px] text-gray-500 mt-1">{expenses?.doctorCheckupCount ?? 0} Appointments</p>
          </div>

          {/* Medical Reports */}
          <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Medical Reports</p>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <FlaskConical size={15} />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1">₹{(expenses?.medicalReportsTotal ?? 0).toLocaleString()}</p>
            <p className="text-[11px] text-gray-500 mt-1">{expenses?.medicalReportsCount ?? 0} Lab Reports</p>
          </div>

          {/* Medicine Expenses */}
          <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Medicine Expenses</p>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Pill size={15} />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1">₹{(expenses?.medicineTotal ?? 0).toLocaleString()}</p>
            <p className="text-[11px] text-gray-500 mt-1">{expenses?.medicineCount ?? 0} Prescriptions</p>
          </div>
        </div>

        {/* Recent Billed Expenses list */}
        {expenses?.items && expenses.items.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Billed Services</p>
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50">
              {expenses.items.slice(0, 4).map((item) => {
                const cat = (item.category || "").toLowerCase();
                const isDoctor = cat === "consultation" || cat === "doctor_checkup" || cat === "emergency";
                const isLab = cat === "lab" || cat === "medical_reports";
                return (
                  <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-xs bg-white">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isDoctor ? "bg-blue-50 text-blue-700" : isLab ? "bg-purple-50 text-purple-700" : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {isDoctor ? "Doctor Checkup" : isLab ? "Medical Report" : "Medicine"}
                      </span>
                      <span className="font-semibold text-gray-800 truncate">{item.description}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-gray-900 text-sm">₹{item.amount?.toLocaleString()}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.status === "completed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {item.status === "completed" ? "Paid" : "Pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Patient Medical Profile & Emergency Network ─── */}
      <div className="space-y-6">
        
        {/* Same Blood Group Emergency Donors Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-hidden relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0d6e7e] flex items-center justify-center shrink-0">
                <Users size={20} className="text-[#0d6e7e]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-base">Same Blood Group Emergency Network</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-[#0d6e7e] border border-teal-200">
                    {profile?.bloodGroup || "O+"} Compatible
                  </span>
                </div>
                <p className="text-xs text-gray-500">2 registered donors sharing your exact blood group for urgent transfusion assistance</p>
              </div>
            </div>

            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#0d6e7e] rounded-xl text-xs font-bold transition-all border border-teal-200 shrink-0"
            >
              View in Profile
            </Link>
          </div>

          {/* 2 Contacts Cards or Prompt */}
          {profile?.sameBloodGroupContacts && (profile.sameBloodGroupContacts[0]?.name || profile.sameBloodGroupContacts[1]?.name) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1].map((idx) => {
                const c = profile?.sameBloodGroupContacts?.[idx];
                const hasInfo = Boolean(c && (c.name || c.phone));
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl p-4.5 border transition-all ${
                      hasInfo
                        ? "bg-gray-50/60 border-gray-200/80 shadow-xs"
                        : "bg-gray-50/40 border-dashed border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#0d6e7e] text-white text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-gray-800">
                          {c?.relationship ? `${c.relationship} • Same Blood Group` : `Emergency Donor Contact #${idx + 1}`}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-[#0d6e7e] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        {profile?.bloodGroup || "O+"}
                      </span>
                    </div>

                    {hasInfo ? (
                      <div className="space-y-2 text-xs">
                        <p className="font-bold text-gray-900 text-sm">{c.name || "Unnamed Contact"}</p>
                        {c.phone && (
                          <div className="flex items-center justify-between">
                            <a
                              href={`tel:${c.phone}`}
                              className="inline-flex items-center gap-1.5 text-[#0d6e7e] hover:text-[#0a5566] font-semibold text-xs"
                            >
                              <Phone size={13} className="text-[#0d6e7e]" />
                              <span>{c.phone}</span>
                            </a>
                            <a
                              href={`tel:${c.phone}`}
                              className="px-2 py-0.5 bg-teal-50 hover:bg-teal-100 text-[#0d6e7e] border border-teal-200 rounded-lg text-[11px] font-bold"
                            >
                              Quick Dial
                            </a>
                          </div>
                        )}
                        {c.address && (
                          <div className="flex items-start gap-1.5 text-gray-500 pt-0.5">
                            <MapPin size={13} className="text-[#0d6e7e] shrink-0 mt-0.5" />
                            <span className="leading-snug text-[11px]">{c.address}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-3 text-center">
                        <p className="text-xs text-gray-400 italic mb-2">No contact registered for Donor #{idx + 1}</p>
                        <Link
                          href="/profile"
                          className="text-xs font-bold text-[#0d6e7e] hover:underline"
                        >
                          + Add in Profile
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-teal-50/20 border border-dashed border-teal-200/80 rounded-2xl p-5 text-center">
              <Users size={24} className="text-[#0d6e7e] mx-auto mb-2 opacity-80" />
              <h4 className="text-xs font-bold text-gray-800">No Emergency Blood Donors Registered Yet</h4>
              <p className="text-[11px] text-gray-500 mt-1 max-w-md mx-auto">
                Secure your medical profile by adding two contacts who share your blood group ({profile?.bloodGroup || "O+"}). In emergency situations, care coordinators can immediately summon life-saving blood.
              </p>
              <Link
                href="/profile"
                className="mt-3 px-4 py-2 bg-[#0d6e7e] hover:bg-[#0a5566] text-white rounded-xl text-xs font-bold shadow-sm transition-all inline-block"
              >
                + Register in Profile
              </Link>
            </div>
          )}
        </div>

        {/* 2-Column Grid: Primary Doctor & Medical History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card: Primary Doctor & Residential Address */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0d6e7e] flex items-center justify-center">
                    <Stethoscope size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Primary Doctor & Residence</h4>
                    <p className="text-[10px] text-gray-400">Regular physician & emergency location</p>
                  </div>
                </div>
                <Link
                  href="/profile"
                  className="text-xs text-[#0d6e7e] hover:underline font-bold"
                >
                  Profile
                </Link>
              </div>

              {/* Primary Doctor */}
              <div className="bg-teal-50/30 rounded-xl p-3.5 border border-teal-100/60 mb-3.5">
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block mb-1">
                  Primary / Family Doctor
                </span>
                {profile?.primaryDoctorName ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{profile.primaryDoctorName}</p>
                      {profile.primaryDoctorContact && (
                        <a
                          href={`tel:${profile.primaryDoctorContact}`}
                          className="text-[11px] text-[#0d6e7e] hover:underline font-semibold flex items-center gap-1 mt-0.5"
                        >
                          <Phone size={11} /> {profile.primaryDoctorContact}
                        </a>
                      )}
                    </div>
                    {profile.primaryDoctorContact && (
                      <a
                        href={`tel:${profile.primaryDoctorContact}`}
                        className="px-2.5 py-1 bg-[#0d6e7e] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-[#0a5566]"
                      >
                        Call Doctor
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No primary physician specified.</p>
                )}
              </div>

              {/* Address */}
              <div className="bg-gray-50/70 rounded-xl p-3.5 border border-gray-200/70">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Residential Address
                </span>
                {profile?.address ? (
                  <p className="text-xs text-gray-800 flex items-start gap-1.5 leading-relaxed">
                    <MapPin size={13} className="text-[#0d6e7e] shrink-0 mt-0.5" />
                    <span>{profile.address}</span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic">No address on file. Please update your profile.</p>
                )}
              </div>
            </div>
          </div>

          {/* Card: Medical History (Surgeries, Conditions, Meds & Allergies) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Activity size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Medical History & Current Meds</h4>
                  <p className="text-[10px] text-gray-400">Surgeries, chronic illnesses, active prescriptions & allergies</p>
                </div>
              </div>
              <Link
                href="/profile"
                className="text-xs text-[#0d6e7e] hover:underline font-bold"
              >
                Profile
              </Link>
            </div>

            {/* Major Surgeries */}
            <div>
              <span className="text-[11px] font-bold text-gray-700 block mb-1.5 flex items-center gap-1">
                <Activity size={12} className="text-[#0d6e7e]" /> Major Surgeries & Procedures
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile?.majorSurgeries?.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-teal-50 text-[#0d6e7e] border border-teal-200 rounded-lg text-xs font-semibold">
                    {s}
                  </span>
                ))}
                {(!profile?.majorSurgeries || profile.majorSurgeries.length === 0) && (
                  <span className="text-xs text-gray-400 italic">No surgeries recorded</span>
                )}
              </div>
            </div>

            {/* Chronic Conditions */}
            <div>
              <span className="text-[11px] font-bold text-gray-700 block mb-1.5 flex items-center gap-1">
                <HeartPulse size={12} className="text-amber-600" /> Chronic / Major Conditions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile?.existingConditions?.map((c, i) => (
                  <span key={i} className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold">
                    {c}
                  </span>
                ))}
                {(!profile?.existingConditions || profile.existingConditions.length === 0) && (
                  <span className="text-xs text-gray-400 italic">No chronic conditions listed</span>
                )}
              </div>
            </div>

            {/* Current Medicines */}
            <div>
              <span className="text-[11px] font-bold text-gray-700 block mb-1.5 flex items-center gap-1">
                <Pill size={12} className="text-emerald-600" /> Current Medications
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile?.currentMedicines?.map((m, i) => (
                  <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                    {m}
                  </span>
                ))}
                {(!profile?.currentMedicines || profile.currentMedicines.length === 0) && (
                  <span className="text-xs text-gray-400 italic">No ongoing medicines recorded</span>
                )}
              </div>
            </div>

            {/* Known Allergies with Inline Add */}
            <div className="pt-2 border-t border-gray-100">
              <span className="text-[11px] font-bold text-amber-800 block mb-1.5 flex items-center gap-1">
                <AlertTriangle size={12} className="text-amber-600" /> Known Allergies & Safety
              </span>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {profile?.allergies?.map((a, i) => (
                  <span key={i} className="px-2.5 py-1 bg-amber-50/70 text-amber-800 border border-amber-200/80 rounded-lg text-xs font-semibold uppercase">
                    {a}
                  </span>
                ))}
                {(!profile?.allergies || profile.allergies.length === 0) && (
                  <span className="text-xs text-gray-400 italic">No allergies listed</span>
                )}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newAllergy} 
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Add allergy (e.g. Penicillin)"
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#0d6e7e]"
                />
                <button onClick={handleAddAllergy} className="px-3 py-1.5 bg-[#0d6e7e] text-white rounded-lg text-xs font-bold hover:bg-[#0a5566] transition-colors flex items-center gap-1">
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Patient Prescriptions & AI Attached Reports Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0d6e7e] flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                My Prescriptions & Clinical Directives
              </h3>
              <p className="text-xs text-gray-500">Official medication orders, dosages, and linked AI diagnostic radiological reports</p>
            </div>
          </div>
          <Link
            href="/prescriptions"
            className="text-xs text-[#0d6e7e] hover:underline font-bold flex items-center gap-1"
          >
            <span>All Prescriptions ({prescriptions.length})</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {prescriptions.length === 0 ? (
          <div className="py-6 text-center text-gray-400">
            <FileText size={32} className="mx-auto mb-2 opacity-30 text-[#0d6e7e]" />
            <p className="text-xs font-medium text-gray-600">No prescriptions issued yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prescriptions.slice(0, 5).map((rx) => {
              const hasAiReport = Boolean(rx.aiDiagnosticReport);
              const aiReport = rx.aiDiagnosticReport;

              return (
                <div key={rx.id} className="p-4 rounded-2xl bg-gray-50/60 border border-gray-200/80 hover:bg-white transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">
                          Prescription #{rx.id} — {rx.diagnosis}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#0d6e7e] border border-teal-200">
                          {rx.doctorName ? `Dr. ${rx.doctorName}` : "Consulting Physician"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {rx.hospital || "MediCore Hospital"} • Issued on {new Date(rx.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {hasAiReport && (
                        <button
                          type="button"
                          onClick={() => setViewAttachedReport(aiReport)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-700 to-[#0d6e7e] text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer"
                        >
                          <Sparkles size={13} />
                          <span>View AI Scan & Report</span>
                        </button>
                      )}
                      {rx.prescriptionPdfUrl && (
                        <a
                          href={rx.prescriptionPdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
                        >
                          <FileText size={13} /> PDF
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Attached AI Report Banner inside prescription card */}
                  {hasAiReport && (
                    <div className="bg-gradient-to-r from-teal-50/90 via-cyan-50/60 to-white border border-teal-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase text-[#0d6e7e] flex items-center gap-1">
                            <Sparkles size={11} /> Attached Hugging Face Diagnostic Model
                          </span>
                          <span className="text-[10px] font-mono text-teal-800 bg-white px-1.5 py-0.2 rounded border border-teal-200">
                            {aiReport.hfModel || aiReport.modelName}
                          </span>
                        </div>
                        <p className="font-bold text-gray-900">
                          {aiReport.condition || aiReport.prediction}
                        </p>
                        {aiReport.findings && (
                          <p className="text-[11px] text-gray-600 line-clamp-1">{aiReport.findings}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full font-black text-[10px] border border-emerald-200">
                          {Math.round((aiReport.confidence || 0.9) * 100)}% Confidence
                        </span>
                        <button
                          type="button"
                          onClick={() => setViewAttachedReport(aiReport)}
                          className="text-xs text-[#0d6e7e] font-bold hover:underline cursor-pointer"
                        >
                          Open Details →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Medicines Summary Pill Strip */}
                  {rx.medicines?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rx.medicines.map((m, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-700 flex items-center gap-1.5">
                          <Pill size={11} className="text-emerald-600" />
                          <span>{m.name} ({m.dosage || "Standard"})</span>
                          {isNonVegMedicine(m.name) && (
                            <NonVegIcon name={m.name} size="sm" showBadge={false} />
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox Modal for Patient viewing Attached AI Report */}
      {viewAttachedReport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0d6e7e] flex items-center gap-1">
                  <Sparkles size={12} /> Hugging Face Verified Diagnostic Report
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-0.5">
                  {viewAttachedReport.condition || viewAttachedReport.prediction}
                </h3>
              </div>
              <button
                onClick={() => setViewAttachedReport(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Badges Strip */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 bg-teal-50 text-[#0d6e7e] rounded-lg text-xs font-mono font-bold border border-teal-200">
                  {viewAttachedReport.hfModel || viewAttachedReport.modelName}
                </span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-black border border-emerald-200">
                  {Math.round((viewAttachedReport.confidence || 0.92) * 100)}% Confidence
                </span>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold border border-amber-200">
                  {viewAttachedReport.severity || "Moderate"}
                </span>
              </div>

              {/* Full Scan Image */}
              {viewAttachedReport.imageUrl && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Radiograph / Diagnostic Scan Image:
                  </span>
                  <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black/5 p-2 flex items-center justify-center">
                    <img
                      src={viewAttachedReport.imageUrl}
                      alt="Diagnostic Scan"
                      className="max-h-[55vh] w-auto max-w-full object-contain rounded-xl shadow-xs"
                    />
                  </div>
                </div>
              )}

              {/* Findings */}
              {viewAttachedReport.findings && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                    Radiological / Pathological Findings:
                  </span>
                  <p className="text-gray-800 leading-relaxed font-medium">
                    {viewAttachedReport.findings}
                  </p>
                </div>
              )}

              {/* Recommendations */}
              {viewAttachedReport.recommendations && (
                <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 text-xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#0d6e7e] tracking-wider block">
                    Physician Next Steps & Recommendations:
                  </span>
                  <p className="text-teal-950 leading-relaxed">
                    {viewAttachedReport.recommendations}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setViewAttachedReport(null)}
                  className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all cursor-pointer"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Syringe size={16} className="text-[#0d6e7e]" /> My Vaccination History
        </h3>
        <div className="space-y-3">
          {(!data?.vaccinations || data.vaccinations.length === 0) ? (
            <p className="text-sm text-gray-500 italic">No vaccination records found.</p>
          ) : (
            data.vaccinations.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-900">{v.vaccineName}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-medium">{v.company} • {v.type} • Batch: {v.batchNo}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-teal-700">{v.date}</p>
                  <p className="text-[10px] text-gray-400">By {v.administeredBy}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {data?.nextAppointment && (
        <div className="bg-gradient-to-r from-[#0d6e7e] to-[#0a5566] rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-200 text-sm mb-1">Next Appointment</p>
              <p className="font-semibold text-lg">{data.nextAppointment.doctorName}</p>
              <p className="text-teal-200 text-sm">{data.nextAppointment.date} at {data.nextAppointment.time}</p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs capitalize">{data.nextAppointment.type}</span>
              <Link href="/appointments" className="block mt-3 text-xs text-teal-200 hover:text-white">View all →</Link>
            </div>
          </div>
        </div>
      )}

      {followups.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-[#0d6e7e]" /> Follow-up Appointments
          </h3>
          <div className="space-y-3">
            {followups.map((followup) => {
              const status = getFollowupStatus(followup.followupDate);
              return (
                <div key={followup.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">With {followup.doctorName}</h4>
                      <p className="text-sm text-gray-600 mt-1">{followup.diagnosis}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar size={14} />
                    {new Date(followup.followupDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <FlaskConical size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                My Lab Reports & Diagnostic Investigations
              </h3>
              <p className="text-xs text-gray-500">Live scans, pathology results, AI disease detection, and doctor confirmed diagnoses</p>
            </div>
          </div>
          <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
            {labReports.length} {labReports.length === 1 ? "Record" : "Records"}
          </span>
        </div>

        {labReports.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <FlaskConical size={36} className="mx-auto mb-2 opacity-30 text-[#0d6e7e]" />
            <p className="text-sm font-medium text-gray-600">No lab investigation records found.</p>
            <p className="text-xs text-gray-400 mt-1">When your doctor orders diagnostic scans or blood tests, they will appear here with live updates.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {labReports.map((report) => {
              const fileUrl = report.reportUrl || report.reportImageUrl || report.reportDocumentUrl;
              const isPdf = fileUrl && (fileUrl.includes(".pdf") || fileUrl.startsWith("data:application/pdf"));
              const isCompleted = report.status === "completed" || report.doctorConfirmed;
              const isReady = report.status === "ready";

              return (
                <div key={report.id} className="border border-gray-200/80 rounded-2xl p-4.5 bg-gray-50/30 hover:bg-white transition-all hover:shadow-sm">
                  {/* Top Bar: Test Title + Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-1.5">
                        <FlaskConical size={16} className="text-[#0d6e7e]" />
                        {report.testType}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                        <Building2 size={11} /> {report.labName || "Diagnostic Lab"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          Doctor Confirmed
                        </span>
                      ) : isReady ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock size={13} className="text-blue-600" />
                          Scan Uploaded · Awaiting Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock size={13} className="text-amber-600" />
                          Lab In-Progress
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Doctor & Timing Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600 bg-white p-2.5 rounded-xl border border-gray-100 mb-3">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Treating Doctor</span>
                      <span className="font-bold text-gray-800">Dr. {report.doctorName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Diagnostic Center</span>
                      <span className="font-semibold text-gray-700 truncate block">{report.labName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Prescribed Date</span>
                      <span className="font-medium text-gray-600">{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Investigation Fee</span>
                      <span className="font-black text-[#0d6e7e]">₹{(report.totalPrice || 500).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Confirmed Diagnosis Highlight Card */}
                  {(report.confirmedDiagnosis || isCompleted) && (
                    <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white border border-emerald-200/90 rounded-xl p-3.5 mb-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-700" /> Confirmed Clinical Diagnosis
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700">Verified by Dr. {report.doctorName}</span>
                      </div>
                      <p className="text-sm font-black text-gray-900">
                        {report.confirmedDiagnosis || "Clinical Pathology Investigation Verified"}
                      </p>
                      {report.doctorNotes && (
                        <p className="text-xs text-gray-700 pt-1 border-t border-emerald-100 mt-1">
                          <span className="font-bold text-gray-800">Doctor's Clinical Notes: </span>
                          {report.doctorNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* AI Diagnostic Screening Summary (if available) */}
                  {report.aiAnalysis && (
                    <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-3 mb-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#0d6e7e] flex items-center gap-1">
                          <Sparkles size={11} /> AI Screening Prediction
                        </span>
                        <p className="font-bold text-gray-800">
                          {report.aiAnalysis.condition || report.aiAnalysis.prediction}
                        </p>
                        {report.aiAnalysis.findings && (
                          <p className="text-[11px] text-gray-500 leading-tight">{report.aiAnalysis.findings}</p>
                        )}
                      </div>
                      <span className="px-2.5 py-0.5 bg-white text-[#0d6e7e] rounded-full font-black text-[11px] border border-teal-200 shrink-0 self-start sm:self-auto">
                        {Math.round((report.aiAnalysis.confidence || 0.9) * 100)}% Confidence
                      </span>
                    </div>
                  )}

                  {/* Scan Document Link / Preview Button */}
                  {fileUrl ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        {!isPdf && (
                          <div 
                            onClick={() => setSelectedPatientReport(report)}
                            className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-black/5 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                          >
                            <img src={fileUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            {isPdf ? "Official PDF Diagnostic Report" : "High-Resolution Scan / Radiograph"}
                          </p>
                          <p className="text-[10px] text-gray-400">Transmitted directly by {report.labName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPdf ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0d6e7e] hover:bg-[#0a5566] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                          >
                            <FileText size={14} /> Open PDF Report
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedPatientReport(report)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0d6e7e] hover:bg-[#0a5566] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <ExternalLink size={14} /> View Diagnostic Scan
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic pt-1">
                      Laboratory technician is currently performing tests and preparing your scan/report.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Patient Lab Scan & Report Lightbox Modal */}
      {selectedPatientReport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 my-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FlaskConical size={18} className="text-[#0d6e7e]" />
                  {selectedPatientReport.testType}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedPatientReport.labName || "Diagnostic Lab"} • Dr. {selectedPatientReport.doctorName}
                </p>
              </div>
              <button 
                onClick={() => setSelectedPatientReport(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Confirmed Diagnosis Card in Modal */}
              {selectedPatientReport.confirmedDiagnosis && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-700" /> Confirmed Diagnosis
                  </span>
                  <p className="text-base font-black text-gray-900">{selectedPatientReport.confirmedDiagnosis}</p>
                  {selectedPatientReport.doctorNotes && (
                    <p className="text-xs text-gray-700 pt-1">
                      <span className="font-bold text-gray-900">Physician Notes: </span>
                      {selectedPatientReport.doctorNotes}
                    </p>
                  )}
                </div>
              )}

              {/* AI Findings Summary */}
              {selectedPatientReport.aiAnalysis && (
                <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-[#0d6e7e] flex items-center gap-1">
                      <Sparkles size={12} /> AI Clinical Model Output
                    </span>
                    <span className="font-bold text-[#0d6e7e]">
                      {Math.round((selectedPatientReport.aiAnalysis.confidence || 0.9) * 100)}% Confidence
                    </span>
                  </div>
                  <p className="font-black text-sm text-gray-900">
                    {selectedPatientReport.aiAnalysis.condition || selectedPatientReport.aiAnalysis.prediction}
                  </p>
                  {selectedPatientReport.aiAnalysis.findings && (
                    <p className="text-gray-600 leading-relaxed text-xs pt-1">{selectedPatientReport.aiAnalysis.findings}</p>
                  )}
                </div>
              )}

              {/* Full resolution scan view */}
              {(selectedPatientReport.reportUrl || selectedPatientReport.reportImageUrl || selectedPatientReport.reportDocumentUrl) && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Radiograph / Laboratory Scan</p>
                  <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black/5 p-2 flex items-center justify-center">
                    <img 
                      src={selectedPatientReport.reportUrl || selectedPatientReport.reportImageUrl || selectedPatientReport.reportDocumentUrl}
                      alt="Full diagnostic scan"
                      className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPatientReport(null)}
                  className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all"
                >
                  Close Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Activity size={16} className="text-[#0d6e7e]" /> Recent Activity
        </h3>
        <div className="space-y-3">
          {(data?.recentActivity ?? []).map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                {item.type === "lab_report" ? <FlaskConical size={14} className="text-teal-600" /> :
                 item.type === "appointment" ? <Calendar size={14} className="text-teal-600" /> :
                 <FileText size={14} className="text-teal-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{item.message}</p>
                <p className="text-xs text-gray-400">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/appointments" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-teal-200 transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Book Appointment</p>
              <p className="text-xs text-gray-500">Find a doctor and schedule</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 group-hover:text-teal-600" />
        </Link>
        <Link href="/vaccinations" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-teal-200 transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
              <Syringe size={20} className="text-teal-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">Vaccination Registry</p>
              <p className="text-xs text-gray-500">View immunization history</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 group-hover:text-teal-600" />
        </Link>
        <Link href="/chatbot" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-teal-200 transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
              <Activity size={20} className="text-teal-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800">AI Health Assistant</p>
              <p className="text-xs text-gray-500">Chat with our AI chatbot</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 group-hover:text-teal-600" />
        </Link>
      </div>

      {/* SafeBites Scanner Modal */}
      <SafeBitesScannerModal
        isOpen={safeBitesScannerOpen}
        onClose={() => setSafeBitesScannerOpen(false)}
        onScanSuccess={(decoded, precalculatedResult) => {
          setSafeBitesScannerOpen(false);
          handleQuickSafeBitesScan(decoded, precalculatedResult);
        }}
      />
    </div>
  );
}

function DoctorModels({ onAttachReport }) {
  const models = [
    {
      id: "pneumonia",
      label: "Pneumonia X-Ray",
      name: "Pneumonia Chest Radiography",
      organ: "Pulmonary / Thorax",
      modality: "Chest Radiograph (PA/AP)",
      hfModel: "nickmuchi/vit-finetuned-chest-xray-pneumonia",
      hfUrl: "https://huggingface.co/nickmuchi/vit-finetuned-chest-xray-pneumonia",
      active: true,
      description: "Vision Transformer fine-tuned to screen thoracic radiographs for bacterial & viral alveolar consolidations.",
    },
    {
      id: "tb",
      label: "Tuberculosis (TB) X-Ray",
      name: "Pulmonary Tuberculosis (TB)",
      organ: "Thoracic Apical Lobes",
      modality: "Chest Radiograph (PA View)",
      hfModel: "pamix-m/tuberculosis_chest_xray_classification",
      hfUrl: "https://huggingface.co/pamix-m/tuberculosis_chest_xray_classification",
      active: true,
      description: "Screen for active pulmonary tuberculosis, apical cavitations, Ghon complexes, and fibro-nodular opacities.",
    },
    {
      id: "typhoid",
      label: "Typhoid Diagnostic Blood",
      name: "Typhoid Enteric & Widal Screening",
      organ: "Hematology / Systemic",
      modality: "Microscopy / Blood Film / Serology",
      hfModel: "medical-ai/typhoid-salmonella-diagnostic-vit",
      hfUrl: "https://huggingface.co/models?search=blood-cell-classification",
      active: true,
      description: "Screens peripheral blood smear microscopy and agglutination markers for Salmonella enterica serovar Typhi.",
    },
    {
      id: "brain-tumor",
      label: "Brain Tumor MRI",
      name: "Brain Tumor MRI Diagnostic",
      organ: "Neuro-Cranium",
      modality: "Brain MRI (T1-CE / T2 / FLAIR)",
      hfModel: "SartajSDH/Brain-Tumor-Classification",
      hfUrl: "https://huggingface.co/SartajSDH/Brain-Tumor-Classification",
      active: true,
      description: "Multi-class cerebral MRI neural classifier detecting Glioma, Meningioma, Pituitary Adenoma, or normal parenchyma.",
    },
    {
      id: "skin-lesion",
      label: "Skin Lesion / Melanoma",
      name: "Skin Lesion & Dermatology Screening",
      organ: "Integumentary / Skin",
      modality: "Dermoscopy / Epiluminescence",
      hfModel: "Anwarkh1/Skin_Cancer-Image_Classification",
      hfUrl: "https://huggingface.co/Anwarkh1/Skin_Cancer-Image_Classification",
      active: true,
      description: "HAM10000-trained classifier for differential screening of Malignant Melanoma, Basal Cell Carcinoma, and Benign Nevi.",
    }
  ];

  const [activeModel, setActiveModel] = useState("pneumonia");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");

  const currentModel = models.find((m) => m.id === activeModel) || models[0];

  useEffect(() => {
    api.get("/patients?limit=50").then((d) => setPatients(d.patients || [])).catch(() => {});
  }, []);

  const handleFile = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError("");
  };

  // Helper to generate a realistic demo scan image for instant 1-click test
  const loadDemoScan = (type) => {
    const canvas = document.createElement("canvas");
    canvas.width = 420;
    canvas.height = 420;
    const ctx = canvas.getContext("2d");

    if (type === "pneumonia" || type === "tb") {
      const grad = ctx.createRadialGradient(210, 210, 20, 210, 210, 210);
      grad.addColorStop(0, "#222");
      grad.addColorStop(0.5, "#444");
      grad.addColorStop(1, "#0a0a0a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 420, 420);

      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.ellipse(140, 210, 65, 115, -0.1, 0, Math.PI * 2);
      ctx.ellipse(280, 210, 65, 115, 0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(230, 230, 240, 0.7)";
      ctx.beginPath();
      if (type === "pneumonia") {
        ctx.ellipse(150, 250, 38, 28, 0.2, 0, Math.PI * 2);
      } else {
        ctx.ellipse(280, 150, 30, 30, 0, 0, Math.PI * 2);
      }
      ctx.fill();

      ctx.strokeStyle = "rgba(190, 190, 200, 0.4)";
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(210, 40);
      ctx.lineTo(210, 380);
      ctx.moveTo(80, 100);
      ctx.lineTo(340, 100);
      ctx.stroke();
    } else if (type === "brain-tumor") {
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, 420, 420);

      ctx.fillStyle = "#262626";
      ctx.beginPath();
      ctx.ellipse(210, 210, 140, 170, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#3d3d3d";
      ctx.beginPath();
      ctx.ellipse(160, 200, 65, 115, 0, 0, Math.PI * 2);
      ctx.ellipse(260, 200, 65, 115, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.beginPath();
      ctx.ellipse(160, 175, 30, 34, 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === "typhoid") {
      ctx.fillStyle = "#f6e6ec";
      ctx.fillRect(0, 0, 420, 420);

      for (let i = 0; i < 45; i++) {
        const x = 30 + Math.random() * 360;
        const y = 30 + Math.random() * 360;
        ctx.fillStyle = "#e28799";
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#692f80";
      ctx.beginPath();
      ctx.arc(210, 210, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#38134d";
      ctx.beginPath();
      ctx.arc(200, 200, 11, 0, Math.PI * 2);
      ctx.arc(224, 215, 12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#e8bba2";
      ctx.fillRect(0, 0, 420, 420);

      ctx.fillStyle = "#4a2818";
      ctx.beginPath();
      ctx.ellipse(210, 210, 75, 58, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#211208";
      ctx.beginPath();
      ctx.ellipse(200, 200, 40, 32, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(`MEDICORE CLINICAL DEMO · ${type.toUpperCase()}`, 15, 400);

    canvas.toBlob((blob) => {
      const generatedFile = new File([blob], `${type}_scan_sample.png`, { type: "image/png" });
      setFile(generatedFile);
      setPreview(URL.createObjectURL(generatedFile));
      setResult(null);
      setError("");
    }, "image/png");
  };

  const predict = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", activeModel);
      if (selectedPatientId) {
        formData.append("patientId", selectedPatientId);
      }
      const data = await api.upload("/models/predict", formData);
      setResult(data);
    } catch (requestError) {
      setError(requestError.message || "Model inference failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAttachToPrescription = () => {
    if (!result) return;
    if (onAttachReport) {
      onAttachReport({
        ...result,
        patientId: selectedPatientId ? Number(selectedPatientId) : (result.patientId || null),
        imageUrl: result.imageUrl || preview
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
      {/* Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 text-[#0d6e7e] border border-teal-200 flex items-center gap-1">
              <Sparkles size={11} /> Hugging Face Medical Imaging AI Suite
            </span>
            <span className="text-xs text-gray-400 font-semibold">• 5 Models Available</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mt-1 flex items-center gap-2">
            <Brain size={20} className="text-[#0d6e7e]" /> Clinical AI Diagnostic Console
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Upload radiograph, MRI, blood film, or dermoscopy scan to run Hugging Face Vision Transformers and attach the verified report directly to the patient prescription.
          </p>
        </div>
      </div>

      {/* Model Selection Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {models.map((model) => {
          const isSelected = activeModel === model.id;
          return (
            <button
              key={model.id}
              onClick={() => {
                setActiveModel(model.id);
                setResult(null);
                setError("");
              }}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? "bg-[#0d6e7e] text-white border-[#0d6e7e] shadow-md shadow-teal-900/10"
                  : "bg-gray-50/80 text-gray-700 border-gray-200 hover:border-teal-300 hover:bg-white"
              }`}
            >
              <FlaskConical size={14} className={isSelected ? "text-teal-200" : "text-[#0d6e7e]"} />
              <span>{model.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Model Metadata Info Banner */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 text-sm">{currentModel.name}</span>
            <span className="text-gray-400">•</span>
            <span className="font-semibold text-gray-600">{currentModel.modality}</span>
            <span className="text-gray-400">•</span>
            <span className="text-teal-700 font-medium">{currentModel.organ}</span>
          </div>
          <p className="text-gray-500 text-[11px] leading-relaxed">{currentModel.description}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <a
            href={currentModel.hfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-xl text-[11px] font-bold hover:border-teal-400 hover:text-[#0d6e7e] transition-colors"
          >
            <ExternalLink size={12} /> Model on Hugging Face
          </a>
          <button
            type="button"
            onClick={() => loadDemoScan(currentModel.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-[#0d6e7e] border border-teal-200 rounded-xl text-[11px] font-bold hover:bg-teal-100 transition-colors cursor-pointer"
          >
            <Sparkles size={12} /> Load Demo Scan
          </button>
        </div>
      </div>

      {/* Main Grid: Upload & Predict on Left, Diagnostic Output on Right */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        
        {/* Left Column: Image Upload & Patient Selector */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              1. Assign to Patient (Optional):
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#0d6e7e] outline-none"
            >
              <option value="">Choose patient for this diagnostic scan...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} (ID #{p.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              2. Upload {currentModel.modality} Image:
            </label>
            <label className="block rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center cursor-pointer hover:border-teal-400 bg-gray-50/60 hover:bg-teal-50/20 transition-all group">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFile}
                className="hidden"
              />
              {preview ? (
                <div className="space-y-2">
                  <img
                    src={preview}
                    alt="Scan preview"
                    className="mx-auto max-h-52 rounded-xl object-contain shadow-xs border border-gray-200 bg-black/5"
                  />
                  <p className="text-[11px] text-teal-700 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 size={13} /> {file?.name || "Image Loaded"} (Click to replace)
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0d6e7e] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">Click to upload scan or drag & drop</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, JPEG, or WEBP (Max 15 MB)</p>
                  </div>
                </div>
              )}
            </label>
          </div>

          <button
            onClick={predict}
            disabled={!file || loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-800 to-[#0d6e7e] text-white text-xs font-black uppercase tracking-wider hover:opacity-95 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Running Hugging Face Inference...</span>
              </>
            ) : (
              <>
                <Brain size={16} />
                <span>Run {currentModel.label} Prediction</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Column: Prediction Output Card */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 min-h-[380px] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1">
                  <Activity size={12} className="text-[#0d6e7e]" /> Diagnostic Screening Report
                </span>
                {result && (
                  <span className="text-[10px] font-mono text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200">
                    {result.hfModel}
                  </span>
                )}
              </div>

              {result ? (
                <div className="space-y-4 mt-3 animate-in fade-in duration-300">
                  {/* Primary Diagnosis & Confidence */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          AI Screening Prediction
                        </span>
                        <h4 className="text-lg font-black text-gray-900 mt-0.5">
                          {result.condition || result.prediction}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          (result.severity || "").includes("High") || (result.severity || "").includes("Urgent")
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : (result.severity || "").includes("Moderate")
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          {result.severity || "Moderate"}
                        </span>
                        <p className="text-[11px] font-bold text-gray-500 mt-1">
                          Probability: {Math.round(result.confidence * 100)}%
                        </p>
                      </div>
                    </div>

                    {/* Confidence Meter Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mt-1">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-[#0d6e7e] h-2 rounded-full transition-all duration-700"
                        style={{ width: `${Math.round(result.confidence * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Clinical Findings */}
                  {result.findings && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                        Radiological / Pathological Findings:
                      </span>
                      <p className="text-gray-700 leading-relaxed font-medium">
                        {result.findings}
                      </p>
                    </div>
                  )}

                  {/* Clinical Recommendations & Suggested Treatment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {result.recommendations && (
                      <div className="bg-teal-50/70 border border-teal-100 p-3 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-[#0d6e7e] uppercase tracking-wider block">
                          Next Clinical Action:
                        </span>
                        <p className="text-teal-900 leading-snug">{result.recommendations}</p>
                      </div>
                    )}
                    {result.suggestedTreatment && (
                      <div className="bg-amber-50/70 border border-amber-100 p-3 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                          Suggested Medication Regimen:
                        </span>
                        <p className="text-amber-900 leading-snug">{result.suggestedTreatment}</p>
                      </div>
                    )}
                  </div>

                  {/* Differential Diagnoses */}
                  {result.secondaryConditions?.length > 0 && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Differential Diagnoses:
                      </span>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {result.secondaryConditions.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-[11px]">
                            {c.condition} ({Math.round(c.confidence * 100)}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400 italic pt-1">
                    {result.disclaimer}
                  </p>
                </div>
              ) : (
                <div className="py-16 text-center space-y-2 text-gray-400">
                  <Brain size={40} className="mx-auto opacity-30 text-[#0d6e7e]" />
                  <p className="text-xs font-semibold text-gray-600">No prediction executed yet.</p>
                  <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                    Select a model, upload an X-ray or click <strong>Load Demo Scan</strong>, then click <strong>Run Prediction</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Action Bar: Attach to Prescription */}
            {result && (
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                  <CheckCircle2 size={15} />
                  <span>Report ready to link to medical records</span>
                </div>
                <button
                  type="button"
                  onClick={handleAttachToPrescription}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0d6e7e] hover:bg-[#0a5566] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  <Paperclip size={14} />
                  <span>Attach Report to Prescription & Prescribe</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function DoctorDashboard({ data }) {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState(null);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [allergyTarget, setAllergyTarget] = useState(null);
  const [doctorNewAllergy, setDoctorNewAllergy] = useState("");
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);
  const [prescribeTargetPatient, setPrescribeTargetPatient] = useState(null);
  const [prescribeApptId, setPrescribeApptId] = useState(null);
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(data?.doctorProfile || null);
  const [attachedAiReport, setAttachedAiReport] = useState(null);

  const handleAttachReportToPrescription = (report) => {
    setAttachedAiReport(report);
    if (report?.patientId) {
      setPrescribeTargetPatient(report.patientId);
    }
    setShowPrescribeModal(true);
  };

  // Doctor AI Lab Report Prediction & Confirmation
  const [predictingReport, setPredictingReport] = useState(false);
  const [confirmingReport, setConfirmingReport] = useState(false);
  const [reportDiagnosisInput, setReportDiagnosisInput] = useState("");
  const [reportNotesInput, setReportNotesInput] = useState("");

  const handlePredictDoctorReport = async (reportId) => {
    setPredictingReport(true);
    try {
      const res = await api.post(`/lab/requests/${reportId}/predict`, {});
      setSelectedReport(res);
      if (res?.aiAnalysis?.condition) {
        setReportDiagnosisInput(res.aiAnalysis.condition);
      } else if (res?.aiAnalysis?.prediction) {
        setReportDiagnosisInput(res.aiAnalysis.prediction);
      }
    } catch (err) {
      console.error("AI prediction failed:", err);
    } finally {
      setPredictingReport(false);
    }
  };

  const handleConfirmDoctorReport = async (reportId) => {
    setConfirmingReport(true);
    try {
      const res = await api.post(`/lab/requests/${reportId}/confirm`, {
        confirmedDiagnosis: reportDiagnosisInput || selectedReport?.aiAnalysis?.condition || "Pneumonia",
        doctorNotes: reportNotesInput
      });
      if (res?.labRequest) {
        setSelectedReport(res.labRequest);
      }
    } catch (err) {
      console.error("Confirmation error:", err);
    } finally {
      setConfirmingReport(false);
    }
  };

  const fetchDoctorProfile = () => {
    if (user?.id) {
      api.get(`/doctors/${user.id}`).then(setDoctorProfile).catch(console.error);
    }
  };

  const handleOpenPrescribeForAppt = (appt) => {
    setPrescribeTargetPatient(appt.patientId || null);
    setPrescribeApptId(appt.id || null);
    setShowPrescribeModal(true);
  };

  const handleOpenPrescribeForPatient = (patient) => {
    setPrescribeTargetPatient(patient.id || null);
    setPrescribeApptId(null);
    setShowPrescribeModal(true);
  };

  const handleOpenNewPrescription = () => {
    setPrescribeTargetPatient(null);
    setPrescribeApptId(null);
    setShowPrescribeModal(true);
  };

  const handleDoctorAddAllergy = async () => {
    if (!doctorNewAllergy.trim() || !allergyTarget) return;
    await api.post(`/patients/${allergyTarget.id}/allergies`, { allergy: doctorNewAllergy });
    setDoctorNewAllergy("");
    setAllergyTarget(null);
  };

  const fetchBloodBanks = async () => {
    try {
      const banks = await api.get("/blood-banks");
      setBloodBanks(banks || []);
    } catch (err) {
      console.error("Failed to fetch blood banks:", err);
    }
  };

  useEffect(() => {
    fetchBloodBanks();
    if (user?.id) {
      fetchDoctorProfile();
    }
  }, [user?.id]);

  return (
    <div className="space-y-6">
      {/* Doctor Prescription Action Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-[#0d6e7e] to-teal-700 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-teal-700/50">
        <div className="space-y-1">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Stethoscope size={22} className="text-teal-200" /> Clinical Dashboard · Dr. {user?.fullName || "Doctor"}
          </h2>
          <p className="text-xs text-teal-100 font-medium">
            AI-powered prescribing with HealthPilot.ai active compound allergy detection, generic drug suggestions, and Indian Medicine Dataset live pricing.
          </p>
        </div>
        <button
          onClick={handleOpenNewPrescription}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0d6e7e] rounded-xl text-xs font-black hover:bg-teal-50 hover:shadow-lg transition-all shadow-md shrink-0 self-start sm:self-auto uppercase tracking-wider"
        >
          <Pill size={16} /> Prescribe Medicine
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<Calendar size={20} className="text-blue-600" />} label="Today's Appointments" value={data?.todayAppointments ?? 0} color="bg-blue-50" />
        <StatCard icon={<Users size={20} className="text-green-600" />} label="Active Patients" value={data?.activePatients ?? 0} color="bg-green-50" />
        <StatCard icon={<FileText size={20} className="text-purple-600" />} label="Pending Prescriptions" value={data?.pendingPrescriptions ?? 0} color="bg-purple-50" />
        <StatCard icon={<FlaskConical size={20} className="text-amber-600" />} label="Lab Reviews" value={data?.pendingLabReviews ?? 0} color="bg-amber-50" />
        <StatCard icon={<Syringe size={20} className="text-teal-600" />} label="Vaccinations Given" value={data?.prescriptionsToday || 0} color="bg-teal-50" />
      </div>

      {/* Hospital Profile, Photos & Clinical Services Rate Card Widget */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0d6e7e] shrink-0 shadow-xs">
              <Building2 size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#0d6e7e] border border-teal-100">
                  Hospital & Practice Profile
                </span>
                <span className="text-xs text-gray-400">• Visible to booking patients</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mt-1 flex items-center gap-2">
                {doctorProfile?.hospital || "Hospital & Clinical Practice"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-red-500 shrink-0" />
                  <span>{doctorProfile?.hospitalAddress || doctorProfile?.location || "Hospital Address not set"}</span>
                </span>
                {doctorProfile?.hospitalPhone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-green-600 shrink-0" />
                      <span>{doctorProfile?.hospitalPhone}</span>
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setShowHospitalModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0d6e7e] text-white rounded-xl text-xs font-bold hover:bg-[#0a5566] transition-all shadow-xs"
            >
              <Building2 size={15} /> Manage Hospital & Rates
            </button>
          </div>
        </div>

        {/* Hospital Photos Thumbnails & Services Rate Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
          {/* Left: Hospital Photos Preview */}
          <div className="lg:col-span-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                <ImageIcon size={14} className="text-[#0d6e7e]" /> Hospital Photos ({doctorProfile?.hospitalImages?.length || 0})
              </span>
              <button
                onClick={() => setShowHospitalModal(true)}
                className="text-xs text-[#0d6e7e] font-semibold hover:underline flex items-center gap-1"
              >
                <Camera size={12} /> Add / Edit Photos
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(doctorProfile?.hospitalImages || []).slice(0, 3).map((img, idx) => (
                <div key={idx} className="relative h-24 rounded-xl overflow-hidden border border-gray-200 group bg-gray-100">
                  <img src={img.url} alt={img.title || "Hospital"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1 text-[10px] text-white font-medium truncate">
                    {img.title || `Photo ${idx + 1}`}
                  </div>
                </div>
              ))}
              {(!doctorProfile?.hospitalImages || doctorProfile.hospitalImages.length === 0) && (
                <div
                  onClick={() => setShowHospitalModal(true)}
                  className="col-span-3 h-24 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 text-gray-400 gap-1"
                >
                  <Camera size={20} />
                  <span className="text-xs font-medium">Upload hospital photos for patients</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Quick Rate Card summary */}
          <div className="lg:col-span-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Syringe size={14} className="text-[#0d6e7e]" /> Service Price List ({doctorProfile?.services?.length || 0} items)
              </span>
              <button
                onClick={() => setShowHospitalModal(true)}
                className="text-xs text-[#0d6e7e] font-semibold hover:underline flex items-center gap-1"
              >
                Update Rates
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-100 flex items-center justify-between">
                <div className="min-w-0 pr-1">
                  <p className="font-bold text-gray-900 truncate">Visiting / OPD Card</p>
                  <p className="text-[10px] text-gray-500">Standard fee</p>
                </div>
                <span className="font-black text-sm text-[#0d6e7e] shrink-0">₹{doctorProfile?.fee || user?.fee || 500}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div className="min-w-0 pr-1">
                  <p className="font-bold text-gray-900 truncate">Injection Fee</p>
                  <p className="text-[10px] text-gray-500">IM / IV</p>
                </div>
                <span className="font-bold text-sm text-gray-800 shrink-0">
                  ₹{doctorProfile?.services?.find(s => s.name?.toLowerCase().includes("injection"))?.price || 100}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div className="min-w-0 pr-1">
                  <p className="font-bold text-gray-900 truncate">Disposable Syringe</p>
                  <p className="text-[10px] text-gray-500">Sterile single-use</p>
                </div>
                <span className="font-bold text-sm text-gray-800 shrink-0">
                  ₹{doctorProfile?.services?.find(s => s.name?.toLowerCase().includes("syringe"))?.price || 30}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div className="min-w-0 pr-1">
                  <p className="font-bold text-gray-900 truncate">Wound Dressing</p>
                  <p className="text-[10px] text-gray-500">Antiseptic care</p>
                </div>
                <span className="font-bold text-sm text-gray-800 shrink-0">
                  ₹{doctorProfile?.services?.find(s => s.name?.toLowerCase().includes("dressing"))?.price || 250}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FlaskConical size={16} className="text-[#0d6e7e]" /> Lab Reports for Review
        </h3>
        <div className="space-y-3">
          {(data?.labReviews ?? []).length === 0 ? (
            <p className="text-sm text-gray-500 italic">No reports ready for review.</p>
          ) : (
            (data?.labReviews ?? []).map((report) => (
              <div key={report.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                  <FileText size={14} className="text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{report.patientName} — {report.testType}</p>
                  <p className="text-xs text-gray-500">Submitted on {new Date(report.createdAt).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={() => setSelectedReport(report)}
                  className="text-xs text-[#0d6e7e] font-bold hover:underline"
                >
                  Preview
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <DoctorModels onAttachReport={handleAttachReportToPrescription} />

      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 my-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FlaskConical size={20} className="text-[#0d6e7e]" /> Diagnostic Investigation Review
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedReport.patientName} — {selectedReport.testType} • {selectedReport.labName || "Diagnostic Lab"}
                </p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Patient and Lab Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Patient</p>
                  <p className="font-bold text-gray-900">{selectedReport.patientName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Age / Blood</p>
                  <p className="font-medium text-gray-700">{selectedReport.patientAge || "28"} • {selectedReport.patientBloodGroup || "O+"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Diagnostic Lab</p>
                  <p className="font-bold text-teal-800 truncate">{selectedReport.labName || "Laboratory"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Status</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block mt-0.5 ${
                    selectedReport.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-purple-100 text-purple-700"
                  }`}>
                    {selectedReport.status}
                  </span>
                </div>
              </div>

              {/* Uploaded Scan or PDF Document */}
              {(selectedReport.reportDocumentUrl || selectedReport.reportUrl || selectedReport.reportImageUrl) ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center justify-between">
                    <span>Diagnostic Scan / Report File</span>
                    <span className="text-[10px] text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                      Uploaded by Lab
                    </span>
                  </p>
                  {((selectedReport.reportDocumentUrl || selectedReport.reportUrl || "").includes('.pdf') || (selectedReport.reportDocumentUrl || selectedReport.reportUrl || "").startsWith('data:application/pdf')) ? (
                    <div className="flex flex-col items-center gap-3 py-6 bg-slate-50 rounded-2xl border border-slate-200">
                      <FileText size={40} className="text-[#0d6e7e]" />
                      <a href={selectedReport.reportDocumentUrl || selectedReport.reportUrl} target="_blank" rel="noreferrer" 
                         className="px-5 py-2 bg-[#0d6e7e] text-white rounded-xl text-xs font-bold hover:bg-[#0a5566]">
                        Open PDF Report
                      </a>
                    </div>
                  ) : (
                    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black/5 p-1">
                      <img src={selectedReport.reportDocumentUrl || selectedReport.reportUrl || selectedReport.reportImageUrl} alt="Report scan" className="w-full max-h-72 object-contain rounded-xl mx-auto" />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center py-6 text-gray-400 italic text-xs bg-slate-50 rounded-2xl border border-dashed border-gray-200">
                  No scan or report document uploaded by lab yet.
                </p>
              )}

              {/* AI Clinical Diagnostic Model Section */}
              <div className="bg-teal-50/70 p-4.5 rounded-2xl border border-teal-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain size={18} className="text-[#0d6e7e]" />
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      AI Diagnostic Model Engine
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePredictDoctorReport(selectedReport.id)}
                    disabled={predictingReport || (!selectedReport.reportUrl && !selectedReport.reportImageUrl && !selectedReport.reportDocumentUrl)}
                    className="px-3.5 py-1.5 bg-[#0d6e7e] text-white rounded-xl text-xs font-bold hover:bg-[#0a5566] disabled:opacity-50 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    {predictingReport ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" /> Analyzing Image...
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} /> Run AI Prediction
                      </>
                    )}
                  </button>
                </div>

                {/* AI Prediction Output */}
                {selectedReport.aiAnalysis && (
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-teal-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">AI Disease Classification</p>
                        <p className="text-base font-black text-gray-900">
                          {selectedReport.aiAnalysis.condition || selectedReport.aiAnalysis.prediction}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-red-50 text-red-700 border border-red-200">
                        {Math.round(selectedReport.aiAnalysis.confidence * 100)}% Confidence
                      </span>
                    </div>

                    {selectedReport.aiAnalysis.findings && (
                      <p className="text-xs text-gray-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                        <span className="font-bold text-gray-800">Clinical Findings: </span>
                        {selectedReport.aiAnalysis.findings}
                      </p>
                    )}

                    {selectedReport.aiAnalysis.secondaryConditions?.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-bold text-gray-700">Differential:</span>
                        {selectedReport.aiAnalysis.secondaryConditions.map((sc, i) => (
                          <span key={i} className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-medium text-gray-700">
                            {sc.condition} ({Math.round(sc.confidence * 100)}%)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Doctor Diagnosis Confirmation & Dual-Account Record Sync */}
                <div className="pt-2 border-t border-teal-200/60 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Doctor Confirmed Clinical Diagnosis:
                    </label>
                    <input
                      type="text"
                      value={reportDiagnosisInput || (selectedReport.confirmedDiagnosis || "")}
                      onChange={(e) => setReportDiagnosisInput(e.target.value)}
                      placeholder="e.g. Community-Acquired Pneumonia (Lower Lobe)"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#0d6e7e]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Clinical Remarks & Prescription Linkage:
                    </label>
                    <textarea
                      rows={2}
                      value={reportNotesInput}
                      onChange={(e) => setReportNotesInput(e.target.value)}
                      placeholder="e.g. Opacity verified. Prescribed course of Azithromycin + symptomatic bronchodilator."
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#0d6e7e] resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleConfirmDoctorReport(selectedReport.id)}
                    disabled={confirmingReport || (!reportDiagnosisInput && !selectedReport.confirmedDiagnosis)}
                    className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    {confirmingReport ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Saving to Records...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} /> Confirm Diagnosis & Sync to Both Accounts
                      </>
                    )}
                  </button>

                  {selectedReport.status === "completed" && (
                    <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-xl text-center text-xs font-bold text-emerald-900 flex items-center justify-center gap-2">
                      <Check size={16} className="text-emerald-700" />
                      <span>Diagnosis Confirmed & Synced to Patient & Doctor Accounts: {selectedReport.confirmedDiagnosis}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Droplet size={16} className="text-red-600" /> Available Blood Banks
          </h3>
          <Link href="/blood-bank" className="text-xs text-[#0d6e7e] hover:underline font-bold">View All →</Link>
        </div>
        {bloodBanks.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No blood banks available.</p>
        ) : (
          <div className="space-y-3">
            {bloodBanks.map((bank) => (
              <div key={bank.id} className="p-3 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 border border-red-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{bank.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{bank.location}</p>
                  </div>
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Preview</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {Object.entries(bank.stock || {}).map(([group, count]) => {
                    const status = count === 0 ? "bg-red-100 text-red-700" : count < 10 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700";
                    return (
                      <div key={group} className={`p-2 rounded-lg ${status}`}>
                        <p className="text-xs font-semibold">{group}</p>
                        <p className="text-xs font-bold">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-[#0d6e7e]" /> Today's Schedule
        </h3>
        <div className="space-y-2">
          {(data?.schedule ?? []).map((appt, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-teal-50 transition-colors">
              <div className="text-sm font-medium text-[#0d6e7e] w-20 shrink-0">{appt.time}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{appt.patientName}</p>
                <p className="text-xs text-gray-500 capitalize">{appt.type} visit</p>
                {appt.notes && <p className="text-[10px] text-teal-600 mt-1 font-medium italic truncate">Symptoms: {appt.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  appt.status === "confirmed" ? "bg-green-100 text-green-700" :
                  appt.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                }`}>{appt.status}</span>
                <button
                  onClick={() => handleOpenPrescribeForAppt(appt)}
                  className="px-2.5 py-1 bg-[#0d6e7e] text-white rounded-lg text-xs font-bold hover:bg-[#0a5566] transition-colors flex items-center gap-1 shadow-xs"
                  title="Prescribe Medicine"
                >
                  <Pill size={12} /> Prescribe
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users size={16} className="text-[#0d6e7e]" /> Recent Patients
        </h3>
        <div className="space-y-2">
          {(data?.recentPatients ?? []).map((p, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-[#0d6e7e] flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-medium">{p.name.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-500">{p.condition}</p>
                {p.symptoms && <p className="text-[10px] text-teal-600 mt-1 font-medium italic truncate">Symptoms: {p.symptoms}</p>}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400 mr-1">{p.lastVisit}</p>
                <button 
                  onClick={() => handleOpenPrescribeForPatient(p)}
                  className="px-2 py-1 bg-teal-50 text-[#0d6e7e] hover:bg-teal-100 rounded-lg border border-teal-100 transition-all text-xs font-bold flex items-center gap-1"
                  title="Prescribe Medicine"
                >
                  <Pill size={12} /> Prescribe
                </button>
                <button 
                  onClick={() => setAllergyTarget(p)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all"
                  title="Add Known Allergy"
                >
                  <AlertTriangle size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/appointments" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-teal-200 transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800 text-sm">Schedule</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 group-hover:text-teal-600" />
        </Link>
        <Link href="/vaccinations" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-teal-200 transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
              <Syringe size={20} className="text-teal-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800 text-sm">Vaccination Registry</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 group-hover:text-teal-600" />
        </Link>
        <Link href="/patients" className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-teal-200 transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800 text-sm">Patient List</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 group-hover:text-teal-600" />
        </Link>
      </div>

      {allergyTarget && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Add Allergy</h3>
            <button onClick={() => setAllergyTarget(null)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Add a known allergy for <span className="font-semibold text-gray-700">{allergyTarget.name}</span>.</p>
          <input 
            type="text"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl mb-4 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            placeholder="Allergy name (e.g. Aspirin)"
            value={doctorNewAllergy}
            onChange={(e) => setDoctorNewAllergy(e.target.value)}
          />
          <button 
            onClick={handleDoctorAddAllergy}
            className="w-full py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-900/10"
          >
            Update Patient Safety Record
          </button>
        </div>
      </div>
      )}

      {/* Doctor Prescription Console Modal */}
      <PrescriptionModal
        isOpen={showPrescribeModal}
        onClose={() => {
          setShowPrescribeModal(false);
          setAttachedAiReport(null);
        }}
        initialPatientId={prescribeTargetPatient}
        appointmentId={prescribeApptId}
        doctor={user}
        initialAttachedReport={attachedAiReport}
        onPrescriptionCreated={() => {
          fetchDoctorProfile();
        }}
      />

      {/* Doctor Hospital Profile & Rate Card Editor Modal */}
      {showHospitalModal && (
        <DoctorHospitalProfileModal
          isOpen={showHospitalModal}
          onClose={() => setShowHospitalModal(false)}
          initialDoctorId={user?.id}
          onProfileUpdated={(updated) => {
            setDoctorProfile(updated);
            fetchDoctorProfile();
          }}
        />
      )}
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apptView, setApptView] = useState("today"); // "today" | "recent"
  
  // Telegram Bot & Broadcast states
  const [telegramStatus, setTelegramStatus] = useState(null);
  const [showBotModal, setShowBotModal] = useState(false);
  const [botTokenInput, setBotTokenInput] = useState("");
  const [defaultChatIdInput, setDefaultChatIdInput] = useState("");
  const [testChatId, setTestChatId] = useState("");
  const [savingBot, setSavingBot] = useState(false);
  const [testingBot, setTestingBot] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const [dispatchResult, setDispatchResult] = useState(null);

  const [broadcast, setBroadcast] = useState({
    title: "👶 Pulse Polio Immunization Drive (Children Age 0-5) — Pandharpur",
    message: `Dear Parents & Citizens,

The Government Pulse Polio Immunization Drive is now active for all children aged 0 to 5 years. Ensure your child receives two drops of life (Oral Polio Vaccine - OPV).

🏥 Center: Pandharpur Municipal Council Hospital (Government Hospital)
📍 Address: Chouphala, Pandharpur, Maharashtra - 413304
🗺️ GPS Map: https://maps.google.com/?q=Pandharpur+Municipal+Council+Hospital+Chouphala+Pandharpur
📞 Hospital Helpline: 02186 223 147
⏰ Timings: 09:00 AM – 05:00 PM
💵 Cost: 100% Free under National Immunization Mission

Please bring your child's immunization card. Two drops of life for a polio-free future!`,
    targetType: "all", // "all" | "patients" | "doctors" | "specific" | "custom_chat"
    targetUserId: "",
    customChatId: "",
    priority: "urgent",
    sendTelegram: true,
    sendInApp: true
  });
  const [sending, setSending] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const fetchStats = () => {
    setLoading(true);
    api.get("/admin/stats")
      .then((data) => {
        setStats(data);
        if ((!data?.todayAppointments || data.todayAppointments.length === 0) && data?.recentAppointments?.length > 0) {
          setApptView("recent");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchTelegramStatus = () => {
    api.get("/admin/telegram/status")
      .then((data) => {
        setTelegramStatus(data);
        if (data.defaultChatId && !defaultChatIdInput) {
          setDefaultChatIdInput(data.defaultChatId);
        }
      })
      .catch(console.error);
  };

  const fetchUsersList = () => {
    api.get("/admin/users-list")
      .then(setUsersList)
      .catch(console.error);
  };

  const fetchBroadcastHistory = () => {
    api.get("/admin/broadcast/history")
      .then(setBroadcastHistory)
      .catch(console.error);
  };

  useEffect(() => {
    fetchStats();
    fetchTelegramStatus();
    fetchUsersList();
  }, []);

  const handleSaveBotConfig = async (e) => {
    e.preventDefault();
    if (!botTokenInput.trim()) {
      alert("Please enter your Telegram Bot Token from @BotFather.");
      return;
    }
    setSavingBot(true);
    setTestResult(null);
    try {
      const res = await api.post("/admin/telegram/config", {
        botToken: botTokenInput.trim(),
        defaultChatId: defaultChatIdInput.trim()
      });
      alert(res.message || "Telegram Bot connected successfully!");
      fetchTelegramStatus();
      setShowBotModal(false);
      setBotTokenInput("");
    } catch (err) {
      alert(err.message || "Failed to validate Bot Token. Ensure you copied the exact token from @BotFather.");
    } finally {
      setSavingBot(false);
    }
  };

  const handleTestBot = async () => {
    setTestingBot(true);
    setTestResult(null);
    try {
      const res = await api.post("/admin/telegram/test", {
        chatId: testChatId.trim() || defaultChatIdInput.trim()
      });
      setTestResult({ success: true, message: res.message });
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTestingBot(false);
    }
  };

  const handleLinkUserTelegram = async (userId, chatId) => {
    if (!chatId) return;
    try {
      await api.patch(`/users/${userId}/telegram`, { telegramChatId: chatId });
      fetchUsersList();
      alert(`Telegram Chat ID ${chatId} linked to user #${userId} successfully!`);
    } catch (err) {
      console.error(err);
      alert("Failed to link Telegram Chat ID.");
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcast.message.trim()) {
      alert("Please enter a message to broadcast.");
      return;
    }
    if (broadcast.targetType === "specific" && !broadcast.targetUserId) {
      alert("Please select a specific recipient user.");
      return;
    }
    if (broadcast.targetType === "custom_chat" && !broadcast.customChatId.trim()) {
      alert("Please enter a destination Telegram Chat ID.");
      return;
    }

    setSending(true);
    setDispatchResult(null);
    try {
      const res = await api.post("/admin/broadcast", broadcast);
      setDispatchResult(res);
      alert(`Message dispatched!\n• Telegram: ${res.telegramDelivered} delivered (${res.telegramFailed} failed)\n• In-App: ${res.inAppCreated} sent`);
      setBroadcast(prev => ({ ...prev, title: "", message: "" }));
      fetchBroadcastHistory();
    } catch (err) {
      console.error(err);
      alert(`Broadcast error: ${err.message || "Failed to send message"}`);
    } finally {
      setSending(false);
    }
  };

  const totalPatients = stats?.totalPatients || 1;
  const vaccinatedCount = stats?.vaccinatedPeopleCount ?? 0;
  const vaxPercentage = Math.min(100, Math.round((vaccinatedCount / totalPatients) * 100));

  const displayedAppointments = apptView === "today" 
    ? (stats?.todayAppointments || []) 
    : (stats?.recentAppointments || []);

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "confirmed") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Confirmed
        </span>
      );
    }
    if (s === "completed") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <CheckCircle2 size={12} className="text-blue-600" />
          Completed
        </span>
      );
    }
    if (s === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock size={12} className="text-amber-600" />
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        Cancelled
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Quick Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Doctors</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalDoctors ?? "—"}</p>
              <p className="text-xs text-blue-600 font-medium mt-1">
                {stats?.activeDoctors ? `${stats.activeDoctors} Active on duty` : "Hospital network"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
              <Stethoscope size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalPatients?.toLocaleString() ?? "—"}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">Registered in system</p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
              <Users size={20} />
            </div>
          </div>
        </div>

        {/* Appointments Today Real Tracker Card */}
        <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl p-5 shadow-sm border border-teal-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider">Appointments Today</p>
              </div>
              <p className="text-2xl font-black text-teal-900 mt-1">{stats?.appointmentsToday ?? 0}</p>
              <p className="text-xs text-teal-700 font-medium mt-1">
                {stats?.totalAppointments ?? 0} total bookings recorded
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-teal-600 text-white shadow-sm">
              <Calendar size={20} />
            </div>
          </div>
        </div>

        {/* Real Vaccination Status KPI Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-5 shadow-sm border border-indigo-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">People Vaccinated</p>
              <p className="text-2xl font-black text-indigo-950 mt-1">
                {stats?.vaccinatedPeopleCount ?? 0}
                <span className="text-sm font-normal text-gray-500"> / {stats?.totalPatients ?? 0}</span>
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-20 bg-indigo-100 rounded-full h-1.5">
                  <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${vaxPercentage}%` }}></div>
                </div>
                <span className="text-xs font-bold text-indigo-700">{vaxPercentage}%</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-600 text-white shadow-sm">
              <Syringe size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Real-time Patient Appointment Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-50/50 via-white to-teal-50/20">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar size={20} className="text-[#0d6e7e]" />
                Patient Appointment Status
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                {stats?.appointmentsToday ?? 0} Today
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Live status of patients who took appointments today and recent bookings across clinics
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View switcher tabs */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setApptView("today")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  apptView === "today" 
                    ? "bg-white text-teal-800 shadow-sm font-bold" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Today ({stats?.todayAppointments?.length ?? stats?.appointmentsToday ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setApptView("recent")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  apptView === "recent" 
                    ? "bg-white text-teal-800 shadow-sm font-bold" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All Recent ({stats?.recentAppointments?.length ?? 0})
              </button>
            </div>

            <Link 
              href="/appointments"
              className="px-3 py-1.5 text-xs font-bold text-[#0d6e7e] hover:text-[#0a5566] bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors flex items-center gap-1"
            >
              All Appointments →
            </Link>
          </div>
        </div>

        {/* Appointment Status Quick Counter Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-gray-50/60 border-b border-gray-100 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-gray-600">Confirmed:</span>
            <strong className="text-gray-900 font-bold">{stats?.appointmentStatusCounts?.confirmed ?? 0}</strong>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-100">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-gray-600">Pending:</span>
            <strong className="text-gray-900 font-bold">{stats?.appointmentStatusCounts?.pending ?? 0}</strong>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-100">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span className="text-gray-600">Completed:</span>
            <strong className="text-gray-900 font-bold">{stats?.appointmentStatusCounts?.completed ?? 0}</strong>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-100">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-gray-600">Cancelled:</span>
            <strong className="text-gray-900 font-bold">{stats?.appointmentStatusCounts?.cancelled ?? 0}</strong>
          </div>
        </div>

        {/* Appointment List / Table */}
        <div className="overflow-x-auto">
          {displayedAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500 space-y-3">
              <Calendar size={36} className="mx-auto text-gray-300" />
              <p className="text-sm font-medium">No appointments found for {apptView === "today" ? "today" : "the selected view"}.</p>
              {apptView === "today" && (
                <button
                  type="button"
                  onClick={() => setApptView("recent")}
                  className="text-xs text-[#0d6e7e] font-semibold underline hover:text-[#0a5566]"
                >
                  View all recent patient bookings ({stats?.recentAppointments?.length ?? 0})
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-5">Patient</th>
                  <th className="py-3 px-5">Assigned Doctor</th>
                  <th className="py-3 px-5">Date & Time</th>
                  <th className="py-3 px-5">Consultation Type</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {displayedAppointments.map((appt) => {
                  const isToday = appt.date === todayStr;
                  return (
                    <tr key={appt.id || appt._id} className="hover:bg-teal-50/30 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                            {(appt.patientName || "P")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                              {appt.patientName || `Patient #${appt.patientId || "—"}`}
                            </p>
                            <p className="text-[11px] text-gray-400">ID: {appt.patientId || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <p className="font-medium text-gray-800 text-xs sm:text-sm">
                          {appt.doctorName || `Doctor #${appt.doctorId || "—"}`}
                        </p>
                        {appt.notes && (
                          <p className="text-[11px] text-gray-400 truncate max-w-[200px]" title={appt.notes}>
                            Note: {appt.notes}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800 text-xs">{appt.date}</p>
                          {isToday && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-600 text-white uppercase tracking-wider">
                              Today
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">{appt.time || "Regular Slot"}</p>
                      </td>
                      <td className="py-3 px-5">
                        <span className="capitalize px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                          {appt.type || "General"}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        {getStatusBadge(appt.status)}
                      </td>
                      <td className="py-3 px-5 text-right font-semibold text-gray-800 text-xs sm:text-sm">
                        ₹{appt.fee ?? 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SECTION 2: Real Vaccination Status & Coverage */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-50/50 via-white to-indigo-50/20">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Syringe size={20} className="text-indigo-600" />
                Vaccination Coverage & Patient Status
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                {stats?.vaccinatedPeopleCount ?? 0} People Vaccinated
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Immunization records, dose tracking, and patient vaccination compliance across the network
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/vaccinations"
              className="px-3 py-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1"
            >
              Open Vaccination Center →
            </Link>
          </div>
        </div>

        {/* Vaccination Key Metrics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-gradient-to-br from-indigo-50/30 to-purple-50/20 border-b border-gray-100">
          <div className="bg-white rounded-xl p-4 border border-indigo-100/60 shadow-sm">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">People Vaccinated</p>
            <p className="text-2xl font-black text-indigo-900 mt-1">{stats?.vaccinatedPeopleCount ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">Verified patient recipients</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-indigo-100/60 shadow-sm">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Doses Administered</p>
            <p className="text-2xl font-black text-indigo-900 mt-1">{stats?.totalVaccinations ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">Injections recorded</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-indigo-100/60 shadow-sm">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Immunization Rate</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{vaxPercentage}%</p>
            <p className="text-xs text-gray-400 mt-0.5">Of {stats?.totalPatients ?? 0} total patients</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-indigo-100/60 shadow-sm">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Pending / Unvaccinated</p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {Math.max(0, (stats?.totalPatients ?? 0) - (stats?.vaccinatedPeopleCount ?? 0))}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Awaiting vaccination</p>
          </div>
        </div>

        {/* Real Vaccination Records Table */}
        <div className="overflow-x-auto">
          {(!stats?.recentVaccinations || stats.recentVaccinations.length === 0) ? (
            <div className="p-8 text-center text-gray-500 space-y-3">
              <Syringe size={36} className="mx-auto text-gray-300" />
              <p className="text-sm font-medium">No vaccination records found.</p>
              <Link 
                href="/vaccinations"
                className="inline-block text-xs text-indigo-600 font-semibold underline hover:text-indigo-800"
              >
                Record patient vaccination now
              </Link>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-5">Vaccinated Patient</th>
                  <th className="py-3 px-5">Vaccine Administered</th>
                  <th className="py-3 px-5">Manufacturer & Batch</th>
                  <th className="py-3 px-5">Administered By</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {stats.recentVaccinations.map((vax) => (
                  <tr key={vax.id || vax._id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                          {(vax.patientName || "P")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                            {vax.patientName || `Patient #${vax.patientId}`}
                          </p>
                          <p className="text-[11px] text-gray-400">ID: {vax.patientId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Syringe size={12} className="text-indigo-500" />
                        {vax.vaccineName || "COVID-19 Vaccine"}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <p className="font-medium text-gray-800 text-xs">{vax.company || "Manufacturer"}</p>
                      <p className="text-[11px] text-gray-400 font-mono">Batch: {vax.batchNo || "N/A"}</p>
                    </td>
                    <td className="py-3 px-5">
                      <p className="text-xs font-medium text-gray-800">{vax.administeredBy || "Attending Physician"}</p>
                      <p className="text-[11px] text-gray-400">{vax.type || "Injection"}</p>
                    </td>
                    <td className="py-3 px-5 text-xs text-gray-600 font-medium">
                      {vax.date || "—"}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck size={13} className="text-emerald-600" />
                        Administered
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Telegram Bot & Broadcast Announcement Console */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Strip with Telegram Bot Status */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-900/5 via-teal-50/20 to-sky-50/30">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
                <Bot size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  Telegram Bot & Broadcast Console
                </h2>
                <p className="text-xs text-gray-500">
                  Dispatch hospital announcements and targeted clinical alerts to all users or specific patients via Telegram
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Telegram Bot Connection Pill */}
            {telegramStatus?.configured && telegramStatus?.botInfo?.ok ? (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>@{telegramStatus.botInfo.bot.username}</span>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded uppercase font-extrabold">Active</span>
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Bot Token Not Set</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                setBotTokenInput("");
                setDefaultChatIdInput(telegramStatus?.defaultChatId || "");
                setShowBotModal(true);
              }}
              className="px-3 py-1.5 text-xs font-bold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Settings size={14} />
              Configure Bot
            </button>

            <button
              type="button"
              onClick={() => {
                fetchBroadcastHistory();
                setShowHistoryModal(true);
              }}
              className="px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Clock size={14} />
              Logs ({broadcastHistory.length})
            </button>
          </div>
        </div>

        {/* Telegram Configuration Callout if not configured */}
        {(!telegramStatus?.configured || !telegramStatus?.botInfo?.ok) && (
          <div className="p-4 bg-gradient-to-r from-sky-50 to-teal-50 border-b border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-sky-900">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-sky-600 shrink-0" />
              <span>
                <strong>Want to connect your Telegram Bot?</strong> Create one in 30 seconds via Telegram's <strong>@BotFather</strong> and paste the token to begin instant messaging!
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowBotModal(true)}
              className="px-3 py-1 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 shrink-0 self-start sm:self-auto transition-colors"
            >
              Setup Bot Token →
            </button>
          </div>
        )}

        {/* Dispatcher Form & Live Simulation Split */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Dispatch Composer Form (7 cols) */}
          <form onSubmit={handleBroadcast} className="lg:col-span-7 space-y-4">
            {/* Target Audience Tabs */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Recipient Audience
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "all", label: "All Users", desc: "Broadcast to all", icon: Users },
                  { id: "patients", label: "Patients", desc: "All registered patients", icon: User },
                  { id: "doctors", label: "Doctors", desc: "All medical staff", icon: Stethoscope },
                  { id: "specific", label: "Specific User", desc: "Target 1 patient/doctor", icon: MessageSquare },
                  { id: "custom_chat", label: "Direct Chat ID", desc: "Custom Telegram ID", icon: Send },
                ].map((tgt) => {
                  const isSelected = broadcast.targetType === tgt.id;
                  const IconComp = tgt.icon;
                  return (
                    <button
                      key={tgt.id}
                      type="button"
                      onClick={() => setBroadcast({ ...broadcast, targetType: tgt.id })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? "border-teal-500 bg-teal-50/50 ring-2 ring-teal-200" 
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <IconComp size={14} className={isSelected ? "text-teal-700" : "text-gray-500"} />
                        <span className={`text-xs font-bold ${isSelected ? "text-teal-900" : "text-gray-800"}`}>
                          {tgt.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">{tgt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* If Specific User is Selected */}
            {broadcast.targetType === "specific" && (
              <div className="p-4 rounded-xl bg-teal-50/40 border border-teal-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-teal-900">Select Recipient Patient / Doctor</label>
                  <span className="text-[11px] text-teal-700">{usersList.length} users available</span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search user by name or role..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-teal-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 mb-2"
                  />
                  <select
                    value={broadcast.targetUserId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const foundUser = usersList.find(u => String(u.id) === selectedId);
                      setBroadcast({
                        ...broadcast,
                        targetUserId: selectedId,
                        customChatId: foundUser?.telegramChatId || ""
                      });
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-teal-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  >
                    <option value="">-- Choose Patient or Doctor --</option>
                    {usersList
                      .filter(u => !userSearch || (u.fullName || "").toLowerCase().includes(userSearch.toLowerCase()) || (u.role || "").toLowerCase().includes(userSearch.toLowerCase()))
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.fullName || `User #${u.id}`} ({u.role || "patient"}) {u.telegramChatId ? `— Telegram Linked: ${u.telegramChatId}` : "— No Telegram"}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Show status of selected user */}
                {broadcast.targetUserId && (() => {
                  const selectedUser = usersList.find(u => String(u.id) === String(broadcast.targetUserId));
                  return (
                    <div className="p-3 bg-white rounded-lg border border-teal-100 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <strong className="text-gray-900">{selectedUser?.fullName}</strong>
                          <span className="ml-2 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-100 text-gray-700">
                            {selectedUser?.role}
                          </span>
                        </div>
                        {selectedUser?.telegramChatId ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 size={13} /> Telegram: {selectedUser.telegramChatId}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-semibold flex items-center gap-1">
                            <AlertTriangle size={13} /> No Telegram Chat ID
                          </span>
                        )}
                      </div>

                      {/* Option to link or edit chat id */}
                      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                        <span className="text-[11px] text-gray-500 whitespace-nowrap">Telegram Chat ID:</span>
                        <input
                          type="text"
                          placeholder="e.g. 123456789"
                          value={broadcast.customChatId}
                          onChange={(e) => setBroadcast({ ...broadcast, customChatId: e.target.value })}
                          className="px-2 py-1 text-xs border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-teal-500 flex-1 font-mono"
                        />
                        {broadcast.customChatId && broadcast.customChatId !== selectedUser?.telegramChatId && (
                          <button
                            type="button"
                            onClick={() => handleLinkUserTelegram(selectedUser?.id, broadcast.customChatId)}
                            className="px-2.5 py-1 text-[11px] bg-teal-600 text-white font-bold rounded-md hover:bg-teal-700"
                          >
                            Save to Profile
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Quick pick from recent bot senders */}
                {telegramStatus?.recentSenders?.length > 0 && (
                  <div className="pt-2 border-t border-teal-100">
                    <p className="text-[11px] text-teal-800 font-semibold mb-1">
                      Recent Bot Senders (users who messaged the bot):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {telegramStatus.recentSenders.map(s => (
                        <button
                          key={s.chat_id}
                          type="button"
                          onClick={() => {
                            setBroadcast({ ...broadcast, customChatId: s.chat_id });
                            if (broadcast.targetUserId) {
                              handleLinkUserTelegram(broadcast.targetUserId, s.chat_id);
                            }
                          }}
                          className="px-2 py-1 rounded bg-white hover:bg-teal-100 border border-teal-200 text-[11px] text-teal-900 font-medium flex items-center gap-1 transition-colors"
                        >
                          <span>{s.name}</span>
                          <span className="text-gray-400 font-mono">({s.chat_id})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If Direct Custom Chat ID is Selected */}
            {broadcast.targetType === "custom_chat" && (
              <div className="p-4 rounded-xl bg-sky-50/40 border border-sky-100 space-y-2">
                <label className="text-xs font-bold text-sky-900 block">Destination Telegram Chat ID</label>
                <input
                  type="text"
                  placeholder="e.g. 987654321 or -1001234567890 (Channel/Group)"
                  value={broadcast.customChatId}
                  onChange={(e) => setBroadcast({ ...broadcast, customChatId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-sky-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />

                {telegramStatus?.recentSenders?.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[11px] text-sky-800 font-semibold mb-1">Quick Select from Recent Bot Senders:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {telegramStatus.recentSenders.map(s => (
                        <button
                          key={s.chat_id}
                          type="button"
                          onClick={() => setBroadcast({ ...broadcast, customChatId: s.chat_id })}
                          className="px-2 py-1 rounded bg-white hover:bg-sky-100 border border-sky-200 text-[11px] text-sky-900 font-medium flex items-center gap-1 transition-colors"
                        >
                          <span>{s.name}</span>
                          <span className="text-gray-400 font-mono">({s.chat_id})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Presets / Templates */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} className="text-teal-600" />
                  Quick Presets & Templates
                </label>
                <span className="text-[11px] text-gray-400">Click to auto-fill</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBroadcast({
                      ...broadcast,
                      title: "👶 Pulse Polio Immunization Drive (Children Age 0-5) — Pandharpur",
                      priority: "urgent",
                      message: `Dear Parents & Citizens,\n\nThe Government Pulse Polio Immunization Drive is now active for all children aged 0 to 5 years. Ensure your child receives two drops of life (Oral Polio Vaccine - OPV).\n\n🏥 Center: Pandharpur Municipal Council Hospital (Government Hospital)\n📍 Address: Chouphala, Pandharpur, Maharashtra - 413304\n🗺️ GPS Map: https://maps.google.com/?q=Pandharpur+Municipal+Council+Hospital+Chouphala+Pandharpur\n📞 Hospital Helpline: 02186 223 147\n⏰ Timings: 09:00 AM – 05:00 PM\n💵 Cost: 100% Free under National Immunization Mission\n\nPlease bring your child's immunization card. Two drops of life for a polio-free future!`
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <span>👶 Polio Vaccine Drive (Pandharpur Govt Hospital)</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-800 text-[10px] font-extrabold uppercase">Preset</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBroadcast({
                      ...broadcast,
                      title: "🩸 Urgent Blood Donation Request — O- / B+ Donors",
                      priority: "urgent",
                      message: `Urgent requirement for blood donors at Pandharpur Municipal Council Hospital Blood Bank.\n\n📍 Location: Chouphala, Pandharpur\n📞 Contact: 02186 223 147\nEligible donors are requested to report immediately.`
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700 transition-colors"
                >
                  🩸 Blood Donor Appeal
                </button>
              </div>
            </div>

            {/* Announcement Title & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hospital Schedule Update / Camp Notice"
                  value={broadcast.title}
                  onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Priority
                </label>
                <select
                  value={broadcast.priority}
                  onChange={(e) => setBroadcast({ ...broadcast, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-500 font-medium bg-white"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">🚨 Urgent</option>
                </select>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Message Content
              </label>
              <textarea
                placeholder="Write message details for patients and doctors. Telegram bold, clinical guidelines, or general instructions..."
                rows={4}
                value={broadcast.message}
                onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-500 resize-none font-normal leading-relaxed"
              />
            </div>

            {/* Delivery Channels Checklist & Submit Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={broadcast.sendTelegram}
                    onChange={(e) => setBroadcast({ ...broadcast, sendTelegram: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                  />
                  <span>Send via Telegram Bot</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={broadcast.sendInApp}
                    onChange={(e) => setBroadcast({ ...broadcast, sendInApp: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                  />
                  <span>Send In-App Notification</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={sending || !broadcast.message.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-[#0d6e7e] to-[#0a5566] text-white rounded-xl font-bold text-xs sm:text-sm hover:from-[#0a5566] hover:to-[#084452] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {sending ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>
                      {broadcast.targetType === "specific" ? "Send to Selected User" : "Send Announcement"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right Column: Live Telegram Message Phone Mockup (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-sky-900/5 via-sky-50/20 to-teal-50/30 border border-sky-100/80">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-sky-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    ✈️
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      {telegramStatus?.botInfo?.bot?.first_name || "MediCore Bot"}
                    </p>
                    <p className="text-[10px] text-sky-600 font-medium">Telegram Preview</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-gray-400">Live Simulation</span>
              </div>

              {/* Realistic Telegram Message Bubble */}
              <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-sky-100 space-y-2 relative text-left">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-800">
                  <span>{broadcast.priority === "urgent" ? "🚨" : "🏥"}</span>
                  <span>MediCore HMS — Announcement</span>
                  {broadcast.priority === "urgent" && (
                    <span className="text-[10px] px-1 bg-red-100 text-red-700 rounded uppercase font-extrabold">
                      Urgent
                    </span>
                  )}
                </div>

                {broadcast.title && (
                  <p className="font-bold text-gray-900 text-xs sm:text-sm">
                    {broadcast.title}
                  </p>
                )}

                <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {broadcast.message || "Your message text will appear here in real-time as you type..."}
                </p>

                <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400 italic">
                  <span>Dispatched by: MediCore Super Admin</span>
                  <span className="text-sky-600 font-semibold">Just now ✓✓</span>
                </div>
              </div>
            </div>

            {/* Quick tips & Bot Username Link */}
            <div className="mt-4 pt-3 border-t border-sky-100 text-[11px] text-gray-500 space-y-1.5">
              <p className="font-semibold text-gray-800 flex items-center gap-1">
                <Info size={12} className="text-sky-600" /> Telegram Linking Tip:
              </p>
              <p className="text-[11px] leading-tight text-gray-500">
                To receive alerts, a user searches your bot in Telegram and clicks <strong>/start</strong>. Their Chat ID appears automatically in the Recent Senders dropdown.
              </p>
              {telegramStatus?.botInfo?.bot?.username && (
                <a
                  href={`https://t.me/${telegramStatus.botInfo.bot.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-900 font-bold underline text-[11px] pt-1"
                >
                  Open @{telegramStatus.botInfo.bot.username} on Telegram ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Telegram Bot Configuration & BotFather Setup */}
      {showBotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Configure Telegram Bot</h3>
                  <p className="text-xs text-gray-500">Connect your BotFather API Token</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBotModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 text-xs text-teal-950 space-y-2">
              <p className="font-bold text-teal-900 flex items-center gap-1">
                <Sparkles size={14} className="text-teal-600" />
                How to create your Bot in BotFather:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-teal-900/90 leading-relaxed">
                <li>Open Telegram and search for <strong>@BotFather</strong> (or open <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="underline font-bold text-teal-700">t.me/BotFather</a>).</li>
                <li>Send the command: <code className="bg-teal-100 px-1 py-0.5 rounded font-mono font-bold">/newbot</code></li>
                <li>Enter a friendly name for your bot (e.g., <em>MediCore Hospital Alerts</em>).</li>
                <li>Choose a username ending in <code className="bg-teal-100 px-1 rounded font-mono">bot</code> (e.g., <em>medicore_hms_bot</em>).</li>
                <li>BotFather will reply with an <strong>HTTP API Token</strong> (e.g. <code className="bg-teal-100 px-1 rounded font-mono">7123456789:AAH...</code>). Copy and paste it below!</li>
              </ol>
            </div>

            <form onSubmit={handleSaveBotConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Telegram Bot Token *
                </label>
                <input
                  type="text"
                  placeholder="Paste token from @BotFather (e.g. 7123456789:AAH...)"
                  value={botTokenInput}
                  onChange={(e) => setBotTokenInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm font-mono outline-none focus:ring-2 focus:ring-teal-500"
                />
                {telegramStatus?.botTokenMasked && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Current active token: <code className="font-mono text-gray-600">{telegramStatus.botTokenMasked}</code>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Default Broadcast Chat ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. -1001234567890 (Channel or Group ID to always receive all broadcasts)"
                  value={defaultChatIdInput}
                  onChange={(e) => setDefaultChatIdInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm font-mono outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Leave empty if you only want to send to individual patient accounts.
                </p>
              </div>

              {/* Bot Test Tool */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 space-y-2">
                <label className="block text-xs font-bold text-gray-800">
                  Send Test Ping to Verify Integration
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter your personal Telegram Chat ID to test"
                    value={testChatId}
                    onChange={(e) => setTestChatId(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestBot}
                    disabled={testingBot || (!testChatId && !defaultChatIdInput)}
                    className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-bold hover:bg-black disabled:opacity-50 shrink-0"
                  >
                    {testingBot ? "Testing..." : "Send Test Ping"}
                  </button>
                </div>
                {testResult && (
                  <p className={`text-xs font-semibold ${testResult.success ? "text-emerald-600" : "text-rose-600"}`}>
                    {testResult.success ? `✅ ${testResult.message}` : `❌ ${testResult.message}`}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowBotModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBot || !botTokenInput.trim()}
                  className="px-5 py-2 bg-[#0d6e7e] text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-[#0a5566] disabled:opacity-50"
                >
                  {savingBot ? "Connecting..." : "Connect & Save Bot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Broadcast Transmission History */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-100 space-y-4 relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Broadcast & Dispatch History</h3>
                  <p className="text-xs text-gray-500">Record of recent announcements and targeted messages</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {broadcastHistory.length === 0 ? (
              <p className="text-center py-8 text-gray-500 text-xs">No broadcast transmissions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {broadcastHistory.map((item, idx) => (
                  <div key={item.id || item._id || idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <strong className="text-gray-900 text-sm">{item.title || "Hospital Announcement"}</strong>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-100 text-teal-800">
                            Target: {item.targetType}
                          </span>
                          <span className="text-gray-400 text-[11px]">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Recent"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                          <CheckCircle2 size={12} /> {item.telegramDelivered || 0} Telegram
                        </span>
                        <p className="text-[10px] text-gray-400">{item.inAppCreated || 0} in-app</p>
                      </div>
                    </div>
                    <p className="text-gray-700 bg-white p-2.5 rounded-lg border border-gray-100 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clinical Operations Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Prescriptions Issued</p>
          <p className="text-3xl font-bold text-gray-800">{stats?.prescriptionsToday ?? "—"}</p>
          <Link href="/prescriptions" className="text-xs text-[#0d6e7e] hover:underline mt-2 block font-medium">View all prescriptions →</Link>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Pending Lab Reports</p>
          <p className="text-3xl font-bold text-gray-800">{stats?.pendingLabReports ?? "—"}</p>
          <Link href="/lab" className="text-xs text-[#0d6e7e] hover:underline mt-2 block font-medium">View laboratory requests →</Link>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Affiliated Facilities</p>
          <p className="text-3xl font-bold text-gray-800">{stats?.totalFacilities ?? 34}</p>
          <Link href="/locations" className="text-xs text-[#0d6e7e] hover:underline mt-2 block font-medium">View location distribution →</Link>
        </div>
      </div>
    </div>
  );
}

function LabDashboard() {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const fetchRequests = () => api.get("/lab/requests").then(setRequests).catch(console.error);
  useEffect(() => { fetchRequests(); }, []);

  const uploadReportDocument = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedRequest) return;
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assetType", "lab_report");
      formData.append("labRequestId", String(selectedRequest.id));
      const uploaded = await api.upload("/uploads", formData);
      await fetchRequests();
      setSelectedRequest({ ...selectedRequest, reportDocumentUrl: uploaded.url, reportUrl: uploaded.url, uploadId: uploaded.id });
    } catch (error) {
      console.error(error);
    }
    setUploadingDoc(false);
  };

  const markReady = async () => {
    if (!selectedRequest) return;
    try {
      await api.post(`/lab/requests/${selectedRequest.id}/report`, { reportUrl: selectedRequest.reportDocumentUrl });
      await fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error(error);
    }
  };

  const pending = requests.filter((r) => r.status === "pending").length;
  const processing = requests.filter((r) => r.status === "processing").length;
  const ready = requests.filter((r) => r.status === "ready").length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Clock size={20} className="text-amber-600" />} label="Pending" value={pending} color="bg-amber-50" />
        <StatCard icon={<Activity size={20} className="text-blue-600" />} label="Processing" value={processing} color="bg-blue-50" />
        <StatCard icon={<FlaskConical size={20} className="text-green-600" />} label="Ready" value={ready} color="bg-green-50" />
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Recent Lab Requests</h3>
        <div className="space-y-3">
          {requests.slice(0, 5).map((r) => (
            <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-lg bg-gray-50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{r.patientName} — {r.testType}</p>
                <p className="text-xs text-gray-500">Ordered by {r.doctorName}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.priority === "urgent" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{r.priority}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === "ready" ? "bg-green-100 text-green-700" : r.status === "processing" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{r.status}</span>
                <button onClick={() => setSelectedRequest(r)} className="text-sm text-[#0d6e7e] font-semibold hover:underline">View</button>
              </div>
            </div>
          ))}
        </div>
        <Link href="/lab" className="block text-center text-sm text-[#0d6e7e] hover:underline mt-4">View all lab requests →</Link>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Request Details</h2>
                <p className="text-sm text-gray-500">{selectedRequest.patientName} — {selectedRequest.testType}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="p-2 rounded-full hover:bg-gray-100">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-gray-100 bg-slate-50 p-5">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3">Patient Info</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedRequest.patientName}</p>
                  <p className="text-xs text-gray-500 mt-2">Age: {selectedRequest.patientAge || "—"}</p>
                  <p className="text-xs text-gray-500">Blood group: {selectedRequest.patientBloodGroup || "—"}</p>
                  <p className="text-xs text-gray-500">Request priority: {selectedRequest.priority}</p>
                </div>
                <div className="rounded-3xl border border-gray-100 bg-white p-5">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3">Doctor Info</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedRequest.doctorName}</p>
                  <p className="text-xs text-gray-500 mt-2">Ordered test: {selectedRequest.testType}</p>
                  <p className="text-xs text-gray-500">Status: {selectedRequest.status}</p>
                  <p className="text-xs text-gray-500">Created on: {new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {selectedRequest.diagnosis && (
                <div className="rounded-3xl border border-gray-100 bg-slate-50 p-5">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3">Diagnosis</p>
                  <p className="text-sm text-gray-700">{selectedRequest.diagnosis}</p>
                </div>
              )}

              <div className="rounded-3xl border border-gray-100 bg-white p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3">Report Upload</p>
                    <p className="text-sm text-gray-700">Upload a test report image or PDF for the doctor.</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${selectedRequest.reportDocumentUrl ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {selectedRequest.reportDocumentUrl ? "Uploaded" : "No file uploaded"}
                  </span>
                </div>
                <label className="block rounded-3xl border border-dashed border-gray-200 p-6 text-center cursor-pointer hover:border-teal-400 transition-colors bg-gray-50">
                  <input type="file" accept="image/*,.pdf" onChange={uploadReportDocument} className="hidden" />
                  <p className="text-sm font-semibold text-gray-700">Choose Image or PDF</p>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG, JPEG, or PDF</p>
                  {uploadingDoc && <p className="text-xs text-teal-600 mt-2">Uploading...</p>}
                </label>
                {selectedRequest.reportDocumentUrl && (
                  <div className="rounded-3xl border border-gray-100 p-4 bg-slate-50">
                    {selectedRequest.reportDocumentUrl.startsWith("data:application/pdf") ? (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Uploaded PDF</p>
                        <a href={selectedRequest.reportDocumentUrl} target="_blank" rel="noreferrer" className="text-sm text-[#0d6e7e] font-semibold hover:underline">Open PDF report</a>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Uploaded Image</p>
                        <img src={selectedRequest.reportDocumentUrl} alt="Uploaded report" className="w-full rounded-3xl object-contain border border-gray-200" />
                      </div>
                    )}
                  </div>
                )}
                {selectedRequest.status !== "ready" && (
                  <div className="pt-4 border-t border-gray-100">
                    <button onClick={markReady} disabled={!selectedRequest.reportDocumentUrl}
                      className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition-all">
                      Finalize & Send Report Back
                    </button>
                  </div>
                )}
              </div>

              {selectedRequest.prescriptionId && (
                <div className="rounded-3xl border border-gray-100 bg-slate-50 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3">Prescription</p>
                      <p className="text-sm text-gray-700">This request is linked to prescription #{selectedRequest.prescriptionId}.</p>
                    </div>
                    <Link href="/prescriptions" className="inline-flex items-center justify-center rounded-full bg-[#0d6e7e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a5566]">
                      Open Prescription
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BloodBankDashboard() {
  const { user } = useAuth();
  const [bank, setBank] = useState(null);
  const [stock, setStock] = useState({});
  const [reservations, setReservations] = useState([]);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [action, setAction] = useState("add");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

  useEffect(() => {
    if (user?.id) {
      fetchBankData();
    }
  }, [user]);

  const fetchBankData = async () => {
    setDataLoading(true);
    setError(null);
    try {
      const banks = await api.get("/blood-banks");
      console.log("Banks received:", banks);
      if (banks && banks.length > 0) {
        const bankData = banks[0];
        setBank(bankData);
        setStock(bankData.stock || {});

        const reservs = await api.get(`/blood-reservations?bloodBankId=${bankData.id}`);
        setReservations(reservs || []);
      } else {
        setError("No blood bank found for this user.");
      }
    } catch (err) {
      console.error("Failed to fetch bank data:", err);
      setError(err.message || "Failed to load blood bank data");
    } finally {
      setDataLoading(false);
    }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedBloodGroup || !bank) return;

    setLoading(true);
    try {
      await api.patch(`/blood-banks/${bank.id}/stock`, {
        bloodGroup: selectedBloodGroup,
        quantity: parseInt(quantity),
        action,
      });

      await fetchBankData();
      setSelectedBloodGroup(null);
      setQuantity(1);
      setAction("add");
    } catch (err) {
      console.error("Failed to update stock:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    try {
      await api.patch(`/blood-reservations/${reservationId}`, { status: "cancelled" });
      await fetchBankData();
    } catch (err) {
      console.error("Failed to cancel reservation:", err);
    }
  };

  const handleMarkCollected = async (reservationId) => {
    try {
      await api.patch(`/blood-reservations/${reservationId}`, { status: "collected" });
      await fetchBankData();
    } catch (err) {
      console.error("Failed to mark as collected:", err);
    }
  };

  const getStockStatus = (count) => {
    if (count === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
    if (count < 10) return { label: "Low Stock", color: "bg-amber-100 text-amber-700" };
    return { label: "In Stock", color: "bg-green-100 text-green-700" };
  };

  const totalStock = Object.values(stock).reduce((a, b) => a + b, 0);
  const activeReservations = reservations.filter((r) => r.status === "reserved").length;
  const collectedToday = reservations.filter((r) => r.status === "collected" && new Date(r.createdAt).toDateString() === new Date().toDateString()).length;

  if (dataLoading) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#0d6e7e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading blood bank data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-700 font-medium">Error: {error}</p>
        <button onClick={fetchBankData} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Bank Info */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900">{bank?.name}</h2>
        <p className="text-sm text-gray-600 mt-1">{bank?.location}</p>
      </div>

      {/* Stock Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <StatCard icon={<Droplet size={20} className="text-red-600" />} label="Total Stock" value={totalStock} color="bg-red-50" />
        <StatCard icon={<AlertTriangle size={20} className="text-blue-600" />} label="Active Reservations" value={activeReservations} color="bg-blue-50" />
        <StatCard icon={<TrendingUp size={20} className="text-green-600" />} label="Collected Today" value={collectedToday} color="bg-green-50" />
        <StatCard icon={<FlaskConical size={20} className="text-purple-600" />} label="Blood Groups" value={BLOOD_GROUPS.length} color="bg-purple-50" />
      </div>

      {/* Blood Stock Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100 w-full">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Droplet size={18} className="text-red-600" /> Blood Stock Inventory
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {BLOOD_GROUPS.map((group) => {
              const count = stock[group] || 0;
              const status = getStockStatus(count);
              return (
                <div key={group} className="border border-gray-200 rounded-xl p-4 hover:border-teal-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-lg text-gray-900">{group}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {count > 0 ? count : "0"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{status.label}</p>
                  <button
                    onClick={() => {
                      setSelectedBloodGroup(group);
                      setQuantity(1);
                      setAction("add");
                    }}
                    className="w-full py-2 text-xs font-medium rounded-lg bg-gray-50 hover:bg-teal-50 text-gray-700 hover:text-teal-700 transition-colors"
                  >
                    Manage
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stock Adjustment Panel */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 h-fit">
          <h3 className="font-semibold text-gray-900 mb-4">Adjust Stock</h3>

          {selectedBloodGroup ? (
            <form onSubmit={handleUpdateStock} className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Selected Blood Group</p>
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-300">
                  <span className="font-bold text-lg text-gray-900">{selectedBloodGroup}</span>
                  <span className="text-sm text-gray-600">Current: {stock[selectedBloodGroup] || 0} units</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="add">Add Stock</option>
                  <option value="subtract">Remove Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 font-medium text-sm flex items-center justify-center gap-2"
                >
                  {action === "add" ? <Plus size={16} /> : <Minus size={16} />}
                  {loading ? "Updating..." : "Update"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBloodGroup(null)}
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-300 font-medium text-sm"
                >
                  <X size={16} />
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-600 text-center py-8">Select a blood group to adjust stock</p>
          )}
        </div>
      </div>

      {/* Active Reservations */}
      <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle size={18} className="text-blue-600" /> Active Reservations
          </h2>
        </div>

        {reservations.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Droplet size={40} className="mx-auto mb-3 opacity-40" />
            <p>No reservations at this time</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-medium text-gray-900">{reservation.patientName}</p>
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                      {reservation.bloodGroup}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {reservation.units} units
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Requested by: {reservation.doctorName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Reserved: {new Date(reservation.reservedDate).toLocaleDateString()} • 
                    Expires: {new Date(reservation.expiryDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    reservation.status === "reserved" ? "bg-amber-100 text-amber-700" :
                    reservation.status === "collected" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {reservation.status}
                  </span>
                  {reservation.status === "reserved" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleMarkCollected(reservation.id)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-xs font-medium"
                      >
                        Collected
                      </button>
                      <button
                        onClick={() => handleCancelReservation(reservation.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-xs font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user: rawUser } = useAuth();
  const [dashData, setDashData] = useState(null);

  // Normalize the role (handle "blood bank" -> "blood_bank")
  const user = rawUser ? {
    ...rawUser,
    role: (rawUser.role || "").toLowerCase().replace(/ /g, "_")
  } : null;

  useEffect(() => {
    if (!user) return;
    console.log("Dashboard - Current user role:", user.role);
    const endpoint = user.role === "patient" ? "/dashboard/patient" : user.role === "doctor" ? "/dashboard/doctor" : null;
    if (endpoint) api.get(endpoint).then(setDashData).catch(console.error);
  }, [user]);

  if (!user) return null;

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting()}, {user.fullName.split(" ")[0]} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">
            {user.role === "blood_bank" ? "Manage your blood bank inventory and reservations." : "Here's what's happening in your health today."}
          </p>
        </div>
        <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">Role: {user.role}</div>
      </div>
      {user.role === "patient" && <PatientDashboard data={dashData} />}
      {user.role === "doctor" && <DoctorDashboard data={dashData} />}
      {user.role === "lab" && <LabDashboard />}
      {user.role === "blood_bank" && <BloodBankDashboard />}
      {(user.role === "admin" || user.role === "superadmin") && <AdminDashboard />}
      {!["patient", "doctor", "lab", "blood_bank", "admin", "superadmin"].includes(user.role) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <p className="text-amber-700 font-medium">Unrecognized role: {user.role}</p>
        </div>
      )}
    </div>
  );
}
