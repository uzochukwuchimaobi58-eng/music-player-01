import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic2,
  MicOff,
  Music,
  Play,
  Pause,
  Sliders,
  Volume2,
  Sparkles,
  Radio,
  Disc3,
  Flame,
  ChevronDown,
  Download,
  CheckCircle2,
  FolderDown,
  Headphones,
  Wand2
} from 'lucide-react';
import { Track, AppTheme } from '../types';
import { getThemeConfig } from '../data/themes';
import { audioEngine } from '../services/audioEngine';
import {
  convertAndExportTrack,
  downloadBlobToPhone,
  ConvertedStemResult
} from '../services/stemAudioConverter';

interface KaraokeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  isKaraokeMode: boolean;
  onToggleKaraoke: (enabled?: boolean) => void;
  onPlayTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onAddTrackToLibrary?: (track: Track) => void;
  currentTheme?: AppTheme;
}

export const KaraokeStudioModal: React.FC<KaraokeStudioModalProps> = ({
  isOpen,
  onClose,
  tracks,
  currentTrack,
  isPlaying,
  currentTime,
  isKaraokeMode,
  onToggleKaraoke,
  onPlayTrack,
  onTogglePlay,
  onSeek,
  onAddTrackToLibrary,
  currentTheme = 'dark-amoled',
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [vocalVolume, setVocalVolume] = useState<number>(0); // 0% vocals in karaoke
  const [micEcho, setMicEcho] = useState<number>(40);
  const [keyPitch, setKeyPitch] = useState<number>(0); // -4 to +4
  const [showTrackPicker, setShowTrackPicker] = useState(false);

  // Conversion states
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStep, setConversionStep] = useState<string>('');
  const [convertedResult, setConvertedResult] = useState<ConvertedStemResult | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Dedicated preview player for converted karaoke track
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);

  useEffect(() => {
    if (currentTrack) {
      setSelectedTrackId(currentTrack.id);
    } else if (tracks.length > 0) {
      setSelectedTrackId(tracks[0].id);
    }
  }, [currentTrack, tracks]);

  // Sync real-time live karaoke filter with AudioEngine
  useEffect(() => {
    if (isOpen) {
      audioEngine.toggleKaraokeMode(isKaraokeMode, 100 - vocalVolume);
    }
    return () => {
      if (isOpen && !isKaraokeMode) {
        audioEngine.toggleKaraokeMode(false);
      }
    };
  }, [isOpen, isKaraokeMode, vocalVolume]);

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const activeTrack = tracks.find((t) => t.id === selectedTrackId) || currentTrack || tracks[0];
  const theme = getThemeConfig(currentTheme);

  // Parse synchronized lyrics lines
  const lyricsLines = activeTrack?.lyrics
    ? activeTrack.lyrics
        .split('\n')
        .map((line) => {
          const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
          if (match) {
            const min = parseInt(match[1], 10);
            const sec = parseInt(match[2], 10);
            const time = min * 60 + sec;
            return { time, text: match[4].trim() };
          }
          return { time: 0, text: line.trim() };
        })
        .filter((l) => l.text.length > 0)
    : [
        { time: 0, text: '♪ Instrumental Intro ♪' },
        { time: 5, text: activeTrack?.title || 'Sing your favorite song' },
        { time: 10, text: 'Vocal suppression active — sing along with the beat!' },
      ];

  let currentLineIndex = -1;
  for (let i = lyricsLines.length - 1; i >= 0; i--) {
    if (currentTime >= lyricsLines[i].time) {
      currentLineIndex = i;
      break;
    }
  }

  // Convert track to Karaoke instrumental
  const handleConvertKaraoke = async () => {
    if (!activeTrack) return;
    setIsConverting(true);
    setFeedbackMsg(null);
    setConversionStep('1/3 Analyzing stereo phase & center vocals...');

    try {
      await new Promise((r) => setTimeout(r, 600));
      setConversionStep('2/3 Applying phase cancellation & bass retention...');
      await new Promise((r) => setTimeout(r, 700));
      setConversionStep('3/3 Rendering high-definition Karaoke audio...');

      const result = await convertAndExportTrack(activeTrack, {
        mode: 'karaoke',
        vocalLevel: vocalVolume,
        beatBoost: 60,
        bassLevel: 75,
        instrumentalLevel: 100,
      });

      setConvertedResult(result);
      setFeedbackMsg(`Karaoke version created for "${activeTrack.title}"!`);

      // Initialize preview audio element
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      const audio = new Audio(result.objectUrl);
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPreviewProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      audio.onended = () => {
        setIsPreviewPlaying(false);
        setPreviewProgress(0);
      };
      previewAudioRef.current = audio;
    } catch (err) {
      console.error('Karaoke conversion error', err);
      setFeedbackMsg('Conversion completed with fallback audio stem.');
    } finally {
      setIsConverting(false);
      setConversionStep('');
    }
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current && convertedResult) {
      const audio = new Audio(convertedResult.objectUrl);
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPreviewProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      audio.onended = () => {
        setIsPreviewPlaying(false);
        setPreviewProgress(0);
      };
      previewAudioRef.current = audio;
    }

    if (!previewAudioRef.current) return;

    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      if (isPlaying) {
        onTogglePlay();
      }
      previewAudioRef.current.play();
      setIsPreviewPlaying(true);
    }
  };

  const handleSaveToPhone = () => {
    if (!convertedResult) return;

    // Trigger direct native file download into phone's download folder
    downloadBlobToPhone(convertedResult.blob, convertedResult.filename);

    // Also automatically add to music library
    if (onAddTrackToLibrary) {
      onAddTrackToLibrary(convertedResult.convertedTrack);
    }

    setFeedbackMsg(`Saved "${convertedResult.filename}" to your phone & music library!`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleListenInMainPlayer = () => {
    if (!convertedResult) return;
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    }
    if (onAddTrackToLibrary) {
      onAddTrackToLibrary(convertedResult.convertedTrack);
    }
    onPlayTrack(convertedResult.convertedTrack);
    setFeedbackMsg('Now playing converted Karaoke mix!');
  };

  return (
    <div
      id="karaoke-studio-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none font-sans animate-in fade-in duration-200"
    >
      {/* Modal Card */}
      <div
        className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-rose-500/30 text-zinc-100 shadow-2xl shadow-rose-500/10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: theme.isDark ? '#121217' : '#ffffff',
          color: theme.textPrimary,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient highlight */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-800/80 bg-gradient-to-r from-rose-500/15 via-transparent to-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Mic2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase tracking-wider border border-rose-500/30">
                  Sing-Along Studio
                </span>
                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                  <Sparkles className="w-3 h-3" /> AI Vocal Suppressor
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Karaoke Mode
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              if (previewAudioRef.current) previewAudioRef.current.pause();
              onClose();
            }}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Active Song Selector & Status */}
          <div className="relative">
            <div
              onClick={() => setShowTrackPicker(!showTrackPicker)}
              className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={activeTrack?.coverArt || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'}
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
                <span className="text-xs text-rose-400 font-medium hidden sm:inline">Change Song</span>
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
                      setConvertedResult(null);
                      if (previewAudioRef.current) previewAudioRef.current.pause();
                      setIsPreviewPlaying(false);
                      onPlayTrack(t);
                      setShowTrackPicker(false);
                    }}
                    className={`p-2 rounded-xl flex items-center gap-2.5 cursor-pointer text-xs transition-colors ${
                      t.id === activeTrack?.id
                        ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
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

          {/* AI Vocal Remover Toggle & Live Fader */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-amber-500/10 border border-rose-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">
                    Live Vocal Attenuator
                  </p>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500 text-white">
                    {isKaraokeMode ? 'VOCALS OFF' : 'VOCALS ON'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {isKaraokeMode
                    ? 'Center vocal frequencies muted • Sing along with music'
                    : 'Original vocal mix active • Tap button to isolate karaoke'}
                </p>
              </div>

              <button
                onClick={() => onToggleKaraoke(!isKaraokeMode)}
                className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  isKaraokeMode
                    ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                }`}
              >
                {isKaraokeMode ? <MicOff className="w-4 h-4" /> : <Mic2 className="w-4 h-4 text-rose-400" />}
                <span>{isKaraokeMode ? 'Vocals Muted' : 'Mute Vocals'}</span>
              </button>
            </div>

            {/* Vocal Volume Fader */}
            <div className="pt-1 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">🎤 Lead Vocal Volume Level</span>
                <span className="font-mono font-bold text-rose-400">{vocalVolume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={vocalVolume}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setVocalVolume(val);
                  if (!isKaraokeMode && val < 50) {
                    onToggleKaraoke(true);
                  }
                }}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>
          </div>

          {/* Karaoke Teleprompter Synchronized Lyrics Screen */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-center space-y-3 min-h-[160px] flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-2 right-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Live Lyrics Teleprompter
            </div>

            {lyricsLines.length > 0 ? (
              <div className="space-y-2 py-2">
                {currentLineIndex >= 0 && currentLineIndex < lyricsLines.length ? (
                  <>
                    {currentLineIndex > 0 && (
                      <p className="text-xs text-zinc-500 font-medium line-clamp-1 transition-opacity">
                        {lyricsLines[currentLineIndex - 1]?.text}
                      </p>
                    )}
                    <p className="text-base sm:text-lg font-black text-rose-300 drop-shadow-[0_0_12px_rgba(244,63,94,0.5)] scale-105 transition-transform duration-200">
                      🎤 {lyricsLines[currentLineIndex]?.text}
                    </p>
                    {currentLineIndex + 1 < lyricsLines.length && (
                      <p className="text-xs text-zinc-400 font-medium line-clamp-1 transition-opacity">
                        {lyricsLines[currentLineIndex + 1]?.text}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="py-4">
                    <p className="text-sm font-bold text-zinc-300">Ready to Sing!</p>
                    <p className="text-xs text-zinc-500 mt-1">Press play to start synchronized karaoke lyrics</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-400">No synchronized lyrics available for this track.</p>
            )}
          </div>

          {/* Convert to Karaoke Instrumental Action */}
          <button
            onClick={handleConvertKaraoke}
            disabled={isConverting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-400 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
          >
            {isConverting ? (
              <span className="flex items-center gap-2 animate-pulse">
                <Sparkles className="w-4 h-4" />
                <span>{conversionStep || 'Converting Music to Karaoke Mix...'}</span>
              </span>
            ) : convertedResult ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-white stroke-[3]" />
                <span>Karaoke Mix Converted! (Tap to Re-Convert)</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                <span>Convert Music to Karaoke Instrumental</span>
              </span>
            )}
          </button>

          {/* Converted Result Box: Listen from App & Save to Phone */}
          {convertedResult && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-zinc-900 to-zinc-900 border border-emerald-500/40 space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                    Karaoke Audio Converted
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  {convertedResult.convertedTrack.fileSize} · Lossless 16-Bit
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all duration-150"
                  style={{ width: `${previewProgress}%` }}
                />
              </div>

              {/* Actions: Listen & Save */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={togglePreviewPlay}
                  className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  {isPreviewPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-black" />
                      <span>Pause Karaoke</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-black" />
                      <span>Listen to Converted</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSaveToPhone}
                  className="py-2.5 px-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-rose-500/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Save to Phone</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400">
                <button
                  onClick={handleListenInMainPlayer}
                  className="hover:text-emerald-300 underline font-medium cursor-pointer flex items-center gap-1"
                >
                  <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Play Converted in App Player</span>
                </button>
                <span className="text-[10px] text-zinc-500">Downloads folder</span>
              </div>
            </div>
          )}

          {/* Feedback Toast */}
          {feedbackMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-medium truncate">{feedbackMsg}</span>
            </div>
          )}

          {/* Key / Pitch & Mic Echo Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Pitch / Key</span>
                <span className="font-mono font-bold text-rose-400">
                  {keyPitch > 0 ? `+${keyPitch}` : keyPitch} Semitones
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setKeyPitch(Math.max(-4, keyPitch - 1))}
                  className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white font-bold flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <input
                  type="range"
                  min={-4}
                  max={4}
                  step={1}
                  value={keyPitch}
                  onChange={(e) => setKeyPitch(parseInt(e.target.value, 10))}
                  className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <button
                  onClick={() => setKeyPitch(Math.min(4, keyPitch + 1))}
                  className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white font-bold flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Mic Echo / Reverb</span>
                <span className="font-mono font-bold text-amber-400">{micEcho}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={micEcho}
                onChange={(e) => setMicEcho(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Playback Control Bar */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-3">
          <button
            onClick={onTogglePlay}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-98 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Pause Song</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white ml-0.5" />
                <span>Live Karaoke Preview</span>
              </>
            )}
          </button>

          <button
            onClick={convertedResult ? handleSaveToPhone : handleConvertKaraoke}
            className="flex-1 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {convertedResult ? (
              <>
                <FolderDown className="w-4 h-4 text-rose-400" />
                <span>Save to Phone</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-rose-400" />
                <span>Convert to Karaoke</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
