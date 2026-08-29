import React, { useState } from 'react';
import { X, ListMusic, Plus, Check, Trash2, Palette } from 'lucide-react';
import { Track, Playlist } from '../types';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlaylist: (name: string, color: string, trackIds: string[]) => void;
  onUpdatePlaylist?: (playlist: Playlist) => void;
  onDeletePlaylist?: (playlistId: string) => void;
  existingPlaylist?: Playlist | null;
  allTracks: Track[];
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreatePlaylist,
  onUpdatePlaylist,
  onDeletePlaylist,
  existingPlaylist,
  allTracks,
}) => {
  const [name, setName] = useState(existingPlaylist?.name || '');
  const [selectedColor, setSelectedColor] = useState(
    existingPlaylist?.color || 'from-sky-500 to-indigo-600'
  );
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>(
    existingPlaylist?.trackIds || []
  );

  if (!isOpen) return null;

  const colorGradients = [
    { label: 'Sky Indigo', value: 'from-sky-500 to-indigo-600' },
    { label: 'Amber Red', value: 'from-amber-500 to-rose-600' },
    { label: 'Emerald Teal', value: 'from-emerald-500 to-teal-700' },
    { label: 'Purple Violet', value: 'from-purple-500 to-pink-600' },
    { label: 'Sunset Gold', value: 'from-orange-500 to-yellow-600' },
    { label: 'Cyan Blue', value: 'from-cyan-500 to-blue-600' },
  ];

  const handleToggleTrack = (id: string) => {
    setSelectedTrackIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;

    if (existingPlaylist && onUpdatePlaylist) {
      onUpdatePlaylist({
        ...existingPlaylist,
        name: name.trim(),
        color: selectedColor,
        trackIds: selectedTrackIds,
      });
    } else {
      onCreatePlaylist(name.trim(), selectedColor, selectedTrackIds);
    }
    onClose();
  };

  return (
    <div
      id="playlist-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none animate-in fade-in duration-200 font-sans"
    >
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center border border-zinc-700">
              <ListMusic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {existingPlaylist ? 'Edit Playlist' : 'Create New Playlist'}
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                Personalized Collection
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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Playlist Name Input */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
              Playlist Name
            </label>
            <input
              id="input-playlist-name"
              type="text"
              placeholder="e.g., Road Trip Classics, Chill Lofi..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-zinc-900 text-zinc-100 placeholder-zinc-500 border border-zinc-800 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Color Gradient Theme Picker */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-zinc-400" />
              Cover Palette
            </label>
            <div className="flex flex-wrap gap-2">
              {colorGradients.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setSelectedColor(g.value)}
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${g.value} flex items-center justify-center transition-all cursor-pointer ${
                    selectedColor === g.value
                      ? 'ring-2 ring-white scale-110 shadow-md'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  title={g.label}
                >
                  {selectedColor === g.value && <Check className="w-4 h-4 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Track Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Add Tracks ({selectedTrackIds.length})
              </label>
              <button
                onClick={() => {
                  if (selectedTrackIds.length === allTracks.length) {
                    setSelectedTrackIds([]);
                  } else {
                    setSelectedTrackIds(allTracks.map((t) => t.id));
                  }
                }}
                className="text-[11px] text-zinc-400 hover:text-white hover:underline cursor-pointer"
              >
                {selectedTrackIds.length === allTracks.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 rounded-xl bg-zinc-900/90 p-2 border border-zinc-800">
              {allTracks.map((track) => {
                const isSelected = selectedTrackIds.includes(track.id);
                return (
                  <div
                    key={track.id}
                    onClick={() => handleToggleTrack(track.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-zinc-800 text-white'
                        : 'hover:bg-zinc-800/60 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={track.coverArt}
                        alt={track.title}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded object-cover border border-zinc-800"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{track.title}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{track.artist}</p>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected
                          ? 'bg-white border-white text-black'
                          : 'border-zinc-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-black/60 flex items-center justify-between">
          {existingPlaylist && onDeletePlaylist && !existingPlaylist.isDefault ? (
            <button
              onClick={() => {
                onDeletePlaylist(existingPlaylist.id);
                onClose();
              }}
              className="px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-save-playlist"
              onClick={handleSave}
              disabled={!name.trim()}
              className="px-5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              Save Playlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
