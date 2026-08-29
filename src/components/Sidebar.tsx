import React from 'react';
import {
  FolderSync,
  Sliders,
  Repeat,
  Repeat1,
  Palette,
  Timer,
  Car,
  HardDriveDownload,
  Settings,
  Sparkles,
  X,
  Volume2,
  Music2,
  Radio,
  Scissors,
  Crown,
  Zap,
  Mic2
} from 'lucide-react';
import { RepeatMode, AppTheme } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScanModal: () => void;
  onOpenEqualizer: () => void;
  onOpenSleepTimer: () => void;
  onOpenThemeModal: () => void;
  onOpenSettings: () => void;
  onOpenRingtoneTrimmer: () => void;
  onOpenProModal: () => void;
  onEnterDriveMode: () => void;
  repeatMode: RepeatMode;
  onToggleRepeat: () => void;
  currentTheme: AppTheme;
  sleepTimerRemaining: number | null; // in seconds
  offlineCount: number;
  isProUser: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onOpenScanModal,
  onOpenEqualizer,
  onOpenSleepTimer,
  onOpenThemeModal,
  onOpenSettings,
  onOpenRingtoneTrimmer,
  onOpenProModal,
  onEnterDriveMode,
  repeatMode,
  onToggleRepeat,
  currentTheme,
  sleepTimerRemaining,
  offlineCount,
  isProUser,
}) => {
  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex" id="sidebar-drawer-overlay">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div
        id="sidebar-drawer-content"
        className="relative z-10 w-72 sm:w-80 h-full bg-black text-zinc-300 flex flex-col shadow-2xl border-r border-zinc-800 overflow-y-auto animate-in slide-in-from-left duration-250 select-none font-sans"
      >
        {/* Header with Sonance brand icon */}
        <div className="p-5 pb-4 bg-gradient-to-b from-zinc-900 to-black border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-xs flex items-center justify-center">
                <div className="w-0.5 h-4 bg-black mx-[1px]"></div>
                <div className="w-0.5 h-2 bg-black mx-[1px]"></div>
                <div className="w-0.5 h-5 bg-black mx-[1px]"></div>
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>SONANCE</span>
                  {isProUser && (
                    <span className="text-[9px] bg-gradient-to-r from-amber-400 to-amber-500 text-black px-1.5 py-0.2 rounded font-black">
                      PRO
                    </span>
                  )}
                </h2>
                <p className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
                  Studio Audio Engine
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

          {/* Pro Upgrade Banner inside Sidebar */}
          {!isProUser && (
            <button
              onClick={() => {
                onClose();
                onOpenProModal();
              }}
              className="mt-3.5 w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-900/20 border border-amber-500/40 text-amber-300 flex items-center justify-between text-xs font-bold hover:brightness-110 transition-all cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Upgrade to Sonance PRO</span>
              </div>
              <span className="text-[10px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-black">
                $4.99
              </span>
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-3 px-4 space-y-5">
          {/* Group 1: Library & Storage */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2 px-2">
              Library & Storage
            </p>
            <div className="space-y-1">
              {/* Scan Library */}
              <button
                id="menu-item-scan"
                onClick={() => {
                  onClose();
                  onOpenScanModal();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-900 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FolderSync className="w-4 h-4 text-indigo-400 group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white">
                    Scan & Import Music
                  </span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  OFFLINE
                </span>
              </button>

              {/* Ringtone Cutter */}
              <button
                id="menu-item-ringtone"
                onClick={() => {
                  onClose();
                  onOpenRingtoneTrimmer();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-900 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Scissors className="w-4 h-4 text-emerald-400 group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white">
                    Ringtone & Audio Cutter
                  </span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  TOOL
                </span>
              </button>

              {/* Repeat Mode */}
              <button
                id="menu-item-repeat"
                onClick={onToggleRepeat}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-900 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {repeatMode === 'one' ? (
                    <Repeat1 className="w-4 h-4 text-emerald-400 group-hover:scale-105 transition-transform" />
                  ) : (
                    <Repeat className="w-4 h-4 text-emerald-400 group-hover:scale-105 transition-transform" />
                  )}
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white">
                    Playback Loop
                  </span>
                </div>
                <span className="text-[11px] font-medium text-zinc-500 capitalize">
                  {repeatMode === 'one' ? 'Single' : repeatMode === 'all' ? 'All' : 'Off'}
                </span>
              </button>
            </div>
          </div>

          {/* Group 2: Audio Engineering & FX */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2 px-2">
              DSP & Viral Audio FX
            </p>
            <div className="space-y-1">
              {/* Equalizer */}
              <button
                id="menu-item-equalizer"
                onClick={() => {
                  onClose();
                  onOpenEqualizer();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-900 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Sliders className="w-4 h-4 text-sky-400 group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white">
                    10-Band EQ & Spatial 3D
                  </span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  DSP
                </span>
              </button>

              {/* Sleep Timer */}
              <button
                id="menu-item-sleep-timer"
                onClick={() => {
                  onClose();
                  onOpenSleepTimer();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-900 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Timer className="w-4 h-4 text-amber-400 group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white">
                    Sleep Timer
                  </span>
                </div>
                {sleepTimerRemaining !== null ? (
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {formatTimer(sleepTimerRemaining)}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-500">Off</span>
                )}
              </button>

              {/* Drive Mode */}
              <button
                id="menu-item-drive-mode"
                onClick={() => {
                  onClose();
                  onEnterDriveMode();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-900 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Car className="w-4 h-4 text-teal-400 group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white">
                    Drive Mode
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                  Hands-Safe
                </span>
              </button>
            </div>
          </div>

          {/* Group 3: Interface & Preferences */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2 px-2">
              Appearance & Engine
            </p>
            <div className="space-y-1">
              {/* Themes */}
              <button
                id="menu-item-themes"
                onClick={() => {
                  onClose();
                  onOpenThemeModal();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-900 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Palette className="w-4 h-4 text-rose-400 group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white">
                    Theme Palette
                  </span>
                </div>
                <span className="text-xs font-medium text-zinc-500 capitalize">
                  {currentTheme.replace('-', ' ')}
                </span>
              </button>

              {/* Settings */}
              <button
                id="menu-item-settings"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900 transition-colors text-left group cursor-pointer"
              >
                <Settings className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                <span className="text-xs font-medium text-zinc-300 group-hover:text-white">
                  Audio Engine Settings
                </span>
              </button>
            </div>
          </div>

          {/* Offline Caching Card */}
          <div className="px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
            <div className="flex items-center gap-2 text-xs text-zinc-200 mb-1">
              <HardDriveDownload className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">Local Storage DB</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {offlineCount} tracks indexed locally for zero-latency playback.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-zinc-800 bg-zinc-950 text-center">
          <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-3 h-3" />
            <span>Hi-Res Lossless Audio Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
