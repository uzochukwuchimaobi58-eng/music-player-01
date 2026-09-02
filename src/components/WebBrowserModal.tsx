import React, { useState } from 'react';
import { X, Globe, Search, ArrowRight, Music, Radio, ExternalLink, Sparkles } from 'lucide-react';
import { Track } from '../types';

interface WebBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayStreamUrl?: (track: Track) => void;
}

export const WebBrowserModal: React.FC<WebBrowserModalProps> = ({
  isOpen,
  onClose,
  onPlayStreamUrl,
}) => {
  const [url, setUrl] = useState('https://freemusicarchive.org');
  const [searchEngineQuery, setSearchEngineQuery] = useState('');

  if (!isOpen) return null;

  const popularStations = [
    {
      name: 'Lofi Chillhop Radio',
      genre: 'Lofi / Study',
      url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
      icon: '🎧',
    },
    {
      name: 'Synthwave Neon 80s',
      genre: 'Retro Electro',
      url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=electronic-future-beats-117997.mp3',
      icon: '🌆',
    },
    {
      name: 'Acoustic Coffeehouse',
      genre: 'Acoustic / Warm',
      url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-abstract-intention-12099.mp3',
      icon: '☕',
    },
    {
      name: 'Cyberpunk Bass Drive',
      genre: 'Bass / Phonk',
      url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=cyber-drive.mp3',
      icon: '⚡',
    },
  ];

  const handlePlayStation = (station: (typeof popularStations)[0]) => {
    if (onPlayStreamUrl) {
      const streamTrack: Track = {
        id: `web-stream-${Date.now()}`,
        title: station.name,
        artist: station.genre,
        album: 'Web Music Station',
        duration: 180,
        url: station.url,
        coverArt:
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
        folder: 'Web Browser',
        isFavorite: true,
        playCount: 0,
        dateAdded: Date.now(),
        isOffline: false,
        bitrate: '320 kbps Stream',
        sourceType: 'built-in',
      };
      onPlayStreamUrl(streamTrack);
      onClose();
    }
  };

  return (
    <div
      id="web-browser-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs select-none animate-in fade-in duration-200 font-sans"
    >
      <div className="w-full max-w-lg bg-[#18181a] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#141416]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Web Browser & Radio</h3>
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  AD
                </span>
              </div>
              <p className="text-[10px] text-zinc-500">Stream audio & online music feeds</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser URL Input */}
        <div className="p-4 bg-[#1b1b1e] border-b border-zinc-800/80 flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Globe className="w-4 h-4 text-zinc-500 absolute left-3" />
            <input
              type="text"
              value={searchEngineQuery}
              onChange={(e) => setSearchEngineQuery(e.target.value)}
              placeholder="Search music, artists, or enter audio URL..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-900 text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-sky-500"
            />
          </div>
          <button
            onClick={() => {
              if (searchEngineQuery.trim()) {
                window.open(
                  `https://www.google.com/search?q=${encodeURIComponent(searchEngineQuery + ' free music mp3')}`,
                  '_blank'
                );
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <span>Search</span>
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Featured Live Stations */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Popular Online Music Feeds
            </span>
            <span className="text-[10px] text-sky-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 1-Click Stream
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {popularStations.map((station, i) => (
              <div
                key={i}
                onClick={() => handlePlayStation(station)}
                className="p-3 rounded-xl bg-[#202024] hover:bg-[#28282d] border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-between group active:scale-98"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl">{station.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-sky-400 transition-colors">
                      {station.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate">{station.genre}</p>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 group-hover:bg-sky-400 group-hover:text-black flex items-center justify-center transition-all shrink-0">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>

          {/* Web Links / Free Audio Sources */}
          <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Free Music Portals
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Free Music Archive', link: 'https://freemusicarchive.org' },
                { name: 'Pixabay Audio', link: 'https://pixabay.com/music/' },
                { name: 'Jamendo Music', link: 'https://www.jamendo.com' },
                { name: 'Internet Archive Audio', link: 'https://archive.org/details/audio' },
              ].map((site, index) => (
                <a
                  key={index}
                  href={site.link}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white border border-zinc-800 flex items-center gap-1.5 transition-colors"
                >
                  <span>{site.name}</span>
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-zinc-800 bg-[#141416] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
