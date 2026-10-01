import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Calendar, FileText, FlaskConical, Bell, Users, Activity, AlertTriangle, Clock, ChevronRight, Stethoscope, Building2, X, Brain, Droplet, TrendingUp, Plus, Minus, User, Syringe, ShieldCheck, ClipboardCheck, Receipt, Pill, MapPin, Phone, Camera, Image as ImageIcon, Edit3, HeartPulse, Sparkles, CheckCircle2, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import PrescriptionModal from "@/components/PrescriptionModal";
import DoctorHospitalProfileModal from "@/components/DoctorHospitalProfileModal";

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

      {prescriptions.some((prescription) => prescription.prescriptionPdfUrl) && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText size={16} className="text-[#0d6e7e]" /> Prescription Documents</h3>
          <div className="space-y-3">
            {prescriptions.filter((prescription) => prescription.prescriptionPdfUrl).map((prescription) => (
              <div key={prescription.id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
                <div><p className="text-sm font-medium text-gray-800">Prescription #{prescription.id}</p><p className="text-xs text-gray-500">{prescription.diagnosis}</p></div>
                <a href={prescription.prescriptionPdfUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#0d6e7e] hover:underline">Open combined PDF</a>
              </div>
            ))}
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

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FlaskConical size={16} className="text-[#0d6e7e]" /> My Lab Reports
        </h3>
        {labReports.length === 0 ? (
          <p className="text-sm text-gray-500">No lab reports available.</p>
        ) : (
          <div className="space-y-4">
            {labReports.map((report) => (
              <div key={report.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">{report.testType}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    report.status === "ready" ? "bg-green-100 text-green-700" :
                    report.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                  }`}>{report.status}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Doctor: {report.doctorName} | Lab: {report.labName}</p>
                <p className="text-xs text-gray-400 mb-3">Requested: {new Date(report.createdAt).toLocaleDateString()}</p>
                {report.status === "ready" && report.reportDocumentUrl && (
                  <div className="mt-3">
                    {report.reportDocumentUrl.includes('.pdf') ? (
                      <a href={report.reportDocumentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-[#0d6e7e] font-semibold hover:underline">
                        <FileText size={14} /> View PDF Report
                      </a>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 mb-2">Report Image</p>
                        <img src={report.reportDocumentUrl} alt="Lab report" className="w-full max-w-md rounded-lg object-contain border border-gray-200" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}

function DoctorModels() {
  const models = [
    { id: "pneumonia", label: "Pneumonia", description: "Screen a chest X-ray for pneumonia indicators.", active: true },
    { id: "alzheimer", label: "Alzheimer's", description: "Model integration coming soon.", active: false },
    { id: "diabetic-retinopathy", label: "Diabetic Retinopathy", description: "Model integration coming soon.", active: false },
    { id: "skin-lesion", label: "Skin Lesion", description: "Model integration coming soon.", active: false },
    { id: "brain-tumor", label: "Brain Tumor", description: "Model integration coming soon.", active: false },
    { id: "tb", label: "Tuberculosis", description: "Model integration coming soon.", active: false },
  ];
  const [activeModel, setActiveModel] = useState("pneumonia");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError("");
  };

  const predict = async () => {
    if (!file || activeModel !== "pneumonia") return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      setResult(await api.upload("/models/pneumonia/predict", formData));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Brain size={16} className="text-[#0d6e7e]" /> Models
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {models.map((model) => (
          <button key={model.id} disabled={!model.active} onClick={() => { setActiveModel(model.id); setResult(null); setError(""); }}
            className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${activeModel === model.id ? "bg-[#0d6e7e] text-white border-[#0d6e7e]" : model.active ? "bg-white text-gray-700 border-gray-200 hover:border-teal-400" : "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"}`}>
            {model.label}{!model.active && " · Soon"}
          </button>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="text-sm font-medium text-gray-800">Pneumonia Detection</p>
          <p className="text-xs text-gray-500 mt-1 mb-4">Upload a chest X-ray image for AI screening.</p>
          <label className="block rounded-xl border border-dashed border-gray-200 p-6 text-center cursor-pointer hover:border-teal-400 bg-gray-50">
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="hidden" />
            {preview ? <img src={preview} alt="Selected chest X-ray" className="mx-auto max-h-48 rounded-lg object-contain" /> : <><FileText size={28} className="mx-auto text-gray-300" /><p className="text-sm font-semibold text-gray-700 mt-2">Choose X-ray image</p><p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG, or WEBP</p></>}
          </label>
          <button onClick={predict} disabled={!file || loading} className="mt-4 w-full py-2.5 rounded-lg bg-[#0d6e7e] text-white text-sm font-semibold hover:bg-[#0a5566] disabled:opacity-50">
            {loading ? "Analyzing..." : "Run Prediction"}
          </button>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-5 min-h-48">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 mb-4">Prediction Output</p>
          {result ? <><p className={`text-2xl font-bold ${result.prediction === "Pneumonia" ? "text-red-600" : "text-green-600"}`}>{result.prediction}</p><p className="text-sm text-gray-600 mt-2">Confidence: {Math.round(result.confidence * 100)}%</p><p className="text-xs text-amber-700 mt-5">{result.disclaimer}</p></> : <p className="text-sm text-gray-400 italic">Upload an image to see the model output.</p>}
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

      <DoctorModels />

      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Report Preview</h2>
                <p className="text-sm text-gray-500">{selectedReport.patientName} — {selectedReport.testType}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-2 rounded-full hover:bg-gray-100">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {(selectedReport.reportDocumentUrl || selectedReport.reportUrl) ? (
                <div className="space-y-4">
                  {((selectedReport.reportDocumentUrl || selectedReport.reportUrl).includes('.pdf') || (selectedReport.reportDocumentUrl || selectedReport.reportUrl).startsWith('data:application/pdf')) ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <FileText size={48} className="text-gray-300" />
                      <a href={selectedReport.reportDocumentUrl || selectedReport.reportUrl} target="_blank" rel="noreferrer" 
                         className="px-6 py-2 bg-[#0d6e7e] text-white rounded-full font-semibold hover:bg-[#0a5566]">
                        Open PDF Report
                      </a>
                    </div>
                  ) : (
                    <img src={selectedReport.reportDocumentUrl || selectedReport.reportUrl} alt="Report" className="w-full rounded-2xl border border-gray-200" />
                  )}

                  {selectedReport.aiAnalysis && (
                    <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain size={16} className="text-teal-700" />
                        <p className="text-xs font-bold text-teal-700 uppercase">AI Analysis Preview</p>
                      </div>
                      <p className="text-sm text-teal-900 font-semibold">{selectedReport.aiAnalysis.primaryCondition}</p>
                      <p className="text-xs text-teal-600 mt-1">Confidence: {Math.round(selectedReport.aiAnalysis.confidence * 100)}%</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500 italic">No report document found.</p>
              )}
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
        onClose={() => setShowPrescribeModal(false)}
        initialPatientId={prescribeTargetPatient}
        appointmentId={prescribeApptId}
        doctor={user}
        onPrescriptionCreated={() => {
          // Can refresh or alert
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
  const [broadcast, setBroadcast] = useState({ title: "", message: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => { api.get("/admin/stats").then(setStats).catch(console.error); }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcast.title.trim() || !broadcast.message.trim()) return;
    setSending(true);
    try {
      await api.post("/admin/broadcast", broadcast);
      alert("Global announcement sent successfully.");
      setBroadcast({ title: "", message: "" });
    } catch (err) {
      console.error(err);
    }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Stethoscope size={20} className="text-blue-600" />} label="Total Doctors" value={stats?.totalDoctors ?? "—"} color="bg-blue-50" />
        <StatCard icon={<Users size={20} className="text-green-600" />} label="Total Patients" value={stats?.totalPatients?.toLocaleString() ?? "—"} color="bg-green-50" />
        <StatCard icon={<Building2 size={20} className="text-purple-600" />} label="Facilities" value={stats?.totalFacilities ?? "—"} color="bg-purple-50" />
        <StatCard icon={<AlertTriangle size={20} className="text-red-500" />} label="Critical Alerts" value={stats?.criticalAlerts ?? "—"} color="bg-red-50" />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Bell size={18} className="text-[#0d6e7e]" /> Broadcast Announcement
        </h3>
        <form onSubmit={handleBroadcast} className="space-y-4">
          <input 
            type="text"
            placeholder="Announcement Title"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500"
            value={broadcast.title}
            onChange={(e) => setBroadcast({...broadcast, title: e.target.value})}
          />
          <textarea 
            placeholder="Message to all patients and staff..."
            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 h-24 resize-none"
            value={broadcast.message}
            onChange={(e) => setBroadcast({...broadcast, message: e.target.value})}
          />
          <button 
            type="submit"
            disabled={sending}
            className="px-6 py-2 bg-[#0d6e7e] text-white rounded-xl font-bold text-sm hover:bg-[#0a5566] disabled:opacity-50 flex items-center gap-2"
          >
            {sending ? "Sending..." : <><Send size={16} /> Send to All Users</>}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Today's Appointments</p>
          <p className="text-3xl font-bold text-gray-800">{stats?.appointmentsToday ?? "—"}</p>
          <Link href="/appointments" className="text-xs text-[#0d6e7e] hover:underline mt-2 block">View all →</Link>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Prescriptions Today</p>
          <p className="text-3xl font-bold text-gray-800">{stats?.prescriptionsToday ?? "—"}</p>
          <Link href="/prescriptions" className="text-xs text-[#0d6e7e] hover:underline mt-2 block">View all →</Link>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Pending Lab Reports</p>
          <p className="text-3xl font-bold text-gray-800">{stats?.pendingLabReports ?? "—"}</p>
          <Link href="/lab" className="text-xs text-[#0d6e7e] hover:underline mt-2 block">View all →</Link>
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
