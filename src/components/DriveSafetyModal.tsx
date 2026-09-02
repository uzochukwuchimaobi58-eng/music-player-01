import React, { useState } from 'react';
import {
  ShieldAlert,
  Car,
  AlertTriangle,
  CheckCircle2,
  X,
  Eye,
  Hand,
  Volume2,
  Navigation,
  Compass,
  Check
} from 'lucide-react';
import { AppTheme } from '../types';
import { getThemeConfig } from '../data/themes';

interface DriveSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmEnterDriveMode: () => void;
  currentTheme?: AppTheme;
}

export const DriveSafetyModal: React.FC<DriveSafetyModalProps> = ({
  isOpen,
  onClose,
  onConfirmEnterDriveMode,
  currentTheme = 'dark-amoled',
}) => {
  const [hasAcknowledged, setHasAcknowledged] = useState(true);
  const theme = getThemeConfig(currentTheme);

  if (!isOpen) return null;

  return (
    <div
      id="drive-safety-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200 font-sans"
      onClick={onClose}
    >
      <div
        id="drive-safety-modal-content"
        className="w-full max-w-lg bg-[#14161b] rounded-3xl border border-amber-500/30 shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col text-zinc-100 animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: theme.isDark ? '#14161d' : '#ffffff',
          color: theme.textPrimary,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Traffic / Safety Badge */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-b from-amber-500/15 via-transparent to-transparent border-b border-zinc-800/80">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/20">
              <Car className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-500/30">
                  Driver Safety Notice
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mt-1">
                Entering Drive Mode
              </h2>
            </div>
          </div>
        </div>

        {/* Prominent Core Instruction Banner */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-start gap-3.5">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wide">
                Important Safety Instruction
              </h3>
              <p className="text-base font-bold text-white leading-snug">
                Please obey the traffic and obey the rules with others instructions.
              </p>
            </div>
          </div>

          {/* Safety Guidelines List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
              Safety Rules & Driver Instructions
            </h4>

            <div className="space-y-2.5">
              {/* Rule 1 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0 mt-0.5">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-zinc-200">Obey Traffic Laws & Speed Limits</p>
                  <p className="text-zinc-400 mt-0.5 leading-relaxed">
                    Always observe all local traffic signals, posted speed limits, road signs, and instructions from traffic officers.
                  </p>
                </div>
              </div>

              {/* Rule 2 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="p-2 rounded-lg bg-sky-500/15 text-sky-400 shrink-0 mt-0.5">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-zinc-200">Keep Your Eyes on the Road</p>
                  <p className="text-zinc-400 mt-0.5 leading-relaxed">
                    Do not stare at the screen or browse playlists while driving. Maintain full visual attention on road conditions.
                  </p>
                </div>
              </div>

              {/* Rule 3 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400 shrink-0 mt-0.5">
                  <Hand className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-zinc-200">Hands on the Wheel</p>
                  <p className="text-zinc-400 mt-0.5 leading-relaxed">
                    Drive Mode offers oversized buttons for quick one-touch control when safely stopped. Avoid manual interaction while vehicle is moving.
                  </p>
                </div>
              </div>

              {/* Rule 4 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 shrink-0 mt-0.5">
                  <Navigation className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-zinc-200">Pull Over Safely to Search</p>
                  <p className="text-zinc-400 mt-0.5 leading-relaxed">
                    If you need to change playlists or configure settings, park safely at the curb or a designated rest area first.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* User Acknowledgment Toggle */}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 cursor-pointer hover:bg-zinc-900/70 transition-colors">
            <input
              type="checkbox"
              checked={hasAcknowledged}
              onChange={(e) => setHasAcknowledged(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs font-medium text-zinc-300">
              I understand and promise to obey all traffic regulations and drive safely.
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-zinc-800/80 bg-zinc-900/40 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-1/3 py-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>

          <button
            type="button"
            id="btn-confirm-drive-mode"
            disabled={!hasAcknowledged}
            onClick={() => {
              onConfirmEnterDriveMode();
              onClose();
            }}
            className="w-full sm:w-2/3 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>I Obey Traffic Rules · Enter Drive Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
};
