import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Scissors,
  Play,
  Pause,
  Volume2,
  Bell,
  PhoneCall,
  AlarmClock,
  Sparkles,
  Download,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { Track } from '../types';

interface RingtoneTrimmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

export const RingtoneTrimmerModal: React.FC<RingtoneTrimmerModalProps> = ({
  isOpen,
  onClose,
  track,
}) => {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);
  const [isPlayingSnippet, setIsPlayingSnippet] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [ringtoneTarget, setRingtoneTarget] = useState<'ringtone' | 'alarm' | 'notification'>('ringtone');

  const snippetAudioRef = useRef<HTMLAudioElement | null>(null);
  const playCheckInterval = useRef<number | null>(null);

  useEffect(() => {
    if (track) {
      setStartTime(0);
      const defaultDuration = Math.min(30, track.duration || 30);
      setEndTime(defaultDuration);
    }
  }, [track]);

  useEffect(() => {
    return () => {
      if (snippetAudioRef.current) {
        snippetAudioRef.current.pause();
        snippetAudioRef.current = null;
      }
      if (playCheckInterval.current) {
        clearInterval(playCheckInterval.current);
      }
    };
  }, []);

  if (!isOpen || !track) return null;

  const clipDuration = Math.max(1, Math.round(endTime - startTime));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTogglePlaySnippet = () => {
    if (isPlayingSnippet) {
      if (snippetAudioRef.current) snippetAudioRef.current.pause();
      if (playCheckInterval.current) clearInterval(playCheckInterval.current);
      setIsPlayingSnippet(false);
    } else {
      if (!snippetAudioRef.current) {
        snippetAudioRef.current = new Audio(track.url);
      }
      const audio = snippetAudioRef.current;
      audio.currentTime = startTime;
      audio.play().then(() => {
        setIsPlayingSnippet(true);
        if (playCheckInterval.current) clearInterval(playCheckInterval.current);
        playCheckInterval.current = window.setInterval(() => {
          if (audio.currentTime >= endTime || audio.ended) {
            audio.pause();
            audio.currentTime = startTime;
            setIsPlayingSnippet(false);
            if (playCheckInterval.current) clearInterval(playCheckInterval.current);
          }
        }, 100);
      }).catch((e) => {
        console.warn('Snippet play error:', e);
      });
    }
  };

  const handleExportRingtone = () => {
    setIsExporting(true);
    setExportSuccess(null);

    // Simulate waveform extraction & encoding
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(
        `Set as ${ringtoneTarget.toUpperCase()}: "${track.title.slice(0, 20)}..." (${clipDuration}s clip)`
      );
      setTimeout(() => {
        setExportSuccess(null);
      }, 4000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="ringtone-trimmer-modal">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 shadow-2xl p-5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Ringtone & Audio Cutter</h3>
              <p className="text-[10px] text-zinc-400">Trim 30-sec clips for phone ringtone or alarms</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Track Banner */}
        <div className="my-4 p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
          <img
            src={track.coverArt}
            alt={track.title}
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-lg object-cover border border-zinc-700 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate">{track.title}</h4>
            <p className="text-[11px] text-zinc-400 truncate mt-0.5">{track.artist}</p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-400 shrink-0">
            {clipDuration}s clip
          </span>
        </div>

        {/* Simulated Interactive Waveform Trimmer */}
        <div className="space-y-3 my-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Start: <b className="text-white font-mono">{formatTime(startTime)}</b></span>
            <span>End: <b className="text-white font-mono">{formatTime(endTime)}</b></span>
          </div>

          {/* Waveform graphic with selection window */}
          <div className="relative h-16 w-full rounded-xl bg-zinc-900 border border-zinc-800 p-2 flex items-center justify-between gap-1 overflow-hidden">
            {/* Visual waveform bars */}
            {Array.from({ length: 32 }).map((_, idx) => {
              const barPosRatio = idx / 32;
              const trackDur = track.duration || 180;
              const barTime = barPosRatio * trackDur;
              const isInsideClip = barTime >= startTime && barTime <= endTime;
              const pseudoHeight = Math.sin(idx * 0.7) * 40 + 50;

              return (
                <div
                  key={idx}
                  style={{ height: `${pseudoHeight}%` }}
                  className={`w-full rounded-full transition-colors ${
                    isInsideClip
                      ? 'bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                      : 'bg-zinc-700/60'
                  }`}
                />
              );
            })}
          </div>

          {/* Start and End Range Sliders */}
          <div className="space-y-2 pt-1">
            <div>
              <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                <span>Clip Start Point</span>
                <span className="font-mono text-zinc-200">{formatTime(startTime)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(0, (track.duration || 180) - 5)}
                step={1}
                value={startTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setStartTime(val);
                  if (endTime <= val) setEndTime(Math.min(track.duration || 180, val + 30));
                }}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                <span>Clip End Point</span>
                <span className="font-mono text-zinc-200">{formatTime(endTime)}</span>
              </div>
              <input
                type="range"
                min={startTime + 1}
                max={track.duration || 180}
                step={1}
                value={endTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setEndTime(val);
                }}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Target Destination: Ringtone vs Alarm vs Notification */}
        <div className="my-3">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">
            Assign Trimmed Audio To:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setRingtoneTarget('ringtone')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                ringtoneTarget === 'ringtone'
                  ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-md'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <PhoneCall className="w-4 h-4 text-indigo-400" />
              <span>Ringtone</span>
            </button>

            <button
              onClick={() => setRingtoneTarget('alarm')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                ringtoneTarget === 'alarm'
                  ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <AlarmClock className="w-4 h-4 text-amber-400" />
              <span>Alarm</span>
            </button>

            <button
              onClick={() => setRingtoneTarget('notification')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                ringtoneTarget === 'notification'
                  ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Bell className="w-4 h-4 text-emerald-400" />
              <span>Alert Tone</span>
            </button>
          </div>
        </div>

        {/* Success toast */}
        {exportSuccess && (
          <div className="my-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-medium truncate">{exportSuccess}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
          <button
            onClick={handleTogglePlaySnippet}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-xs border border-zinc-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isPlayingSnippet ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Preview</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportRingtone}
            disabled={isExporting}
            className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <span className="animate-pulse">Encoding Audio...</span>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Set Phone {ringtoneTarget.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
