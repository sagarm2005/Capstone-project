import { useState } from "react";
import { Brain, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { api } from "@/lib/api";

const MODELS = [
  { id: "pneumonia", label: "Pneumonia", description: "Screen a chest X-ray for pneumonia indicators.", active: true },
  { id: "alzheimer", label: "Alzheimer's", active: false },
  { id: "diabetic-retinopathy", label: "Diabetic Retinopathy", active: false },
  { id: "skin-lesion", label: "Skin Lesion", active: false },
  { id: "brain-tumor", label: "Brain Tumor", active: false },
  { id: "tb", label: "Tuberculosis", active: false },
];

export default function Models() {
  const [, navigate] = useLocation();
  const [activeModel, setActiveModel] = useState("pneumonia");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError("");
  };

  const predict = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      setResult(await api.upload("/models/pneumonia/predict", formData));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const attachReport = () => {
    if (!file || !result) return;
    const reader = new FileReader();
    reader.onload = () => {
      sessionStorage.setItem("pending_model_report", JSON.stringify({
        fileName: file.name,
        dataUrl: reader.result,
        result,
      }));
      navigate("/prescriptions");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Medical Models</h1>
        <p className="text-gray-500 text-sm">Upload medical images for model-assisted screening.</p>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Brain size={16} className="text-[#0d6e7e]" /> Available Models
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {MODELS.map((model) => (
            <button key={model.id} disabled={!model.active} onClick={() => { setActiveModel(model.id); setResult(null); setError(""); }}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${activeModel === model.id ? "bg-[#0d6e7e] text-white border-[#0d6e7e]" : model.active ? "bg-white text-gray-700 border-gray-200 hover:border-teal-400" : "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"}`}>
              {model.label}{!model.active && " · Soon"}
            </button>
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="text-sm font-medium text-gray-800">Pneumonia Detection</p>
            <p className="text-xs text-gray-500 mt-1 mb-4">Upload a chest X-ray image for AI screening.</p>
            <label className="block rounded-xl border border-dashed border-gray-200 p-6 text-center cursor-pointer hover:border-teal-400 bg-gray-50">
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="hidden" />
              {preview ? <img src={preview} alt="Selected chest X-ray" className="mx-auto max-h-48 rounded-lg object-contain" /> : <><FileText size={28} className="mx-auto text-gray-300" /><p className="text-sm font-semibold text-gray-700 mt-2">Choose X-ray image</p><p className="text-xs text-gray-500 mt-1">PNG, JPG, JPEG, or WEBP</p></>}
            </label>
            <button onClick={predict} disabled={!file || loading} className="mt-4 w-full py-2.5 rounded-lg bg-[#0d6e7e] text-white text-sm font-semibold hover:bg-[#0a5566] disabled:opacity-50">
              {loading ? "Analyzing..." : "Run Prediction"}
            </button>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-5 min-h-48">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 mb-4">Prediction Output</p>
            {result ? <><p className={`text-2xl font-bold ${result.prediction === "Pneumonia" ? "text-red-600" : "text-green-600"}`}>{result.prediction}</p><p className="text-sm text-gray-600 mt-2">Confidence: {Math.round(result.confidence * 100)}%</p><p className="text-xs text-amber-700 mt-5">{result.disclaimer}</p><button onClick={attachReport} className="mt-5 w-full py-2.5 rounded-lg border border-[#0d6e7e] text-[#0d6e7e] text-sm font-semibold hover:bg-teal-50">Attach Report to Prescription</button></> : <p className="text-sm text-gray-400 italic">Upload an image to see the model output.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
