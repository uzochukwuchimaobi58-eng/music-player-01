import React, { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface TrackArtworkProps {
  coverArt?: string | null;
  title?: string;
  artist?: string;
  className?: string;
  iconClassName?: string;
  alt?: string;
  showVinylGrooves?: boolean;
}

// Deterministic aesthetic gradient palettes for tracks without embedded artwork
const ART_GRADIENTS = [
  'from-amber-600/80 via-amber-800/60 to-zinc-950',
  'from-indigo-600/80 via-indigo-900/60 to-zinc-950',
  'from-emerald-600/80 via-teal-900/60 to-zinc-950',
  'from-rose-600/80 via-rose-900/60 to-zinc-950',
  'from-violet-600/80 via-purple-950/60 to-zinc-950',
  'from-cyan-600/80 via-blue-950/60 to-zinc-950',
  'from-fuchsia-600/80 via-pink-950/60 to-zinc-950',
  'from-orange-600/80 via-amber-950/60 to-zinc-950',
];

function getGradientForTitle(title: string = ''): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % ART_GRADIENTS.length;
  return ART_GRADIENTS[index];
}

export const TrackArtwork: React.FC<TrackArtworkProps> = ({
  coverArt,
  title = '',
  artist = '',
  className = 'w-full h-full object-cover',
  iconClassName = 'w-5 h-5 text-white/70',
  alt,
  showVinylGrooves = true,
}) => {
  const [hasError, setHasError] = useState(false);

  // Normalize path using Capacitor file conversion for Android local paths
  let resolvedSrc = coverArt?.trim() || '';
  if (
    resolvedSrc &&
    (resolvedSrc.startsWith('/') || resolvedSrc.startsWith('file://'))
  ) {
    try {
      resolvedSrc = Capacitor.convertFileSrc(resolvedSrc);
    } catch {
      // Fallback to original
    }
  }

  // Reset error state when artwork URL updates
  useEffect(() => {
    setHasError(false);
  }, [coverArt]);

  const gradientClass = getGradientForTitle(title || artist);
  const initialLetter = (title || artist || 'M').trim().charAt(0).toUpperCase();

  // If artwork is valid and has not errored, render high quality image
  if (resolvedSrc && !hasError) {
    return (
      <img
        src={resolvedSrc}
        alt={alt || title || 'Music artwork'}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={className}
      />
    );
  }

  // Resilient offline fallback: Sleek high-contrast vinyl artwork with grooves & initial
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden bg-gradient-to-br ${gradientClass} select-none`}
      title={title || artist}
    >
      {/* Vinyl grooves decoration */}
      {showVinylGrooves && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-35">
          <div className="w-[88%] h-[88%] rounded-full border border-white/20" />
          <div className="absolute w-[68%] h-[68%] rounded-full border border-white/15" />
          <div className="absolute w-[46%] h-[46%] rounded-full border border-white/10" />
        </div>
      )}

      {/* Center label & icon */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <Music className={iconClassName} />
        {initialLetter && (
          <span className="text-[10px] font-bold text-white/60 tracking-wider mt-0.5 uppercase">
            {initialLetter}
          </span>
        )}
      </div>
    </div>
  );
};
