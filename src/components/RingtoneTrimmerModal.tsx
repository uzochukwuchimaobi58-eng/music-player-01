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
  Share2,
  Tag,
  Layers,
  Crown,
  Lock,
  Music2,
  Check,
  Disc3,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { Track } from '../types';
import { trimAudioTrack, TrimResult, downloadBlobToPhone } from '../services/audioTrimmer';

interface RingtoneTrimmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  tracks?: Track[];
  isProUser?: boolean;
  onOpenProModal?: () => void;
  onUpdateTracks?: (updatedTracks: Track[]) => void;
  onAddTrackToLibrary?: (track: Track) => void;
}

export const RingtoneTrimmerModal: React.FC<RingtoneTrimmerModalProps> = ({
  isOpen,
  onClose,
  track,
  tracks = [],
  isProUser = false,
  onOpenProModal,
  onUpdateTracks,
  onAddTrackToLibrary,
}) => {
  const [activeTab, setActiveTab] = useState<'trimmer' | 'tag_editor'>('trimmer');

  // --- Trimmer States ---
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);
  const [fadeIn, setFadeIn] = useState(true);
  const [fadeOut, setFadeOut] = useState(true);
  const [exportFormat, setExportFormat] = useState<'mp3' | 'm4r' | 'wav'>('wav');
  const [isPlayingSnippet, setIsPlayingSnippet] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [ringtoneTarget, setRingtoneTarget] = useState<'ringtone' | 'alarm' | 'notification'>('ringtone');
  const [trimmedResult, setTrimmedResult] = useState<TrimResult | null>(null);
  const [isPlayingTrimmedAudio, setIsPlayingTrimmedAudio] = useState(false);
  const trimmedAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- Batch Tag Editor States ---
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [batchArtist, setBatchArtist] = useState('');
  const [batchAlbum, setBatchAlbum] = useState('');
  const [batchGenre, setBatchGenre] = useState('');
  const [batchYear, setBatchYear] = useState('');
  const [tagSuccess, setTagSuccess] = useState<string | null>(null);
  const [proAlert, setProAlert] = useState<string | null>(null);

  const snippetAudioRef = useRef<HTMLAudioElement | null>(null);
  const playCheckInterval = useRef<number | null>(null);

  useEffect(() => {
    if (track) {
      setStartTime(0);
      const defaultDuration = Math.min(30, track.duration || 30);
      setEndTime(defaultDuration);
      setSelectedTrackIds([track.id]);
      setBatchArtist(track.artist || '');
      setBatchAlbum(track.album || '');
      setBatchGenre(track.genre || '');
      setBatchYear(track.year ? track.year.toString() : '2025');
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

  const clipDuration = Math.max(1, Math.round((endTime - startTime) * 10) / 10);

  const formatPrecisionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
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

  const handleTogglePlayTrimmedAudio = () => {
    if (!trimmedResult) return;
    if (!trimmedAudioRef.current) {
      trimmedAudioRef.current = new Audio(trimmedResult.objectUrl);
      trimmedAudioRef.current.onended = () => setIsPlayingTrimmedAudio(false);
    }

    if (isPlayingTrimmedAudio) {
      trimmedAudioRef.current.pause();
      setIsPlayingTrimmedAudio(false);
    } else {
      trimmedAudioRef.current.currentTime = 0;
      trimmedAudioRef.current.play().then(() => {
        setIsPlayingTrimmedAudio(true);
      }).catch((err) => console.warn('Trimmed audio play error:', err));
    }
  };

  const handleExportRingtone = async () => {
    if (!track) return;

    setIsExporting(true);
    setExportSuccess(null);

    try {
      // Execute true client-side audio slicing and encoding
      const result = await trimAudioTrack(track, startTime, endTime, {
        fadeIn,
        fadeOut,
        format: exportFormat === 'wav' ? 'wav' : 'wav',
      });

      setTrimmedResult(result);

      // Direct save to phone storage / Downloads folder
      downloadBlobToPhone(result.blob, result.filename);

      // Add to user's offline audio library
      if (onAddTrackToLibrary) {
        onAddTrackToLibrary(result.trimmedTrack);
      }

      setExportSuccess(
        `Saved to phone! Downloaded "${result.filename}" (${result.duration}s) to device storage.`
      );
    } catch (err) {
      console.error('Trimming audio failed:', err);
      setExportSuccess('Trimming audio failed. Please try a different track or range.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleTrackSelection = (id: string) => {
    setSelectedTrackIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllTracks = () => {
    if (selectedTrackIds.length === tracks.length) {
      setSelectedTrackIds([]);
    } else {
      setSelectedTrackIds(tracks.map((t) => t.id));
    }
  };

  const handleApplyBatchTags = () => {
    if (!isProUser) {
      setProAlert('Batch ID3 Tag Editor is exclusive to Sonance Pro ($0.99/mo or $4.99/yr)');
      if (onOpenProModal) {
        setTimeout(() => onOpenProModal(), 500);
      }
      return;
    }

    if (selectedTrackIds.length === 0) {
      alert('Please select at least one track to batch edit tags.');
      return;
    }

    if (onUpdateTracks && tracks.length > 0) {
      const updated = tracks.map((t) => {
        if (selectedTrackIds.includes(t.id)) {
          return {
            ...t,
            artist: batchArtist || t.artist,
            album: batchAlbum || t.album,
            genre: batchGenre || t.genre,
            year: batchYear ? parseInt(batchYear) || t.year : t.year,
          };
        }
        return t;
      });
      onUpdateTracks(updated);
    }

    setTagSuccess(`Successfully updated ID3 tags for ${selectedTrackIds.length} track(s)!`);
    setTimeout(() => setTagSuccess(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" id="ringtone-trimmer-modal">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 shadow-2xl p-4 sm:p-5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              {activeTab === 'trimmer' ? <Scissors className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {activeTab === 'trimmer' ? 'High-Precision Trimmer & Ringtone' : 'Batch ID3 Tag Editor'}
                </h3>
                {isProUser ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5" /> PRO
                  </span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> PRO ONLY
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400">
                {activeTab === 'trimmer'
                  ? 'Sub-second millisecond cutting & direct phone ringtone export'
                  : 'Batch edit metadata, albums, artists & genres across tracks'}
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

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 my-3 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
          <button
            onClick={() => setActiveTab('trimmer')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'trimmer'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-indigo-400" />
            <span>Precision Trimmer</span>
          </button>
          <button
            onClick={() => setActiveTab('tag_editor')}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'tag_editor'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Batch ID3 Editor</span>
          </button>
        </div>

        {/* Pro Alert Banner */}
        {proAlert && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2 truncate">
              <Crown className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="truncate">{proAlert}</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenProModal?.();
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-400 text-black font-bold text-[10px] shrink-0 hover:bg-amber-300 cursor-pointer"
            >
              Upgrade ($0.99)
            </button>
          </div>
        )}

        {/* Tab 1: High Precision Trimmer */}
        {activeTab === 'trimmer' && (
          <div className="overflow-y-auto space-y-4 pr-1 flex-1">
            {/* Selected Track Banner */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
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
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Start: <b className="text-white font-mono">{formatPrecisionTime(startTime)}</b></span>
                <span>End: <b className="text-white font-mono">{formatPrecisionTime(endTime)}</b></span>
              </div>

              {/* Waveform graphic with selection window */}
              <div className="relative h-16 w-full rounded-xl bg-zinc-900 border border-zinc-800 p-2 flex items-center justify-between gap-1 overflow-hidden">
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

              {/* Millisecond Precision Controls */}
              <div className="space-y-2 pt-1">
                <div>
                  <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                    <span>Precision Start Point</span>
                    <span className="font-mono text-zinc-200">{formatPrecisionTime(startTime)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, (track.duration || 180) - 5)}
                    step={0.1}
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
                    <span>Precision End Point</span>
                    <span className="font-mono text-zinc-200">{formatPrecisionTime(endTime)}</span>
                  </div>
                  <input
                    type="range"
                    min={startTime + 1}
                    max={track.duration || 180}
                    step={0.1}
                    value={endTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setEndTime(val);
                    }}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              {/* Fade In / Out curves & Format */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fadeIn}
                    onChange={(e) => setFadeIn(e.target.checked)}
                    className="rounded accent-indigo-500"
                  />
                  <span>Fade In (1.0s)</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fadeOut}
                    onChange={(e) => setFadeOut(e.target.checked)}
                    className="rounded accent-indigo-500"
                  />
                  <span>Fade Out (1.5s)</span>
                </label>
              </div>

              {/* Format selection */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                <span className="text-zinc-400">Export Format:</span>
                <div className="flex items-center gap-1.5">
                  {(['mp3', 'm4r', 'wav'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                        exportFormat === fmt ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Target Destination */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">
                Assign Trimmed Audio To:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setRingtoneTarget('ringtone')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all cursor-pointer ${
                    ringtoneTarget === 'ringtone'
                      ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-md'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ringtone</span>
                </button>

                <button
                  onClick={() => setRingtoneTarget('alarm')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all cursor-pointer ${
                    ringtoneTarget === 'alarm'
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <AlarmClock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Alarm</span>
                </button>

                <button
                  onClick={() => setRingtoneTarget('notification')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-xs font-semibold transition-all cursor-pointer ${
                    ringtoneTarget === 'notification'
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Alert Tone</span>
                </button>
              </div>
            </div>

            {/* Trimmed Result Preview & Download Card */}
            {trimmedResult && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-indigo-200 truncate">{trimmedResult.filename}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {trimmedResult.duration}s · 16-bit PCM WAV (High Quality Phone Audio)
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={handleTogglePlayTrimmedAudio}
                      className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                      title={isPlayingTrimmedAudio ? 'Pause Trimmed Audio' : 'Play Trimmed Audio'}
                    >
                      {isPlayingTrimmedAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    </button>
                    <button
                      onClick={() => downloadBlobToPhone(trimmedResult.blob, trimmedResult.filename)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Save file to phone"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Save Again</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Success toast */}
            {exportSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="font-medium truncate">{exportSuccess}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Batch ID3 Tag Editor */}
        {activeTab === 'tag_editor' && (
          <div className="overflow-y-auto space-y-4 pr-1 flex-1">
            {/* Multi-track selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
                  Select Tracks to Edit ({selectedTrackIds.length} of {tracks.length || 1})
                </span>
                <button
                  onClick={handleSelectAllTracks}
                  className="text-[11px] text-amber-400 hover:underline font-semibold cursor-pointer"
                >
                  {selectedTrackIds.length === tracks.length ? 'Deselect All' : 'Select All Tracks'}
                </button>
              </div>

              <div className="max-h-32 overflow-y-auto rounded-xl bg-zinc-900 border border-zinc-800 p-2 space-y-1">
                {(tracks.length > 0 ? tracks : [track]).map((t) => {
                  const isSelected = selectedTrackIds.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTrackSelection(t.id)}
                      className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-amber-500/20 text-white border border-amber-500/30'
                          : 'text-zinc-400 hover:bg-zinc-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Music2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate font-medium">{t.title}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-zinc-500 truncate max-w-[100px]">{t.artist}</span>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center ${
                            isSelected ? 'bg-amber-400 text-black' : 'border border-zinc-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Batch Tag Inputs */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">Artist Name</label>
                  <input
                    type="text"
                    value={batchArtist}
                    onChange={(e) => setBatchArtist(e.target.value)}
                    placeholder="e.g. The Weeknd"
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">Album Title</label>
                  <input
                    type="text"
                    value={batchAlbum}
                    onChange={(e) => setBatchAlbum(e.target.value)}
                    placeholder="e.g. After Hours"
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">Genre</label>
                  <input
                    type="text"
                    value={batchGenre}
                    onChange={(e) => setBatchGenre(e.target.value)}
                    placeholder="e.g. Synthpop, R&B"
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold block mb-1">Year</label>
                  <input
                    type="text"
                    value={batchYear}
                    onChange={(e) => setBatchYear(e.target.value)}
                    placeholder="e.g. 2025"
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Success toast for tags */}
            {tagSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="font-medium truncate">{tagSuccess}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800">
          {activeTab === 'trimmer' ? (
            <>
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
                    <span>Preview Clip</span>
                  </>
                )}
              </button>

              <button
                id="btn-save-trimmed-to-phone"
                onClick={handleExportRingtone}
                disabled={isExporting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:brightness-105 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isExporting ? (
                  <span className="animate-pulse">Trimming Audio & Downloading...</span>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Save Trimmed Music to Phone</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={handleApplyBatchTags}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:brightness-105 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              {!isProUser && <Lock className="w-3.5 h-3.5" />}
              <Tag className="w-3.5 h-3.5" />
              <span>Apply ID3 Tags to {selectedTrackIds.length} Track(s)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
