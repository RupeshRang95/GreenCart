import React, { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
};

const ReceiptCameraModal: React.FC<Props> = ({ open, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera
  useEffect(() => {
    if (!open) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // back camera
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    startCamera();

    return () => {
      // Stop camera when modal closes
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [open]);

  // 📸 Capture function
  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], "receipt.jpg", {
        type: "image/jpeg",
      });

      onCapture(file);
    }, "image/jpeg");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-end">
      {/* Camera feed */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover absolute top-0 left-0"
        playsInline
      />

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls overlay */}
      <div className="relative z-10 p-4 flex justify-center gap-4">
        <button
          onClick={takePhoto}
          className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 active:scale-95 shadow-lg"
        />
        <button
          onClick={onClose}
          className="text-white text-sm px-4 bg-gray-800 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ReceiptCameraModal;
