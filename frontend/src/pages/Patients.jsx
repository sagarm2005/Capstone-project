import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Users, Search, X, AlertCircle, Shield } from "lucide-react";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const fetchPatients = () => {
    api.get(`/patients?search=${encodeURIComponent(search)}&limit=20`)
      .then((d) => { setPatients(d.patients); setTotal(d.total); })
      .catch(console.error);
  };
  useEffect(() => { fetchPatients(); }, [search]);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-500 text-sm">{total} patients registered</p>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Search patients by name or email..." />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {patients.map((p) => (
            <button key={p.id} onClick={() => setSelected(p)}
              className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 text-left transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#0d6e7e] flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-semibold">{p.fullName.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm">{p.fullName}</p>
                <p className="text-xs text-gray-500">{p.email} • {p.phone}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {p.existingConditions.slice(0, 2).map((c, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{c}</span>
                  ))}
                  {p.allergies.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-xs flex items-center gap-0.5">
                      <AlertCircle size={10} /> {p.allergies.length} allerg{p.allergies.length !== 1 ? "ies" : "y"}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-500">{p.bloodGroup}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.lastVisit ? `Last: ${p.lastVisit}` : "No visits"}</p>
              </div>
            </button>
          ))}
          {patients.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-40" />
              <p>No patients found</p>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Patient Profile</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#0d6e7e] flex items-center justify-center">
                  <span className="text-white text-xl font-bold">{selected.fullName.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{selected.fullName}</h3>
                  <p className="text-gray-500 text-sm">{selected.gender} • DOB: {selected.dateOfBirth}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500 mb-0.5">Email</p><p className="font-medium text-gray-800 truncate">{selected.email}</p></div>
                <div><p className="text-gray-500 mb-0.5">Phone</p><p className="font-medium text-gray-800">{selected.phone}</p></div>
                <div>
                  <p className="text-gray-500 mb-0.5">Blood Group</p>
                  <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded font-medium text-sm">{selected.bloodGroup}</span>
                </div>
                <div><p className="text-gray-500 mb-0.5">Last Visit</p><p className="font-medium text-gray-800">{selected.lastVisit || "N/A"}</p></div>
              </div>
              {selected.allergies.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-red-500" /> Allergies
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selected.allergies.map((a, i) => <span key={i} className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium">{a}</span>)}
                  </div>
                </div>
              )}
              {selected.existingConditions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Existing Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.existingConditions.map((c, i) => <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium">{c}</span>)}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <Shield size={14} className="text-green-600 shrink-0" />
                <p className="text-xs text-green-700">{selected.vaccinationStatus}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
