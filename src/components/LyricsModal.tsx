import React, { useState } from 'react';
import {
  X,
  FileText,
  Sparkles,
  Music,
  HardDrive,
  Edit3,
  Check,
  Search,
  Download,
  Mic2,
  MicOff
} from 'lucide-react';
import { Track } from '../types';

interface LyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  currentTime: number;
  isKaraokeMode?: boolean;
  onToggleKaraoke?: (enabled: boolean) => void;
  onUpdateLyrics?: (trackId: string, newLyrics: string) => void;
}

export const LyricsModal: React.FC<LyricsModalProps> = ({
  isOpen,
  onClose,
  track,
  currentTime,
  isKaraokeMode = false,
  onToggleKaraoke,
  onUpdateLyrics,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLyrics, setEditedLyrics] = useState('');
  const [isFetchingOnline, setIsFetchingOnline] = useState(false);
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null);

  if (!isOpen || !track) return null;

  const rawLyrics = track.lyrics || 'No synchronized lyrics available for this track.';
  const lines = rawLyrics.split('\n');

  const handleStartEdit = () => {
    setEditedLyrics(rawLyrics);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (onUpdateLyrics) {
      onUpdateLyrics(track.id, editedLyrics);
    }
    setIsEditing(false);
  };

  const handleFetchLyrics = () => {
    setIsFetchingOnline(true);
    setSearchSuccess(null);

    // Simulate online LRC lyrics database match
    setTimeout(() => {
      setIsFetchingOnline(false);
      const fetched = `[00:10.00] (Intro melody playing smoothly)
[00:22.00] ${track.title} - ${track.artist}
[00:45.00] Living in the rhythm, floating in the zone
[01:10.00] High fidelity sounds resonating in our soul
[01:35.00] Bass vibrating deep into the night
[02:00.00] Pure musical euphoria, reaching new height
[02:25.00] (Guitar & Synth solo)
[02:50.00] Fading out with the groove`;
      if (onUpdateLyrics) {
        onUpdateLyrics(track.id, fetched);
      }
      setSearchSuccess('Synced .LRC lyrics retrieved successfully!');
      setTimeout(() => setSearchSuccess(null), 3000);
    }, 1200);
  };

  return (
    <div
      id="lyrics-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200 font-sans"
    >
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-black/90">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={track.coverArt}
              alt={track.title}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl object-cover border border-zinc-800 shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate tracking-tight">
                {track.title}
              </h3>
              <p className="text-xs text-zinc-400 truncate">
                {track.artist} · {track.album}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* AI Karaoke Toggle */}
            {onToggleKaraoke && (
              <button
                onClick={() => onToggleKaraoke(!isKaraokeMode)}
                title="AI Karaoke (Vocal Remover)"
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isKaraokeMode
                    ? 'bg-rose-500 text-white shadow-lg animate-pulse'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                }`}
              >
                {isKaraokeMode ? <MicOff className="w-3.5 h-3.5" /> : <Mic2 className="w-3.5 h-3.5 text-rose-400" />}
                <span className="hidden sm:inline">{isKaraokeMode ? 'Karaoke ON' : 'Karaoke'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar: Auto-fetch & Manual Edit */}
        <div className="px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleFetchLyrics}
              disabled={isFetchingOnline}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3 h-3 text-indigo-400" />
              <span>{isFetchingOnline ? 'Searching .LRC...' : 'Fetch Lyrics Online'}</span>
            </button>

            {isEditing ? (
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-colors cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Save Changes</span>
              </button>
            ) : (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3 text-zinc-400" />
                <span>Edit LRC</span>
              </button>
            )}
          </div>

          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
            {isKaraokeMode ? 'Vocals Attenuated' : 'Full Audio'}
          </span>
        </div>

        {searchSuccess && (
          <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-300 text-xs text-center">
            {searchSuccess}
          </div>
        )}

        {/* Lyrics Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-center flex-1 min-h-[220px]">
          {isEditing ? (
            <textarea
              value={editedLyrics}
              onChange={(e) => setEditedLyrics(e.target.value)}
              rows={12}
              className="w-full h-full p-3 rounded-xl bg-zinc-900 text-zinc-100 text-xs font-mono border border-zinc-700 focus:outline-none focus:border-indigo-500"
              placeholder="Paste or write lyrics with optional [mm:ss.xx] timestamps..."
            />
          ) : (
            lines.map((line, idx) => {
              const cleanText = line.replace(/\[\d+:\d+(\.\d+)?\]/g, '').trim();
              if (!cleanText) return <div key={idx} className="h-3" />;

              return (
                <p
                  key={idx}
                  className="text-base sm:text-lg font-medium text-zinc-300 hover:text-white transition-colors leading-relaxed"
                >
                  {cleanText}
                </p>
              );
            })
          )}
        </div>

        {/* Track Technical Spec Sheet Footer */}
        <div className="p-3.5 border-t border-zinc-800 bg-black/80 text-xs text-zinc-400 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Bitrate</span>
            <span className="font-mono text-white font-semibold text-xs">{track.bitrate || '320 kbps'}</span>
          </div>
          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Sample Rate</span>
            <span className="font-mono text-zinc-200 font-semibold text-xs">{track.sampleRate || '48.0 kHz'}</span>
          </div>
          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Folder</span>
            <span className="truncate block font-semibold text-zinc-200 text-xs">{track.folder}</span>
          </div>
          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="block text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Offline State</span>
            <span className="font-semibold text-emerald-400 text-xs">{track.isOffline ? 'Cached locally' : 'Ready'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
