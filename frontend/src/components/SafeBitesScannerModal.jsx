import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, Upload, Barcode, AlertCircle, RefreshCw } from "lucide-react";

export default function SafeBitesScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [cameraError, setCameraError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const html5QrCodeRef = useRef(null);
  const scannerContainerId = "safebites-reader-canvas";

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const qrRegionId = scannerContainerId;

    const startCamera = async () => {
      setCameraError("");
      try {
        const html5QrCode = new Html5Qrcode(qrRegionId);
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            if (isMounted) {
              if (navigator.vibrate) navigator.vibrate(100);
              stopCamera();
              onScanSuccess(decodedText);
            }
          },
          (errorMessage) => {
            // Frame parse error (ignore continuous scan ticks)
          }
        );

        if (isMounted) {
          setIsScanning(true);
        }
      } catch (err) {
        if (isMounted) {
          console.warn("Camera start failed, falling back to manual/upload:", err);
          setCameraError(
            err.message?.includes("Permission")
              ? "Camera permission denied. You can upload an image or type the barcode number below."
              : "Unable to access camera directly. Try uploading a photo or enter the barcode number."
          );
          setIsScanning(false);
        }
      }
    };

    // Small delay to allow DOM element to mount
    const timer = setTimeout(() => {
      startCamera();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn("Stop camera error:", e);
      }
      html5QrCodeRef.current = null;
      setIsScanning(false);
    }
  };

  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setCameraError("");

    try {
      // 1. First stop active camera to free up video feed and camera locks
      await stopCamera();

      let detectedCode = null;

      // 2. Try Browser Native BarcodeDetector (Chrome, Edge, Android)
      if ("BarcodeDetector" in window) {
        try {
          const detector = new window.BarcodeDetector({
            formats: [
              "ean_13", "ean_8", "upc_a", "upc_e",
              "code_128", "code_39", "code_93", "itf", "qr_code"
            ],
          });
          const imgBitmap = await createImageBitmap(file);
          const barcodes = await detector.detect(imgBitmap);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            detectedCode = barcodes[0].rawValue.trim();
          }
        } catch (detectorErr) {
          console.warn("Native BarcodeDetector pass skipped:", detectorErr);
        }
      }

      // 3. Fallback to Html5Qrcode file scan if native detector did not find a barcode
      if (!detectedCode) {
        try {
          const tempContainerId = "safebites-temp-file-scanner";
          let tempEl = document.getElementById(tempContainerId);
          if (!tempEl) {
            tempEl = document.createElement("div");
            tempEl.id = tempContainerId;
            tempEl.style.display = "none";
            document.body.appendChild(tempEl);
          }
          const html5QrCode = new Html5Qrcode(tempContainerId);
          detectedCode = await html5QrCode.scanFile(file, false);
          try { await html5QrCode.clear(); } catch (_) {}
        } catch (html5Err) {
          console.warn("Html5Qrcode file scan pass skipped:", html5Err);
        }
      }

      // 4. If decoded locally, notify success
      if (detectedCode) {
        setIsProcessingFile(false);
        onScanSuccess(detectedCode);
        return;
      }

      // 5. If client-side couldn't read the raw barcode (or user uploaded food packaging/label),
      // upload to backend /api/safebites/scan-image which uses AI Vision to read barcode & product info!
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.upload("/safebites/scan-image", formData);
      if (res && res.success && res.analysis) {
        setIsProcessingFile(false);
        onScanSuccess(res.detected_barcode || res.product?.barcode || res.product?.product_name, res);
        return;
      }

      throw new Error(res?.error || "Could not detect barcode or food packaging in this photo.");
    } catch (err) {
      console.error("Barcode upload error:", err);
      setCameraError(err.message || "Could not detect a clear barcode in this photo. Try manual entry or another angle.");
    } finally {
      setIsProcessingFile(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    stopCamera();
    onScanSuccess(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-[#0d6e7e] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Camera size={20} className="text-teal-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">SafeBites Scanner</h3>
              <p className="text-xs text-teal-200">Align barcode inside the view finder</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Canvas or Camera Area */}
        <div className="p-5 flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-[300px] bg-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-teal-500/40">
            <div id={scannerContainerId} className="w-full h-full" />

            {/* Laser scanning line overlay */}
            {isScanning && (
              <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-pulse" />
            )}

            {/* Processing file overlay */}
            {isProcessingFile && (
              <div className="absolute inset-0 p-4 bg-slate-900/95 flex flex-col items-center justify-center text-center text-teal-300 z-10">
                <RefreshCw size={36} className="animate-spin text-teal-400 mb-2" />
                <p className="text-xs font-bold text-white mb-1">Scanning Photo...</p>
                <p className="text-[11px] text-teal-200">Decoding barcode or product packaging</p>
              </div>
            )}

            {!isScanning && !isProcessingFile && cameraError && (
              <div className="absolute inset-0 p-4 bg-slate-900/95 flex flex-col items-center justify-center text-center text-gray-300">
                <AlertCircle size={36} className="text-amber-400 mb-2" />
                <p className="text-xs leading-relaxed text-gray-300 px-3">{cameraError}</p>
              </div>
            )}
          </div>

          <div className="w-full mt-4 flex items-center justify-center gap-3">
            {/* Image Upload option */}
            <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 ${isProcessingFile ? 'opacity-50 pointer-events-none' : 'bg-gray-100 hover:bg-gray-200'} text-gray-700 text-xs font-semibold rounded-xl transition-all border border-gray-200`}>
              <Upload size={14} className="text-teal-700" />
              <span>{isProcessingFile ? "Scanning..." : "Upload Barcode / Photo"}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isProcessingFile}
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>

        {/* Manual Code Input Bar */}
        <div className="px-6 pb-6 pt-2 border-t border-gray-100 bg-gray-50/70">
          <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
            <Barcode size={14} />
            <span>Or enter barcode number manually</span>
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 3017620422003 or product name"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2.5 bg-[#0d6e7e] hover:bg-[#0a5566] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
            >
              Scan
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
