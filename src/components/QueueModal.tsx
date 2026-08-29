import React from 'react';
import { X, ListMusic, Play, Trash2, Shuffle } from 'lucide-react';
import { Track } from '../types';

interface QueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Track[];
  currentTrackId: string | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onShuffleQueue: () => void;
}

export const QueueModal: React.FC<QueueModalProps> = ({
  isOpen,
  onClose,
  queue,
  currentTrackId,
  isPlaying,
  onPlayTrack,
  onShuffleQueue,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="queue-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs select-none animate-in fade-in duration-200 font-sans"
    >
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center border border-zinc-700">
              <ListMusic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Current Playing Queue</h3>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                {queue.length} {queue.length === 1 ? 'track' : 'tracks'} queued
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onShuffleQueue}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5 text-zinc-400" />
              <span>Shuffle</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Queue List */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-1.5 flex-1">
          {queue.map((track, idx) => {
            const isCurrent = track.id === currentTrackId;
            return (
              <div
                key={`${track.id}-${idx}`}
                onClick={() => onPlayTrack(track)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-zinc-800/90 border border-indigo-500/40 text-indigo-300'
                    : 'bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-zinc-500 w-4 text-center">
                    {idx + 1}
                  </span>

                  <img
                    src={track.coverArt}
                    alt={track.title}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover border border-zinc-800"
                  />

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold truncate">
                      {track.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {track.artist}
                    </p>
                  </div>
                </div>

                {isCurrent && (
                  <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 uppercase tracking-wider">
                    {isPlaying ? 'Playing' : 'Paused'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-black/60 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 font-bold text-xs text-zinc-200 cursor-pointer"
          >
            Close Queue
          </button>
        </div>
      </div>
    </div>
  );
};
