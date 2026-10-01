import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  X,
  Upload,
  Plus,
  Trash2,
  Building2,
  Stethoscope,
  Image as ImageIcon,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Save,
  MapPin,
  Phone,
  Mail,
  Shield,
  Award,
  Sparkles,
  RefreshCw,
  ExternalLink
} from "lucide-react";

export default function DoctorHospitalProfileModal({
  isOpen,
  onClose,
  initialDoctorId,
  onProfileUpdated
}) {
  const [activeTab, setActiveTab] = useState("hospital"); // "doctor", "hospital", "images", "services"
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    id: null,
    fullName: "",
    specialty: "",
    degree: "",
    experience: 0,
    registrationNumber: "",
    fee: 500,
    phone: "",
    email: "",
    bio: "",
    hospital: "",
    hospitalAddress: "",
    hospitalPhone: "",
    hospitalEmail: "",
    hospitalAbout: "",
    hospitalFacilities: [],
    hospitalImages: [],
    services: []
  });

  // Inputs for adding new items
  const [newFacilityInput, setNewFacilityInput] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageCaption, setNewImageCaption] = useState("");
  const [newService, setNewService] = useState({
    name: "",
    category: "Clinical & Nursing",
    price: "",
    description: ""
  });

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const fetchUrl = initialDoctorId ? `/doctors/${initialDoctorId}` : `/profile`;
    api.get(fetchUrl)
      .then((data) => {
        setFormData({
          id: data.id,
          fullName: data.fullName || "",
          specialty: data.specialty || "",
          degree: data.degree || "",
          experience: data.experience || 0,
          registrationNumber: data.registrationNumber || "",
          fee: data.fee || 600,
          phone: data.phone || "",
          email: data.email || "",
          bio: data.bio || "",
          hospital: data.hospital || "MediCore Hospital",
          hospitalAddress: data.hospitalAddress || data.location || "",
          hospitalPhone: data.hospitalPhone || data.phone || "",
          hospitalEmail: data.hospitalEmail || data.email || "",
          hospitalAbout: data.hospitalAbout || "",
          hospitalFacilities: Array.isArray(data.hospitalFacilities) ? data.hospitalFacilities : [],
          hospitalImages: Array.isArray(data.hospitalImages) ? data.hospitalImages : [],
          services: Array.isArray(data.services) ? data.services : []
        });
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg("Failed to load profile details.");
      })
      .finally(() => setLoading(false));
  }, [isOpen, initialDoctorId]);

  // Handle image file upload using backend /api/uploads
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMsg("");

    try {
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      uploadForm.append("assetType", "hospital_image");

      const res = await api.upload("/uploads", uploadForm);
      if (res && res.url) {
        const newImg = {
          url: res.url,
          caption: newImageCaption.trim() || file.name.replace(/\.[^/.]+$/, "") || "Hospital Photo"
        };
        setFormData((prev) => ({
          ...prev,
          hospitalImages: [...prev.hospitalImages, newImg]
        }));
        setNewImageCaption("");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to upload image. You can also paste an image URL directly.");
    } finally {
      setUploadingImage(false);
      // Reset input
      e.target.value = "";
    }
  };

  // Add image by URL
  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    const newImg = {
      url: newImageUrl.trim(),
      caption: newImageCaption.trim() || "Hospital Facility Photo"
    };
    setFormData((prev) => ({
      ...prev,
      hospitalImages: [...prev.hospitalImages, newImg]
    }));
    setNewImageUrl("");
    setNewImageCaption("");
  };

  // Remove image
  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      hospitalImages: prev.hospitalImages.filter((_, i) => i !== index)
    }));
  };

  // Add facility tag
  const handleAddFacility = () => {
    if (!newFacilityInput.trim()) return;
    const clean = newFacilityInput.trim();
    if (!formData.hospitalFacilities.includes(clean)) {
      setFormData((prev) => ({
        ...prev,
        hospitalFacilities: [...prev.hospitalFacilities, clean]
      }));
    }
    setNewFacilityInput("");
  };

  // Remove facility tag
  const handleRemoveFacility = (fac) => {
    setFormData((prev) => ({
      ...prev,
      hospitalFacilities: prev.hospitalFacilities.filter((f) => f !== fac)
    }));
  };

  // Add Service
  const handleAddService = () => {
    if (!newService.name.trim() || !newService.price) {
      setErrorMsg("Please enter service name and price.");
      return;
    }
    const item = {
      id: Date.now().toString(),
      name: newService.name.trim(),
      category: newService.category || "General",
      price: parseFloat(newService.price) || 0,
      description: newService.description.trim() || "Standard clinical service"
    };
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, item]
    }));
    setNewService({
      name: "",
      category: "Clinical & Nursing",
      price: "",
      description: ""
    });
    setErrorMsg("");
  };

  // Quick preset service adder
  const addPresetService = (name, price, category, description) => {
    if (formData.services.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      return;
    }
    const item = {
      id: Date.now().toString() + Math.random(),
      name,
      price,
      category,
      description
    };
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, item]
    }));
  };

  // Update single service price or field
  const handleUpdateServicePrice = (index, newPrice) => {
    const next = [...formData.services];
    next[index].price = parseFloat(newPrice) || 0;
    setFormData((prev) => ({ ...prev, services: next }));
  };

  const handleRemoveService = (index) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  // Save all changes
  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const targetId = formData.id || initialDoctorId;
      const patchUrl = targetId ? `/doctors/${targetId}` : `/profile`;

      const res = await api.patch(patchUrl, formData);

      // Also ensure profile endpoint gets updated if doctor edited their own profile
      await api.patch(`/profile`, formData).catch(console.error);

      setSuccessMsg("Hospital profile, images & service rates updated successfully!");
      if (onProfileUpdated) {
        onProfileUpdated(res);
      }
      setTimeout(() => {
        setSuccessMsg("");
      }, 3500);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-800 via-[#0d6e7e] to-teal-700 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              <Building2 size={22} className="text-teal-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Hospital & Services Management</h2>
              <p className="text-xs text-teal-100 font-medium">
                Update doctor bio, hospital facilities, photo gallery & clinical service prices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 px-6 gap-2 overflow-x-auto text-xs font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveTab("hospital")}
            className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "hospital"
                ? "border-[#0d6e7e] text-[#0d6e7e] bg-white font-black"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Building2 size={16} /> Hospital Info
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("images")}
            className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "images"
                ? "border-[#0d6e7e] text-[#0d6e7e] bg-white font-black"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <ImageIcon size={16} /> Hospital Photos ({formData.hospitalImages.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("services")}
            className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "services"
                ? "border-[#0d6e7e] text-[#0d6e7e] bg-white font-black"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <DollarSign size={16} /> Service Price List ({formData.services.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("doctor")}
            className={`py-3.5 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "doctor"
                ? "border-[#0d6e7e] text-[#0d6e7e] bg-white font-black"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Stethoscope size={16} /> Doctor Bio & Credentials
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <p className="font-semibold">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm animate-in fade-in">
              <CheckCircle size={18} className="shrink-0 text-emerald-600" />
              <p className="font-bold">{successMsg}</p>
            </div>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-500">
              <RefreshCw size={28} className="animate-spin text-[#0d6e7e]" />
              <p className="text-sm font-semibold">Loading profile information...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: HOSPITAL INFORMATION */}
              {activeTab === "hospital" && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Hospital / Clinic Name *
                      </label>
                      <input
                        type="text"
                        value={formData.hospital}
                        onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                        placeholder="e.g. City Multi-Speciality Hospital"
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Hospital Address / Location *
                      </label>
                      <input
                        type="text"
                        value={formData.hospitalAddress}
                        onChange={(e) => setFormData({ ...formData, hospitalAddress: e.target.value })}
                        placeholder="e.g. Link Road, Opp Bus Stand, Pandharpur, 413304"
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Emergency & Reception Phone
                      </label>
                      <input
                        type="text"
                        value={formData.hospitalPhone}
                        onChange={(e) => setFormData({ ...formData, hospitalPhone: e.target.value })}
                        placeholder="e.g. +91 98765 43210 / 02186-224466"
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Hospital Official Email
                      </label>
                      <input
                        type="email"
                        value={formData.hospitalEmail}
                        onChange={(e) => setFormData({ ...formData, hospitalEmail: e.target.value })}
                        placeholder="e.g. contact@cityhospital.com"
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      About the Hospital & Infrastructure
                    </label>
                    <textarea
                      rows={3}
                      value={formData.hospitalAbout}
                      onChange={(e) => setFormData({ ...formData, hospitalAbout: e.target.value })}
                      placeholder="Describe your clinic, surgical setup, hygiene standards, emergency preparedness..."
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                    />
                  </div>

                  {/* Facilities & Amenities Tags */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Hospital Facilities & Amenities (Visible to Patients)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.hospitalFacilities.map((fac, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-teal-50 border border-teal-200 text-[#0d6e7e] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle size={13} className="text-teal-600" />
                          {fac}
                          <button
                            type="button"
                            onClick={() => handleRemoveFacility(fac)}
                            className="text-teal-400 hover:text-red-500 ml-1"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add new facility (e.g. 24/7 ICU, Digital X-Ray, In-house Pharmacy)"
                        value={newFacilityInput}
                        onChange={(e) => setNewFacilityInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddFacility();
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddFacility}
                        className="px-4 py-2 bg-[#0d6e7e] text-white rounded-xl text-xs font-bold hover:bg-[#0a5566]"
                      >
                        + Add Facility
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: HOSPITAL PHOTO GALLERY */}
              {activeTab === "images" && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="bg-teal-50/70 border border-teal-200 p-4 rounded-2xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                        <ImageIcon size={18} className="text-[#0d6e7e]" /> Hospital & Clinic Image Gallery
                      </h4>
                      <p className="text-xs text-teal-800">
                        Patients view these hospital photos while booking appointments to inspect your clinic, waiting rooms, and treatment wards.
                      </p>
                    </div>
                    <label className="cursor-pointer px-4 py-2.5 bg-[#0d6e7e] hover:bg-[#0a5566] text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-2 shrink-0 transition-all">
                      <Upload size={14} />
                      {uploadingImage ? "Uploading..." : "Upload Photo"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleFileUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Add by image URL */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Or Add Photo by Direct URL / Web Link
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <input
                        type="url"
                        placeholder="Paste image URL (https://...)"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="md:col-span-6 px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Caption (e.g. Operation Suite, Reception)"
                        value={newImageCaption}
                        onChange={(e) => setNewImageCaption(e.target.value)}
                        className="md:col-span-4 px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="md:col-span-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
                      >
                        + Add Image
                      </button>
                    </div>
                  </div>

                  {/* Image Grid Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.hospitalImages.map((img, i) => (
                      <div
                        key={i}
                        className="group relative rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all flex flex-col"
                      >
                        <div className="h-44 w-full bg-gray-100 overflow-hidden relative">
                          <img
                            src={img.url}
                            alt={img.caption || `Hospital photo ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=500&q=80";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(i)}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-md"
                            title="Delete image"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="p-3 bg-white border-t border-gray-100">
                          <p className="text-xs font-bold text-gray-800 truncate">
                            {img.caption || "Hospital Photo"}
                          </p>
                          <a
                            href={img.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-teal-600 hover:underline flex items-center gap-1 mt-1 truncate"
                          >
                            <ExternalLink size={10} /> View full resolution
                          </a>
                        </div>
                      </div>
                    ))}

                    {formData.hospitalImages.length === 0 && (
                      <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 border border-dashed border-gray-300 rounded-2xl">
                        <ImageIcon size={36} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-semibold">No hospital photos uploaded yet.</p>
                        <p className="text-xs text-gray-400 mt-1">Upload pictures of your hospital entrance, ICU, or consultation rooms.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SERVICES & PRICE LIST */}
              {activeTab === "services" && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                        <DollarSign size={18} className="text-emerald-700" /> Clinical Services & Rate Card
                      </h4>
                      <p className="text-xs text-emerald-800">
                        Patients view this transparent service price list (visiting card, injection, syringe, dressing, ECG) before taking appointments.
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs bg-emerald-600 text-white font-black px-3 py-1.5 rounded-xl shadow-xs">
                        {formData.services.length} Services Listed
                      </span>
                    </div>
                  </div>

                  {/* Add new service form */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Add New Medical Service / Consumable
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <input
                        type="text"
                        placeholder="Service Name (e.g. Nebulization, IV Infusion)"
                        value={newService.name}
                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                        className="sm:col-span-4 px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                      <select
                        value={newService.category}
                        onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                        className="sm:col-span-3 px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                      >
                        <option value="Consultation">Consultation</option>
                        <option value="Clinical & Nursing">Clinical & Nursing</option>
                        <option value="Medical Consumable">Medical Consumable</option>
                        <option value="Minor Procedure">Minor Procedure</option>
                        <option value="Diagnostics">Diagnostics</option>
                        <option value="Emergency">Emergency</option>
                      </select>
                      <div className="sm:col-span-3 relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">₹</span>
                        <input
                          type="number"
                          placeholder="Price (₹)"
                          value={newService.price}
                          onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddService}
                        className="sm:col-span-2 px-4 py-2 bg-[#0d6e7e] text-white rounded-xl text-xs font-bold hover:bg-[#0a5566] transition-colors"
                      >
                        + Add Service
                      </button>
                    </div>

                    {/* Quick Presets */}
                    <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-gray-500">Quick Add:</span>
                      {[
                        { name: "Injection Administration", price: 100, cat: "Clinical & Nursing", desc: "IM / IV injection" },
                        { name: "Sterile Syringe & Needle", price: 30, cat: "Medical Consumable", desc: "Single-use sterile pack" },
                        { name: "Wound Dressing & Antiseptic", price: 250, cat: "Minor Procedure", desc: "Sterile gauze dressing" },
                        { name: "ECG Test", price: 400, cat: "Diagnostics", desc: "12-lead digital electrocardiogram" },
                        { name: "Nebulization Session", price: 150, cat: "Clinical & Nursing", desc: "Respiratory nebulizer treatment" }
                      ].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => addPresetService(preset.name, preset.price, preset.cat, preset.desc)}
                          className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          + {preset.name} (₹{preset.price})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Services List Table */}
                  <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 font-bold text-gray-500 uppercase">Service Name</th>
                          <th className="px-4 py-3 font-bold text-gray-500 uppercase">Category</th>
                          <th className="px-4 py-3 font-bold text-gray-500 uppercase text-right">Price (₹)</th>
                          <th className="px-4 py-3 font-bold text-gray-500 uppercase text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {formData.services.map((srv, idx) => (
                          <tr key={srv.id || idx} className="hover:bg-gray-50/70 transition-colors">
                            <td className="px-4 py-3.5">
                              <p className="font-bold text-gray-900">{srv.name}</p>
                              {srv.description && (
                                <p className="text-[11px] text-gray-500 font-normal mt-0.5">{srv.description}</p>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-[#0d6e7e] border border-teal-100">
                                {srv.category || "General"}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="inline-flex items-center gap-1">
                                <span className="text-gray-400 font-bold">₹</span>
                                <input
                                  type="number"
                                  value={srv.price}
                                  onChange={(e) => handleUpdateServicePrice(idx, e.target.value)}
                                  className="w-24 text-right px-2 py-1 border border-gray-300 rounded-lg font-black text-gray-900 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveService(idx)}
                                className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Remove service"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}

                        {formData.services.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-gray-400 italic">
                              No services added yet. Add visiting card, injection, syringe, or procedural fees.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: DOCTOR BIO & CREDENTIALS */}
              {activeTab === "doctor" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Doctor Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Primary Specialty
                      </label>
                      <input
                        type="text"
                        value={formData.specialty}
                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                        placeholder="e.g. Cardiologist, Neurologist, General Physician"
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Medical Degree
                      </label>
                      <input
                        type="text"
                        value={formData.degree}
                        onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                        placeholder="e.g. MBBS, MD, MS"
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Experience (Years)
                      </label>
                      <input
                        type="number"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Standard Consultation Fee (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.fee}
                        onChange={(e) => setFormData({ ...formData, fee: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-teal-800 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Medical Registration Number
                      </label>
                      <input
                        type="text"
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        placeholder="e.g. MCI-2019-87654"
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Doctor Biography & Clinical Focus
                    </label>
                    <textarea
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Doctor background, clinical expertise, areas of special interest..."
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-6 py-2.5 bg-[#0d6e7e] hover:bg-[#0a5566] text-white rounded-xl text-sm font-bold shadow-md shadow-teal-900/10 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save size={16} /> Save Profile & Rate Card
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
