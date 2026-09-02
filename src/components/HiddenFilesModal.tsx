import React, { useState } from 'react';
import { X, FolderSearch, Eye, EyeOff, ShieldCheck, RefreshCw, Folder, Music } from 'lucide-react';
import { Track } from '../types';

interface HiddenFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  onAddTracks?: (tracks: Track[]) => void;
}

export const HiddenFilesModal: React.FC<HiddenFilesModalProps> = ({
  isOpen,
  onClose,
  tracks,
}) => {
  const [showDotFiles, setShowDotFiles] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const hiddenFoldersList = [
    { path: '/storage/emulated/0/WhatsApp/Media/WhatsApp Audio', count: 18, type: 'Voice & Audio Clips' },
    { path: '/storage/emulated/0/Telegram/Telegram Audio', count: 7, type: 'Chat Audio' },
    { path: '/storage/emulated/0/Android/data/.hidden_media', count: 12, type: 'Private Records' },
    { path: '/storage/emulated/0/Recordings/Call', count: 4, type: 'Call Recordings' },
  ];

  const handleScanHidden = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanMessage('Scanned 41 hidden audio files across storage.');
    }, 1200);
  };

  return (
    <div
      id="hidden-files-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs select-none animate-in fade-in duration-200 font-sans"
    >
      <div className="w-full max-w-md bg-[#18181a] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#141416]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <FolderSearch className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Hidden Audio Files</h3>
              <p className="text-[10px] text-zinc-500">Scan hidden directories & .nomedia folders</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Toggle Scan Option */}
          <div className="p-3 rounded-xl bg-[#202024] border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {showDotFiles ? (
                <Eye className="w-4 h-4 text-teal-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-zinc-500" />
              )}
              <div>
                <p className="text-xs font-semibold text-white">Include .nomedia Folders</p>
                <p className="text-[10px] text-zinc-500">Reveal private WhatsApp and app audio</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={showDotFiles}
              onChange={(e) => setShowDotFiles(e.target.checked)}
              className="w-4 h-4 accent-teal-500 cursor-pointer"
            />
          </div>

          {/* Hidden Folders */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Detected Hidden Folders
              </span>
              <button
                onClick={handleScanHidden}
                disabled={isScanning}
                className="text-[10px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Scanning...' : 'Scan Now'}
              </button>
            </div>

            {scanMessage && (
              <div className="p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium">
                {scanMessage}
              </div>
            )}

            <div className="space-y-2">
              {hiddenFoldersList.map((folder, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#202024] border border-zinc-800 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Folder className="w-4 h-4 text-teal-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{folder.path}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{folder.type}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 shrink-0 ml-2">
                    {folder.count} files
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-zinc-800 bg-[#141416] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
