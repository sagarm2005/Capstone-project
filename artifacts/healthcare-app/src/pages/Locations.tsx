import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { MapPin, Users, Stethoscope, Building2, TrendingUp } from "lucide-react";

type Location = {
  id: number; name: string; totalDoctors: number; activeDoctors: number; onLeave: number;
  activePatients: number; facilities: number; breakdown: { gp: number; specialists: number; surgeons: number };
};

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selected, setSelected] = useState<Location | null>(null);

  useEffect(() => {
    api.get<Location[]>("/admin/locations").then(setLocations).catch(console.error);
  }, []);

  const totalDoctors = locations.reduce((s, l) => s + l.totalDoctors, 0);
  const totalPatients = locations.reduce((s, l) => s + l.activePatients, 0);
  const totalFacilities = locations.reduce((s, l) => s + l.facilities, 0);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Location Statistics</h1>
        <p className="text-gray-500 text-sm">Doctor and patient distribution across zones</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-[#0d6e7e] to-[#0a5566] rounded-xl p-5 text-white">
          <Stethoscope size={20} className="text-teal-200 mb-2" />
          <p className="text-2xl font-bold">{totalDoctors}</p>
          <p className="text-teal-200 text-sm">Total Doctors</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <Users size={20} className="text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{totalPatients.toLocaleString()}</p>
          <p className="text-gray-500 text-sm">Active Patients</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <Building2 size={20} className="text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-gray-800">{totalFacilities}</p>
          <p className="text-gray-500 text-sm">Facilities</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((loc) => {
          const utilization = Math.round((loc.activeDoctors / loc.totalDoctors) * 100);
          return (
            <button key={loc.id} onClick={() => setSelected(selected?.id === loc.id ? null : loc)}
              className={`bg-white rounded-xl p-5 shadow-sm border text-left transition-all ${selected?.id === loc.id ? "border-teal-400 ring-2 ring-teal-100" : "border-gray-100 hover:border-teal-200"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <MapPin size={16} className="text-teal-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{loc.name}</p>
                    <p className="text-xs text-gray-500">{loc.facilities} facilities</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Utilization</p>
                  <p className={`text-sm font-bold ${utilization > 90 ? "text-red-600" : utilization > 75 ? "text-amber-600" : "text-green-600"}`}>{utilization}%</p>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                <div className={`h-1.5 rounded-full ${utilization > 90 ? "bg-red-500" : utilization > 75 ? "bg-amber-500" : "bg-green-500"}`}
                  style={{ width: `${utilization}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-800">{loc.activeDoctors}</p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-600">{loc.onLeave}</p>
                  <p className="text-xs text-gray-500">On Leave</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600">{loc.activePatients.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Patients</p>
                </div>
              </div>

              {selected?.id === loc.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-600 mb-2">Doctor Breakdown</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <p className="text-sm font-bold text-blue-700">{loc.breakdown.gp}</p>
                      <p className="text-xs text-gray-500">Gen. Practice</p>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded-lg">
                      <p className="text-sm font-bold text-purple-700">{loc.breakdown.specialists}</p>
                      <p className="text-xs text-gray-500">Specialists</p>
                    </div>
                    <div className="text-center p-2 bg-teal-50 rounded-lg">
                      <p className="text-sm font-bold text-teal-700">{loc.breakdown.surgeons}</p>
                      <p className="text-xs text-gray-500">Surgeons</p>
                    </div>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
