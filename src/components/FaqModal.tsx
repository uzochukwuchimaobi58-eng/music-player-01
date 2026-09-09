import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  HelpCircle,
  Search,
  X
} from 'lucide-react';

interface FaqItem {
  id: string;
  number: number;
  question: string;
  summary: string;
  steps: string[];
  tips?: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'faq-1',
    number: 1,
    question: 'How to download songs & auto-detect from online?',
    summary: 'When downloading songs in Chrome or online, Sonance automatically detects and imports new audio files as soon as you switch back!',
    steps: [
      'Enable Auto-Detect: On the Home screen or Library tab, tap "Connect /Download Folder" once to link your phone’s download directory.',
      'Download your music: Open Chrome or any browser and download your favorite MP3, FLAC, WAV, or M4A music files.',
      'Switch back to Music Player: The app automatically detects new files in the background and adds them to your library without needing to click anything!',
      'PWA Open With: You can also tap the downloaded file notification or "Open With" in Chrome and select Sonance Music Player to play it immediately.'
    ],
    tips: 'Downloaded songs are cached locally in your phone storage and remain 100% playable even when completely offline.'
  },
  {
    id: 'faq-2',
    number: 2,
    question: 'Why the song stop playing?',
    summary: 'Modern Android systems (Samsung, Xiaomi, Oppo, Vivo, OnePlus) aggressively kill background audio to save battery when the screen turns off.',
    steps: [
      'Open your phone’s Android Settings > Battery > Battery Optimization (or App Battery Usage).',
      'Locate "Music Player" (Sonance) in the list and set it to "Don’t optimize" or "Unrestricted".',
      'Enable "Allow background activity" and "Autostart" in your phone’s App permissions.',
      'On Xiaomi/Redmi devices, lock the app in Recent Apps (hold app card > tap Lock icon).'
    ],
    tips: 'Inside Settings > Playback, you can also enable "Screen Wake Lock" if using your phone on a car mount.'
  },
  {
    id: 'faq-3',
    number: 3,
    question: 'How to display lyrics and scroll?',
    summary: 'Sonance features full-screen synchronized lyrics that automatically scroll in real time with the vocal track.',
    steps: [
      'Open the Now Playing screen while any song is active.',
      'Tap the Lyrics icon (Microphone / Note symbol) or swipe left on the album art.',
      'The synchronized (.lrc) lyrics will automatically highlight and scroll line by line.',
      'If lyrics are missing or out of sync, tap the three dots (⋮) menu on the track and tap "Edit / Search Lyrics" to paste or adjust timestamps.'
    ],
    tips: 'Tap any lyric line during playback to instantly jump the audio scrubber directly to that exact verse.'
  },
  {
    id: 'faq-4',
    number: 4,
    question: 'Want to hide some audio files?',
    summary: 'You can easily exclude short ringtones, notifications, WhatsApp voice notes, and audiobooks from your music list.',
    steps: [
      'Open Settings > tap "Filter Audio Files".',
      'Turn ON "Filter by length" to ignore audio clips shorter than 30s or 60s.',
      'Turn ON "Filter by size" to ignore small sound bites under 100 KB.',
      'Tap "Hidden Folders" to select and exclude specific directories (e.g. WhatsApp Audio, Telegram, Call Recordings).'
    ],
    tips: 'Filtered files remain safe on your phone and are never deleted—they are simply excluded from the music library.'
  },
  {
    id: 'faq-5',
    number: 5,
    question: 'Why shuffle some songs instead of all songs?',
    summary: 'Shuffle randomizes songs within your currently active queue, album, or playlist rather than all device songs.',
    steps: [
      'If you start playing from an Album or Playlist, Shuffle will only randomize the tracks inside that specific collection.',
      'To shuffle ALL songs across your entire phone:',
      '1. Tap "Songs" in the top tabs of your library.',
      '2. Tap the prominent "Shuffle All" button at the top of the track list.',
      '3. Your entire library is now queued and randomized.'
    ],
    tips: 'You can tap the Queue icon on the player screen at any time to see the upcoming randomized track list.'
  },
  {
    id: 'faq-6',
    number: 6,
    question: 'How to stop shuffle playing or change play mode?',
    summary: 'Switch easily between Sequential, Loop All, Repeat One, and Shuffle playback modes.',
    steps: [
      'Open the full-screen Now Playing screen.',
      'Find the Play Mode icon on the left side of the media playback buttons.',
      'Tap the icon to cycle through the 4 playback modes:',
      '• Sequential (Straight arrows): Plays queue in order and stops at the end.',
      '• Loop All (Circular arrows): Replays the entire playlist continuously.',
      '• Repeat One (Circular arrows with "1"): Repeatedly replays the current song.',
      '• Shuffle Mode (Crossed arrows): Plays tracks in random order.'
    ],
    tips: 'The icon and color update immediately to indicate which mode is currently active.'
  },
  {
    id: 'faq-7',
    number: 7,
    question: 'Why some songs are not displayed?',
    summary: 'Newly added or copied music files might not have been indexed yet by Android MediaStore, or are excluded by a filter.',
    steps: [
      'Check format: Ensure your files are in supported formats (MP3, FLAC, WAV, M4A, AAC, OGG, OPUS).',
      'Check duration: Verify the song is not shorter than the threshold set in Settings > Filter Audio Files.',
      'Run a Media Scan: Open the left sidebar menu, tap "Scan Music", and run "Quick Scan" or "Deep Folder Scan" on your Download / Music folder.',
      'Check Storage Permission: Ensure Sonance has "Music and Audio" storage permission granted in Android Settings > Apps.'
    ],
    tips: 'After downloading new songs from browser or chat apps, running "Scan Music" will find them in seconds.'
  },
  {
    id: 'faq-8',
    number: 8,
    question: 'How to restore the deleted songs?',
    summary: 'Restoring accidentally removed tracks depends on whether you removed them from a playlist or deleted the file.',
    steps: [
      'Removed from Playlist: The song is still in your master library! Go to the "Songs" tab, tap the track menu (⋮), and choose "Add to Playlist".',
      'Hidden by Filter: Go to Settings > Filter Audio Files and uncheck the excluded folder or reduce the minimum duration filter.',
      'Deleted from Phone Storage: Open your phone’s built-in "Files" or "Gallery" app, tap "Trash / Recycle Bin", select the audio file, and tap "Restore".'
    ],
    tips: 'Sonance never permanently removes files from your SD card or internal storage without an explicit confirmation prompt.'
  },
  {
    id: 'faq-9',
    number: 9,
    question: 'No sound when using the 10-band equalizer?',
    summary: 'Silence or low volume usually occurs if preamp gain is set too low or frequency bands are all pulled down.',
    steps: [
      'Open the Equalizer by tapping the EQ icon on the player or in the sidebar.',
      'Check the Master Preamp slider on the left: if it is at -12 dB or -15 dB, drag it back to 0 dB.',
      'Check the 10 frequency faders (31Hz - 16kHz): if all sliders are at the bottom, sound will be completely silenced. Tap "Reset" or choose a preset (e.g. Rock, Pop, Flat).',
      'Toggle the Master ON/OFF power switch in the top-right corner to reset the WebAudio audio engine.',
      'If using Bluetooth headphones, check that your device media volume is turned up and not set to "Mute".'
    ],
    tips: 'Tap "Flat" or "Reset" inside the Equalizer to instantly return all 10 frequency bands to baseline 0 dB.'
  },
  {
    id: 'faq-10',
    number: 10,
    question: 'How to change themes or custom wallpaper?',
    summary: 'Personalize the player with luxury dark, AMOLED, floral gradients, or your own gallery photos.',
    steps: [
      'Open the left sidebar menu and tap "Themes & Wallpaper" (or tap Theme in Settings).',
      'Choose from curated themes: Dark AMOLED, Green Floral, Electric Violet, Sunset Glow, or Luxury Gold.',
      'Tap "Custom Wallpaper" to pick any photo from your phone’s gallery as the background.',
      'Adjust the wallpaper blur and opacity sliders for optimal text readability.'
    ],
    tips: 'The AMOLED pure black theme uses zero pixels on OLED screens to maximize your phone battery life.'
  },
  {
    id: 'faq-11',
    number: 11,
    question: 'How does the Sleep Timer work?',
    summary: 'Automatically stops music after you fall asleep so your phone battery does not drain overnight.',
    steps: [
      'Tap the Sleep Timer icon (Moon / Clock) on the Now Playing screen or in the sidebar.',
      'Choose a duration: 15 minutes, 30 minutes, 45 minutes, 60 minutes, or "End of Current Song".',
      'When the timer reaches zero, the player gently fades out the volume and pauses playback automatically.'
    ],
    tips: 'You can tap the Sleep Timer icon at any time to see the live remaining countdown or add extra time.'
  },
  {
    id: 'faq-12',
    number: 12,
    question: 'How to edit song tags and album artwork?',
    summary: 'Fix incorrect song titles, missing artist names, or blurry album covers.',
    steps: [
      'Locate the song in your library and tap the three dots (⋮) menu on the track card.',
      'Tap "Edit Artwork / Tags".',
      'Update the Title, Artist name, Album, or Genre.',
      'Tap "Upload from Device" to choose your own image from phone storage, or pick from our high-res curated album covers.',
      'Tap "Save Changes" to update the song display everywhere in the app.'
    ],
    tips: 'Edited metadata and custom artwork are saved locally to your device’s offline database.'
  }
];

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback?: () => void;
  accentColorHex?: string;
  nightMode?: boolean;
}

export const FaqModal: React.FC<FaqModalProps> = ({
  isOpen,
  onClose,
  onOpenFeedback,
  accentColorHex = '#f5b731',
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  if (!isOpen) return null;

  const filteredFaqs = FAQ_DATA.filter((faq) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      faq.question.toLowerCase().includes(query) ||
      faq.summary.toLowerCase().includes(query) ||
      faq.steps.some((step) => step.toLowerCase().includes(query))
    );
  });

  return (
    <div
      id="faq-screen"
      className="fixed inset-0 z-60 flex flex-col bg-black/85 backdrop-blur-md text-white animate-in fade-in duration-200"
    >
      {/* Top App Bar matching screenshot */}
      <div className="pt-safe px-4 py-3 flex items-center justify-between border-b border-white/10 shrink-0 bg-black/40">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-white">FAQ</h1>
        </div>

        <button
          onClick={() => {
            setShowSearch(!showSearch);
            if (showSearch) setSearchQuery('');
          }}
          className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          aria-label="Search FAQs"
        >
          {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
        </button>
      </div>

      {/* Optional Search Bar */}
      {showSearch && (
        <div className="px-4 py-2 bg-black/60 border-b border-white/10 shrink-0 animate-in slide-in-from-top-2 duration-150">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search FAQ questions & solutions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 rounded-xl text-sm bg-white/10 border border-white/15 text-white placeholder-zinc-400 outline-none focus:border-amber-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main FAQ List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-28 scrollbar-thin scrollbar-thumb-zinc-700">
        {filteredFaqs.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 space-y-2">
            <HelpCircle className="w-10 h-10 mx-auto opacity-40 text-amber-400" />
            <p className="text-sm">No solutions matched "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-amber-400 underline cursor-pointer mt-1"
            >
              Show all FAQs
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-2xl transition-all duration-200 overflow-hidden border ${
                  isExpanded
                    ? 'bg-zinc-900/90 border-white/20 shadow-xl'
                    : 'bg-white/10 hover:bg-white/15 border-white/10 shadow-sm'
                } backdrop-blur-md`}
              >
                {/* Header row with Question number, text, and chevron */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                  className="w-full text-left p-4 sm:p-4.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <p className="text-[15px] sm:text-base font-semibold text-white leading-snug tracking-tight">
                    {faq.number}. {faq.question}
                  </p>
                  <div
                    className={`shrink-0 transition-transform duration-200 text-zinc-300 ${
                      isExpanded ? 'rotate-180 text-amber-400' : ''
                    }`}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>

                {/* Expanded Solution View */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/10 text-xs sm:text-sm animate-in fade-in duration-150">
                    {/* Summary */}
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-zinc-300 leading-relaxed">
                      <p>{faq.summary}</p>
                    </div>

                    {/* Step-by-Step Solution */}
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Recommended Solution:</span>
                      </div>
                      <ol className="space-y-1.5 text-zinc-200 leading-relaxed list-inside">
                        {faq.steps.map((step, idx) => (
                          <li key={idx} className="pl-1">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Pro Tip */}
                    {faq.tips && (
                      <div className="px-3 py-2 rounded-lg bg-white/5 text-[11px] text-zinc-400 border border-white/5">
                        <span className="font-semibold text-zinc-300">Tip: </span>
                        {faq.tips}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Sticky Action Bar with Send Feedback Button matching screenshot */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center justify-center z-20">
        <button
          onClick={() => {
            if (onOpenFeedback) {
              onOpenFeedback();
            } else {
              onClose();
            }
          }}
          className="w-full max-w-md py-3.5 px-6 rounded-full font-bold text-base shadow-xl transition-transform active:scale-98 cursor-pointer flex items-center justify-center text-zinc-950 hover:brightness-105"
          style={{
            backgroundColor: '#f5b731',
            color: '#18181b',
          }}
        >
          Send Feedback
        </button>
      </div>
    </div>
  );
};
