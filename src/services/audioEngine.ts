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

  // AI Karaoke / Vocal Remover Node (Stereo phase cancellation)
  private vocalSplitter: ChannelSplitterNode | null = null;
  private vocalMerger: ChannelMergerNode | null = null;
  private vocalInverterGain: GainNode | null = null;
  private vocalRemoverGain: GainNode | null = null;
  private isKaraokeMode: boolean = false;

  // Active trending effect mode
  private activeEffect: TrendingAudioEffect = 'normal';

  // Synthesized fallback oscillator nodes when offline
  private synthInterval: number | null = null;
  private isSynthetic: boolean = false;
  private synthGain: GainNode | null = null;

  private isInitialized = false;

  public init() {
    if (this.isInitialized) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.preload = 'auto';

      // Create Analyser
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.85;

      // Pre-amp gain for clean headroom (prevents digital clipping when EQ/bass boost are active)
      this.preampGain = this.audioCtx.createGain();
      this.preampGain.gain.setValueAtTime(0.85, this.audioCtx.currentTime);

      // Create Master Gain & Compressor for Hi-Fi Dynamics
      this.masterGain = this.audioCtx.createGain();
      this.dryGain = this.audioCtx.createGain();
      this.dryGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
      this.reverbGain = this.audioCtx.createGain();
      this.reverbGain.gain.setValueAtTime(0.0, this.audioCtx.currentTime);

      // Transparent peak safety limiter: Prevents DAC overload while eliminating bass waveform chopping/cracking
      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-1.5, this.audioCtx.currentTime);
      this.compressor.knee.setValueAtTime(10, this.audioCtx.currentTime);
      this.compressor.ratio.setValueAtTime(16, this.audioCtx.currentTime);
      this.compressor.attack.setValueAtTime(0.025, this.audioCtx.currentTime); // 25ms prevents bass cycle distortion
      this.compressor.release.setValueAtTime(0.12, this.audioCtx.currentTime);

      // Create Bass and Treble dedicated shelves
      this.bassFilter = this.audioCtx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 90;

      this.trebleFilter = this.audioCtx.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 10000;

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
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        this.eqFilters[freq] = filter;
      });

      // Synthetic Reverb Impulse generator for Spatial Room sound
      this.setupReverb();

      // Connect Web Audio Graph
      try {
        this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
        
        // Route through Preamp Headroom first
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

        // Parallel routing: Dry & Reverb
        prevNode.connect(this.dryGain);
        this.dryGain.connect(this.compressor);

        if (this.reverbNode && this.reverbGain) {
          prevNode.connect(this.reverbNode);
          this.reverbNode.connect(this.reverbGain);
          this.reverbGain.connect(this.compressor);
        }

        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
      } catch (e) {
        console.warn('Audio node connection warning (can happen before first play)', e);
      }

      this.isInitialized = true;
    } catch (err) {
      console.error('Failed to initialize Web Audio Engine', err);
    }
  }

  private setupReverb() {
    if (!this.audioCtx) return;
    try {
      this.reverbNode = this.audioCtx.createConvolver();
      const rate = this.audioCtx.sampleRate;
      const length = Math.floor(rate * 1.5);
      const decay = 2.0;
      const impulse = this.audioCtx.createBuffer(2, length, rate);
      const left = impulse.getChannelData(0);
      const right = impulse.getChannelData(1);

      let maxPeak = 0;
      for (let i = 0; i < length; i++) {
        const n = (length - i) / length;
        const env = Math.pow(n, decay);
        left[i] = ((Math.random() * 2 - 1) * env);
        right[i] = ((Math.random() * 2 - 1) * env);
        if (Math.abs(left[i]) > maxPeak) maxPeak = Math.abs(left[i]);
        if (Math.abs(right[i]) > maxPeak) maxPeak = Math.abs(right[i]);
      }
      // Strictly normalize impulse response so convolution never overflows
      if (maxPeak > 0) {
        const scale = 0.04 / maxPeak;
        for (let i = 0; i < length; i++) {
          left[i] *= scale;
          right[i] *= scale;
        }
      }
      this.reverbNode.normalize = true;
      this.reverbNode.buffer = impulse;
    } catch (e) {
      console.warn('Reverb buffer init error', e);
    }
  }

  public async resumeContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
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
    this.stopSynthetic();
    if (this.audioElement) {
      if (url.startsWith('blob:') || url.startsWith('data:')) {
        this.audioElement.removeAttribute('crossOrigin');
      } else {
        this.audioElement.crossOrigin = 'anonymous';
      }
      this.audioElement.src = url;
      this.audioElement.load();
      // Re-apply speed on load
      this.applyTrendingEffect(this.activeEffect);
    }
  }

  public async play(fade: boolean = false): Promise<void> {
    this.init();
    await this.resumeContext();

    if (this.audioElement && this.audioElement.src && !this.isSynthetic) {
      try {
        if (fade && this.masterGain && this.audioCtx) {
          const now = this.audioCtx.currentTime;
          const targetVol = this.masterGain.gain.value || 0.85;
          this.masterGain.gain.cancelScheduledValues(now);
          this.masterGain.gain.setValueAtTime(0.001, now);
          this.masterGain.gain.linearRampToValueAtTime(targetVol, now + 0.3);
        }
        await this.audioElement.play();
        return;
      } catch (err) {
        console.warn('Audio element play failed, engaging high-fidelity synthesizer fallback', err);
        this.startSyntheticTrack();
      }
    } else if (this.isSynthetic) {
      this.resumeSynthetic();
    }
  }

  public pause(fade: boolean = false) {
    if (fade && this.masterGain && this.audioCtx && this.audioElement && !this.isSynthetic) {
      const now = this.audioCtx.currentTime;
      const currentVol = this.masterGain.gain.value || 0.85;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(currentVol, now);
      this.masterGain.gain.linearRampToValueAtTime(0.001, now + 0.25);
      setTimeout(() => {
        if (this.audioElement) {
          this.audioElement.pause();
          if (this.masterGain && this.audioCtx) {
            this.masterGain.gain.setValueAtTime(currentVol, this.audioCtx.currentTime);
          }
        }
      }, 260);
    } else {
      if (this.audioElement && !this.isSynthetic) {
        this.audioElement.pause();
      } else if (this.isSynthetic) {
        this.pauseSynthetic();
      }
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
      // In Web Audio mode, feed full dynamic resolution into the graph and control via masterGain
      this.audioElement.volume = 1.0;
    }
    if (this.masterGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(clamped, now + 0.02);
    }
  }

  public setPlaybackRate(rate: number) {
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
      // Preserve pitch setting if browser supports it
      (this.audioElement as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = (this.activeEffect !== 'nightcore');
    }
  }

  // --- Trending Audio FX (Sped Up, Slowed+Reverb, Nightcore, Lo-Fi Tape, Bass Drop) ---
  public applyTrendingEffect(effect: TrendingAudioEffect) {
    this.activeEffect = effect;
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    switch (effect) {
      case 'sped_up':
        this.setPlaybackRate(1.25);
        if (this.reverbGain) {
          this.reverbGain.gain.cancelScheduledValues(now);
          this.reverbGain.gain.linearRampToValueAtTime(0.06, now + 0.05);
        }
        if (this.bassFilter) {
          this.bassFilter.gain.cancelScheduledValues(now);
          this.bassFilter.gain.linearRampToValueAtTime(2, now + 0.05);
        }
        break;

      case 'slowed_reverb':
        this.setPlaybackRate(0.85);
        if (this.reverbGain) {
          this.reverbGain.gain.cancelScheduledValues(now);
          this.reverbGain.gain.linearRampToValueAtTime(0.3, now + 0.05);
        }
        if (this.bassFilter) {
          this.bassFilter.gain.cancelScheduledValues(now);
          this.bassFilter.gain.linearRampToValueAtTime(5, now + 0.05);
        }
        if (this.trebleFilter) {
          this.trebleFilter.gain.cancelScheduledValues(now);
          this.trebleFilter.gain.linearRampToValueAtTime(-3, now + 0.05);
        }
        break;

      case 'nightcore':
        this.setPlaybackRate(1.35);
        if (this.audioElement) {
          (this.audioElement as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = false;
        }
        if (this.reverbGain) {
          this.reverbGain.gain.cancelScheduledValues(now);
          this.reverbGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
        }
        if (this.trebleFilter) {
          this.trebleFilter.gain.cancelScheduledValues(now);
          this.trebleFilter.gain.linearRampToValueAtTime(3, now + 0.05);
        }
        break;

      case 'bass_drop':
        this.setPlaybackRate(1.0);
        if (this.reverbGain) {
          this.reverbGain.gain.cancelScheduledValues(now);
          this.reverbGain.gain.linearRampToValueAtTime(0.06, now + 0.05);
        }
        if (this.bassFilter) {
          this.bassFilter.gain.cancelScheduledValues(now);
          this.bassFilter.gain.linearRampToValueAtTime(8, now + 0.05);
        }
        if (this.trebleFilter) {
          this.trebleFilter.gain.cancelScheduledValues(now);
          this.trebleFilter.gain.linearRampToValueAtTime(2, now + 0.05);
        }
        break;

      case 'lofi_tape':
        this.setPlaybackRate(0.92);
        if (this.reverbGain) {
          this.reverbGain.gain.cancelScheduledValues(now);
          this.reverbGain.gain.linearRampToValueAtTime(0.18, now + 0.05);
        }
        if (this.bassFilter) {
          this.bassFilter.gain.cancelScheduledValues(now);
          this.bassFilter.gain.linearRampToValueAtTime(3, now + 0.05);
        }
        if (this.trebleFilter) {
          this.trebleFilter.gain.cancelScheduledValues(now);
          this.trebleFilter.gain.linearRampToValueAtTime(-6, now + 0.05);
        }
        break;

      case 'normal':
      default:
        this.setPlaybackRate(1.0);
        if (this.audioElement) {
          (this.audioElement as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
        }
        if (this.reverbGain) {
          this.reverbGain.gain.cancelScheduledValues(now);
          this.reverbGain.gain.linearRampToValueAtTime(0.0, now + 0.05);
        }
        if (this.bassFilter) {
          this.bassFilter.gain.cancelScheduledValues(now);
          this.bassFilter.gain.linearRampToValueAtTime(0, now + 0.05);
        }
        if (this.trebleFilter) {
          this.trebleFilter.gain.cancelScheduledValues(now);
          this.trebleFilter.gain.linearRampToValueAtTime(0, now + 0.05);
        }
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
    const now = this.audioCtx.currentTime;

    const attFactor = enabled ? (vocalAttenuationPercent / 100) : 0;

    // Attenuate mid frequencies (500Hz - 4kHz where lead vocals reside) smoothly
    if (this.eqFilters[500]) {
      this.eqFilters[500].gain.cancelScheduledValues(now);
      this.eqFilters[500].gain.linearRampToValueAtTime(-10 * attFactor, now + 0.05);
    }
    if (this.eqFilters[1000]) {
      this.eqFilters[1000].gain.cancelScheduledValues(now);
      this.eqFilters[1000].gain.linearRampToValueAtTime(-16 * attFactor, now + 0.05);
    }
    if (this.eqFilters[2000]) {
      this.eqFilters[2000].gain.cancelScheduledValues(now);
      this.eqFilters[2000].gain.linearRampToValueAtTime(-18 * attFactor, now + 0.05);
    }
    if (this.eqFilters[4000]) {
      this.eqFilters[4000].gain.cancelScheduledValues(now);
      this.eqFilters[4000].gain.linearRampToValueAtTime(-12 * attFactor, now + 0.05);
    }
    if (this.reverbGain) {
      this.reverbGain.gain.cancelScheduledValues(now);
      this.reverbGain.gain.linearRampToValueAtTime(enabled ? 0.22 : 0.0, now + 0.05);
    }
  }

  public setStemMix(settings: {
    vocalLevel: number;
    beatBoost: number;
    bassLevel: number;
    instrumentalLevel: number;
  }) {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    const vocalCut = (100 - settings.vocalLevel) / 100;
    const bassGain = ((settings.bassLevel - 50) / 50) * 8; // -8 to +8 dB
    const beatGain = ((settings.beatBoost - 50) / 50) * 6; // -6 to +6 dB
    const instGain = ((settings.instrumentalLevel - 50) / 50) * 4;

    if (this.bassFilter) {
      this.bassFilter.gain.cancelScheduledValues(now);
      this.bassFilter.gain.linearRampToValueAtTime(Math.max(-3, bassGain + 3), now + 0.05);
    }

    if (this.eqFilters[60]) {
      this.eqFilters[60].gain.cancelScheduledValues(now);
      this.eqFilters[60].gain.linearRampToValueAtTime(bassGain, now + 0.05);
    }
    if (this.eqFilters[125]) {
      this.eqFilters[125].gain.cancelScheduledValues(now);
      this.eqFilters[125].gain.linearRampToValueAtTime(beatGain, now + 0.05);
    }
    if (this.eqFilters[250]) {
      this.eqFilters[250].gain.cancelScheduledValues(now);
      this.eqFilters[250].gain.linearRampToValueAtTime(instGain, now + 0.05);
    }
    // Vocal cut in mid-range
    if (this.eqFilters[500]) {
      this.eqFilters[500].gain.cancelScheduledValues(now);
      this.eqFilters[500].gain.linearRampToValueAtTime(-10 * vocalCut, now + 0.05);
    }
    if (this.eqFilters[1000]) {
      this.eqFilters[1000].gain.cancelScheduledValues(now);
      this.eqFilters[1000].gain.linearRampToValueAtTime(-18 * vocalCut, now + 0.05);
    }
    if (this.eqFilters[2000]) {
      this.eqFilters[2000].gain.cancelScheduledValues(now);
      this.eqFilters[2000].gain.linearRampToValueAtTime(-20 * vocalCut, now + 0.05);
    }
    if (this.eqFilters[4000]) {
      this.eqFilters[4000].gain.cancelScheduledValues(now);
      this.eqFilters[4000].gain.linearRampToValueAtTime(-14 * vocalCut, now + 0.05);
    }
    // Crisp percussion / beat sparkle
    if (this.eqFilters[8000]) {
      this.eqFilters[8000].gain.cancelScheduledValues(now);
      this.eqFilters[8000].gain.linearRampToValueAtTime(beatGain * 0.8, now + 0.05);
    }
  }

  public resetStemMix() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    EQ_FREQUENCIES.forEach((freq) => {
      const f = this.eqFilters[freq];
      if (f) {
        f.gain.cancelScheduledValues(now);
        f.gain.linearRampToValueAtTime(0, now + 0.05);
      }
    });
    if (this.bassFilter) {
      this.bassFilter.gain.cancelScheduledValues(now);
      this.bassFilter.gain.linearRampToValueAtTime(0, now + 0.05);
    }
    if (this.trebleFilter) {
      this.trebleFilter.gain.cancelScheduledValues(now);
      this.trebleFilter.gain.linearRampToValueAtTime(0, now + 0.05);
    }
    if (this.reverbGain) {
      this.reverbGain.gain.cancelScheduledValues(now);
      this.reverbGain.gain.linearRampToValueAtTime(0, now + 0.05);
    }
  }

  public isKaraoke(): boolean {
    return this.isKaraokeMode;
  }

  public applyEqualizer(settings: EqualizerSettings) {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    // Calculate maximum boost to adjust preamp headroom dynamically (prevents clipping)
    let maxBoost = 0;
    if (settings.enabled) {
      EQ_FREQUENCIES.forEach((freq) => {
        const b = settings.bands[freq] || 0;
        if (b > maxBoost) maxBoost = b;
      });
      if (settings.bassBoost > 0) {
        maxBoost = Math.max(maxBoost, (settings.bassBoost / 100) * 10);
      }
      if (settings.trebleBoost > 0) {
        maxBoost = Math.max(maxBoost, (settings.trebleBoost / 100) * 6);
      }
    }

    // Dynamic Preamp Headroom compensation:
    // If EQ has positive gain, we reduce preamp slightly so the audio never overloads 0 dBFS
    if (this.preampGain) {
      const targetPreamp = settings.enabled && maxBoost > 0
        ? Math.max(0.45, 0.85 * Math.pow(10, -maxBoost / 28))
        : 0.85;
      this.preampGain.gain.cancelScheduledValues(now);
      this.preampGain.gain.linearRampToValueAtTime(targetPreamp, now + 0.05);
    }

    // Apply Bands with smooth linear ramp to prevent clicking
    EQ_FREQUENCIES.forEach((freq) => {
      const filter = this.eqFilters[freq];
      if (filter) {
        let gainVal = settings.enabled ? (settings.bands[freq] || 0) : 0;
        if (this.isKaraokeMode && (freq === 1000 || freq === 2000)) {
          gainVal -= 10;
        }
        filter.gain.cancelScheduledValues(now);
        filter.gain.linearRampToValueAtTime(gainVal, now + 0.05);
      }
    });

    // Bass Boost (smooth ramp)
    if (this.bassFilter) {
      const bassGain = settings.enabled ? (settings.bassBoost / 100) * 10 : 0;
      this.bassFilter.gain.cancelScheduledValues(now);
      this.bassFilter.gain.linearRampToValueAtTime(bassGain, now + 0.05);
    }

    // Treble Boost (smooth ramp)
    if (this.trebleFilter) {
      const trebleGain = settings.enabled ? (settings.trebleBoost / 100) * 6 : 0;
      this.trebleFilter.gain.cancelScheduledValues(now);
      this.trebleFilter.gain.linearRampToValueAtTime(trebleGain, now + 0.05);
    }

    // Spatial Reverb Wet Gain (strictly 0 when disabled or at 0, max 0.35)
    if (this.reverbGain) {
      const reverbVal = (settings.enabled && settings.spatialReverb > 0)
        ? (settings.spatialReverb / 100) * 0.30
        : 0.0;
      this.reverbGain.gain.cancelScheduledValues(now);
      this.reverbGain.gain.linearRampToValueAtTime(reverbVal, now + 0.05);
    }

    // Tube Warmer (Analog Harmonics & Warmth at 250Hz - 500Hz)
    if (settings.enabled && settings.tubeWarmer && settings.tubeWarmer > 0) {
      const warmthDb = (settings.tubeWarmer / 100) * 3.5;
      if (this.eqFilters[250]) {
        const base = settings.bands[250] || 0;
        this.eqFilters[250].gain.cancelScheduledValues(now);
        this.eqFilters[250].gain.linearRampToValueAtTime(base + warmthDb, now + 0.05);
      }
      if (this.eqFilters[500]) {
        const base = settings.bands[500] || 0;
        this.eqFilters[500].gain.cancelScheduledValues(now);
        this.eqFilters[500].gain.linearRampToValueAtTime(base + warmthDb * 0.7, now + 0.05);
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

  // --- Procedural High-Fidelity Synthesizer for offline / uninterrupted playback ---
  private startSyntheticTrack() {
    this.isSynthetic = true;
    if (!this.audioCtx) return;

    this.synthGain = this.audioCtx.createGain();
    this.synthGain.gain.value = 0.25;
    if (this.analyser) {
      this.synthGain.connect(this.analyser);
    }

    const chords = [
      [220, 261.63, 329.63, 392.00], // Am7
      [174.61, 220, 261.63, 329.63], // Fmaj7
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [196.00, 246.94, 293.66, 349.23], // G7
    ];
    let chordIndex = 0;
    let step = 0;

    const playStep = () => {
      if (!this.isSynthetic || !this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const currentChord = chords[chordIndex];

      // Bass note with click-free smooth envelope
      const bassOsc = this.audioCtx.createOscillator();
      const bassGain = this.audioCtx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(currentChord[0] / 2, now);
      bassGain.gain.setValueAtTime(0.001, now);
      bassGain.gain.linearRampToValueAtTime(0.2, now + 0.03);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
      bassOsc.connect(bassGain);
      if (this.synthGain) bassGain.connect(this.synthGain);
      bassOsc.start(now);
      bassOsc.stop(now + 0.40);

      // Melody with click-free smooth envelope
      const noteFreq = currentChord[step % currentChord.length];
      const melodyOsc = this.audioCtx.createOscillator();
      const melodyGain = this.audioCtx.createGain();
      melodyOsc.type = 'sine';
      melodyOsc.frequency.setValueAtTime(noteFreq, now);
      melodyGain.gain.setValueAtTime(0.001, now);
      melodyGain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      melodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
      melodyOsc.connect(melodyGain);
      if (this.synthGain) melodyGain.connect(this.synthGain);
      melodyOsc.start(now);
      melodyOsc.stop(now + 0.34);

      step++;
      if (step % 4 === 0) {
        chordIndex = (chordIndex + 1) % chords.length;
      }
    };

    this.synthInterval = window.setInterval(playStep, 250);
  }

  private pauseSynthetic() {
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  private resumeSynthetic() {
    if (!this.synthInterval && this.isSynthetic) {
      this.startSyntheticTrack();
    }
  }

  private stopSynthetic() {
    this.pauseSynthetic();
    this.isSynthetic = false;
  }
}

export const audioEngine = new AudioEngineService();
