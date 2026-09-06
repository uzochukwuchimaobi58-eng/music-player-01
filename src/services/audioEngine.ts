import { EqualizerSettings } from '../types';
import { EQ_FREQUENCIES } from '../data/defaultTracks';

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

      // Create Analyser
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;

      // Pre-amp gain for clean headroom (0.80 prevents digital clipping when EQ/bass boost are active)
      this.preampGain = this.audioCtx.createGain();
      this.preampGain.gain.setValueAtTime(0.82, this.audioCtx.currentTime);

      // Create Master Gain and Dry/Reverb gains
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);

      this.dryGain = this.audioCtx.createGain();
      this.dryGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);

      this.reverbGain = this.audioCtx.createGain();
      this.reverbGain.gain.setValueAtTime(0.0, this.audioCtx.currentTime);

      // Transparent peak safety limiter: Gentle soft-knee limiting without squashing bass into square waves
      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-1.0, this.audioCtx.currentTime);
      this.compressor.knee.setValueAtTime(18, this.audioCtx.currentTime);
      this.compressor.ratio.setValueAtTime(3.5, this.audioCtx.currentTime);
      this.compressor.attack.setValueAtTime(0.005, this.audioCtx.currentTime);
      this.compressor.release.setValueAtTime(0.20, this.audioCtx.currentTime);

      // Dedicated Bass and Treble shelving filters
      this.bassFilter = this.audioCtx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 100;
      this.bassFilter.gain.value = 0;

      this.trebleFilter = this.audioCtx.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 8000;
      this.trebleFilter.gain.value = 0;

      // Create Equalizer Bands
      EQ_FREQUENCIES.forEach((freq, idx) => {
        if (!this.audioCtx) return;
        const filter = this.audioCtx.createBiquadFilter();
        if (idx === 0) {
          filter.type = 'lowshelf';
        } else if (idx === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.2;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        this.eqFilters[freq] = filter;
      });

      // Connect Web Audio Graph
      try {
        this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
        
        // Route: Source -> Preamp -> BassShelf -> TrebleShelf -> EQ Bands -> DryGain -> Compressor -> MasterGain -> Analyser -> Destination
        this.sourceNode.connect(this.preampGain);
        let prevNode: AudioNode = this.preampGain;

        prevNode.connect(this.bassFilter);
        prevNode = this.bassFilter;

        prevNode.connect(this.trebleFilter);
        prevNode = this.trebleFilter;

        EQ_FREQUENCIES.forEach((freq) => {
          const filter = this.eqFilters[freq];
          if (filter) {
            prevNode.connect(filter);
            prevNode = filter;
          }
        });

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

  public loadTrack(url: string) {
    this.init();
    if (this.audioElement) {
      // Clean up previous playback smoothly
      try {
        this.audioElement.pause();
      } catch {
        // ignore
      }

      if (url.startsWith('blob:') || url.startsWith('data:')) {
        this.audioElement.removeAttribute('crossOrigin');
      } else {
        // Only set crossOrigin if URL looks like it's remote CDN
        try {
          this.audioElement.crossOrigin = 'anonymous';
        } catch {
          // ignore
        }
      }

      this.audioElement.src = url;
      this.audioElement.load();
      this.applyTrendingEffect(this.activeEffect);
    }
  }

  public async play(fade: boolean = false): Promise<void> {
    this.init();
    await this.resumeContext();

    if (this.audioElement && this.audioElement.src) {
      try {
        if (fade && this.masterGain && this.audioCtx) {
          const now = this.audioCtx.currentTime;
          const currentGain = this.masterGain.gain.value || 0.85;
          this.rampParam(this.masterGain.gain, 0.001, 0.01);
          setTimeout(() => {
            this.rampParam(this.masterGain?.gain, currentGain, 0.25);
          }, 15);
        }
        await this.audioElement.play();
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          // Normal when switching tracks quickly, ignore safely
          return;
        }
        console.warn('Audio element play error:', err);
      }
    }
  }

  public pause(fade: boolean = false) {
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
    if (this.audioElement && Number.isFinite(seconds)) {
      this.audioElement.currentTime = seconds;
    }
  }

  public setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.audioElement) {
      // Keep source element volume clean and constant to prevent double-attenuation artifacts
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
}

export const audioEngine = new AudioEngineService();

