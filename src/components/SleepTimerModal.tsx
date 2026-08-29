import React, { useState } from 'react';
import { X, Timer, Moon, Check, BellOff } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sleepTimerRemaining: number | null; // in seconds
  onSetTimer: (minutes: number) => void;
  onCancelTimer: () => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  sleepTimerRemaining,
  onSetTimer,
  onCancelTimer,
}) => {
  const [customMins, setCustomMins] = useState(25);

  if (!isOpen) return null;

  const presets = [15, 30, 45, 60, 90];

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div
      id="sleep-timer-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none animate-in fade-in duration-200 font-sans"
    >
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center border border-zinc-700">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Sleep Timer</h3>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                Gentle Audio Fade-Out
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
        <div className="p-4 sm:p-5 space-y-4">
          {/* Active Countdown */}
          {sleepTimerRemaining !== null ? (
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Music Stops In
              </span>
              <div className="text-3xl font-black font-mono text-white mt-1">
                {formatTimer(sleepTimerRemaining)}
              </div>
              <button
                onClick={() => {
                  onCancelTimer();
                  onClose();
                }}
                className="mt-3 px-4 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors border border-rose-500/20 cursor-pointer"
              >
                Turn Off Timer
              </button>
            </div>
          ) : (
            <p className="text-xs text-zinc-400">
              Select duration to automatically pause playback:
            </p>
          )}

          {/* Presets */}
          <div className="grid grid-cols-3 gap-2">
            {presets.map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  onSetTimer(mins);
                  onClose();
                }}
                className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-center transition-all group active:scale-95 cursor-pointer"
              >
                <span className="text-base font-black text-white group-hover:text-zinc-100">
                  {mins}
                </span>
                <span className="block text-[10px] text-zinc-500 uppercase font-mono tracking-wider">Minutes</span>
              </button>
            ))}
          </div>

          {/* Custom Duration Slider */}
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2.5">
            <div className="flex justify-between text-xs font-semibold text-zinc-300">
              <span>Custom Duration:</span>
              <span className="text-white font-mono font-bold">{customMins} mins</span>
            </div>
            <input
              type="range"
              min={5}
              max={180}
              step={5}
              value={customMins}
              onChange={(e) => setCustomMins(parseInt(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <button
              onClick={() => {
                onSetTimer(customMins);
                onClose();
              }}
              className="w-full py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Start {customMins} Min Timer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
