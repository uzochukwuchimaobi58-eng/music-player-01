import { Capacitor } from '@capacitor/core';
import { EqualizerSettings, Track } from '../types';
import { EQ_FREQUENCIES } from '../data/defaultTracks';
import { MusicLibrary } from '../plugins/MusicLibrary';

export type TrendingAudioEffect = 'normal' | 'sped_up' | 'slowed_reverb' | 'nightcore' | 'bass_drop' | 'lofi_tape';

class AudioEngineService {
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private preampGain: GainNode | null = null;
  private eqFilters: { [freq: number]: BiquadFilterNode } = {};
  private bassFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Active trending effect mode
  private activeEffect: TrendingAudioEffect = 'normal';
  private isKaraokeMode: boolean = false;
  private isInitialized = false;

  // Native Playback Management
  private isNative: boolean = false;
  private nativeListenersSetup: boolean = false;
  private timeUpdateListeners: Set<(currentTime: number, duration: number) => void> = new Set();
  private stateChangeListeners: Set<(isPlaying: boolean) => void> = new Set();
  private trackEndListeners: Set<() => void> = new Set();
  private trackAutoAdvancedListeners: Set<(event: { id: string; index: number; title: string; artist: string }) => void> = new Set();
  private lastCurrentTime: number = 0;
  private lastDuration: number = 0;

  // Safe parameter ramping to completely eliminate audio clicks/crackles
  private rampParam(param: AudioParam | null | undefined, target: number, duration: number = 0.04) {
    if (!param || !this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      param.cancelScheduledValues(now);
      param.setValueAtTime(param.value, now);
      param.linearRampToValueAtTime(target, now + duration);
    } catch {
      try {
        param.value = target;
      } catch {
        // ignore
      }
    }
  }

  public init() {
    if (this.isInitialized) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      this.audioElement = new Audio();
      this.audioElement.preload = 'auto';

      // HTML5 Audio Event Listeners for Web fallback
      this.audioElement.addEventListener('timeupdate', () => {
        if (!this.isNative && this.audioElement) {
          const cur = this.audioElement.currentTime;
          const dur = this.audioElement.duration || 0;
          this.lastCurrentTime = cur;
          if (dur > 0 && !isNaN(dur)) this.lastDuration = dur;
          this.timeUpdateListeners.forEach((cb) => cb(cur, dur));
        }
      });

      this.audioElement.addEventListener('loadedmetadata', () => {
        if (!this.isNative && this.audioElement) {
          const dur = this.audioElement.duration || 0;
          if (dur > 0 && !isNaN(dur)) this.lastDuration = dur;
          this.timeUpdateListeners.forEach((cb) => cb(this.audioElement?.currentTime || 0, dur));
        }
      });

      this.audioElement.addEventListener('play', () => {
        if (!this.isNative) {
          this.stateChangeListeners.forEach((cb) => cb(true));
        }
      });

      this.audioElement.addEventListener('pause', () => {
        if (!this.isNative) {
          this.stateChangeListeners.forEach((cb) => cb(false));
        }
      });

      this.audioElement.addEventListener('ended', () => {
        if (!this.isNative) {
          this.trackEndListeners.forEach((cb) => cb());
        }
      });

      // Create Analyser
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;

      // Pre-amp gain for clean headroom (0.80 prevents digital clipping when EQ/bass boost are active)
      this.preampGain = this.audioCtx.createGain();
      this.preampGain.gain.setValueAtTime(0.82, this.audioCtx.currentTime);

      // Create 10-Band EQ filters
      EQ_FREQUENCIES.forEach((freq) => {
        if (!this.audioCtx) return;
        const filter = this.audioCtx.createBiquadFilter();
        if (freq <= 60) {
          filter.type = 'lowshelf';
        } else if (freq >= 16000) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.414;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        this.eqFilters[freq] = filter;
      });

      // Dedicated Bass Booster (Peaking at 65Hz)
      this.bassFilter = this.audioCtx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 80;
      this.bassFilter.gain.value = 0;

      // Dedicated Treble Booster (Highshelf at 12kHz)
      this.trebleFilter = this.audioCtx.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 12000;
      this.trebleFilter.gain.value = 0;

      // Reverb / Spatial Node
      this.reverbGain = this.audioCtx.createGain();
      this.dryGain = this.audioCtx.createGain();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
      this.dryGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
      this.reverbGain.gain.setValueAtTime(0.0, this.audioCtx.currentTime);

      // Studio Output Limiter / Compressor to eliminate distortion
      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-1.0, this.audioCtx.currentTime);
      this.compressor.knee.setValueAtTime(18, this.audioCtx.currentTime);
      this.compressor.ratio.setValueAtTime(3.5, this.audioCtx.currentTime);
      this.compressor.attack.setValueAtTime(0.005, this.audioCtx.currentTime);
      this.compressor.release.setValueAtTime(0.20, this.audioCtx.currentTime);

      // Wire signal graph safely:
      try {
        this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
        let prevNode: AudioNode = this.sourceNode;

        prevNode.connect(this.preampGain);
        prevNode = this.preampGain;

        EQ_FREQUENCIES.forEach((freq) => {
          const filter = this.eqFilters[freq];
          if (filter) {
            prevNode.connect(filter);
            prevNode = filter;
          }
        });

        if (this.bassFilter) {
          prevNode.connect(this.bassFilter);
          prevNode = this.bassFilter;
        }

        if (this.trebleFilter) {
          prevNode.connect(this.trebleFilter);
          prevNode = this.trebleFilter;
        }

        // Parallel routing: Dry output to compressor
        prevNode.connect(this.dryGain);
        this.dryGain.connect(this.compressor);

        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
      } catch (e) {
        console.warn('Audio node connection warning', e);
      }

      this.isInitialized = true;
    } catch (err) {
      console.error('Failed to initialize Web Audio Engine', err);
    }
  }

  private async setupNativeListeners() {
    if (this.nativeListenersSetup) return;
    this.nativeListenersSetup = true;

    try {
      await MusicLibrary.addListener('playbackProgress', (progress) => {
        if (this.isNative) {
          const curSec = (progress.currentPosition || 0) / 1000;
          const durSec = (progress.duration || 0) / 1000;
          this.lastCurrentTime = curSec;
          if (durSec > 0) this.lastDuration = durSec;
          this.timeUpdateListeners.forEach((cb) => cb(curSec, durSec));
        }
      });

      await MusicLibrary.addListener('playbackStateChange', (state) => {
        if (this.isNative) {
          const isPlaying = state.status === 'playing';
          if (state.duration && state.duration > 0) {
            this.lastDuration = state.duration / 1000;
          }
          if (state.position !== undefined) {
            this.lastCurrentTime = state.position / 1000;
          }
          this.stateChangeListeners.forEach((cb) => cb(isPlaying));
        }
      });

      await MusicLibrary.addListener('playbackCompleted', () => {
        if (this.isNative) {
          this.trackEndListeners.forEach((cb) => cb());
        }
      });

      await MusicLibrary.addListener('trackAutoAdvanced', (event) => {
        this.trackAutoAdvancedListeners.forEach((cb) => cb(event));
      });

      await MusicLibrary.addListener('playbackError', (err) => {
        console.warn('Native playback error:', err);
      });
    } catch (e) {
      console.debug('Native listeners not supported or failed to bind:', e);
    }
  }

  public async resumeContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume();
      } catch (e) {
        console.debug('Resume AudioContext error', e);
      }
    }
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioCtx;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public async loadTrack(
    url: string,
    track?: Track,
    options?: {
      queue?: Track[];
      currentIndex?: number;
      repeatMode?: string;
      isShuffle?: boolean;
    }
  ) {
    this.init();
    this.setupNativeListeners();

    const isContentUri = url.startsWith('content://');
    const isNativeEnv = Capacitor.isNativePlatform();

    // 1. If this is an Android content URI or running on native Android with a local track,
    // use the native MediaPlayer PlaybackManager!
    if (isContentUri || (isNativeEnv && track?.sourceType === 'user-upload')) {
      this.isNative = true;
      if (this.audioElement) {
        try {
          this.audioElement.pause();
          this.audioElement.src = '';
        } catch {}
      }

      // Extract raw ID if id is formatted as native-12345-...
      let rawId: string | undefined = undefined;
      if (track?.id) {
        const parts = track.id.split('-');
        if (parts.length >= 2 && parts[0] === 'native') {
          rawId = parts[1];
        } else {
          rawId = track.id;
        }
      }

      // Format queue items for native Android service
      const nativeQueue = options?.queue?.map((t) => {
        let itemRawId: string | undefined = undefined;
        if (t.id) {
          const parts = t.id.split('-');
          if (parts.length >= 2 && parts[0] === 'native') {
            itemRawId = parts[1];
          } else {
            itemRawId = t.id;
          }
        }
        return {
          id: itemRawId || t.id,
          uri: t.url,
          title: t.title,
          artist: t.artist,
          album: t.album,
          coverArt: t.coverArt,
          duration: t.duration ? Math.round(t.duration * 1000) : 0,
          isFavorite: t.isFavorite,
        };
      });

      try {
        await MusicLibrary.playTrack({
          uri: url,
          id: rawId,
          title: track?.title,
          artist: track?.artist,
          album: track?.album,
          coverArt: track?.coverArt,
          duration: track?.duration ? Math.round(track.duration * 1000) : 0,
          isFavorite: track?.isFavorite,
          queue: nativeQueue,
          currentIndex: options?.currentIndex,
          repeatMode: options?.repeatMode,
          isShuffle: options?.isShuffle,
        });
      } catch (err) {
        console.warn('Native MusicLibrary.playTrack error:', err);
      }
      return;
    }

    // 2. Standard Web Browser / AudioElement playback
    this.isNative = false;
    try {
      if (Capacitor.isNativePlatform()) {
        MusicLibrary.pause();
      }
    } catch {}

    if (this.audioElement) {
      try {
        this.audioElement.pause();
      } catch {}

      if (url.startsWith('blob:') || url.startsWith('data:')) {
        this.audioElement.removeAttribute('crossOrigin');
      } else {
        try {
          this.audioElement.crossOrigin = 'anonymous';
        } catch {}
      }

      this.audioElement.src = url;
      this.audioElement.load();
      this.applyTrendingEffect(this.activeEffect);
    }
  }

  public async play(fade: boolean = false): Promise<void> {
    this.init();
    if (this.isNative) {
      try {
        await MusicLibrary.resume();
        this.stateChangeListeners.forEach((cb) => cb(true));
      } catch (e) {
        console.warn('Native resume error:', e);
      }
      return;
    }

    await this.resumeContext();

    if (this.audioElement && this.audioElement.src) {
      try {
        if (fade && this.masterGain && this.audioCtx) {
          const currentGain = this.masterGain.gain.value || 0.85;
          this.rampParam(this.masterGain.gain, 0.001, 0.01);
          setTimeout(() => {
            this.rampParam(this.masterGain?.gain, currentGain, 0.25);
          }, 15);
        }
        await this.audioElement.play();
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
        console.warn('Audio element play error:', err);
      }
    }
  }

  public pause(fade: boolean = false) {
    if (this.isNative) {
      try {
        MusicLibrary.pause();
        this.stateChangeListeners.forEach((cb) => cb(false));
      } catch (e) {
        console.warn('Native pause error:', e);
      }
      return;
    }

    if (!this.audioElement) return;

    if (fade && this.masterGain && this.audioCtx) {
      const currentVol = this.masterGain.gain.value || 0.85;
      this.rampParam(this.masterGain.gain, 0.001, 0.2);
      setTimeout(() => {
        if (this.audioElement) {
          this.audioElement.pause();
          if (this.masterGain) {
            this.rampParam(this.masterGain.gain, currentVol, 0.01);
          }
        }
      }, 210);
    } else {
      this.audioElement.pause();
    }
  }

  public seek(seconds: number) {
    if (this.isNative) {
      try {
        MusicLibrary.seekTo({ position: Math.round(seconds * 1000) });
        this.lastCurrentTime = seconds;
        this.timeUpdateListeners.forEach((cb) => cb(seconds, this.lastDuration));
      } catch (e) {
        console.warn('Native seek error:', e);
      }
      return;
    }

    if (this.audioElement && Number.isFinite(seconds)) {
      this.audioElement.currentTime = seconds;
    }
  }

  public setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.isNative) {
      try {
        MusicLibrary.setVolume({ volume: clamped });
      } catch {}
    }
    if (this.audioElement) {
      this.audioElement.volume = 1.0;
    }
    if (this.masterGain) {
      this.rampParam(this.masterGain.gain, clamped, 0.02);
    }
  }

  public setPlaybackRate(rate: number) {
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
      (this.audioElement as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = (this.activeEffect !== 'nightcore');
    }
  }

  // --- Trending Audio FX (Sped Up, Slowed+Reverb, Nightcore, Lo-Fi Tape, Bass Drop) ---
  public applyTrendingEffect(effect: TrendingAudioEffect) {
    this.activeEffect = effect;
    if (!this.audioCtx) return;

    switch (effect) {
      case 'sped_up':
        this.setPlaybackRate(1.25);
        this.rampParam(this.bassFilter?.gain, 2, 0.05);
        this.rampParam(this.trebleFilter?.gain, 1, 0.05);
        break;

      case 'slowed_reverb':
        this.setPlaybackRate(0.85);
        this.rampParam(this.bassFilter?.gain, 4, 0.05);
        this.rampParam(this.trebleFilter?.gain, -3, 0.05);
        break;

      case 'nightcore':
        this.setPlaybackRate(1.35);
        if (this.audioElement) {
          (this.audioElement as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = false;
        }
        this.rampParam(this.trebleFilter?.gain, 3, 0.05);
        break;

      case 'bass_drop':
        this.setPlaybackRate(1.0);
        this.rampParam(this.bassFilter?.gain, 6, 0.05);
        this.rampParam(this.trebleFilter?.gain, 1, 0.05);
        break;

      case 'lofi_tape':
        this.setPlaybackRate(0.92);
        this.rampParam(this.bassFilter?.gain, 3, 0.05);
        this.rampParam(this.trebleFilter?.gain, -5, 0.05);
        break;

      case 'normal':
      default:
        this.setPlaybackRate(1.0);
        if (this.audioElement) {
          (this.audioElement as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
        }
        this.rampParam(this.bassFilter?.gain, 0, 0.05);
        this.rampParam(this.trebleFilter?.gain, 0, 0.05);
        break;
    }
  }

  public getActiveTrendingEffect(): TrendingAudioEffect {
    return this.activeEffect;
  }

  // --- AI Karaoke & Vocal Attenuator ---
  public toggleKaraokeMode(enabled: boolean, vocalAttenuationPercent: number = 100) {
    this.isKaraokeMode = enabled;
    if (!this.audioCtx) return;

    const attFactor = enabled ? (vocalAttenuationPercent / 100) : 0;

    if (this.eqFilters[500]) this.rampParam(this.eqFilters[500].gain, -8 * attFactor, 0.05);
    if (this.eqFilters[1000]) this.rampParam(this.eqFilters[1000].gain, -14 * attFactor, 0.05);
    if (this.eqFilters[2000]) this.rampParam(this.eqFilters[2000].gain, -16 * attFactor, 0.05);
    if (this.eqFilters[4000]) this.rampParam(this.eqFilters[4000].gain, -10 * attFactor, 0.05);
  }

  public setStemMix(settings: {
    vocalLevel: number;
    beatBoost: number;
    bassLevel: number;
    instrumentalLevel: number;
  }) {
    if (!this.audioCtx) return;

    const vocalCut = (100 - settings.vocalLevel) / 100;
    const bassGain = ((settings.bassLevel - 50) / 50) * 6;
    const beatGain = ((settings.beatBoost - 50) / 50) * 5;
    const instGain = ((settings.instrumentalLevel - 50) / 50) * 3;

    if (this.bassFilter) this.rampParam(this.bassFilter.gain, Math.max(-2, bassGain + 2), 0.05);
    if (this.eqFilters[60]) this.rampParam(this.eqFilters[60].gain, bassGain, 0.05);
    if (this.eqFilters[125]) this.rampParam(this.eqFilters[125].gain, beatGain, 0.05);
    if (this.eqFilters[250]) this.rampParam(this.eqFilters[250].gain, instGain, 0.05);

    if (this.eqFilters[500]) this.rampParam(this.eqFilters[500].gain, -8 * vocalCut, 0.05);
    if (this.eqFilters[1000]) this.rampParam(this.eqFilters[1000].gain, -14 * vocalCut, 0.05);
    if (this.eqFilters[2000]) this.rampParam(this.eqFilters[2000].gain, -16 * vocalCut, 0.05);
    if (this.eqFilters[4000]) this.rampParam(this.eqFilters[4000].gain, -10 * vocalCut, 0.05);
    if (this.eqFilters[8000]) this.rampParam(this.eqFilters[8000].gain, beatGain * 0.6, 0.05);
  }

  public resetStemMix() {
    if (!this.audioCtx) return;
    EQ_FREQUENCIES.forEach((freq) => {
      const f = this.eqFilters[freq];
      if (f) this.rampParam(f.gain, 0, 0.05);
    });
    if (this.bassFilter) this.rampParam(this.bassFilter.gain, 0, 0.05);
    if (this.trebleFilter) this.rampParam(this.trebleFilter.gain, 0, 0.05);
  }

  public isKaraoke(): boolean {
    return this.isKaraokeMode;
  }

  public applyEqualizer(settings: EqualizerSettings) {
    if (!this.audioCtx) return;

    // Calculate maximum boost to adjust preamp headroom dynamically (prevents clipping/cracking)
    let maxBoost = 0;
    if (settings.enabled) {
      EQ_FREQUENCIES.forEach((freq) => {
        const b = settings.bands[freq] || 0;
        if (b > maxBoost) maxBoost = b;
      });
      if (settings.bassBoost > 0) {
        maxBoost = Math.max(maxBoost, (settings.bassBoost / 100) * 8);
      }
      if (settings.trebleBoost > 0) {
        maxBoost = Math.max(maxBoost, (settings.trebleBoost / 100) * 5);
      }
    }

    // Dynamic Preamp Headroom compensation:
    if (this.preampGain) {
      const targetPreamp = settings.enabled && maxBoost > 0
        ? Math.max(0.40, 0.82 * Math.pow(10, -maxBoost / 25))
        : 0.82;
      this.rampParam(this.preampGain.gain, targetPreamp, 0.05);
    }

    // Apply Bands with click-free ramps
    EQ_FREQUENCIES.forEach((freq) => {
      const filter = this.eqFilters[freq];
      if (filter) {
        let gainVal = settings.enabled ? (settings.bands[freq] || 0) : 0;
        if (this.isKaraokeMode && (freq === 1000 || freq === 2000)) {
          gainVal -= 8;
        }
        this.rampParam(filter.gain, gainVal, 0.05);
      }
    });

    // Bass Boost (smooth ramp)
    if (this.bassFilter) {
      const bassGain = settings.enabled ? (settings.bassBoost / 100) * 8 : 0;
      this.rampParam(this.bassFilter.gain, bassGain, 0.05);
    }

    // Treble Boost (smooth ramp)
    if (this.trebleFilter) {
      const trebleGain = settings.enabled ? (settings.trebleBoost / 100) * 5 : 0;
      this.rampParam(this.trebleFilter.gain, trebleGain, 0.05);
    }

    // Tube Warmer (Harmonics & Warmth at 250Hz - 500Hz)
    if (settings.enabled && settings.tubeWarmer && settings.tubeWarmer > 0) {
      const warmthDb = (settings.tubeWarmer / 100) * 2.5;
      if (this.eqFilters[250]) {
        const base = settings.bands[250] || 0;
        this.rampParam(this.eqFilters[250].gain, base + warmthDb, 0.05);
      }
      if (this.eqFilters[500]) {
        const base = settings.bands[500] || 0;
        this.rampParam(this.eqFilters[500].gain, base + warmthDb * 0.6, 0.05);
      }
    }
  }

  public getFrequencyData(array: Uint8Array) {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array);
    } else {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.sin(Date.now() / 200 + i * 0.2) * 30 + 35);
      }
    }
  }

  public getTimeDomainData(array: Uint8Array) {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(array);
    }
  }

  // --- Universal Event Subscriptions ---
  public onTimeUpdate(cb: (currentTime: number, duration: number) => void): () => void {
    this.timeUpdateListeners.add(cb);
    return () => this.timeUpdateListeners.delete(cb);
  }

  public onStateChange(cb: (isPlaying: boolean) => void): () => void {
    this.stateChangeListeners.add(cb);
    return () => this.stateChangeListeners.delete(cb);
  }

  public onTrackEnd(cb: () => void): () => void {
    this.trackEndListeners.add(cb);
    return () => this.trackEndListeners.delete(cb);
  }

  public onTrackAutoAdvanced(cb: (event: { id: string; index: number; title: string; artist: string }) => void): () => void {
    this.trackAutoAdvancedListeners.add(cb);
    return () => this.trackAutoAdvancedListeners.delete(cb);
  }

  public async syncQueue(queue: Track[], currentId?: string, repeatMode?: string, isShuffle?: boolean) {
    if (Capacitor.isNativePlatform()) {
      try {
        const nativeQueue = queue.map((t) => {
          let itemRawId: string | undefined = undefined;
          if (t.id) {
            const parts = t.id.split('-');
            if (parts.length >= 2 && parts[0] === 'native') {
              itemRawId = parts[1];
            } else {
              itemRawId = t.id;
            }
          }
          return {
            id: itemRawId || t.id,
            uri: t.url,
            title: t.title,
            artist: t.artist,
            album: t.album,
            coverArt: t.coverArt,
            duration: t.duration ? Math.round(t.duration * 1000) : 0,
            isFavorite: t.isFavorite,
          };
        });
        await MusicLibrary.setQueue({
          queue: nativeQueue,
          currentId,
          repeatMode,
          isShuffle,
        });
      } catch (e) {
        console.debug('Failed to sync queue with native service:', e);
      }
    }
  }

  public async syncPlaybackMode(repeatMode?: string, isShuffle?: boolean) {
    if (Capacitor.isNativePlatform()) {
      try {
        await MusicLibrary.setPlaybackMode({ repeatMode, isShuffle });
      } catch {}
    }
  }

  public async playNextNative(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await MusicLibrary.playNext();
        return res.success;
      } catch {
        return false;
      }
    }
    return false;
  }

  public async playPreviousNative(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await MusicLibrary.playPrevious();
        return res.success;
      } catch {
        return false;
      }
    }
    return false;
  }

  public isNativePlayback(): boolean {
    return this.isNative;
  }

  public getCurrentTime(): number {
    return this.isNative ? this.lastCurrentTime : (this.audioElement?.currentTime || 0);
  }

  public getDuration(): number {
    return this.isNative ? this.lastDuration : (this.audioElement?.duration || 0);
  }
}

export const audioEngine = new AudioEngineService();
