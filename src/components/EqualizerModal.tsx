import React from 'react';
import { X, Sliders, RotateCcw, Sparkles, Volume2, Waves, Flame } from 'lucide-react';
import { EqualizerSettings, EqPreset } from '../types';
import { EQ_FREQUENCIES, EQ_PRESET_MAP } from '../data/defaultTracks';
import { VisualizerCanvas } from './VisualizerCanvas';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EqualizerSettings;
  onChangeSettings: (newSettings: EqualizerSettings) => void;
  isPlaying: boolean;
  use10Bands?: boolean;
  accentColorHex?: string;
  isProUser?: boolean;
  onOpenProModal?: () => void;
  onToggle10Bands?: (enable10: boolean) => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onChangeSettings,
  isPlaying,
  use10Bands = true,
  accentColorHex = '#f5b731',
  onToggle10Bands,
}) => {
  if (!isOpen) return null;

  const effectiveUse10Bands = use10Bands;

  const displayFrequencies = effectiveUse10Bands
    ? EQ_FREQUENCIES
    : [60, 250, 1000, 4000, 16000];

  const presets: EqPreset[] = [
    'Hi-Fi Master',
    'Bass Boost',
    'Vocal Booster',
    'Rock',
    'Electronic',
    'Jazz',
    'Acoustic',
    'Flat',
    'Custom',
  ];

  const handleToggleEnabled = () => {
    onChangeSettings({
      ...settings,
      enabled: !settings.enabled,
    });
  };

  const handleSelectPreset = (preset: EqPreset) => {
    if (preset === 'Custom') {
      onChangeSettings({ ...settings, preset: 'Custom' });
    } else {
      onChangeSettings({
        ...settings,
        preset,
        bands: { ...EQ_PRESET_MAP[preset] },
      });
    }
  };

  const handleBandChange = (freq: number, gain: number) => {
    onChangeSettings({
      ...settings,
      preset: 'Custom',
      bands: {
        ...settings.bands,
        [freq]: gain,
      },
    });
  };

  const handleReset = () => {
    handleSelectPreset('Flat');
  };

  const formatFreqLabel = (freq: number) => {
    if (freq >= 1000) return `${freq / 1000}k`;
    return `${freq}`;
  };

  return (
    <div
      id="equalizer-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs select-none animate-in fade-in duration-200 font-sans"
    >
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center border border-zinc-700">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {effectiveUse10Bands ? '10-Band' : '5-Band'} HD Equalizer
                </h3>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                  Precision DSP
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                10-Band Precision DSP Mastering
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Master Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer" title="Enable/Disable DSP">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={handleToggleEnabled}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white"></div>
            </label>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          {/* Mode Switcher & Lossless Badge */}
          <div className="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-400">EQ Mode:</span>
              <button
                onClick={() => onToggle10Bands?.(false)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                  !effectiveUse10Bands ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                5-Band
              </button>
              <button
                onClick={() => onToggle10Bands?.(true)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  effectiveUse10Bands
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-amber-300/80 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20'
                }`}
              >
                <span>10-Band HD</span>
              </button>
            </div>

            {/* Lossless HD Toggle */}
            <div
              onClick={() => {
                onChangeSettings({ ...settings, losslessMastering: !settings.losslessMastering });
              }}
              className="flex items-center gap-1.5 text-[11px] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-zinc-300">Lossless 24-bit</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${settings.losslessMastering ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'}`}>
                {settings.losslessMastering ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
          </div>

          {/* Live Visualizer feedback in EQ modal */}
          <div className="h-14 bg-black rounded-xl border border-zinc-800 p-2 flex items-center justify-center relative overflow-hidden">
            <VisualizerCanvas
              isPlaying={isPlaying && settings.enabled}
              type="bars"
              color={settings.enabled ? '#f59e0b' : '#52525b'}
              barCount={32}
            />
            <div className="absolute top-1.5 left-2.5 text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
              DSP FREQUENCY SPECTRUM
            </div>
          </div>

          {/* Preset Pills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Sound Profiles
              </span>
              <button
                onClick={handleReset}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors font-medium cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Flat</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => {
                const isActive = settings.preset === p;
                return (
                  <button
                    key={p}
                    onClick={() => handleSelectPreset(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-black shadow-md font-bold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vertical Band Sliders */}
          <div className={`p-3 sm:p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 transition-opacity ${settings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="flex items-end justify-between gap-1 sm:gap-2 h-44 sm:h-48 pt-4 pb-2">
              {displayFrequencies.map((freq) => {
                const currentGain = settings.bands[freq] || 0;
                return (
                  <div key={freq} className="flex-1 flex flex-col items-center h-full justify-between">
                    {/* Gain dB readout */}
                    <span className="text-[10px] font-mono text-white font-bold mb-1">
                      {currentGain > 0 ? `+${currentGain}` : currentGain}
                    </span>

                    {/* Vertical Slider */}
                    <div className="relative flex-1 flex items-center justify-center w-full py-1">
                      <input
                        type="range"
                        min={-12}
                        max={12}
                        step={1}
                        value={currentGain}
                        onChange={(e) => handleBandChange(freq, parseFloat(e.target.value))}
                        className="h-32 w-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white -rotate-90 origin-center"
                      />
                    </div>

                    {/* Frequency label */}
                    <span className="text-[10px] font-mono text-zinc-400 font-semibold mt-1">
                      {formatFreqLabel(freq)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Scale markings */}
            <div className="flex justify-between text-[9px] font-mono text-zinc-500 pt-2 border-t border-zinc-800">
              <span>+12 dB (Boost)</span>
              <span>0 dB (Flat)</span>
              <span>-12 dB (Cut)</span>
            </div>
          </div>

          {/* Dedicated Pro FX Sliders: Bass Boost, 3D Spatial Reverb, Tube Warmer, Treble HD */}
          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 ${settings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            {/* 1. Bass Boost */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-zinc-200 flex items-center gap-1">
                  <Waves className="w-3.5 h-3.5 text-indigo-400" />
                  Bass Boost
                </span>
                <span className="text-xs font-mono font-bold text-zinc-400">
                  {settings.bassBoost}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.bassBoost}
                onChange={(e) =>
                  onChangeSettings({ ...settings, bassBoost: parseInt(e.target.value) })
                }
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* 2. 3D Spatial Reverb */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-zinc-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  3D Reverb
                </span>
                <span className="text-xs font-mono font-bold text-zinc-400">
                  {settings.spatialReverb}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.spatialReverb}
                onChange={(e) =>
                  onChangeSettings({ ...settings, spatialReverb: parseInt(e.target.value) })
                }
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            {/* 3. Tube Warmer (Analog Saturation) */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-zinc-200 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  Tube Warmer
                </span>
                <span className="text-xs font-mono font-bold text-zinc-400">
                  {settings.tubeWarmer || 0}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.tubeWarmer || 0}
                onChange={(e) =>
                  onChangeSettings({ ...settings, tubeWarmer: parseInt(e.target.value) })
                }
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* 4. Treble Clarity / HD */}
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-zinc-200 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  Treble HD
                </span>
                <span className="text-xs font-mono font-bold text-zinc-400">
                  {settings.trebleBoost}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.trebleBoost}
                onChange={(e) =>
                  onChangeSettings({ ...settings, trebleBoost: parseInt(e.target.value) })
                }
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-black/60 flex items-center justify-between">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>32-Bit Floating Point DSP Engine Active</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Apply & Done
          </button>
        </div>
      </div>
    </div>
  );
};
