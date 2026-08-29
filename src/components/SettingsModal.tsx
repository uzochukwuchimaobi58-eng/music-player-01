import React from 'react';
import {
  X,
  Settings,
  Sparkles,
  Volume2,
  HardDriveDownload,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Headphones,
  Zap
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hiFiMode: boolean;
  onToggleHiFi: () => void;
  onClearOfflineCache: () => void;
  onResetAllData: () => void;
  offlineCount: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  hiFiMode,
  onToggleHiFi,
  onClearOfflineCache,
  onResetAllData,
  offlineCount,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none animate-in fade-in duration-200 font-sans"
    >
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center border border-zinc-700">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Player Settings</h3>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                Audio Engine & Storage Preferences
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Audio Engine section */}
          <div>
            <span className="font-bold text-zinc-500 uppercase tracking-widest text-[10px] block mb-2">
              Audio Engine & Processing
            </span>

            <div className="space-y-2">
              {/* Hi-Fi Lossless toggle */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">
                      Hi-Fi 320kbps Lossless DSP
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Enables dynamic range compression & 48kHz spatial fidelity
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
                  <input
                    type="checkbox"
                    checked={hiFiMode}
                    onChange={onToggleHiFi}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white"></div>
                </label>
              </div>

              {/* Headphone Optimization */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Headphones className="w-5 h-5 text-sky-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">
                      Binaural Headphone 3D Stage
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Virtualizes surrounding audio space for in-ear monitors
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Storage & Offline section */}
          <div>
            <span className="font-bold text-zinc-500 uppercase tracking-widest text-[10px] block mb-2">
              Offline Storage Management
            </span>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDriveDownload className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-zinc-300">Cached Audio Tracks:</span>
                </div>
                <span className="font-bold text-emerald-400 font-mono">
                  {offlineCount} songs
                </span>
              </div>

              <div className="flex gap-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={onClearOfflineCache}
                  className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Clear Cache</span>
                </button>

                <button
                  onClick={onResetAllData}
                  className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset App Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-black/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
