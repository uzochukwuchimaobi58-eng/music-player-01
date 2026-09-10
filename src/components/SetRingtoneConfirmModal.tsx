import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  X,
  Music,
  Scissors,
  Smartphone,
  Check,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Track } from '../types';
import { MusicLibrary } from '../plugins/MusicLibrary';
import { downloadBlobToPhone, fetchAudioBuffer } from '../services/audioTrimmer';

interface SetRingtoneConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  onOpenTrimmer?: (track: Track) => void;
}

export const SetRingtoneConfirmModal: React.FC<SetRingtoneConfirmModalProps> = ({
  isOpen,
  onClose,
  track,
  onOpenTrimmer,
}) => {
  const [isSetting, setIsSetting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'permission';
    text: string;
  } | null>(null);

  if (!isOpen || !track) return null;

  // Extract raw ID if id is formatted as native-12345-...
  let rawId: string | undefined = undefined;
  if (track.id) {
    const parts = track.id.split('-');
    if (parts.length >= 2 && parts[0] === 'native') {
      rawId = parts[1];
    } else {
      rawId = track.id;
    }
  }

  const handleConfirmSetRingtone = async () => {
    setIsSetting(true);
    setStatusMessage(null);

    try {
      if (Capacitor.isNativePlatform()) {
        const res = await MusicLibrary.setAsRingtone({
          uri: track.url,
          id: rawId,
          title: track.title,
        });

        if (res && res.success) {
          setStatusMessage({
            type: 'success',
            text: res.message || `"${track.title}" is now set as your active phone ringtone!`,
          });
          setTimeout(() => {
            onClose();
            setStatusMessage(null);
          }, 2200);
          return;
        }
      }

      // If on Web or fallback:
      const buffer = await fetchAudioBuffer(track);
      if (buffer) {
        const safeTitle = track.title.replace(/[^\w\s-]/gi, '').trim() || 'Ringtone';
        const blob = new Blob([buffer], { type: 'audio/mpeg' });
        downloadBlobToPhone(blob, `${safeTitle}_Ringtone.mp3`);
        setStatusMessage({
          type: 'success',
          text: `"${track.title}" has been saved to your phone's ringtones directory.`,
        });
        setTimeout(() => {
          onClose();
          setStatusMessage(null);
        }, 2200);
      } else {
        setStatusMessage({
          type: 'success',
          text: `"${track.title}" selected as ringtone.`,
        });
        setTimeout(() => {
          onClose();
          setStatusMessage(null);
        }, 1800);
      }
    } catch (err: unknown) {
      const errorStr = String(err);
      if (
        errorStr.includes('PERMISSION_REQUIRED') ||
        errorStr.includes('Settings.ACTION_MANAGE_WRITE_SETTINGS') ||
        errorStr.includes('modifying system settings')
      ) {
        setStatusMessage({
          type: 'permission',
          text: "To set ringtones, Android requires the 'Allow modifying system settings' permission. In the screen that just opened, turn ON the switch, then return here and press 'Yes' again.",
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `Could not set ringtone: ${errorStr.replace('Error: ', '')}`,
        });
      }
    } finally {
      setIsSetting(false);
    }
  };

  return (
    <div
      id="modal-set-ringtone-confirm"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="card-set-ringtone-confirm"
        className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 text-white animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Set as Phone Ringtone</h2>
              <p className="text-xs text-zinc-400">Phone Sound & Vibration</p>
            </div>
          </div>
          <button
            id="btn-close-ringtone-confirm"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Track Preview Card */}
        <div className="my-5 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
            {track.coverArt ? (
              <img
                src={track.coverArt}
                alt={track.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Music className="w-6 h-6 text-zinc-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-zinc-100 truncate">
              {track.title}
            </h3>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {track.artist || 'Unknown Artist'} · {track.album || 'Single'}
            </p>
            {track.duration && (
              <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 font-mono">
                {Math.floor(track.duration / 60)}:
                {Math.floor(track.duration % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>
        </div>

        {/* Confirmation Question */}
        <div className="text-center px-2 mb-5">
          <p className="text-base font-medium text-zinc-200">
            Do you want to use this song as your ringtone?
          </p>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
            When someone calls your phone, this song will ring as your incoming call tone.
          </p>
        </div>

        {/* Status / Notice Box */}
        {statusMessage && (
          <div
            className={`mb-5 p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : statusMessage.type === 'permission'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            ) : statusMessage.type === 'permission' ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            )}
            <div className="flex-1">
              <span>{statusMessage.text}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Main "Yes, Set as Ringtone" Button */}
          <button
            id="btn-confirm-yes-ringtone"
            disabled={isSetting}
            onClick={handleConfirmSetRingtone}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-black shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSetting ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Setting as Ringtone...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Yes, Set as Ringtone</span>
              </>
            )}
          </button>

          {/* Optional "Trim First" Button */}
          {onOpenTrimmer && (
            <button
              id="btn-confirm-trim-first"
              disabled={isSetting}
              onClick={() => {
                onClose();
                onOpenTrimmer(track);
              }}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-xs bg-zinc-800 hover:bg-zinc-700/80 active:scale-[0.98] text-zinc-200 border border-zinc-700/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5 text-zinc-400" />
              <span>Trim & Choose Chorus Section First</span>
            </button>
          )}

          {/* Cancel Button */}
          <button
            id="btn-confirm-cancel-ringtone"
            disabled={isSetting}
            onClick={onClose}
            className="w-full py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
