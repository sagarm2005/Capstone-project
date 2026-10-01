import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  X,
  Building2,
  Stethoscope,
  MapPin,
  Phone,
  Mail,
  Star,
  Award,
  Image as ImageIcon,
  Calendar,
  Syringe,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ZoomIn
} from "lucide-react";

export default function DoctorPublicProfileModal({
  isOpen,
  onClose,
  doctor,
  onBook
}) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview", "photos", "services"
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState("all");

  useEffect(() => {
    if (!isOpen || !doctor?.id) return;
    setLoading(true);
    api.get(`/doctors/${doctor.id}`)
      .then((data) => {
        setDoctorDetails(data);
      })
      .catch((err) => {
        console.error("Failed to load doctor details:", err);
        setDoctorDetails(doctor); // fallback to initial
      })
      .finally(() => setLoading(false));
  }, [isOpen, doctor?.id]);

  if (!isOpen) return null;

  const currentDoc = doctorDetails || doctor || {};
  const hospitalImages = currentDoc.hospitalImages && currentDoc.hospitalImages.length > 0
    ? currentDoc.hospitalImages
    : [
        {
          id: 1,
          url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80",
          title: "Main Hospital Building & Emergency Entrance",
          description: "24/7 emergency trauma care and outpatient specialty center"
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
          title: "Intensive Care Unit & Inpatient Ward",
          description: "State-of-the-art life support monitoring and nursing station"
        }
      ];

  const facilities = currentDoc.hospitalFacilities && currentDoc.hospitalFacilities.length > 0
    ? currentDoc.hospitalFacilities
    : [
        "24/7 Emergency Care",
        "State-of-the-art ICU & NICU",
        "In-house Diagnostic & Pathology Lab",
        "24-Hour Pharmacy & Dispensary",
        "Ambulance Service on Call",
        "Wheelchair Accessible & Sanitized Suites"
      ];

  const services = currentDoc.services && currentDoc.services.length > 0
    ? currentDoc.services
    : [
        { id: "s1", name: "Visiting Card / OPD Consultation", price: currentDoc.fee || 500, category: "Consultation", description: "Comprehensive in-person consultation & vitals examination" },
        { id: "s2", name: "Injection Administration (IM / IV)", price: 100, category: "Nursing & Injections", description: "Safe sterile injection delivery with vitals observation" },
        { id: "s3", name: "Sterile Disposable Syringe & Needle", price: 30, category: "Consumables", description: "Medical-grade single-use sterile syringe pack" },
        { id: "s4", name: "Antiseptic Wound Dressing & Bandage", price: 250, category: "Minor Procedures", description: "Complete aseptic wound cleaning and dressing" },
        { id: "s5", name: "12-Lead Electrocardiogram (ECG)", price: 400, category: "Diagnostics & Monitoring", description: "Immediate cardiac rhythm check with doctor interpretation" },
        { id: "s6", name: "Emergency Triage & Assessment", price: 1200, category: "Emergency Care", description: "Priority emergency stabilization and physician consultation" }
      ];

  const categories = ["all", ...new Set(services.map(s => s.category || "General"))];

  const filteredServices = services.filter((srv) => {
    const matchesSearch = srv.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      (srv.description && srv.description.toLowerCase().includes(serviceSearch.toLowerCase()));
    const matchesCategory = serviceCategoryFilter === "all" || srv.category === serviceCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden my-auto">
        
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-[#0d6e7e] via-[#095260] to-[#084b56] text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pr-10">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-lg">
              <Stethoscope size={36} className="text-teal-200" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-400/20 text-teal-200 border border-teal-400/30">
                  {currentDoc.specialty || "General Medicine"}
                </span>
                {currentDoc.rating && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full">
                    <Star size={12} className="fill-amber-300 text-amber-300" /> {currentDoc.rating}
                  </span>
                )}
                {currentDoc.experience && (
                  <span className="text-xs text-teal-100/90 font-medium">
                    • {currentDoc.experience}+ Years Exp.
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-black tracking-tight">{currentDoc.fullName}</h1>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-teal-100">
                <span className="flex items-center gap-1">
                  <Building2 size={13} className="text-teal-300" />
                  <span className="font-semibold">{currentDoc.hospital || "Apollo Multispeciality Hospital"}</span>
                </span>
                {(currentDoc.location || currentDoc.hospitalAddress) && (
                  <span className="flex items-center gap-1 text-teal-200/80">
                    <MapPin size={13} />
                    <span>{currentDoc.location || currentDoc.hospitalAddress}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Fee Badge */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-right shrink-0">
              <p className="text-[11px] uppercase tracking-wider text-teal-200 font-semibold">Consultation Fee</p>
              <p className="text-2xl font-black text-white">₹{currentDoc.fee || 500}</p>
              <p className="text-[10px] text-teal-200/80">Visiting Card included</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-6 border-b border-white/10 pt-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-2.5 px-3 text-xs font-bold transition-all relative ${
                activeTab === "overview"
                  ? "text-white border-b-2 border-teal-300"
                  : "text-teal-200/70 hover:text-white"
              }`}
            >
              Doctor & Hospital Overview
            </button>
            <button
              onClick={() => setActiveTab("photos")}
              className={`pb-2.5 px-3 text-xs font-bold transition-all flex items-center gap-1.5 relative ${
                activeTab === "photos"
                  ? "text-white border-b-2 border-teal-300"
                  : "text-teal-200/70 hover:text-white"
              }`}
            >
              <ImageIcon size={13} />
              Hospital Photo Gallery ({hospitalImages.length})
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`pb-2.5 px-3 text-xs font-bold transition-all flex items-center gap-1.5 relative ${
                activeTab === "services"
                  ? "text-white border-b-2 border-teal-300"
                  : "text-teal-200/70 hover:text-white"
              }`}
            >
              <Syringe size={13} />
              Services Price List ({services.length})
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <div className="w-8 h-8 border-4 border-[#0d6e7e] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Loading hospital profile & rates...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Doctor Bio */}
                  <div className="bg-teal-50/50 rounded-2xl p-5 border border-teal-100">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
                      <Award size={16} className="text-[#0d6e7e]" /> About Dr. {currentDoc.fullName}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {currentDoc.bio ||
                        `${currentDoc.fullName} is a highly accomplished ${currentDoc.specialty || "specialist"} dedicated to delivering compassionate, evidence-based patient healthcare with modern diagnostics and state-of-the-art facilities.`}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-teal-100/60 text-xs">
                      <div>
                        <span className="text-gray-400 text-[11px] block">Qualification</span>
                        <span className="font-semibold text-gray-800">{currentDoc.degree || "MBBS, MD"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[11px] block">Medical Reg. No.</span>
                        <span className="font-semibold font-mono text-gray-800">{currentDoc.registrationNumber || "MCI-48291"}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[11px] block">Experience</span>
                        <span className="font-semibold text-gray-800">{currentDoc.experience || 8} Years</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[11px] block">OPD Visiting Fee</span>
                        <span className="font-bold text-[#0d6e7e]">₹{currentDoc.fee || 500}</span>
                      </div>
                    </div>
                  </div>

                  {/* Hospital Info & Highlights */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider font-bold text-[#0d6e7e] block">Affiliated Facility</span>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mt-0.5">
                          <Building2 size={18} className="text-[#0d6e7e]" /> {currentDoc.hospital || "Apollo Multispeciality Hospital"}
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab("photos")}
                        className="text-xs font-bold text-[#0d6e7e] hover:underline flex items-center gap-1"
                      >
                        View {hospitalImages.length} Photos <ChevronRight size={13} />
                      </button>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      {currentDoc.hospitalAbout ||
                        "Equipped with comprehensive clinical infrastructure, emergency trauma units, modular operating theatres, and 24/7 intensive monitoring to ensure gold-standard patient safety."}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                      <div className="flex items-start gap-2.5 text-gray-700">
                        <MapPin size={15} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900">Hospital Address</p>
                          <p className="text-gray-500 text-[11px] mt-0.5">
                            {currentDoc.hospitalAddress || currentDoc.location || "Plot 14, Health City, Sector 5"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 text-gray-700">
                        <Phone size={15} className="text-green-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900">Hospital Contact & Emergency</p>
                          <p className="text-gray-500 text-[11px] mt-0.5">
                            {currentDoc.hospitalPhone || "+91 800-456-7890"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Hospital Facilities Pills */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-[#0d6e7e]" /> Hospital Facilities & Amenities
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {facilities.map((fac, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-teal-50/50 border border-teal-100/60 text-xs text-gray-800">
                            <CheckCircle2 size={14} className="text-teal-600 shrink-0" />
                            <span className="font-medium">{fac}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Hospital Photo Preview Thumbnails */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                          <ImageIcon size={14} className="text-[#0d6e7e]" /> Hospital Gallery Preview
                        </h4>
                        <button
                          onClick={() => setActiveTab("photos")}
                          className="text-xs text-[#0d6e7e] font-semibold hover:underline"
                        >
                          View Full Gallery
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        {hospitalImages.slice(0, 3).map((img, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              setSelectedPhoto(img);
                              setActiveTab("photos");
                            }}
                            className="group relative h-24 rounded-xl overflow-hidden cursor-pointer border border-gray-200 shadow-xs"
                          >
                            <img
                              src={img.url}
                              alt={img.title || "Hospital"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <ZoomIn size={18} />
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[10px] text-white font-medium truncate">
                              {img.title || `Photo ${i + 1}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Highlight Rate Card teaser */}
                  <div className="bg-gradient-to-r from-gray-50 to-teal-50/30 rounded-2xl p-5 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Syringe size={16} className="text-[#0d6e7e]" /> Transparent Clinical Services & Rates
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Doctor-verified price list for visiting cards, injections, syringes, wound dressings, and procedures.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("services")}
                      className="px-4 py-2 bg-[#0d6e7e] text-white text-xs font-bold rounded-xl hover:bg-[#0a5566] transition-colors shrink-0 shadow-xs"
                    >
                      View All {services.length} Services
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: HOSPITAL PHOTOS */}
              {activeTab === "photos" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <ImageIcon size={16} className="text-[#0d6e7e]" /> Hospital Infrastructure & Premises
                      </h3>
                      <p className="text-xs text-gray-500">
                        High-resolution photographs of {currentDoc.hospital || "the hospital"}, wards, and diagnostic units.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-teal-50 text-[#0d6e7e] rounded-full border border-teal-100">
                      {hospitalImages.length} Photos
                    </span>
                  </div>

                  {/* Photo Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {hospitalImages.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedPhoto(img)}
                        className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col"
                      >
                        <div className="h-44 w-full bg-gray-100 relative overflow-hidden">
                          <img
                            src={img.url}
                            alt={img.title || "Hospital Facility"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2">
                            <ZoomIn size={20} />
                            <span className="text-xs font-bold">Enlarge</span>
                          </div>
                        </div>
                        <div className="p-3 bg-white flex-1 flex flex-col justify-between">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {img.title || `Facility Photo ${idx + 1}`}
                          </p>
                          {img.description && (
                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                              {img.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Photo Lightbox Modal */}
                  {selectedPhoto && (
                    <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
                      <div className="relative max-w-4xl w-full bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
                        <button
                          onClick={() => setSelectedPhoto(null)}
                          className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                        >
                          <X size={20} />
                        </button>
                        <div className="max-h-[75vh] w-full flex items-center justify-center bg-black/40 overflow-hidden">
                          <img
                            src={selectedPhoto.url}
                            alt={selectedPhoto.title || "Hospital Preview"}
                            className="max-h-[75vh] w-auto object-contain mx-auto"
                          />
                        </div>
                        <div className="p-4 bg-gray-900/90 text-white">
                          <h4 className="text-sm font-bold">{selectedPhoto.title}</h4>
                          {selectedPhoto.description && (
                            <p className="text-xs text-gray-300 mt-1">{selectedPhoto.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SERVICES PRICE LIST */}
              {activeTab === "services" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Syringe size={16} className="text-[#0d6e7e]" /> Clinical Services & Consumables Rate Card
                      </h3>
                      <p className="text-xs text-gray-500">
                        Transparent pricing updated directly by Dr. {currentDoc.fullName}.
                      </p>
                    </div>

                    {/* Filter and Search */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        placeholder="Search services (e.g. syringe, injection)..."
                        className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none w-56"
                      />
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setServiceCategoryFilter(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize shrink-0 transition-colors ${
                          serviceCategoryFilter === cat
                            ? "bg-[#0d6e7e] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Services Table */}
                  <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-200 grid grid-cols-12 text-xs font-bold text-gray-600 uppercase tracking-wider">
                      <div className="col-span-7 sm:col-span-7">Service / Item</div>
                      <div className="col-span-3 sm:col-span-3">Category</div>
                      <div className="col-span-2 sm:col-span-2 text-right">Standard Rate</div>
                    </div>

                    <div className="divide-y divide-gray-100 bg-white">
                      {filteredServices.length === 0 ? (
                        <div className="p-8 text-center text-xs text-gray-400 italic">
                          No clinical services match your filter.
                        </div>
                      ) : (
                        filteredServices.map((srv, idx) => (
                          <div
                            key={srv.id || idx}
                            className="px-4 py-3.5 grid grid-cols-12 items-center text-xs hover:bg-teal-50/30 transition-colors"
                          >
                            <div className="col-span-7 sm:col-span-7 pr-2">
                              <p className="font-bold text-gray-900 flex items-center gap-1.5">
                                {srv.name.toLowerCase().includes("visiting") ? (
                                  <Stethoscope size={14} className="text-[#0d6e7e] shrink-0" />
                                ) : srv.name.toLowerCase().includes("injection") || srv.name.toLowerCase().includes("syringe") ? (
                                  <Syringe size={14} className="text-teal-600 shrink-0" />
                                ) : (
                                  <ShieldCheck size={14} className="text-gray-400 shrink-0" />
                                )}
                                <span>{srv.name}</span>
                              </p>
                              {srv.description && (
                                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{srv.description}</p>
                              )}
                            </div>

                            <div className="col-span-3 sm:col-span-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                                {srv.category || "Clinical"}
                              </span>
                            </div>

                            <div className="col-span-2 sm:col-span-2 text-right">
                              <span className="font-black text-sm text-[#0d6e7e]">
                                ₹{srv.price}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-[11px] text-amber-800 flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-600 shrink-0" />
                    <span>
                      Rates are inclusive of disposable surgical sterilization and medical compliance standards.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-500 flex items-center gap-1.5">
            <Building2 size={14} className="text-[#0d6e7e]" />
            <span>Consulting at <span className="font-semibold text-gray-700">{currentDoc.hospital || "Hospital"}</span></span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
            {onBook && (
              <button
                onClick={() => {
                  onClose();
                  onBook(currentDoc);
                }}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-[#0d6e7e] text-white font-bold text-xs rounded-xl hover:bg-[#0a5566] transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Calendar size={14} /> Book Appointment (₹{currentDoc.fee || 500})
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
