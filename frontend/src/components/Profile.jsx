import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Droplet,
  Shield,
  Award,
  Building2,
  MapPin,
  Camera,
  Image as ImageIcon,
  Syringe,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit3,
  X,
  ZoomIn,
  Stethoscope,
  Activity,
  HeartPulse,
  Pill,
  AlertTriangle
} from "lucide-react";
import DoctorHospitalProfileModal from "@/components/DoctorHospitalProfileModal";
import PatientProfileModal from "@/components/PatientProfileModal";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const fetchProfile = () => {
    api.get("/profile")
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#0d6e7e] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!profile) return <div className="text-center py-12 text-gray-500">Failed to load profile.</div>;

  const role = (profile.role || "").toLowerCase().replace(/ /g, "_");

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-12">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0d6e7e] to-[#084b56] flex items-center justify-center shrink-0 shadow-md text-white">
            <User size={46} />
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-[#0d6e7e] border border-teal-100">
                {profile.role}
              </span>
              {role === "doctor" && profile.specialty && (
                <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                  {profile.specialty}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-gray-900">{profile.fullName}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2.5 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><Mail size={14} className="text-[#0d6e7e]" /> {profile.email}</span>
              {profile.phone && <span className="flex items-center gap-1.5"><Phone size={14} className="text-green-600" /> {profile.phone}</span>}
              {role === "doctor" && profile.hospital && (
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <Building2 size={14} className="text-[#0d6e7e]" /> {profile.hospital}
                </span>
              )}
            </div>
          </div>
        </div>

        {role === "doctor" && (
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0d6e7e] text-white rounded-2xl text-xs font-bold hover:bg-[#0a5566] transition-all shadow-sm hover:shadow-md shrink-0 cursor-pointer"
          >
            <Edit3 size={15} /> Edit Hospital & Service Rates
          </button>
        )}

        {role === "patient" && (
          <button
            onClick={() => setShowPatientModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0d6e7e] text-white rounded-2xl text-xs font-bold hover:bg-[#0a5566] transition-all shadow-sm hover:shadow-md shrink-0 cursor-pointer"
          >
            <Edit3 size={15} /> Update Health Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield size={18} className="text-[#0d6e7e]" /> Account Credentials
          </h2>
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Full Name</span>
              <span className="font-semibold text-gray-900">{profile.fullName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Email Address</span>
              <span className="font-semibold text-gray-900">{profile.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">System Role</span>
              <span className="font-semibold text-gray-900 capitalize">{profile.role}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Account ID</span>
              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded font-bold">#{profile.id}</span>
            </div>
            {profile.phone && (
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Phone Contact</span>
                <span className="font-semibold text-gray-900">{profile.phone}</span>
              </div>
            )}
            {profile.address && (
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Residential Address</span>
                <span className="font-semibold text-gray-900 text-right max-w-xs">{profile.address}</span>
              </div>
            )}
            {profile.primaryDoctorName && (
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Primary Doctor</span>
                <span className="font-semibold text-[#0d6e7e]">{profile.primaryDoctorName} {profile.primaryDoctorContact ? `(${profile.primaryDoctorContact})` : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Role-specific Details */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          {role === 'patient' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Droplet size={18} className="text-[#0d6e7e]" /> Medical & Health Profile
                </h2>
                <button
                  onClick={() => setShowPatientModal(true)}
                  className="text-xs text-[#0d6e7e] font-bold hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">Blood Group</span>
                  <span className="font-bold text-[#0d6e7e] px-2.5 py-0.5 bg-teal-50 border border-teal-200 rounded-md">{profile.bloodGroup || "Not specified"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">Date of Birth</span>
                  <span className="font-semibold text-gray-900">{profile.dateOfBirth || "Not specified"}</span>
                </div>

                {/* Major Surgeries */}
                <div className="py-2 border-b border-gray-50">
                  <span className="text-gray-500 block mb-1.5 font-medium flex items-center gap-1">
                    <Activity size={12} className="text-[#0d6e7e]" /> Major Surgeries & Procedures
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.majorSurgeries?.length ? (
                      profile.majorSurgeries.map((s, idx) => (
                        <span key={idx} className="bg-teal-50 text-[#0d6e7e] border border-teal-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic">No surgeries recorded</span>
                    )}
                  </div>
                </div>

                {/* Existing Conditions */}
                <div className="py-2 border-b border-gray-50">
                  <span className="text-gray-500 block mb-1.5 font-medium flex items-center gap-1">
                    <HeartPulse size={12} className="text-amber-600" /> Chronic Medical Conditions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.existingConditions?.length ? (
                      profile.existingConditions.map((c, idx) => (
                        <span key={idx} className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic">No chronic conditions listed</span>
                    )}
                  </div>
                </div>

                {/* Current Medicines */}
                <div className="py-2 border-b border-gray-50">
                  <span className="text-gray-500 block mb-1.5 font-medium flex items-center gap-1">
                    <Pill size={12} className="text-emerald-600" /> Current Medications
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.currentMedicines?.length ? (
                      profile.currentMedicines.map((m, idx) => (
                        <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                          {m}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic">No ongoing medicines recorded</span>
                    )}
                  </div>
                </div>

                {/* Known Allergies */}
                <div>
                  <span className="text-gray-500 block mb-1.5 font-medium flex items-center gap-1 text-amber-700">
                    <AlertTriangle size={12} className="text-amber-600" /> Known Allergies
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {profile.allergies?.length ? (
                      profile.allergies.map(a => (
                        <span key={a} className="bg-amber-50/70 text-amber-800 border border-amber-200/80 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase">
                          {a}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic">No allergies listed</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {role === 'doctor' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Award size={18} className="text-blue-600" /> Clinical Accreditation
                </h2>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="text-xs text-[#0d6e7e] font-bold hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">Specialty</span>
                  <span className="font-bold text-gray-900">{profile.specialty || "General Medicine"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">Medical Registration</span>
                  <span className="font-mono font-bold text-gray-900">{profile.registrationNumber || "MCI-48291"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">Qualification & Degree</span>
                  <span className="font-semibold text-gray-900">{profile.degree || "MBBS, MD"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">Years of Experience</span>
                  <span className="font-semibold text-gray-900">{profile.experience || 8} Years</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">OPD Consultation (Visiting Card)</span>
                  <span className="font-bold text-[#0d6e7e] text-sm">₹{profile.fee || 500}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* PATIENT-SPECIFIC: Emergency Same Blood Group Donor Network */}
      {role === "patient" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0d6e7e] flex items-center justify-center shrink-0">
                <Users size={22} className="text-[#0d6e7e]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    Same Blood Group Emergency Network
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-[#0d6e7e] border border-teal-200">
                    Blood Group: {profile.bloodGroup || "O+"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Two designated contacts who share your exact blood group for urgent transfusions and crisis backup.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPatientModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-[#0d6e7e] rounded-xl text-xs font-bold border border-teal-200 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Edit3 size={13} /> Update Emergency Donors
            </button>
          </div>

          {/* 2 Contacts Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map((idx) => {
              const c = profile?.sameBloodGroupContacts?.[idx];
              const hasData = Boolean(c && (c.name || c.phone));
              return (
                <div
                  key={idx}
                  className={`rounded-2xl p-5 border transition-all ${
                    hasData
                      ? "bg-gray-50/50 border-gray-200/80 shadow-xs hover:border-teal-200"
                      : "bg-gray-50/30 border-dashed border-gray-200 text-center"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#0d6e7e] text-white text-xs font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-gray-800">
                        {c?.relationship ? `${c.relationship} • Same Blood Group` : `Emergency Donor Contact #${idx + 1}`}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#0d6e7e] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      {profile.bloodGroup || "O+"}
                    </span>
                  </div>

                  {hasData ? (
                    <div className="space-y-2.5 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Full Name</span>
                        <p className="font-bold text-gray-900 text-sm mt-0.5">{c.name || "—"}</p>
                      </div>

                      {c.phone && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Contact Number</span>
                          <div className="flex items-center justify-between mt-0.5">
                            <a
                              href={`tel:${c.phone}`}
                              className="inline-flex items-center gap-1.5 text-[#0d6e7e] hover:text-[#0a5566] font-bold"
                            >
                              <Phone size={13} className="text-[#0d6e7e]" />
                              <span>{c.phone}</span>
                            </a>
                            <a
                              href={`tel:${c.phone}`}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-[#0d6e7e] rounded-lg text-xs font-bold border border-teal-200/70"
                            >
                              Call Now
                            </a>
                          </div>
                        </div>
                      )}

                      {c.address && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Residential / Work Address</span>
                          <p className="text-gray-700 flex items-start gap-1.5 mt-0.5 leading-snug">
                            <MapPin size={13} className="text-[#0d6e7e] shrink-0 mt-0.5" />
                            <span>{c.address}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4">
                      <p className="text-xs text-gray-400 italic mb-2">No contact registered for Donor #{idx + 1}</p>
                      <button
                        onClick={() => setShowPatientModal(true)}
                        className="text-xs font-bold text-[#0d6e7e] hover:underline cursor-pointer"
                      >
                        + Add Donor Info
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DOCTOR-SPECIFIC SECTIONS: Hospital Info, Photos & Rate Card */}
      {role === "doctor" && (
        <div className="space-y-6">
          {/* Hospital Information & Facilities Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0d6e7e] block">
                  Hospital Affiliation
                </span>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mt-0.5">
                  <Building2 size={22} className="text-[#0d6e7e]" /> {profile.hospital || "Hospital Not Specified"}
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-[#0d6e7e] rounded-xl text-xs font-bold border border-teal-200 transition-colors self-start sm:self-auto"
              >
                <Edit3 size={13} /> Update Hospital Info
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {profile.hospitalAbout ||
                "Equipped with comprehensive clinical infrastructure, emergency trauma units, modular operating theatres, and 24/7 intensive monitoring to ensure gold-standard patient safety."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900">Hospital Address</p>
                  <p className="text-gray-500 text-[11px] mt-0.5">
                    {profile.hospitalAddress || profile.location || "Hospital address not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone size={16} className="text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900">Hospital Phone & Helpdesk</p>
                  <p className="text-gray-500 text-[11px] mt-0.5">
                    {profile.hospitalPhone || "+91 800-456-7890"}
                  </p>
                </div>
              </div>
            </div>

            {/* Facilities */}
            <div>
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Shield size={14} className="text-[#0d6e7e]" /> Hospital Amenities & Facilities
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {(profile.hospitalFacilities || [
                  "24/7 Emergency Care",
                  "State-of-the-art ICU & NICU",
                  "In-house Diagnostic & Pathology Lab",
                  "24-Hour Pharmacy & Dispensary",
                  "Ambulance Service on Call",
                  "Wheelchair Accessible & Sanitized Suites"
                ]).map((fac, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50/50 border border-teal-100/60 text-xs text-gray-800">
                    <CheckCircle2 size={15} className="text-teal-600 shrink-0" />
                    <span className="font-medium">{fac}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hospital Photo Gallery */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-[#0d6e7e]" /> Hospital Photos ({profile.hospitalImages?.length || 0})
                </h4>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="text-xs text-[#0d6e7e] font-bold hover:underline flex items-center gap-1"
                >
                  <Camera size={13} /> Manage Photos
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(profile.hospitalImages && profile.hospitalImages.length > 0 ? profile.hospitalImages : [
                  {
                    id: 1,
                    url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80",
                    title: "Main Hospital Building",
                    description: "Emergency trauma care and outpatient center"
                  },
                  {
                    id: 2,
                    url: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=1200&q=80",
                    title: "Doctor Consultation Room",
                    description: "Private sanitized clinical consultation suite"
                  },
                  {
                    id: 3,
                    url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&q=80",
                    title: "Intensive Care Unit",
                    description: "Life support monitoring and inpatient recovery"
                  }
                ]).map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewPhoto(img)}
                    className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col"
                  >
                    <div className="h-40 w-full bg-gray-100 relative overflow-hidden">
                      <img
                        src={img.url}
                        alt={img.title || "Hospital Photo"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5">
                        <ZoomIn size={18} />
                        <span className="text-xs font-bold">Preview</span>
                      </div>
                    </div>
                    <div className="p-3 bg-white">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {img.title || `Hospital Photo ${idx + 1}`}
                      </p>
                      {img.description && (
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                          {img.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clinical Services & Price List Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0d6e7e] block">
                  Transparency & Pricing
                </span>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mt-0.5">
                  <Syringe size={22} className="text-[#0d6e7e]" /> Clinical Services & Consumables Rate Card
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Active rate card visible to patients during online appointment booking.
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0d6e7e] text-white rounded-xl text-xs font-bold hover:bg-[#0a5566] transition-colors self-start sm:self-auto shadow-xs"
              >
                <Edit3 size={13} /> Update Service Prices
              </button>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 grid grid-cols-12 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <div className="col-span-7 sm:col-span-7">Service / Item Name</div>
                <div className="col-span-3 sm:col-span-3">Category</div>
                <div className="col-span-2 sm:col-span-2 text-right">Standard Rate</div>
              </div>

              <div className="divide-y divide-gray-100 bg-white">
                {(profile.services && profile.services.length > 0 ? profile.services : [
                  { id: "s1", name: "Visiting Card / OPD Consultation", price: profile.fee || 500, category: "Consultation", description: "Comprehensive in-person consultation & vitals examination" },
                  { id: "s2", name: "Injection Administration (IM / IV)", price: 100, category: "Nursing & Injections", description: "Safe sterile injection delivery with vitals observation" },
                  { id: "s3", name: "Sterile Disposable Syringe & Needle", price: 30, category: "Consumables", description: "Medical-grade single-use sterile syringe pack" },
                  { id: "s4", name: "Antiseptic Wound Dressing & Bandage", price: 250, category: "Minor Procedures", description: "Complete aseptic wound cleaning and dressing" },
                  { id: "s5", name: "12-Lead Electrocardiogram (ECG)", price: 400, category: "Diagnostics & Monitoring", description: "Immediate cardiac rhythm check with doctor interpretation" },
                  { id: "s6", name: "Emergency Triage & Assessment", price: 1200, category: "Emergency Care", description: "Priority emergency stabilization and physician consultation" }
                ]).map((srv, idx) => (
                  <div
                    key={srv.id || idx}
                    className="px-4 py-3 grid grid-cols-12 items-center text-xs hover:bg-teal-50/30 transition-colors"
                  >
                    <div className="col-span-7 sm:col-span-7 pr-2">
                      <p className="font-bold text-gray-900">{srv.name}</p>
                      {srv.description && (
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{srv.description}</p>
                      )}
                    </div>
                    <div className="col-span-3 sm:col-span-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                        {srv.category || "General"}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-2 text-right">
                      <span className="font-black text-sm text-[#0d6e7e]">₹{srv.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-[11px] text-amber-800 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-600 shrink-0" />
              <span>
                You can add or update rates at any time. All updates are immediately reflected to patients booking online.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for Profile Preview */}
      {previewPhoto && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="max-h-[75vh] w-full flex items-center justify-center bg-black/40 overflow-hidden">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.title || "Hospital"}
                className="max-h-[75vh] w-auto object-contain mx-auto"
              />
            </div>
            <div className="p-4 bg-gray-900/90 text-white">
              <h4 className="text-sm font-bold">{previewPhoto.title}</h4>
              {previewPhoto.description && (
                <p className="text-xs text-gray-300 mt-1">{previewPhoto.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Doctor Hospital Profile & Rate Card Editor Modal */}
      {showEditModal && (
        <DoctorHospitalProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          initialDoctorId={profile?.id}
          onProfileUpdated={(updated) => {
            fetchProfile();
          }}
        />
      )}

      {/* Patient Health Profile Modal */}
      {showPatientModal && (
        <PatientProfileModal
          isOpen={showPatientModal}
          onClose={() => setShowPatientModal(false)}
          patientId={profile?.id}
          initialData={profile}
          onUpdated={(updated) => {
            fetchProfile();
          }}
        />
      )}
    </div>
  );
}