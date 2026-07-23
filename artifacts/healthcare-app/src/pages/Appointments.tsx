import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Calendar, Plus, Search, X, Clock, User, Stethoscope } from "lucide-react";

type Appointment = {
  id: number; patientId: number; patientName: string; doctorId: number; doctorName: string;
  date: string; time: string; type: string; status: string; fee: number; notes: string;
};
type Doctor = { id: number; fullName: string; specialty: string; hospital: string; location: string; fee: number; rating: number; };
type Slot = { time: string; available: boolean };

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [form, setForm] = useState({ doctorId: 0, date: "", time: "", type: "normal", notes: "" });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAppointments = () => {
    const param = user?.role === "patient" ? `?patientId=${user.id}` : user?.role === "doctor" ? `?doctorId=${user.id}` : "";
    api.get<Appointment[]>(`/appointments${param}`).then(setAppointments).catch(console.error);
  };

  useEffect(() => {
    fetchAppointments();
    api.get<Doctor[]>("/doctors").then(setDoctors).catch(console.error);
  }, []);

  const openBooking = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setForm({ ...form, doctorId: doctor.id });
    api.get<Slot[]>(`/doctors/${doctor.id}/slots`).then(setSlots).catch(console.error);
    setShowModal(true);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/appointments", { ...form, patientId: user?.id, doctorId: selectedDoctor?.id });
      fetchAppointments();
      setShowModal(false);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filtered = appointments.filter((a) =>
    !search || a.doctorName.toLowerCase().includes(search.toLowerCase()) ||
    a.patientName.toLowerCase().includes(search.toLowerCase())
  );

  const availableSlots = slots.filter((s) => s.available);

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
              <div key={appt.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                  <Calendar size={18} className="text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-800 text-sm">
                      {user?.role === "patient" ? appt.doctorName : appt.patientName}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[appt.status] || "bg-gray-100 text-gray-600"}`}>
                      {appt.status}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs capitalize">{appt.type}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={12} />{appt.date}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12} />{appt.time}</span>
                    <span className="text-xs text-gray-500">₹{appt.fee}</span>
                  </div>
                  {appt.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{appt.notes}</p>}
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
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {!selectedDoctor ? (
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-4">Select a doctor to book with</p>
                <div className="space-y-3">
                  {doctors.map((doc) => (
                    <button key={doc.id} onClick={() => openBooking(doc)}
                      className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-teal-400 hover:bg-teal-50 text-left transition-colors">
                      <div className="w-10 h-10 rounded-full bg-[#0d6e7e] flex items-center justify-center shrink-0">
                        <User size={16} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">{doc.fullName}</p>
                        <p className="text-xs text-gray-500">{doc.specialty} • {doc.hospital}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#0d6e7e]">₹{doc.fee}</p>
                        <p className="text-xs text-amber-600">★ {doc.rating}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleBook} className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl">
                  <Stethoscope size={18} className="text-teal-600" />
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{selectedDoctor.fullName}</p>
                    <p className="text-xs text-gray-500">{selectedDoctor.specialty} • ₹{selectedDoctor.fee}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedDoctor(null)} className="ml-auto text-xs text-teal-600 hover:underline">Change</button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Available Slots</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {availableSlots.map((slot) => (
                      <button key={slot.time} type="button"
                        onClick={() => setForm({ ...form, time: slot.time })}
                        className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${form.time === slot.time ? "bg-[#0d6e7e] text-white border-[#0d6e7e]" : "border-gray-200 hover:border-teal-400"}`}>
                        {slot.time}
                      </button>
                    ))}
                  </div>
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
                  {loading ? "Booking..." : `Confirm Booking — ₹${selectedDoctor.fee}`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
