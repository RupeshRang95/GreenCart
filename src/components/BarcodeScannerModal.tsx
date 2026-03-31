import React, { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { X, Zap, AlertCircle } from "lucide-react";

interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
}
const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  open,
  onClose,
  onDetected,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [status, setStatus] = useState<"starting" | "scanning" | "error">(
    "starting",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const detectedRef = useRef(false);

  const stopScanner = useCallback(() => {
    readerRef.current?.reset();
    readerRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    stopScanner();
    detectedRef.current = false;
    setStatus("starting");
    setErrorMsg("");
    onClose();
  }, [stopScanner, onClose]);

  useEffect(() => {
    if (!open) return;
    detectedRef.current = false;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    const start = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg("Camera not supported on this device or browser.");
        setStatus("error");
        return;
      }

      try {
        // Get the back camera specifically
        let deviceId: string | undefined;

        try {
          const devices = await readerRef.current.listVideoInputDevices?.();
          if (devices && devices.length > 0) {
            const backCamera = devices.find((d) =>
              /back|rear|environment/i.test(d.label),
            );
            deviceId = backCamera?.deviceId ?? devices[0].deviceId;
          } else {
            deviceId = undefined; // default camera
          }
        } catch {
          deviceId = undefined; // fallback for mobile
        }

        await reader.decodeFromVideoDevice(
          deviceId, // undefined on mobile, specific deviceId on desktop
          videoRef.current!,
          (result, err) => {
            if (result && !detectedRef.current) {
              detectedRef.current = true;
              const code = result.getText().replace(/\D/g, "");
              if (code.length >= 6) {
                setTimeout(() => {
                  stopScanner();
                  onDetected(code);
                  handleClose();
                }, 120);
              }
            }
            if (err && !(err instanceof NotFoundException)) {
              console.warn("Scanner error:", err);
            }
          },
        );
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : "Camera access denied or not available.";
        setErrorMsg(msg);
        setStatus("error");
      }
    };

    void start();

    return () => {
      stopScanner();
    };
  }, [open, stopScanner, onDetected, handleClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      style={{ touchAction: "none" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 z-10">
        <div>
          <p className="text-white font-display font-bold text-[17px]">
            Scan Barcode
          </p>
          <p className="text-white/50 text-[12px]">
            {status === "scanning"
              ? "Point camera at the barcode on the package"
              : status === "starting"
                ? "Starting camera…"
                : "Camera error"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X size={18} className="text-white" />
        </button>
      </div>

      {/* Camera viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {status !== "error" && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />
        )}

        {/* Scanning overlay */}
        {status === "scanning" && (
          <div className="relative z-10 flex flex-col items-center">
            {/* Targeting box */}
            <div className="relative" style={{ width: 260, height: 160 }}>
              {/* Corner brackets */}
              {[
                "top-0 left-0",
                "top-0 right-0 rotate-90",
                "bottom-0 right-0 rotate-180",
                "bottom-0 left-0 -rotate-90",
              ].map((pos, i) => (
                <div key={i} className={`absolute ${pos} w-8 h-8`}>
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-[#4ade80] rounded-full" />
                  <div className="absolute top-0 left-0 h-full w-[3px] bg-[#4ade80] rounded-full" />
                </div>
              ))}

              {/* Animated scan line */}
              <div
                className="absolute left-2 right-2 h-[2px] bg-[#4ade80] rounded animate-scan-line"
                style={{
                  boxShadow: "0 0 10px 2px rgba(74,222,128,0.6)",
                  animationDuration: "1.6s",
                }}
              />
            </div>

            <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-black/50">
              <Zap size={12} className="text-[#4ade80]" />
              <span className="text-white/80 text-[12px]">
                Auto-detects UPC & EAN barcodes
              </span>
            </div>
          </div>
        )}

        {/* Starting state */}
        {status === "starting" && (
          <div className="z-10 flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#4ade80] border-t-transparent animate-spin" />
            <p className="text-white/60 text-[13px]">Requesting camera…</p>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="z-10 flex flex-col items-center gap-4 px-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-[15px] mb-1">
                Camera unavailable
              </p>
              <p className="text-white/50 text-[12px] leading-relaxed">
                {errorMsg}
              </p>
            </div>
            <p className="text-white/40 text-[12px]">
              Type the barcode digits manually instead.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl bg-white/10 text-white text-[13px] font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      {status === "scanning" && (
        <div className="pb-12 pt-4 px-5 text-center">
          <p className="text-white/40 text-[11px]">
            Hold steady · Works in low light · Scans instantly
          </p>
        </div>
      )}
    </div>
  );
};

export default BarcodeScannerModal;
