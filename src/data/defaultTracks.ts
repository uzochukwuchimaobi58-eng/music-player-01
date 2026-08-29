import { Track, Playlist } from '../types';

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'phone-track-1',
    title: 'TION SICKNESS (Remix)',
    artist: 'ODUMODUBLVCK ft. Fireboy',
    album: 'EZIOKWU (Uncut)',
    duration: 214,
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    coverArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
    folder: '/storage/emulated/0/Music',
    isFavorite: true,
    playCount: 142,
    dateAdded: Date.now() - 86400000 * 2,
    lastPlayed: Date.now() - 3600000 * 3,
    isOffline: true,
    bitrate: '320 kbps (Hi-Fi)',
    sampleRate: '48.0 kHz',
    fileSize: '8.4 MB',
    sourceType: 'built-in',
    lyrics: `[00:10.00] Yeah, we pulling up on high frequency
[00:18.00] Bass vibrating through the whole city
[00:25.00] No distraction when the beat hits right
[00:32.00] We taking over through the neon night
[00:40.00] Eziokwu, tell 'em nothing but the truth
[00:52.00] From the studio straight down to the booth
[01:05.00] Heavy drum kicks, feel the sub-bass roll
[01:20.00] Music that takes full control of your soul
[01:40.00] Keep the rhythm running offline or live
[02:00.00] High fidelity vibes, feel the drive`
  },
  {
    id: 'phone-track-2',
    title: 'Midnight City Lights',
    artist: 'Aetheria Wave',
    album: 'Synthetic Dreams',
    duration: 185,
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=electronic-future-beats-117997.mp3',
    coverArt: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80',
    folder: '/storage/emulated/0/Download',
    isFavorite: true,
    playCount: 98,
    dateAdded: Date.now() - 86400000 * 5,
    lastPlayed: Date.now() - 3600000 * 12,
    isOffline: true,
    bitrate: 'Lossless FLAC 24-bit',
    sampleRate: '96.0 kHz',
    fileSize: '24.2 MB',
    sourceType: 'built-in',
    lyrics: `[00:08.00] Neon reflections on wet pavement
[00:22.00] Echoes of analog synthesizers in the dark
[00:36.00] Running down the endless boulevard
[00:50.00] Glowing circuits pulse within the heart
[01:15.00] Electric highway taking us away
[01:35.00] Chasing the horizon till the break of day`
  },
  {
    id: 'phone-track-3',
    title: 'Warm Velvet Chill',
    artist: 'Komorebi Sound',
    album: 'Coffee & Rain',
    duration: 160,
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-abstract-intention-12099.mp3',
    coverArt: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80',
    folder: '/storage/emulated/0/Music',
    isFavorite: false,
    playCount: 67,
    dateAdded: Date.now() - 86400000 * 8,
    lastPlayed: Date.now() - 86400000 * 1,
    isOffline: true,
    bitrate: '320 kbps',
    sampleRate: '44.1 kHz',
    fileSize: '6.1 MB',
    sourceType: 'built-in',
    lyrics: `[00:15.00] Raindrops tapping gently against the glass
[00:30.00] Warm cup in hand watching shadows pass
[00:55.00] Lo-fi beats winding down the slow afternoon
[01:20.00] Calming melodies beneath a cloudy moon`
  },
  {
    id: 'phone-track-4',
    title: 'Ethereal Horizons (Piano & Cello)',
    artist: 'Julian Vance & Orchestra',
    album: 'Acoustic Sanctuary',
    duration: 242,
    url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_73138b3017.mp3?filename=cinematic-time-lapse-115672.mp3',
    coverArt: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500&auto=format&fit=crop&q=80',
    folder: '/storage/emulated/0/Podcasts',
    isFavorite: true,
    playCount: 110,
    dateAdded: Date.now() - 86400000 * 12,
    lastPlayed: Date.now() - 86400000 * 2,
    isOffline: true,
    bitrate: 'Lossless FLAC',
    sampleRate: '96.0 kHz',
    fileSize: '31.5 MB',
    sourceType: 'built-in',
    lyrics: `[00:20.00] Instrumental piece with deep emotional resonance
[01:00.00] Strings swell into grand harmonies
[01:45.00] Solo piano keys resonating peacefully
[02:10.00] Gentle cello fading into silence`
  },
  {
    id: 'phone-track-5',
    title: 'Cyber Bass Ignition',
    artist: 'Sub Zero X',
    album: 'Overdrive Protocol',
    duration: 198,
    url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=tuesday-glitch-future-bass-122941.mp3',
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    folder: '/storage/emulated/0/Download',
    isFavorite: false,
    playCount: 84,
    dateAdded: Date.now() - 86400000 * 15,
    lastPlayed: Date.now() - 86400000 * 4,
    isOffline: true,
    bitrate: '320 kbps (Hi-Fi)',
    sampleRate: '48.0 kHz',
    fileSize: '7.8 MB',
    sourceType: 'built-in',
    lyrics: `[00:12.00] Drop the frequency to 30 Hertz
[00:28.00] Feel the subwoofers engage
[00:45.00] Maximum power output initiated
[01:10.00] Pure electronic energy in sync`
  },
  {
    id: 'phone-track-6',
    title: 'Golden Sunset Grooves',
    artist: 'Sol Tropical',
    album: 'Breeze & Rhythm',
    duration: 172,
    url: 'https://cdn.pixabay.com/download/audio/2022/01/26/audio_d0c6ff1101.mp3?filename=watr-fluid-10149.mp3',
    coverArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
    folder: '/storage/emulated/0/WhatsApp/Media/Audio',
    isFavorite: true,
    playCount: 153,
    dateAdded: Date.now() - 86400000 * 20,
    lastPlayed: Date.now() - 3600000 * 1,
    isOffline: true,
    bitrate: '320 kbps',
    sampleRate: '44.1 kHz',
    fileSize: '6.7 MB',
    sourceType: 'built-in',
    lyrics: `[00:10.00] Waves touching the golden shore
[00:25.00] Tropical drums making you want more
[00:40.00] Warm breeze under palm tree shades
[01:05.00] Memories that never fade`
  },
  {
    id: 'phone-track-7',
    title: 'Deep Ocean Resonator',
    artist: 'Nautilus Audio Lab',
    album: 'Hydrophonics Vol. 1',
    duration: 220,
    url: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_c35f25dae8.mp3?filename=ambient-piano-amp-strings-10711.mp3',
    coverArt: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&auto=format&fit=crop&q=80',
    folder: '/storage/emulated/0/Recordings',
    isFavorite: false,
    playCount: 42,
    dateAdded: Date.now() - 86400000 * 25,
    lastPlayed: Date.now() - 86400000 * 5,
    isOffline: true,
    bitrate: '320 kbps',
    sampleRate: '44.1 kHz',
    fileSize: '8.2 MB',
    sourceType: 'built-in',
    lyrics: `[00:15.00] Submerged beneath the crystal tide
[00:35.00] Resonating depths where mysteries hide
[01:10.00] Hydrophonic pulses drifting free
[01:45.00] Endless calm across the deep blue sea`
  },
  {
    id: 'phone-track-8',
    title: 'Afrobeat Anthem (Live Groove)',
    artist: 'Lagos Sound System',
    album: 'Mainland Frequency',
    duration: 205,
    url: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3?filename=tropical-summer-music-11281.mp3',
    coverArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=80',
    folder: '/storage/emulated/0/Bluetooth',
    isFavorite: true,
    playCount: 189,
    dateAdded: Date.now() - 86400000 * 30,
    lastPlayed: Date.now() - 1800000,
    isOffline: true,
    bitrate: '320 kbps (Hi-Fi)',
    sampleRate: '48.0 kHz',
    fileSize: '7.9 MB',
    sourceType: 'built-in',
    lyrics: `[00:12.00] Horns section blasting through the street
[00:24.00] Everybody moving to the high-tempo beat
[00:48.00] Con gas rolling, bass guitar on fire
[01:12.00] Taking the vibration higher and higher`
  }
];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'playlist-default',
    name: 'Default list',
    color: 'from-sky-500 to-indigo-600',
    trackIds: ['phone-track-1', 'phone-track-2', 'phone-track-6', 'phone-track-8'],
    createdAt: Date.now() - 86400000 * 10,
    isDefault: true
  },
  {
    id: 'playlist-workout',
    name: 'Gym & High Energy',
    color: 'from-amber-500 to-red-600',
    trackIds: ['phone-track-1', 'phone-track-5', 'phone-track-8'],
    createdAt: Date.now() - 86400000 * 7
  },
  {
    id: 'playlist-chill',
    name: 'Deep Focus & Study',
    color: 'from-emerald-500 to-teal-700',
    trackIds: ['phone-track-3', 'phone-track-4', 'phone-track-7'],
    createdAt: Date.now() - 86400000 * 4
  }
];

export const EQ_FREQUENCIES = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

export const EQ_PRESET_MAP: Record<string, { [freq: number]: number }> = {
  'Flat': { 60: 0, 170: 0, 310: 0, 600: 0, 1000: 0, 3000: 0, 6000: 0, 12000: 0, 14000: 0, 16000: 0 },
  'Bass Boost': { 60: 8, 170: 6, 310: 4, 600: 1, 1000: 0, 3000: -1, 6000: -1, 12000: 0, 14000: 1, 16000: 2 },
  'Vocal Booster': { 60: -2, 170: -1, 310: 2, 600: 4, 1000: 6, 3000: 5, 6000: 3, 12000: 1, 14000: 0, 16000: -1 },
  'Rock': { 60: 5, 170: 4, 310: 2, 600: -1, 1000: -2, 3000: 2, 6000: 4, 12000: 6, 14000: 5, 16000: 4 },
  'Electronic': { 60: 7, 170: 5, 310: 1, 600: 0, 1000: 2, 3000: 4, 6000: 5, 12000: 7, 14000: 6, 16000: 5 },
  'Jazz': { 60: 3, 170: 2, 310: 1, 600: 2, 1000: -1, 3000: -1, 6000: 1, 12000: 3, 14000: 4, 16000: 3 },
  'Acoustic': { 60: 4, 170: 3, 310: 2, 600: 1, 1000: 2, 3000: 3, 6000: 4, 12000: 5, 14000: 4, 16000: 3 },
  'Hi-Fi Master': { 60: 4, 170: 2, 310: 1, 600: 0, 1000: 1, 3000: 2, 6000: 3, 12000: 4, 14000: 5, 16000: 5 },
  'Custom': { 60: 0, 170: 0, 310: 0, 600: 0, 1000: 0, 3000: 0, 6000: 0, 12000: 0, 14000: 0, 16000: 0 },
};
