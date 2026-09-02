import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Calendar, FileText, FlaskConical, Bell, Users, Activity, AlertTriangle, Clock, ChevronRight, Stethoscope, Building2, X, Brain, Droplet, TrendingUp, Plus, Minus, User, Syringe, ShieldCheck, ClipboardCheck } from "lucide-react";
import { Link } from "wouter";

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
  const [followups, setFollowups] = useState([]);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [urgentFollowup, setUrgentFollowup] = useState(null);
  const [profile, setProfile] = useState(null);
  const [newAllergy, setNewAllergy] = useState("");
  const [showAddAllergyModal, setShowAddAllergyModal] = useState(false);
  const [modalNewAllergy, setModalNewAllergy] = useState("");

  const fetchProfile = () => {
    api.get(`/patients/${user.id}`).then(setProfile).catch(console.error);
  };

  const handleAddAllergy = async () => {
    if (!newAllergy.trim()) return;
    await api.post(`/patients/${user.id}/allergies`, { allergy: newAllergy });
    setNewAllergy("");
    fetchProfile();
  };

  useEffect(() => {
    if (user?.id) {
      api.get(`/lab/requests?patientId=${user.id}`).then(setLabReports).catch(console.error);
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
      {/* Profile Header Summary with clickable image trigger */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
        <button 
          onClick={() => setShowAddAllergyModal(true)}
          className="relative group shrink-0"
          title="Add New Allergy"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#0d6e7e] flex items-center justify-center transition-all group-hover:ring-4 group-hover:ring-teal-50 overflow-hidden">
             <User size={32} className="text-white" />
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Plus size={20} className="text-white" />
             </div>
          </div>
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{profile?.fullName || user.fullName}</h2>
          <p className="text-sm text-gray-500">
            {profile?.bloodGroup || "O+"} • {profile?.gender || "Male"} • {profile?.dateOfBirth || "—"}
          </p>
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

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500" /> My Allergies & Safety
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {profile?.allergies?.map((a, i) => (
            <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-100">
              {a}
            </span>
          ))}
          {(!profile?.allergies || profile.allergies.length === 0) && <p className="text-sm text-gray-500">No allergies listed.</p>}
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newAllergy} 
            onChange={(e) => setNewAllergy(e.target.value)}
            placeholder="Add allergy (e.g. Penicillin)"
            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button onClick={handleAddAllergy} className="p-1.5 bg-[#0d6e7e] text-white rounded-lg hover:bg-[#0a5566]">
            <Plus size={18} />
          </button>
        </div>
      </div>

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

function DoctorDashboard({ data }) {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState(null);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [allergyTarget, setAllergyTarget] = useState(null);
  const [doctorNewAllergy, setDoctorNewAllergy] = useState("");

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
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<Calendar size={20} className="text-blue-600" />} label="Today's Appointments" value={data?.todayAppointments ?? 0} color="bg-blue-50" />
        <StatCard icon={<Users size={20} className="text-green-600" />} label="Active Patients" value={data?.activePatients ?? 0} color="bg-green-50" />
        <StatCard icon={<FileText size={20} className="text-purple-600" />} label="Pending Prescriptions" value={data?.pendingPrescriptions ?? 0} color="bg-purple-50" />
        <StatCard icon={<FlaskConical size={20} className="text-amber-600" />} label="Lab Reviews" value={data?.pendingLabReviews ?? 0} color="bg-amber-50" />
        <StatCard icon={<Syringe size={20} className="text-teal-600" />} label="Vaccinations Given" value={data?.prescriptionsToday || 0} color="bg-teal-50" />
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
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                appt.status === "confirmed" ? "bg-green-100 text-green-700" :
                appt.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
              }`}>{appt.status}</span>
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
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-400">{p.lastVisit}</p>
                <button 
                  onClick={() => setAllergyTarget(p)}
                  className="p-1.5 text-[#0d6e7e] hover:bg-teal-50 rounded-lg border border-transparent hover:border-teal-100 transition-all"
                  title="Add Allergy"
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
