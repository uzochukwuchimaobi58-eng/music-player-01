import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sparkles,
  SwitchCamera,
  Trash2,
  Disc,
  Layers
} from 'lucide-react';
import { Track } from '../types';

interface ArtworkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  onSaveArtwork: (trackId: string, artworkUrl: string) => void;
}

const PRESET_ARTWORKS = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80',
  'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80',
  'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=600&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80',
];

export const ArtworkUploadModal: React.FC<ArtworkUploadModalProps> = ({
  isOpen,
  onClose,
  track,
  onSaveArtwork,
}) => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'camera' | 'presets'>('gallery');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (track) {
      setPreviewUrl(track.coverArt || PRESET_ARTWORKS[0]);
    }
  }, [track]);

  // Clean up camera stream on unmount or tab switch
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCameraStream();
    } else if (isOpen && activeTab === 'camera') {
      startCamera();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, activeTab, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported on this device/browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(err.message || 'Could not access camera. Please allow camera permissions.');
      setIsCameraActive(false);
    }
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 512, video.videoHeight || 512);
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crop center square
    const sx = ((video.videoWidth || 512) - size) / 2;
    const sy = ((video.videoHeight || 512) - size) / 2;

    ctx.drawImage(video, sx, sy, size, size, 0, 0, 512, 512);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPreviewUrl(dataUrl);
    stopCameraStream();
    setActiveTab('gallery');
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Gallery / File upload handler
  const processImageFile = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const minDim = Math.min(img.width, img.height);
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 512, 512);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setPreviewUrl(compressed);
        } else {
          setPreviewUrl(e.target?.result as string);
        }
        setIsProcessing(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = () => {
    if (track && previewUrl) {
      onSaveArtwork(track.id, previewUrl);
      onClose();
    }
  };

  if (!isOpen || !track) return null;

  return (
    <div
      id="artwork-upload-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs select-none animate-in fade-in duration-200 font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Song Artwork
              </h3>
              <p className="text-[11px] text-zinc-400 truncate max-w-[220px]">
                {track.title} · {track.artist}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 p-1.5 bg-zinc-900/80 border-b border-zinc-800 text-xs font-semibold">
          <button
            id="tab-artwork-gallery"
            onClick={() => {
              setActiveTab('gallery');
              stopCameraStream();
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-zinc-800 text-white shadow-sm font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Gallery / File</span>
          </button>

          <button
            id="tab-artwork-camera"
            onClick={() => setActiveTab('camera')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-zinc-800 text-white shadow-sm font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>Camera</span>
          </button>

          <button
            id="tab-artwork-presets"
            onClick={() => {
              setActiveTab('presets');
              stopCameraStream();
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-zinc-800 text-white shadow-sm font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Presets</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* CAMERA TAB */}
          {activeTab === 'camera' && (
            <div className="flex flex-col items-center space-y-3">
              {cameraError ? (
                <div className="w-full p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2">
                  <p className="text-xs text-rose-300 font-medium">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors"
                  >
                    Retry Camera
                  </button>
                </div>
              ) : (
                <div className="relative w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden bg-black border border-zinc-700 shadow-2xl flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Viewfinder crosshairs */}
                  <div className="absolute inset-4 border border-white/30 rounded-xl pointer-events-none flex items-center justify-center">
                    <div className="w-8 h-8 border-t-2 border-l-2 border-white absolute top-0 left-0 rounded-tl-lg" />
                    <div className="w-8 h-8 border-t-2 border-r-2 border-white absolute top-0 right-0 rounded-tr-lg" />
                    <div className="w-8 h-8 border-b-2 border-l-2 border-white absolute bottom-0 left-0 rounded-bl-lg" />
                    <div className="w-8 h-8 border-b-2 border-r-2 border-white absolute bottom-0 right-0 rounded-br-lg" />
                  </div>

                  {/* Camera flip button */}
                  <button
                    onClick={toggleCameraFacing}
                    title="Switch Front/Back Camera"
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 hover:bg-black/80 transition-all cursor-pointer"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Shutter Snapshot Button */}
              {isCameraActive && (
                <div className="flex items-center gap-4 pt-1">
                  <button
                    id="btn-take-artwork-snapshot"
                    onClick={handleCaptureSnapshot}
                    className="w-14 h-14 rounded-full border-4 border-white bg-red-500 hover:bg-red-400 flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
                    title="Capture Photo"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/20" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* GALLERY TAB */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              {/* Drag & Drop / Upload area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-6 border-2 border-dashed border-zinc-700 hover:border-indigo-400 bg-zinc-900/40 hover:bg-zinc-900/80 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-white mb-1">
                  Click or drag photo here
                </p>
                <p className="text-xs text-zinc-400">
                  Select from phone gallery or files (PNG, JPG, WEBP)
                </p>
              </div>
            </div>
          )}

          {/* PRESETS TAB */}
          {activeTab === 'presets' && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-400">
                Choose a stylish album cover preset:
              </p>
              <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
                {PRESET_ARTWORKS.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPreviewUrl(url)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      previewUrl === url
                        ? 'border-indigo-400 scale-105 shadow-md'
                        : 'border-transparent hover:opacity-80'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Preset ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {previewUrl === url && (
                      <div className="absolute inset-0 bg-indigo-500/40 flex items-center justify-center text-white">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LIVE PREVIEW BOX */}
          <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-3.5">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-zinc-700/80 shadow-md bg-black">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Artwork Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <Disc className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-400">
                Artwork Preview
              </span>
              <p className="text-sm font-bold text-white truncate">
                {track.title}
              </p>
              <p className="text-xs text-zinc-400 truncate">
                {track.artist}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-black/80 flex items-center justify-between">
          <button
            onClick={() => {
              setPreviewUrl(track.coverArt || PRESET_ARTWORKS[0]);
              stopCameraStream();
              setActiveTab('gallery');
            }}
            className="px-3 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-save-artwork-confirm"
              onClick={handleSave}
              disabled={!previewUrl || isProcessing}
              className="px-5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Apply Artwork</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
