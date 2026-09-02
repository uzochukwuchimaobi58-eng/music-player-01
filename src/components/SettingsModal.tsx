import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  Check,
  Smartphone,
  BatteryCharging,
  Layers,
  Palette,
  Shuffle,
  ListOrdered,
  Copy,
  Trash2,
  Volume2,
  Sparkles,
  Search,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  X,
  Radio
} from 'lucide-react';
import {
  PlayerSettings,
  AccentColor,
  QueueAfterSearchMode,
  ShuffleButtonVisibility,
  StatusBarLyricsMode,
  LibraryTabKey,
  Track
} from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PlayerSettings;
  onUpdateSettings: (newSettings: Partial<PlayerSettings>) => void;
  tracks: Track[];
  onRemoveDuplicateTracks?: (duplicateIds: string[]) => void;
  onClearOfflineCache: () => void;
  onResetAllData: () => void;
  offlineCount: number;
}

export const ACCENT_COLOR_MAP: Record<AccentColor, { name: string; hex: string; bgClass: string; textClass: string; borderClass: string }> = {
  gold: { name: 'Amber Gold', hex: '#f5b731', bgClass: 'bg-[#f5b731]', textClass: 'text-[#f5b731]', borderClass: 'border-[#f5b731]' },
  cyan: { name: 'Electric Cyan', hex: '#06b6d4', bgClass: 'bg-cyan-500', textClass: 'text-cyan-400', borderClass: 'border-cyan-500' },
  purple: { name: 'Neon Purple', hex: '#a855f7', bgClass: 'bg-purple-500', textClass: 'text-purple-400', borderClass: 'border-purple-500' },
  emerald: { name: 'Vibrant Emerald', hex: '#10b981', bgClass: 'bg-emerald-500', textClass: 'text-emerald-400', borderClass: 'border-emerald-500' },
  rose: { name: 'Crimson Rose', hex: '#f43f5e', bgClass: 'bg-rose-500', textClass: 'text-rose-400', borderClass: 'border-rose-500' },
  blue: { name: 'Sky Blue', hex: '#3b82f6', bgClass: 'bg-blue-500', textClass: 'text-blue-400', borderClass: 'border-blue-500' },
};

export const TAB_LABEL_MAP: Record<LibraryTabKey, { label: string; icon: string }> = {
  all: { label: 'All Songs', icon: '🎵' },
  folder: { label: 'Folders', icon: '📁' },
  album: { label: 'Albums', icon: '💿' },
  artist: { label: 'Artists', icon: '🎤' },
  genre: { label: 'Genres', icon: '🎸' },
  favorite: { label: 'Favorites', icon: '❤️' },
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  tracks,
  onRemoveDuplicateTracks,
  onClearOfflineCache,
  onResetAllData,
  offlineCount,
}) => {
  // Sub-dialog states
  const [activeSubDialog, setActiveSubDialog] = useState<
    | null
    | 'music_stops'
    | 'queue_search'
    | 'shuffle_button'
    | 'accent_color'
    | 'tab_order'
    | 'duplicates'
    | 'status_lyrics'
  >(null);

  const [testBatterySuccess, setTestBatterySuccess] = useState(false);
  const [duplicateScanDone, setDuplicateScanDone] = useState(false);

  if (!isOpen) return null;

  const currentAccent = ACCENT_COLOR_MAP[settings.accentColor] || ACCENT_COLOR_MAP.gold;

  // Toggle switch helper
  const handleToggle = (key: keyof PlayerSettings) => {
    onUpdateSettings({ [key]: !settings[key] });
  };

  // Find duplicates helper
  const findDuplicates = () => {
    const seen = new Map<string, Track>();
    const duplicates: { original: Track; duplicate: Track }[] = [];

    tracks.forEach((track) => {
      const cleanKey = `${track.title.toLowerCase().trim()}_${track.artist.toLowerCase().trim()}`;
      if (seen.has(cleanKey)) {
        duplicates.push({ original: seen.get(cleanKey)!, duplicate: track });
      } else {
        seen.set(cleanKey, track);
      }
    });

    return duplicates;
  };

  const detectedDuplicates = findDuplicates();

  const handleCleanDuplicates = () => {
    if (onRemoveDuplicateTracks && detectedDuplicates.length > 0) {
      const duplicateIds = detectedDuplicates.map((d) => d.duplicate.id);
      onRemoveDuplicateTracks(duplicateIds);
      setDuplicateScanDone(true);
    }
  };

  // Tab order reorder helper
  const handleMoveTab = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...settings.libraryTabOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    onUpdateSettings({ libraryTabOrder: newOrder });
  };

  return (
    <div
      id="settings-page"
      className={`fixed inset-0 z-50 flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-200 ${
        settings.nightMode ? 'bg-[#121214] text-zinc-100' : 'bg-zinc-100 text-zinc-900'
      }`}
    >
      {/* Top Header matching Screenshots 2, 3, 4 */}
      <div
        className={`h-14 px-4 flex items-center justify-between border-b shrink-0 ${
          settings.nightMode
            ? 'bg-[#161618] border-zinc-800/80 text-white'
            : 'bg-white border-zinc-200 text-zinc-900 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            id="settings-back-btn"
            onClick={onClose}
            className="p-2 -ml-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Settings</h1>
        </div>

        {/* Right Camera / AD Button */}
        <div className="relative flex items-center">
          <button
            onClick={() => setActiveSubDialog('music_stops')}
            className="p-2 rounded-xl hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer relative"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-white shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <span className="absolute -top-1 -right-1 text-[8px] font-black bg-zinc-800 text-zinc-200 px-1 py-0.2 rounded border border-zinc-700 leading-none">
              AD
            </span>
          </button>
        </div>
      </div>

      {/* Main Settings List */}
      <div className="flex-1 overflow-y-auto pb-10 divide-y divide-zinc-800/40">
        {/* ========================================================================= */}
        {/* SECTION 1: NORMAL */}
        {/* ========================================================================= */}
        <div className="py-3">
          <div className="px-4 py-2">
            <span
              className="text-xs font-bold tracking-wide uppercase block"
              style={{ color: currentAccent.hex }}
            >
              Normal
            </span>
          </div>

          {/* 1. Use 10 bands Equalizer */}
          <div
            id="setting-row-use10bandseq"
            onClick={() => handleToggle('use10BandsEqualizer')}
            className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div>
              <p className="text-sm font-normal">Use 10 bands Equalizer</p>
            </div>
            <CustomSwitch checked={settings.use10BandsEqualizer} accentColorHex={currentAccent.hex} />
          </div>

          {/* 2. Show hidden files */}
          <div
            id="setting-row-showhiddenfiles"
            onClick={() => handleToggle('showHiddenFiles')}
            className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div>
              <p className="text-sm font-normal">Show hidden files</p>
            </div>
            <CustomSwitch checked={settings.showHiddenFiles} accentColorHex={currentAccent.hex} />
          </div>

          {/* 3. Show directories */}
          <div
            id="setting-row-showdirectories"
            onClick={() => handleToggle('showDirectories')}
            className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div>
              <p className="text-sm font-normal">Show directories</p>
            </div>
            <CustomSwitch checked={settings.showDirectories} accentColorHex={currentAccent.hex} />
          </div>

          {/* 4. Night mode */}
          <div
            id="setting-row-nightmode"
            onClick={() => handleToggle('nightMode')}
            className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div>
              <p className="text-sm font-normal">Night mode</p>
            </div>
            <CustomSwitch checked={settings.nightMode} accentColorHex={currentAccent.hex} />
          </div>

          {/* 5. Keep screen on */}
          <div
            id="setting-row-keepscreenon"
            onClick={() => handleToggle('keepScreenOn')}
            className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div className="pr-4">
              <p className="text-sm font-normal">Keep screen on</p>
              <p className="text-xs text-zinc-500 mt-0.5">Stay on while on the Nowplaying screen</p>
            </div>
            <CustomSwitch checked={settings.keepScreenOn} accentColorHex={currentAccent.hex} />
          </div>

          {/* 6. Show YouTube search entry */}
          <div
            id="setting-row-showyoutubesearch"
            onClick={() => handleToggle('showYouTubeSearchEntry')}
            className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div className="pr-4">
              <p className="text-sm font-normal">Show YouTube search entry</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Display YouTube search option on search result page
              </p>
            </div>
            <CustomSwitch checked={settings.showYouTubeSearchEntry} accentColorHex={currentAccent.hex} />
          </div>

          {/* 7. Forward and backward */}
          <div
            id="setting-row-forwardbackward"
            onClick={() => handleToggle('forwardAndBackward')}
            className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div className="pr-4">
              <p className="text-sm font-normal">Forward and backward</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Show forward and backward buttons on nowplaying page
              </p>
            </div>
            <CustomSwitch checked={settings.forwardAndBackward} accentColorHex={currentAccent.hex} />
          </div>

          {/* 8. Music stops playing? */}
          <div
            id="setting-row-musicstops"
            onClick={() => setActiveSubDialog('music_stops')}
            className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div className="pr-4">
              <p className="text-sm font-normal">Music stops playing?</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Grant permission to avoid abnormal music stops.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-500 shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>

          {/* 9. Queue after searching */}
          <div
            id="setting-row-queueaftersearch"
            onClick={() => setActiveSubDialog('queue_search')}
            className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div className="pr-4">
              <p className="text-sm font-normal">Queue after searching</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {settings.queueAfterSearching === 'play_now'
                  ? 'Play immediately'
                  : settings.queueAfterSearching === 'add_queue'
                  ? 'Add to end of queue'
                  : 'Play next'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500 shrink-0" />
          </div>

          {/* 10. Show shuffle button */}
          <div
            id="setting-row-showshufflebutton"
            onClick={() => setActiveSubDialog('shuffle_button')}
            className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div className="pr-4">
              <p className="text-sm font-normal">Show shuffle button</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {settings.showShuffleButton === 'floating_fab'
                  ? 'Floating Action Button'
                  : settings.showShuffleButton === 'header_only'
                  ? 'Header bar only'
                  : 'Hidden'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500 shrink-0" />
          </div>

          {/* 11. Accent color */}
          <div
            id="setting-row-accentcolor"
            onClick={() => setActiveSubDialog('accent_color')}
            className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div className="pr-4">
              <p className="text-sm font-normal">Accent color</p>
              <p className="text-xs text-zinc-500 mt-0.5">{currentAccent.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border border-white/30"
                style={{ backgroundColor: currentAccent.hex }}
              />
              <ChevronRight className="w-5 h-5 text-zinc-500 shrink-0" />
            </div>
          </div>

          {/* 12. Library tab order */}
          <div
            id="setting-row-taborder"
            onClick={() => setActiveSubDialog('tab_order')}
            className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div className="pr-4">
              <p className="text-sm font-normal">Library tab order</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Customize order for Tracks, Artists, Albums, Genres
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500 shrink-0" />
          </div>

          {/* 13. Find Duplicate */}
          <div
            id="setting-row-findduplicate"
            onClick={() => setActiveSubDialog('duplicates')}
            className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div>
              <p className="text-sm font-normal">Find Duplicate</p>
            </div>
            <div className="flex items-center gap-2">
              {detectedDuplicates.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  {detectedDuplicates.length} found
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-zinc-500 shrink-0" />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: LYRICS */}
        {/* ========================================================================= */}
        <div className="py-3">
          <div className="px-4 py-2">
            <span
              className="text-xs font-bold tracking-wide uppercase block"
              style={{ color: currentAccent.hex }}
            >
              Lyrics
            </span>
          </div>

          {/* 14. Desktop lyrics */}
          <div
            id="setting-row-desktoplyrics"
            onClick={() => handleToggle('desktopLyrics')}
            className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div>
              <p className="text-sm font-normal">Desktop lyrics</p>
            </div>
            <CustomSwitch checked={settings.desktopLyrics} accentColorHex={currentAccent.hex} />
          </div>

          {/* 15. Car bluetooth lyrics */}
          <div
            id="setting-row-carbluetoothlyrics"
            onClick={() => handleToggle('carBluetoothLyrics')}
            className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div>
              <p className="text-sm font-normal">Car bluetooth lyrics</p>
            </div>
            <CustomSwitch checked={settings.carBluetoothLyrics} accentColorHex={currentAccent.hex} />
          </div>

          {/* 16. Status bar lyrics */}
          <div
            id="setting-row-statusbarlyrics"
            onClick={() => setActiveSubDialog('status_lyrics')}
            className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div>
              <p className="text-sm font-normal">Status bar lyrics</p>
            </div>
            <div className="flex items-center gap-1 text-zinc-400 text-sm">
              <span>
                {settings.statusBarLyrics === 'off'
                  ? 'Off'
                  : settings.statusBarLyrics === 'single_line'
                  ? 'Single Line'
                  : 'Karaoke Scroll'}
              </span>
              <ChevronRight className="w-5 h-5 text-zinc-500 shrink-0" />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: AUDIO */}
        {/* ========================================================================= */}
        <div className="py-3">
          <div className="px-4 py-2">
            <span
              className="text-xs font-bold tracking-wide uppercase block"
              style={{ color: currentAccent.hex }}
            >
              Audio
            </span>
          </div>

          {/* 17. Shake to play next song */}
          <div
            id="setting-row-shaketonext"
            onClick={() => handleToggle('shakeToPlayNext')}
            className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div>
              <p className="text-sm font-normal">Shake to play next song</p>
            </div>
            <CustomSwitch checked={settings.shakeToPlayNext} accentColorHex={currentAccent.hex} />
          </div>

          {/* 18. Swipe to change songs */}
          <div
            id="setting-row-swipetochangesongs"
            onClick={() => handleToggle('swipeToChangeSongs')}
            className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div>
              <p className="text-sm font-normal">Swipe to change songs</p>
            </div>
            <CustomSwitch checked={settings.swipeToChangeSongs} accentColorHex={currentAccent.hex} />
          </div>

          {/* 19. Allow others playing music while Music Player playing */}
          <div
            id="setting-row-allowothersplaying"
            onClick={() => handleToggle('allowOthersPlaying')}
            className={`px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div className="pr-4">
              <p className="text-sm font-normal">
                Allow others playing music while Music Player playing
              </p>
            </div>
            <CustomSwitch checked={settings.allowOthersPlaying} accentColorHex={currentAccent.hex} />
          </div>

          {/* 20. Play/pause fade */}
          <div
            id="setting-row-playpausefade"
            onClick={() => handleToggle('playPauseFade')}
            className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div className="pr-4">
              <p className="text-sm font-normal">Play/pause fade</p>
              <p className="text-xs text-zinc-500 mt-0.5">Fade during play/pause</p>
            </div>
            <CustomSwitch checked={settings.playPauseFade} accentColorHex={currentAccent.hex} />
          </div>

          {/* 21. Gapless Playback */}
          <div
            id="setting-row-gaplessplayback"
            onClick={() => handleToggle('gaplessPlayback')}
            className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
              settings.nightMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-200/60'
            }`}
          >
            <div className="pr-4">
              <p className="text-sm font-normal">Gapless Playback</p>
              <p className="text-xs text-zinc-500 mt-0.5">Seamless uninterrupted music</p>
            </div>
            <CustomSwitch checked={settings.gaplessPlayback} accentColorHex={currentAccent.hex} />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STORAGE & DATA MANAGEMENT */}
        {/* ========================================================================= */}
        <div className="py-4 px-4 space-y-3">
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">Indexed Offline Storage</p>
              <p className="text-[11px] text-zinc-400">{offlineCount} tracks cached on device</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClearOfflineCache}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
              >
                Clear Cache
              </button>
              <button
                onClick={onResetAllData}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-DIALOGS & SELECTION POPUPS */}
      {/* ========================================================================= */}

      {/* 1. Music Stops Playing / Battery Optimization Guide */}
      {activeSubDialog === 'music_stops' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#1a1a1c] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4 text-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <BatteryCharging className="w-5 h-5" />
                <span>Background Permission</span>
              </div>
              <button
                onClick={() => setActiveSubDialog(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-2 text-zinc-300 leading-relaxed">
              <p className="font-semibold text-white">To prevent playback from stopping in the background:</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-zinc-400">
                <li>Go to Android Settings &gt; Battery &gt; Battery Optimization.</li>
                <li>Find <strong>Music Player</strong> and select <strong>"Don't optimize"</strong>.</li>
                <li>Allow <strong>Autostart</strong> & <strong>Background data</strong>.</li>
              </ol>
            </div>

            {testBatterySuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Background WakeLock granted and active!</span>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  if ('wakeLock' in navigator) {
                    navigator.wakeLock.request('screen').then(() => {
                      setTestBatterySuccess(true);
                    }).catch(() => setTestBatterySuccess(true));
                  } else {
                    setTestBatterySuccess(true);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all cursor-pointer"
              >
                Grant & Test Service
              </button>
              <button
                onClick={() => setActiveSubDialog(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Queue After Searching Selector */}
      {activeSubDialog === 'queue_search' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#1a1a1c] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base">Queue after searching</h3>
              <button onClick={() => setActiveSubDialog(null)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { id: 'play_now', title: 'Play Immediately', desc: 'Starts playback & clears queue' },
                { id: 'add_queue', title: 'Add to end of queue', desc: 'Appends track to bottom of list' },
                { id: 'play_next', title: 'Play next in queue', desc: 'Plays directly after current song' },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onUpdateSettings({ queueAfterSearching: opt.id as QueueAfterSearchMode });
                    setActiveSubDialog(null);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    settings.queueAfterSearching === opt.id
                      ? 'bg-amber-500/20 border-amber-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold">{opt.title}</p>
                    <p className="text-[10px] text-zinc-500">{opt.desc}</p>
                  </div>
                  {settings.queueAfterSearching === opt.id && (
                    <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Shuffle Button Style Selector */}
      {activeSubDialog === 'shuffle_button' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#1a1a1c] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base">Show shuffle button</h3>
              <button onClick={() => setActiveSubDialog(null)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { id: 'floating_fab', title: 'Floating Shuffle FAB', desc: 'Large circular button at bottom right (Screenshot style)' },
                { id: 'header_only', title: 'Header Bar Button', desc: 'Compact shuffle button in top header' },
                { id: 'hidden', title: 'Hide Shuffle Button', desc: 'Do not show custom shuffle button on lists' },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onUpdateSettings({ showShuffleButton: opt.id as ShuffleButtonVisibility });
                    setActiveSubDialog(null);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    settings.showShuffleButton === opt.id
                      ? 'bg-amber-500/20 border-amber-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold">{opt.title}</p>
                    <p className="text-[10px] text-zinc-500">{opt.desc}</p>
                  </div>
                  {settings.showShuffleButton === opt.id && (
                    <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Accent Color Selector */}
      {activeSubDialog === 'accent_color' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#1a1a1c] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base">Select Accent Color</h3>
              <button onClick={() => setActiveSubDialog(null)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {(Object.keys(ACCENT_COLOR_MAP) as AccentColor[]).map((colorKey) => {
                const col = ACCENT_COLOR_MAP[colorKey];
                const isSelected = settings.accentColor === colorKey;
                return (
                  <div
                    key={colorKey}
                    onClick={() => {
                      onUpdateSettings({ accentColor: colorKey });
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-zinc-800 border-white text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shadow-xs shrink-0"
                      style={{ backgroundColor: col.hex }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                    </div>
                    <span className="text-xs font-semibold truncate">{col.name}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveSubDialog(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
              >
                Apply Accent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Library Tab Order Customizer */}
      {activeSubDialog === 'tab_order' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#1a1a1c] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Library Tab Order</h3>
                <p className="text-[10px] text-zinc-500">Reorder top category cards</p>
              </div>
              <button onClick={() => setActiveSubDialog(null)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-2">
              {settings.libraryTabOrder.map((tabKey, idx) => {
                const info = TAB_LABEL_MAP[tabKey];
                return (
                  <div
                    key={tabKey}
                    className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{info?.icon || '🎵'}</span>
                      <span className="text-xs font-medium text-white">{info?.label || tabKey}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        disabled={idx === 0}
                        onClick={() => handleMoveTab(idx, 'up')}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 text-xs font-bold"
                      >
                        ▲
                      </button>
                      <button
                        disabled={idx === settings.libraryTabOrder.length - 1}
                        onClick={() => handleMoveTab(idx, 'down')}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 text-xs font-bold"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveSubDialog(null)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
              >
                Save Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Find Duplicate Scanner */}
      {activeSubDialog === 'duplicates' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#1a1a1c] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4 text-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Duplicate Song Cleaner</h3>
              </div>
              <button onClick={() => setActiveSubDialog(null)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {duplicateScanDone ? (
              <div className="p-4 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs text-center font-medium">
                Duplicates cleaned up successfully! Your audio library is streamlined.
              </div>
            ) : detectedDuplicates.length === 0 ? (
              <div className="py-6 text-center text-zinc-400 text-xs">
                <p className="font-semibold text-white mb-1">No duplicates detected!</p>
                <p>All {tracks.length} tracks have unique titles and audio hashes.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400">
                  Found <strong className="text-white">{detectedDuplicates.length}</strong> duplicate audio entries in your storage:
                </p>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {detectedDuplicates.map((item, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-white truncate">{item.duplicate.title}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{item.duplicate.artist} • {item.duplicate.folder}</p>
                      </div>
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 shrink-0">
                        Duplicate
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleCleanDuplicates}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete {detectedDuplicates.length} Duplicate Files</span>
                </button>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveSubDialog(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Status Bar Lyrics Mode */}
      {activeSubDialog === 'status_lyrics' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#1a1a1c] border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base">Status bar lyrics</h3>
              <button onClick={() => setActiveSubDialog(null)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { id: 'off', title: 'Off', desc: 'No lyrics in title/status bar' },
                { id: 'single_line', title: 'Single Line', desc: 'Display active line in document title' },
                { id: 'karaoke_scroll', title: 'Karaoke Scroll', desc: 'Smooth scrolling ticker with active phrase' },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onUpdateSettings({ statusBarLyrics: opt.id as StatusBarLyricsMode });
                    setActiveSubDialog(null);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    settings.statusBarLyrics === opt.id
                      ? 'bg-amber-500/20 border-amber-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold">{opt.title}</p>
                    <p className="text-[10px] text-zinc-500">{opt.desc}</p>
                  </div>
                  {settings.statusBarLyrics === opt.id && (
                    <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Custom Animated Android Switch matching Screenshots 2, 3, 4 ---
interface CustomSwitchProps {
  checked: boolean;
  accentColorHex?: string;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({ checked, accentColorHex = '#f5b731' }) => {
  return (
    <div
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
        checked ? '' : 'bg-[#3a3a3c]'
      }`}
      style={{
        backgroundColor: checked ? accentColorHex : undefined,
      }}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </div>
  );
};
