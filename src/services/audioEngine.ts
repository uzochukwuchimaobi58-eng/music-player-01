import { EqualizerSettings } from '../types';
import { EQ_FREQUENCIES } from '../data/defaultTracks';

export type TrendingAudioEffect = 'normal' | 'sped_up' | 'slowed_reverb' | 'nightcore' | 'bass_drop' | 'lofi_tape';

class AudioEngineService {
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
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

      // Create Master Gain & Compressor for Hi-Fi Dynamics
      this.masterGain = this.audioCtx.createGain();
      this.dryGain = this.audioCtx.createGain();
      this.reverbGain = this.audioCtx.createGain();
      this.reverbGain.gain.value = 0.15;

      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.audioCtx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.audioCtx.currentTime);
      this.compressor.ratio.setValueAtTime(4, this.audioCtx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.audioCtx.currentTime);

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
        let prevNode: AudioNode = this.sourceNode;

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
      const length = rate * 2.5; // 2.5 seconds spacious impulse
      const decay = 2.4;
      const impulse = this.audioCtx.createBuffer(2, length, rate);
      const left = impulse.getChannelData(0);
      const right = impulse.getChannelData(1);

      for (let i = 0; i < length; i++) {
        const n = length - i;
        left[i] = ((Math.random() * 2 - 1) * Math.pow(n / length, decay));
        right[i] = ((Math.random() * 2 - 1) * Math.pow(n / length, decay));
      }
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
          const targetVol = this.audioElement.volume || 1;
          this.masterGain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
          this.masterGain.gain.linearRampToValueAtTime(targetVol, this.audioCtx.currentTime + 0.35);
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
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value || 1, now);
      this.masterGain.gain.linearRampToValueAtTime(0.001, now + 0.3);
      setTimeout(() => {
        if (this.audioElement) {
          this.audioElement.pause();
          if (this.masterGain && this.audioCtx) {
            this.masterGain.gain.setValueAtTime(this.audioElement.volume || 1, this.audioCtx.currentTime);
          }
        }
      }, 300);
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
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume));
    }
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
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
        if (this.reverbGain) this.reverbGain.gain.setValueAtTime(0.08, now);
        if (this.bassFilter) this.bassFilter.gain.setValueAtTime(2, now);
        break;

      case 'slowed_reverb':
        this.setPlaybackRate(0.85);
        if (this.reverbGain) this.reverbGain.gain.setValueAtTime(0.55, now);
        if (this.bassFilter) this.bassFilter.gain.setValueAtTime(6, now);
        if (this.trebleFilter) this.trebleFilter.gain.setValueAtTime(-4, now);
        break;

      case 'nightcore':
        this.setPlaybackRate(1.35);
        if (this.audioElement) {
          (this.audioElement as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = false;
        }
        if (this.reverbGain) this.reverbGain.gain.setValueAtTime(0.15, now);
        if (this.trebleFilter) this.trebleFilter.gain.setValueAtTime(4, now);
        break;

      case 'bass_drop':
        this.setPlaybackRate(1.0);
        if (this.reverbGain) this.reverbGain.gain.setValueAtTime(0.12, now);
        if (this.bassFilter) this.bassFilter.gain.setValueAtTime(12, now);
        if (this.trebleFilter) this.trebleFilter.gain.setValueAtTime(3, now);
        break;

      case 'lofi_tape':
        this.setPlaybackRate(0.92);
        if (this.reverbGain) this.reverbGain.gain.setValueAtTime(0.3, now);
        if (this.bassFilter) this.bassFilter.gain.setValueAtTime(4, now);
        if (this.trebleFilter) this.trebleFilter.gain.setValueAtTime(-8, now);
        break;

      case 'normal':
      default:
        this.setPlaybackRate(1.0);
        if (this.audioElement) {
          (this.audioElement as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
        }
        if (this.reverbGain) this.reverbGain.gain.setValueAtTime(0.15, now);
        if (this.bassFilter) this.bassFilter.gain.setValueAtTime(0, now);
        if (this.trebleFilter) this.trebleFilter.gain.setValueAtTime(0, now);
        break;
    }
  }

  public getActiveTrendingEffect(): TrendingAudioEffect {
    return this.activeEffect;
  }

  // --- AI Karaoke & Vocal Attenuator ---
  public toggleKaraokeMode(enabled: boolean) {
    this.isKaraokeMode = enabled;
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    // Attenuate mid frequencies (1kHz - 4kHz where lead vocals reside) and boost reverb
    if (this.eqFilters[1000]) {
      this.eqFilters[1000].gain.setValueAtTime(enabled ? -12 : 0, now);
    }
    if (this.eqFilters[2000]) {
      this.eqFilters[2000].gain.setValueAtTime(enabled ? -14 : 0, now);
    }
    if (this.eqFilters[4000]) {
      this.eqFilters[4000].gain.setValueAtTime(enabled ? -8 : 0, now);
    }
    if (this.reverbGain) {
      this.reverbGain.gain.setValueAtTime(enabled ? 0.35 : 0.15, now);
    }
  }

  public isKaraoke(): boolean {
    return this.isKaraokeMode;
  }

  public applyEqualizer(settings: EqualizerSettings) {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    // Apply Bands
    EQ_FREQUENCIES.forEach((freq) => {
      const filter = this.eqFilters[freq];
      if (filter) {
        let gainVal = settings.enabled ? (settings.bands[freq] || 0) : 0;
        // Adjust for karaoke if active
        if (this.isKaraokeMode && (freq === 1000 || freq === 2000)) {
          gainVal -= 10;
        }
        filter.gain.cancelScheduledValues(now);
        filter.gain.linearRampToValueAtTime(gainVal, now + 0.05);
      }
    });

    // Bass Boost
    if (this.bassFilter) {
      const bassGain = settings.enabled ? (settings.bassBoost / 100) * 12 : 0;
      this.bassFilter.gain.cancelScheduledValues(now);
      this.bassFilter.gain.linearRampToValueAtTime(bassGain, now + 0.05);
    }

    // Treble Boost
    if (this.trebleFilter) {
      const trebleGain = settings.enabled ? (settings.trebleBoost / 100) * 8 : 0;
      this.trebleFilter.gain.cancelScheduledValues(now);
      this.trebleFilter.gain.linearRampToValueAtTime(trebleGain, now + 0.05);
    }

    // Spatial Reverb Wet Gain
    if (this.reverbGain) {
      const reverbVal = settings.enabled ? (settings.spatialReverb / 100) * 0.45 : 0.15;
      this.reverbGain.gain.cancelScheduledValues(now);
      this.reverbGain.gain.linearRampToValueAtTime(reverbVal, now + 0.05);
    }

    // Tube Warmer (Analog Harmonics & Warmth at 250Hz - 500Hz)
    if (settings.enabled && settings.tubeWarmer && settings.tubeWarmer > 0) {
      const warmthDb = (settings.tubeWarmer / 100) * 4.5;
      if (this.eqFilters[250]) {
        const base = settings.bands[250] || 0;
        this.eqFilters[250].gain.linearRampToValueAtTime(base + warmthDb, now + 0.05);
      }
      if (this.eqFilters[500]) {
        const base = settings.bands[500] || 0;
        this.eqFilters[500].gain.linearRampToValueAtTime(base + warmthDb * 0.7, now + 0.05);
      }
    }
  }

  public getFrequencyData(array: Uint8Array) {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array);
    } else {
      // Simulate soft ambient movement if audio context inactive
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
    this.synthGain.gain.value = 0.3;
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

      // Bass note
      const bassOsc = this.audioCtx.createOscillator();
      const bassGain = this.audioCtx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.value = currentChord[0] / 2;
      bassGain.gain.setValueAtTime(0.4, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      bassOsc.connect(bassGain);
      if (this.synthGain) bassGain.connect(this.synthGain);
      bassOsc.start(now);
      bassOsc.stop(now + 0.45);

      // Melody arpeggio
      const noteFreq = currentChord[step % currentChord.length];
      const melodyOsc = this.audioCtx.createOscillator();
      const melodyGain = this.audioCtx.createGain();
      melodyOsc.type = 'sine';
      melodyOsc.frequency.value = noteFreq * (step % 2 === 0 ? 1 : 2);
      melodyGain.gain.setValueAtTime(0.18, now);
      melodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      melodyOsc.connect(melodyGain);
      if (this.synthGain) melodyGain.connect(this.synthGain);
      melodyOsc.start(now);
      melodyOsc.stop(now + 0.38);

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
