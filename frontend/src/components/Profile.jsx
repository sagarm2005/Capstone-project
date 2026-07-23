import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { User, Mail, Phone, Calendar, Droplet, Shield, Award, Building2, MapPin } from "lucide-react";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/profile")
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#0d6e7e] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!profile) return <div className="text-center py-12 text-gray-500">Failed to load profile.</div>;

  const role = (profile.role || "").toLowerCase().replace(/ /g, "_");

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-[#0d6e7e] flex items-center justify-center shrink-0">
            <User size={48} className="text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
            <p className="text-[#0d6e7e] font-medium capitalize">{profile.role}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Mail size={14} /> {profile.email}</span>
              {profile.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {profile.phone}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Shield size={18} className="text-[#0d6e7e]" /> Account Information
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500 text-sm">Full Name</span>
              <span className="font-medium text-gray-900 text-sm">{profile.fullName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500 text-sm">Email Address</span>
              <span className="font-medium text-gray-900 text-sm">{profile.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500 text-sm">Role</span>
              <span className="font-medium text-gray-900 text-sm capitalize">{profile.role}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500 text-sm">Account ID</span>
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">#{profile.id}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {role === 'patient' && (
            <>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Droplet size={18} className="text-red-500" /> Health Profile
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Blood Group</span>
                  <span className="font-bold text-red-600 text-sm">{profile.bloodGroup || "Not specified"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Date of Birth</span>
                  <span className="font-medium text-gray-900 text-sm">{profile.dateOfBirth || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-sm block mb-2">Allergies</span>
                  <div className="flex flex-wrap gap-2">
                    {profile.allergies?.length ? profile.allergies.map(a => <span key={a} className="bg-red-50 text-red-700 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">{a}</span>) : <span className="text-xs text-gray-400 italic">No allergies listed</span>}
                  </div>
                </div>
              </div>
            </>
          )}

          {role === 'doctor' && (
            <>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Award size={18} className="text-blue-500" /> Professional Details
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Specialty</span>
                  <span className="font-medium text-gray-900 text-sm">{profile.specialty}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Registration</span>
                  <span className="font-mono text-xs text-gray-900">{profile.registrationNumber}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}