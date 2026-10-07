import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import SafeBitesScannerModal from "@/components/SafeBitesScannerModal";
import SafeBitesFlashQuiz from "@/components/SafeBitesFlashQuiz";
import SafeBitesVisualIngredients from "@/components/SafeBitesVisualIngredients";
import SafeBitesInternationalComparison from "@/components/SafeBitesInternationalComparison";
import {
  ShieldAlert, ShieldCheck, AlertTriangle, Scan, Search, Camera,
  Sparkles, Globe2, AlertCircle, ArrowRight, HeartPulse, RefreshCw,
  Flame, Leaf, Ban, CheckCircle2, ChevronRight, Info, ExternalLink, X, Lightbulb,
  Lock, Unlock, Upload
} from "lucide-react";

export default function SafeBites() {
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [samples, setSamples] = useState([]);
  const [currentResult, setCurrentResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [recentScans, setRecentScans] = useState([]);
  const [patientProfile, setPatientProfile] = useState(null);
  const [showQuizFirst, setShowQuizFirst] = useState(true);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Load samples, history, and patient profile
  useEffect(() => {
    api.get("/safebites/samples")
      .then((res) => {
        if (res.samples) setSamples(res.samples);
      })
      .catch(console.error);

    api.get("/safebites/history")
      .then((res) => {
        if (res.history) setRecentScans(res.history);
      })
      .catch(console.error);

    if (user?.id) {
      api.get(`/patients/${user.id}`)
        .then(setPatientProfile)
        .catch(console.error);
    }
  }, [user]);

  const handleScan = async (queryOrBarcode, precalculatedResult = null) => {
    if (precalculatedResult && precalculatedResult.success && precalculatedResult.analysis) {
      setCurrentResult(precalculatedResult);
      setSearchInput("");
      setShowQuizFirst(true);
      setQuizCompleted(false);
      api.get("/safebites/history").then((h) => {
        if (h.history) setRecentScans(h.history);
      }).catch(() => {});
      return;
    }

    const target = (queryOrBarcode || searchInput).trim();
    if (!target) return;

    setIsLoading(true);
    setErrorMsg("");

    try {
      const isBarcode = /^\d+$/.test(target);
      const payload = isBarcode ? { barcode: target } : { query: target };
      const res = await api.post("/safebites/scan", payload);

      if (res.success && res.analysis) {
        setCurrentResult(res);
        setSearchInput("");
        setShowQuizFirst(true);
        setQuizCompleted(false);
        // Refresh history
        api.get("/safebites/history").then((h) => {
          if (h.history) setRecentScans(h.history);
        }).catch(() => {});
      } else {
        setErrorMsg("Could not analyze this product. Please try another barcode or product name.");
      }
    } catch (err) {
      console.error("SafeBites scan failed:", err);
      setErrorMsg(err.message || "Failed to scan product. Please check the barcode or connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMsg("");

    try {
      // 1. Try Native BarcodeDetector in browser
      let detectedCode = null;
      if ("BarcodeDetector" in window) {
        try {
          const detector = new window.BarcodeDetector({
            formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "code_93", "itf", "qr_code"]
          });
          const imgBitmap = await createImageBitmap(file);
          const barcodes = await detector.detect(imgBitmap);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            detectedCode = barcodes[0].rawValue.trim();
          }
        } catch (_) {}
      }

      if (detectedCode) {
        await handleScan(detectedCode);
        return;
      }

      // 2. Upload to backend AI vision scanner
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.upload("/safebites/scan-image", formData);
      if (res && res.success && res.analysis) {
        handleScan(null, res);
      } else {
        setErrorMsg(res?.error || "Could not detect barcode or food packaging in this photo. Try another image.");
      }
    } catch (err) {
      console.error("Direct image scan error:", err);
      setErrorMsg(err.message || "Failed to analyze uploaded photo. Please try another image.");
    } finally {
      setIsLoading(false);
      if (e.target) e.target.value = "";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return { bg: "bg-emerald-500", text: "text-emerald-700", light: "bg-emerald-50", border: "border-emerald-200", label: "Clean & Safe" };
    if (score >= 60) return { bg: "bg-amber-500", text: "text-amber-700", light: "bg-amber-50", border: "border-amber-200", label: "Moderate Caution" };
    if (score >= 40) return { bg: "bg-orange-500", text: "text-orange-700", light: "bg-orange-50", border: "border-orange-200", label: "High Concern" };
    return { bg: "bg-rose-600", text: "text-rose-700", light: "bg-rose-50", border: "border-rose-200", label: "Hazardous / High Additives" };
  };

  const product = currentResult?.product;
  const analysis = currentResult?.analysis;
  const scoreBadge = analysis ? getScoreColor(analysis.safety_score) : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#07363f] via-[#0d6e7e] to-[#0a4b56] text-white p-6 sm:p-10 shadow-xl border border-teal-600/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 border border-teal-300/30 text-xs font-semibold mb-4 backdrop-blur-sm">
            <Sparkles size={13} className="text-teal-300" />
            <span>Open Food Facts + OpenAI Forensic Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            SafeBites <span className="text-teal-300">— True Label Scanner</span>
          </h1>
          <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed mb-6">
            Scan any food barcode to reveal the raw truth behind glossy packaging. Detect toxic additives,
            uncover where ingredients are banned across the globe, and cross-reference against your personal health record.
          </p>

          {/* Search & Camera Input Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3.5 text-teal-200" size={18} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
                placeholder="Enter barcode (e.g. 0028400040112) or product name (e.g. Doritos, Nutella)..."
                className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 placeholder-gray-400 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-sm"
              />
              {searchInput && (
                <button onClick={() => setSearchInput("")} className="absolute right-3 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <label
                className={`inline-flex items-center justify-center gap-2 px-4 py-3 ${isLoading ? 'opacity-50 pointer-events-none' : 'bg-teal-500/30 hover:bg-teal-500/50'} text-white text-sm font-semibold rounded-xl border border-white/30 backdrop-blur-sm transition-all cursor-pointer`}
                title="Upload barcode or product packaging photo"
              >
                <Upload size={18} />
                <span className="hidden sm:inline">Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isLoading}
                  onChange={handleDirectImageUpload}
                />
              </label>

              <button
                onClick={() => setIsScannerOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-teal-500/30 hover:bg-teal-500/50 text-white text-sm font-semibold rounded-xl border border-white/30 backdrop-blur-sm transition-all"
                title="Scan barcode with camera"
              >
                <Camera size={18} />
                <span className="hidden sm:inline">Camera</span>
              </button>

              <button
                onClick={() => handleScan()}
                disabled={isLoading || !searchInput.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-950/20 transition-all shrink-0"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Scan size={18} />
                    <span>Scan Product</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Demo Chips */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs text-teal-200 font-medium">Quick Test:</span>
            {samples.map((item) => (
              <button
                key={item.barcode}
                onClick={() => handleScan(item.barcode)}
                className="inline-flex items-center px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/15 transition-all hover:scale-105 cursor-pointer"
              >
                <span>{(item.name || "").replace(/\s*\([^)]*\)/g, "")}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={20} className="text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-rose-500 hover:text-rose-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Interactive Food Myth Buster Flash Quiz (Shown first for eye-opening consumer education) */}
      {analysis && analysis.flash_quiz && analysis.flash_quiz.length > 0 && showQuizFirst && !quizCompleted && (
        <div className="space-y-4">
          <SafeBitesFlashQuiz
            quizList={analysis.flash_quiz}
            onComplete={() => setQuizCompleted(true)}
            onSkip={() => setQuizCompleted(true)}
          />

          {/* Locked Notice */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-teal-500/30 text-teal-200 text-xs sm:text-sm font-semibold flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-300 shrink-0">
                <Lock size={16} />
              </div>
              <span className="text-gray-300">
                <strong className="text-white">Forensic Lab Data Locked:</strong> Complete the interactive myth-buster flashcards above to reveal the ingredients pie chart, harmful substance causes, and Europe/Japan recipe comparisons.
              </span>
            </div>
            <button
              onClick={() => setQuizCompleted(true)}
              className="text-xs font-bold text-teal-300 hover:text-white px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 shrink-0 transition-all hover:scale-105"
            >
              Skip Deck & View Lab Report →
            </button>
          </div>
        </div>
      )}

      {/* Main Analysis Display - Strictly concealed until quiz is completed or skipped */}
      {analysis && product && (quizCompleted || !analysis.flash_quiz || analysis.flash_quiz.length === 0 || !showQuizFirst) && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header Bar with Replay Quiz Option & Unlocked Pill */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200">
                <Unlock size={13} />
                <span>Forensics Unlocked</span>
              </span>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:inline">
                SafeBites Forensic Audit
              </span>
            </div>
            {analysis.flash_quiz && analysis.flash_quiz.length > 0 && (
              <button
                onClick={() => {
                  setShowQuizFirst(true);
                  setQuizCompleted(false);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#0d6e7e] rounded-xl text-xs font-bold border border-teal-200 transition-all shadow-xs"
              >
                <Lightbulb size={14} className="text-teal-600" />
                <span>Replay Food Myth Flashcards ({analysis.flash_quiz.length})</span>
              </button>
            )}
          </div>

          {/* Top Summary Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-8 items-start">
            {/* Product Image & Info */}
            <div className="flex items-center gap-5 shrink-0 w-full lg:w-auto">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.product_name}
                  className="w-28 h-28 object-contain rounded-2xl border border-gray-100 p-2 bg-gray-50/50 shadow-inner"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                  <Scan size={36} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold tracking-wide uppercase">
                  {product.brand || "Commercial Brand"}
                </span>
                <h2 className="text-2xl font-black text-gray-900 mt-1 truncate">{product.product_name}</h2>
                <p className="text-xs text-gray-500 mt-1 font-mono">Barcode: {product.barcode}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.nutriscore_grade && (
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
                      Nutri-Score: {product.nutriscore_grade}
                    </span>
                  )}
                  {product.nova_group && (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      product.nova_group === 4
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                      NOVA Group {product.nova_group} {product.nova_group === 4 ? "• Ultra Processed" : "• Minimally Processed"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Safety Score Meter */}
            <div className="flex-1 w-full flex flex-col sm:flex-row items-center justify-between gap-6 p-5 rounded-2xl bg-gradient-to-r from-gray-50 to-teal-50/40 border border-gray-200/80">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">SafeBites Safety Score</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-5xl font-black ${scoreBadge.text}`}>
                    {analysis.safety_score}
                  </span>
                  <span className="text-gray-400 font-bold text-lg">/ 100</span>
                </div>
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold bg-white shadow-sm border border-gray-200">
                  <span className={`w-2.5 h-2.5 rounded-full ${scoreBadge.bg}`} />
                  <span className={scoreBadge.text}>{analysis.safety_rating || scoreBadge.label}</span>
                </div>
              </div>

              <div className="text-right sm:max-w-xs">
                <p className="text-xs text-gray-600 leading-relaxed italic bg-white/80 p-3 rounded-xl border border-gray-200/60 shadow-sm text-left sm:text-right">
                  "{analysis.summary}"
                </p>
              </div>
            </div>
          </div>

          {/* VISUAL INGREDIENTS BREAKDOWN & INTERACTIVE PIE CHART */}
          <SafeBitesVisualIngredients visualData={analysis.visual_ingredients} product={product} />

          {/* INTERNATIONAL RECIPE COMPARISON (Domestic vs European Union vs Japan) */}
          <SafeBitesInternationalComparison
            comparisonData={analysis.international_comparison}
            productName={product.product_name}
          />

          {/* Patient Personalized Health Alert Banner */}
          {analysis.patient_health_alerts && analysis.patient_health_alerts.length > 0 && (
            <div className="rounded-3xl p-6 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border-2 border-rose-400/50 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-900/20">
                  <HeartPulse size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-rose-900 text-base flex items-center gap-2">
                    <span>Personal Health & Allergy Warnings for {patientProfile?.fullName || user?.fullName || "You"}</span>
                  </h3>
                  <p className="text-xs text-rose-700">Cross-referenced against your recorded clinical profile</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {analysis.patient_health_alerts.map((alert, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white border border-rose-200 shadow-sm flex items-start gap-3">
                    <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">{alert.title}</h4>
                      <p className="text-xs text-gray-700 mt-1 leading-relaxed">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* "TRUE LABEL" Reality Check (Marketing Claim vs Actual Chemistry) */}
          {analysis.true_label && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0d6e7e]">
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">The True Label Reality Check</h3>
                    <p className="text-xs text-gray-500">Exposing marketing deception vs chemical composition</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-100">
                  {analysis.true_label.processing_classification || "Forensic Audit"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Marketing Claim */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                        Front Package Claim
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 italic">
                      "{analysis.true_label.marketing_claim}"
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-4">Typical consumer perception driven by advertising</p>
                </div>

                {/* Reality Check */}
                <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-200 text-amber-900">
                        Chemical Reality
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {analysis.true_label.reality_check}
                    </p>
                  </div>
                  <p className="text-[11px] text-amber-800/80 mt-4 font-medium">True laboratory and ingredient formulation</p>
                </div>
              </div>
            </div>
          )}

          {/* DANGEROUS & CONTROVERSIAL INGREDIENTS LIST */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <Flame size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>Dangerous & Controversial Ingredients</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-black">
                      {analysis.dangerous_ingredients?.length || 0}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">Health hazards and international bans associated with detected compounds</p>
                </div>
              </div>

              {analysis.banned_summary && (
                <div className="text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                  <span className="font-semibold text-gray-900">{analysis.banned_summary.total_banned_or_restricted_substances} substances</span> banned or restricted internationally
                </div>
              )}
            </div>

            {analysis.dangerous_ingredients && analysis.dangerous_ingredients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.dangerous_ingredients.map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-rose-300 transition-all space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-gray-900 text-base">{item.name}</h4>
                        {item.e_number && (
                          <span className="text-[11px] font-mono text-gray-500 uppercase">Code: {item.e_number}</span>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                        item.hazard_level === "Critical"
                          ? "bg-rose-600 text-white"
                          : item.hazard_level === "High"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.hazard_level || "High Risk"}
                      </span>
                    </div>

                    {/* Health Causes */}
                    <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-100 text-xs text-rose-950 space-y-1">
                      <p className="font-bold text-[11px] text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle size={13} />
                        <span>Health Risks & Causes</span>
                      </p>
                      <p className="leading-relaxed">{item.health_risks}</p>
                    </div>

                    {/* Banned Countries / Jurisdictions */}
                    {item.banned_in && item.banned_in.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Globe2 size={13} className="text-teal-700" />
                          <span>Banned or Restricted In</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.banned_in.map((loc, lidx) => (
                            <span key={lidx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
                              <Ban size={12} className="text-red-500" />
                              <span>{loc}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Why Used */}
                    {item.why_used && (
                      <p className="text-xs text-gray-500 pt-1 border-t border-gray-100">
                        <span className="font-semibold text-gray-700">Commercial Purpose: </span>
                        {item.why_used}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <CheckCircle2 size={36} className="text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-emerald-900 text-base">No Severe Flagged Additives Detected</h4>
                <p className="text-xs text-emerald-700 mt-1">This product does not list notorious banned food dyes or high-risk chemical preservatives.</p>
              </div>
            )}
          </div>

          {/* Nutritional Red Flags & Cleaner Alternatives */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nutritional Red Flags */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                <AlertCircle size={20} className="text-amber-500" />
                <h3 className="font-bold text-gray-900 text-base">Nutritional Red Flags</h3>
              </div>
              <ul className="space-y-2.5">
                {analysis.nutritional_flags && analysis.nutritional_flags.length > 0 ? (
                  analysis.nutritional_flags.map((flag, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{flag}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">Standard nutrient profile.</p>
                )}
              </ul>
            </div>

            {/* Healthier Clean Alternatives */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                <Leaf size={20} className="text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-base">Healthier, Cleaner Alternatives</h3>
              </div>
              <div className="space-y-3">
                {analysis.clean_alternatives && analysis.clean_alternatives.length > 0 ? (
                  analysis.clean_alternatives.map((alt, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-emerald-950 text-sm">{alt.name}</h4>
                        <span className="text-[11px] text-emerald-700 font-semibold">{alt.brand}</span>
                      </div>
                      <p className="text-gray-600 mt-1">{alt.why_better}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">Look for certified organic whole food versions.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Scans History */}
      {recentScans.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Your Recent Scans</h3>
              <p className="text-xs text-gray-500">History of products evaluated with SafeBites</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentScans.slice(0, 8).map((scan, idx) => (
              <div
                key={idx}
                onClick={() => handleScan(scan.barcode || scan.product_name)}
                className="cursor-pointer p-4 rounded-2xl border border-gray-200 hover:border-teal-500 bg-gray-50/50 hover:bg-teal-50/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-gray-900 text-sm truncate group-hover:text-teal-900">{scan.product_name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      (scan.safety_score ?? 70) >= 80 ? "bg-emerald-100 text-emerald-800" :
                      (scan.safety_score ?? 70) >= 60 ? "bg-amber-100 text-amber-800" :
                      "bg-rose-100 text-rose-800"
                    }`}>
                      {scan.safety_score}/100
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{scan.brand || "Commercial item"}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs text-teal-700 font-semibold">
                  <span>Re-examine</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      <SafeBitesScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(decoded, precalculatedResult) => {
          setIsScannerOpen(false);
          handleScan(decoded, precalculatedResult);
        }}
      />
    </div>
  );
}
