import React, { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsOpen(true);
      }
    } catch (error) {
      alert('Erro ao acessar câmera. Verifique permissões.');
      console.error(error);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File(
          [blob], 
          `photo_${Date.now()}.jpg`, 
          { type: 'image/jpeg' }
        );
        onCapture(file);
        stopCamera();
        setIsOpen(false);
      }
    }, 'image/jpeg', 0.9);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  return (
    <>
      <button
        onClick={startCamera}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        <Camera className="w-4 h-4" />
        Capturar Foto
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button
              onClick={capturePhoto}
              className="px-6 py-3 bg-green-600 text-white rounded-full text-lg font-bold hover:bg-green-700 transition-colors"
            >
              ✓ Usar Foto
            </button>
            <button
              onClick={() => {
                stopCamera();
                setIsOpen(false);
              }}
              className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
