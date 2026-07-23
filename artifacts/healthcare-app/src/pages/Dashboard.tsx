import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Calendar, FileText, FlaskConical, Bell, TrendingUp, Users, Activity, AlertTriangle, Clock, ChevronRight, Stethoscope, Building2 } from "lucide-react";
import { Link } from "wouter";

function StatCard({ icon, label, value, color, trend }: {
  icon: React.ReactNode; label: string; value: string | number; color: string; trend?: string;
}) {
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

function PatientDashboard({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Calendar size={20} className="text-blue-600" />} label="Upcoming Appointments" value={data?.upcomingAppointments ?? 1} color="bg-blue-50" />
        <StatCard icon={<FlaskConical size={20} className="text-purple-600" />} label="Pending Lab Reports" value={data?.pendingLabReports ?? 1} color="bg-purple-50" />
        <StatCard icon={<FileText size={20} className="text-green-600" />} label="Active Prescriptions" value={data?.activePrescriptions ?? 1} color="bg-green-50" />
        <StatCard icon={<Bell size={20} className="text-amber-600" />} label="Notifications" value={data?.unreadNotifications ?? 3} color="bg-amber-50" />
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

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Activity size={16} className="text-[#0d6e7e]" /> Recent Activity
        </h3>
        <div className="space-y-3">
          {(data?.recentActivity ?? []).map((item: any, i: number) => (
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

function DoctorDashboard({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Calendar size={20} className="text-blue-600" />} label="Today's Appointments" value={data?.todayAppointments ?? 8} color="bg-blue-50" />
        <StatCard icon={<Users size={20} className="text-green-600" />} label="Active Patients" value={data?.activePatients ?? 89} color="bg-green-50" />
        <StatCard icon={<FileText size={20} className="text-purple-600" />} label="Pending Prescriptions" value={data?.pendingPrescriptions ?? 3} color="bg-purple-50" />
        <StatCard icon={<FlaskConical size={20} className="text-amber-600" />} label="Lab Reviews" value={data?.pendingLabReviews ?? 2} color="bg-amber-50" />
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-[#0d6e7e]" /> Today's Schedule
        </h3>
        <div className="space-y-2">
          {(data?.schedule ?? []).map((appt: any, i: number) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-teal-50 transition-colors">
              <div className="text-sm font-medium text-[#0d6e7e] w-20 shrink-0">{appt.time}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{appt.patientName}</p>
                <p className="text-xs text-gray-500 capitalize">{appt.type} visit</p>
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
          {(data?.recentPatients ?? []).map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-[#0d6e7e] flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-medium">{p.name.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-500">{p.condition}</p>
              </div>
              <p className="text-xs text-gray-400">{p.lastVisit}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get("/admin/stats").then(setStats).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Stethoscope size={20} className="text-blue-600" />} label="Total Doctors" value={stats?.totalDoctors ?? "—"} color="bg-blue-50" />
        <StatCard icon={<Users size={20} className="text-green-600" />} label="Total Patients" value={stats?.totalPatients?.toLocaleString() ?? "—"} color="bg-green-50" />
        <StatCard icon={<Building2 size={20} className="text-purple-600" />} label="Facilities" value={stats?.totalFacilities ?? "—"} color="bg-purple-50" />
        <StatCard icon={<AlertTriangle size={20} className="text-red-500" />} label="Critical Alerts" value={stats?.criticalAlerts ?? "—"} color="bg-red-50" />
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
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>("/lab/requests").then(setRequests).catch(console.error);
  }, []);

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
          {requests.slice(0, 5).map((r: any) => (
            <div key={r.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{r.patientName} — {r.testType}</p>
                <p className="text-xs text-gray-500">Ordered by {r.doctorName}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                r.priority === "urgent" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
              }`}>{r.priority}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                r.status === "ready" ? "bg-green-100 text-green-700" :
                r.status === "processing" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
              }`}>{r.status}</span>
            </div>
          ))}
        </div>
        <Link href="/lab" className="block text-center text-sm text-[#0d6e7e] hover:underline mt-4">View all lab requests →</Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [dashData, setDashData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const endpoint = user.role === "patient" ? "/dashboard/patient" : user.role === "doctor" ? "/dashboard/doctor" : null;
    if (endpoint) {
      api.get(endpoint).then(setDashData).catch(console.error);
    }
  }, [user]);

  if (!user) return null;

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{greeting()}, {user.fullName.split(" ")[0]} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening in your health today.</p>
      </div>

      {user.role === "patient" && <PatientDashboard data={dashData} />}
      {user.role === "doctor" && <DoctorDashboard data={dashData} />}
      {user.role === "lab" && <LabDashboard />}
      {(user.role === "admin" || user.role === "superadmin") && <AdminDashboard />}
    </div>
  );
}
