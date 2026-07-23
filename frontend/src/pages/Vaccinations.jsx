import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Syringe, ShieldCheck, Plus, ClipboardList, User } from "lucide-react";

export default function Vaccinations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const normalizedRole = (user?.role || "").toLowerCase().replace(/ /g, "_");
  const isDoctor = ["doctor", "admin", "superadmin"].includes(normalizedRole);

  const [form, setForm] = useState({
    patientId: "",
    patientName: "",
    vaccineName: "",
    company: "",
    batchNo: "",
    administeredBy: user?.fullName || "",
    type: "Injection",
    date: new Date().toISOString().split('T')[0]
  });

  // Ensure the doctor's name is set once the user profile loads
  useEffect(() => {
    if (user?.fullName && !form.administeredBy) {
      setForm(prev => ({ ...prev, administeredBy: user.fullName }));
    }
  }, [user]);

  // Fetch vaccinations (if patient, filter by their ID)
  const { data: vaccinations, isLoading } = useQuery({
    queryKey: ["vaccinations", user?.id],
    queryFn: () => api.get(`/vaccinations${!isDoctor ? `?patientId=${user.id}` : ""}`),
  });

  // Mutation to add a vaccine (Doctor only)
  const addMutation = useMutation({
    mutationFn: (newVax) => api.post("/vaccinations", newVax),
    onSuccess: () => {
      queryClient.invalidateQueries(["vaccinations"]);
      alert("Vaccination record added successfully!");
      setForm(prev => ({ ...prev, patientId: "", patientName: "", vaccineName: "", company: "", batchNo: "" }));
    },
    onError: (error) => {
      alert(`Failed to save record: ${error.message || "Unknown error"}`);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addMutation.mutate({ ...form, patientId: parseInt(form.patientId) });
  };

  if (isLoading) return <div className="p-8 text-center">Loading records...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShieldCheck className="text-[#0d6e7e]" size={32} /> Vaccination Registry
          </h1>
          <p className="text-gray-500">Manage and view immunization records</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Doctor's Add Form */}
        {isDoctor && (
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Plus size={20} className="text-[#0d6e7e]" /> Add New Record
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient ID</label>
                <input type="number" required value={form.patientId} onChange={e => setForm({...form, patientId: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient Name</label>
                <input type="text" required value={form.patientName} onChange={e => setForm({...form, patientName: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Priya Sharma" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vaccine Name</label>
                <input type="text" required value={form.vaccineName} onChange={e => setForm({...form, vaccineName: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Polio, Covaxin..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input type="text" required value={form.company} onChange={e => setForm({...form, company: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Bharat Biotech, Pfizer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                <input type="text" required value={form.batchNo} onChange={e => setForm({...form, batchNo: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="BTCH-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Administration Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none">
                  <option value="Injection">Injection</option>
                  <option value="Oral">Oral</option>
                </select>
              </div>
              <button type="submit" disabled={addMutation.isPending}
                className="w-full py-3 bg-[#0d6e7e] text-white rounded-xl font-medium hover:bg-[#0a5566] transition-colors disabled:opacity-50">
                {addMutation.isPending ? "Saving..." : "Record Vaccination"}
              </button>
            </form>
          </div>
        )}

        {/* Records Table */}
        <div className={`${isDoctor ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden`}>
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ClipboardList size={20} className="text-[#0d6e7e]" /> 
              {isDoctor ? "Recent Administrations" : "My Immunization History"}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  {isDoctor && <th className="px-6 py-4">Patient</th>}
                  <th className="px-6 py-4">Vaccine</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Batch No</th>
                  <th className="px-6 py-4">Administered By</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vaccinations?.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    {isDoctor && <td className="px-6 py-4 text-sm font-semibold text-teal-700">{v.patientName || `ID: ${v.patientId}`}</td>}
                    <td className="px-6 py-4 font-medium text-gray-900">{v.vaccineName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.company}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${v.type === 'Oral' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {v.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{v.batchNo}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.administeredBy}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{v.date}</td>
                  </tr>
                ))}
                {vaccinations?.length === 0 && (
                  <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}