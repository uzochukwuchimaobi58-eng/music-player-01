import React, { useState, useEffect } from 'react';
import {
  X,
  Disc3,
  Sliders,
  Sparkles,
  Crown,
  Play,
  Pause,
  Download,
  Check,
  CheckCircle2,
  Volume2,
  Layers,
  Wand2,
  Radio,
  Zap,
  ChevronDown
} from 'lucide-react';
import { Track, AppTheme } from '../types';
import { getThemeConfig } from '../data/themes';

interface BeatInstrumentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  isProUser: boolean;
  onOpenProModal: () => void;
  onPlayTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onAddTrackToLibrary?: (track: Track) => void;
  currentTheme?: AppTheme;
}

export const BeatInstrumentalModal: React.FC<BeatInstrumentalModalProps> = ({
  isOpen,
  onClose,
  tracks,
  currentTrack,
  isPlaying,
  isProUser,
  onOpenProModal,
  onPlayTrack,
  onTogglePlay,
  onAddTrackToLibrary,
  currentTheme = 'dark-amoled',
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const [beatBoost, setBeatBoost] = useState(85);
  const [bassLevel, setBassLevel] = useState(90);
  const [instrumentalLevel, setInstrumentalLevel] = useState(100);
  const [vocalLevel, setVocalLevel] = useState(0); // isolated beat has 0 vocals
  const [showTrackPicker, setShowTrackPicker] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (currentTrack) {
      setSelectedTrackId(currentTrack.id);
    } else if (tracks.length > 0) {
      setSelectedTrackId(tracks[0].id);
    }
  }, [currentTrack, tracks]);

  if (!isOpen) return null;

  const activeTrack = tracks.find((t) => t.id === selectedTrackId) || currentTrack || tracks[0];
  const theme = getThemeConfig(currentTheme);

  const handleConvertStems = () => {
    setIsProcessing(true);
    setExportSuccess(null);
    setTimeout(() => {
      setIsProcessing(false);
      setIsConverted(true);
      setVocalLevel(0);
      setBeatBoost(95);
      setBassLevel(95);
      setExportSuccess(`AI Beat & Instrumental Isolated: "${activeTrack.title}"`);
    }, 1400);
  };

  const handleExportInstrumental = () => {
    if (!isProUser) {
      onOpenProModal();
      return;
    }

    if (onAddTrackToLibrary && activeTrack) {
      const newInstrumentalTrack: Track = {
        ...activeTrack,
        id: `inst-${Date.now()}`,
        title: `${activeTrack.title} (Instrumental Beat)`,
        artist: `${activeTrack.artist} (Prod. AI Stems)`,
        album: `${activeTrack.album || 'Beat Collection'} - Instrumental VIP`,
        isFavorite: true,
      };
      onAddTrackToLibrary(newInstrumentalTrack);
      setExportSuccess(`Saved "${newInstrumentalTrack.title}" to your music library!`);
      setTimeout(() => setExportSuccess(null), 3500);
    }
  };

  return (
    <div
      id="beat-instrumental-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none font-sans animate-in fade-in duration-200"
    >
      {/* Modal Card */}
      <div
        className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-amber-500/30 text-zinc-100 shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: theme.isDark ? '#121216' : '#ffffff',
          color: theme.textPrimary,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient highlight */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800/80 bg-gradient-to-r from-amber-500/15 via-transparent to-indigo-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-amber-300 text-black text-[10px] font-black uppercase tracking-wider shadow-sm">
                  PAID PLAN / PRO
                </span>
                <span className="text-[10px] text-zinc-400 font-bold">
                  AI Stem Separator
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Convert to Beat Instrumental
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Track Selector */}
          <div className="relative">
            <div
              onClick={() => setShowTrackPicker(!showTrackPicker)}
              className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={activeTrack?.coverArt}
                  alt={activeTrack?.title}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0 shadow-md"
                />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{activeTrack?.title}</h3>
                  <p className="text-xs text-zinc-400 truncate">{activeTrack?.artist}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="text-xs text-amber-400 font-medium hidden sm:inline">Select Song</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showTrackPicker ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {/* Track Picker Dropdown */}
            {showTrackPicker && (
              <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl z-30 max-h-48 overflow-y-auto space-y-1">
                {tracks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTrackId(t.id);
                      setIsConverted(false);
                      onPlayTrack(t);
                      setShowTrackPicker(false);
                    }}
                    className={`p-2 rounded-xl flex items-center gap-2.5 cursor-pointer text-xs transition-colors ${
                      t.id === activeTrack?.id
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <img
                      src={t.coverArt}
                      alt={t.title}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{t.title}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{t.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI 1-Click Extraction Button */}
          <button
            onClick={handleConvertStems}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2 animate-pulse">
                <Sparkles className="w-4 h-4" />
                <span>Isolating Beat Drums & Instrumental Stems...</span>
              </span>
            ) : isConverted ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-black stroke-[3]" />
                <span>Beat & Instrumental Extracted! (Tap to Re-Process)</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                <span>Convert to Pure Beat & Instrumental</span>
              </span>
            )}
          </button>

          {/* 4-Stem Mixer */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Multi-Track Stem Faders
              </span>
              <span className="text-[10px] font-mono text-amber-400">
                {isConverted ? 'Isolated Instrumental Mix' : 'Standard Mix'}
              </span>
            </div>

            {/* Stem 1: Drums & Beat */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">🥁 Drums & Percussion Beat</span>
                <span className="font-mono font-bold text-amber-400">{beatBoost}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={beatBoost}
                onChange={(e) => setBeatBoost(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Stem 2: Bassline & 808 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">🔊 Bassline & 808 Sub</span>
                <span className="font-mono font-bold text-amber-400">{bassLevel}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={bassLevel}
                onChange={(e) => setBassLevel(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Stem 3: Synths, Chords & Melody */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">🎹 Synths, Guitars & Keys</span>
                <span className="font-mono font-bold text-indigo-400">{instrumentalLevel}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={instrumentalLevel}
                onChange={(e) => setInstrumentalLevel(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Stem 4: Vocals (Muted in Beat Instrumental) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">🎤 Lead & Backing Vocals</span>
                <span className="font-mono font-bold text-rose-400">{vocalLevel}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={vocalLevel}
                onChange={(e) => setVocalLevel(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>
          </div>

          {/* Pro Plan Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-500/30 flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <Crown className="w-5 h-5 fill-amber-400" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Sonance Pro Plan Feature
                </h4>
                {!isProUser && (
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                    VIP EXCLUSIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-300">
                Unlock 320kbps lossless stem isolation, unlimited beat exports, and 100% ad-free listening.
              </p>
              {!isProUser && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenProModal();
                  }}
                  className="mt-2 text-xs font-bold text-amber-400 underline hover:text-amber-300 cursor-pointer flex items-center gap-1"
                >
                  <span>View Paid Plans ($0.99/mo, $4.99/yr, or $9.99 Lifetime)</span>
                  <span>→</span>
                </button>
              )}
            </div>
          </div>

          {/* Success Toast */}
          {exportSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-medium truncate">{exportSuccess}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center gap-3">
          <button
            onClick={onTogglePlay}
            className="flex-1 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Preview Beat'}</span>
          </button>

          <button
            onClick={handleExportInstrumental}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Save Instrumental Beat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
