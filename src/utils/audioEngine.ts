import { UserVoiceProfile } from '../types';

/**
 * 16 Logarithmically-spaced frequency bands (90 Hz to 6200 Hz)
 * covering fundamental speech frequencies and vocal tract formants F1, F2, F3.
 */
export const FREQ_BANDS: [number, number][] = [
  [90, 150],    // Fundamental bass (F0 low male)
  [150, 220],   // Male F0 / Low female F0
  [220, 320],   // Female F0 / High F0
  [320, 450],   // Lower vocal resonance
  [450, 600],   // Formant F1 region
  [600, 800],   // Formant F1 region
  [800, 1050],  // Vowel transition
  [1050, 1350], // Formant F2 region
  [1350, 1700], // Formant F2 region
  [1700, 2100], // Formant F2/F3 region
  [2100, 2550], // Formant F3 region
  [2550, 3050], // Formant F3/F4 region
  [3050, 3600], // Consonant clarity region
  [3600, 4200], // Sibilance onset
  [4200, 5000], // Fricative band
  [5000, 6200], // High air/presence
];

/**
 * Extracts a 16-band normalized spectral energy vector (unit vector) from FFT bins.
 */
export function extractSpectralVector(fftData: Uint8Array, sampleRate: number): number[] {
  const binWidth = sampleRate / (fftData.length * 2);
  const vector: number[] = new Array(FREQ_BANDS.length).fill(0);

  for (let b = 0; b < FREQ_BANDS.length; b++) {
    const [minF, maxF] = FREQ_BANDS[b];
    const minBin = Math.max(1, Math.floor(minF / binWidth));
    const maxBin = Math.min(fftData.length - 1, Math.ceil(maxF / binWidth));

    let sum = 0;
    let count = 0;
    for (let k = minBin; k <= maxBin; k++) {
      sum += fftData[k] || 0;
      count++;
    }
    vector[b] = count > 0 ? sum / count : 0;
  }

  // Normalize vector to unit length (Euclidean L2 norm) for fast cosine dot-product
  let normSq = 0;
  for (let i = 0; i < vector.length; i++) {
    normSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(normSq);
  if (norm > 0.0001) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] = vector[i] / norm;
    }
  }
  return vector;
}

/**
 * Autocorrelation fundamental pitch detection (F0 in Hz)
 * Identifies the dominant speaking pitch between 75 Hz and 360 Hz.
 */
export function detectPitchHz(timeDomainData: Float32Array, sampleRate: number): number | null {
  // Check RMS energy
  let sumSq = 0;
  for (let i = 0; i < timeDomainData.length; i++) {
    sumSq += timeDomainData[i] * timeDomainData[i];
  }
  const rms = Math.sqrt(sumSq / timeDomainData.length);
  if (rms < 0.015) return null; // Silence or quiet room noise

  const minLag = Math.floor(sampleRate / 360);
  const maxLag = Math.ceil(sampleRate / 75);

  let bestLag = -1;
  let bestCorrelation = 0;

  let zeroLag = 0;
  for (let i = 0; i < timeDomainData.length - maxLag; i++) {
    zeroLag += timeDomainData[i] * timeDomainData[i];
  }
  if (zeroLag === 0) return null;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    for (let i = 0; i < timeDomainData.length - maxLag; i++) {
      corr += timeDomainData[i] * timeDomainData[i + lag];
    }
    const normCorr = corr / zeroLag;
    if (normCorr > bestCorrelation) {
      bestCorrelation = normCorr;
      bestLag = lag;
    }
  }

  if (bestCorrelation > 0.35 && bestLag > 0) {
    return Math.round(sampleRate / bestLag);
  }
  return null;
}

/**
 * Compute similarity score (0% to 100%) between incoming speech frame and user's registered voiceprint.
 * Combines spectral formant cosine similarity (70%) and fundamental pitch distance (30%).
 */
export function computeVoiceMatchScore(
  currentVector: number[],
  profileVector: number[],
  currentPitch: number | null,
  profileMedianPitch: number,
  profilePitchRange: [number, number]
): number {
  if (!profileVector || profileVector.length === 0 || !currentVector || currentVector.length === 0) {
    return 100;
  }

  // 1. Spectral cosine similarity (dot product of unit vectors)
  let dot = 0;
  const len = Math.min(currentVector.length, profileVector.length);
  for (let i = 0; i < len; i++) {
    dot += currentVector[i] * profileVector[i];
  }
  const spectralSim = Math.max(0, Math.min(1, dot));

  // 2. Fundamental pitch proximity
  let pitchSim = 0.7; // default for unvoiced consonant frames
  if (currentPitch && profileMedianPitch > 0) {
    const [minP, maxP] = profilePitchRange;
    if (currentPitch >= minP * 0.85 && currentPitch <= maxP * 1.15) {
      const delta = Math.abs(currentPitch - profileMedianPitch);
      pitchSim = Math.max(0.6, 1.0 - (delta / profileMedianPitch) * 0.7);
    } else {
      const delta = Math.min(Math.abs(currentPitch - minP), Math.abs(currentPitch - maxP));
      pitchSim = Math.max(0.1, 0.6 - (delta / 100) * 0.4);
    }
  }

  // Combined score: 70% spectral formant resonance + 30% pitch alignment
  const combined = spectralSim * 0.7 + pitchSim * 0.3;
  return Math.min(100, Math.max(0, Math.round(combined * 100)));
}

export interface AudioEngineCallbacks {
  onSpeech: (volume: number) => void;
  onLevelUpdate: (
    micLevel: number,
    threshold: number,
    peerLevel: number,
    noiseFloor: number,
    isSpeech: boolean,
    voiceMatchScore?: number,
    isSpeakerMatch?: boolean,
    detectedPitchHz?: number | null
  ) => void;
}

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private meetingStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private meetingAnalyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  private lastSpeechTriggerTime: number = 0;
  private cooldownMs: number = 3500; // minimum ms between coin drops
  private consecutiveVoiceFrames: number = 0;
  private requiredConsecutiveFrames: number = 4; // ~60ms of sustained direct speech

  // Adaptive Background Noise Floor tracking
  private adaptiveNoiseFloor: number = 10; // 0 to 100 scale
  private calibratedFloor: number = 0; // manually calibrated background floor
  private filterBackgroundNoise: boolean = true;
  private noiseFloorMargin: number = 15; // requires voice to be at least +15% above ambient background
  private microphoneMode: 'near_field' | 'headset' | 'standard' = 'near_field';

  // Speaker Voice Pattern & Voiceprint verification
  private voiceProfile: UserVoiceProfile | null = null;
  private voiceProfileEnabled: boolean = true;
  private voiceMatchThreshold: number = 65; // minimum match % required
  private smoothedVoiceMatch: number = 80;

  // Speech dynamics & onset tracking
  private previousLevels: number[] = [];
  private readonly HISTORY_SIZE = 5;

  private onSpeechCallback: ((volume: number) => void) | null = null;
  private onLevelUpdateCallback: (
    (
      micLevel: number,
      threshold: number,
      peerLevel: number,
      noiseFloor: number,
      isSpeech: boolean,
      voiceMatchScore?: number,
      isSpeakerMatch?: boolean,
      detectedPitchHz?: number | null
    ) => void
  ) | null = null;

  // Sound FX settings
  private soundEnabled: boolean = true;
  private soundVolume: number = 0.7;

  // Base sensitivity 1 (least sensitive) to 10 (most sensitive)
  private sensitivity: number = 6;

  public setSoundSettings(enabled: boolean, volume: number) {
    this.soundEnabled = enabled;
    this.soundVolume = Math.max(0, Math.min(1, volume));
  }

  public setSensitivity(sensitivity: number) {
    this.sensitivity = Math.max(1, Math.min(10, sensitivity));
  }

  public setFilterSettings(
    filterBackground: boolean = true,
    margin: number = 15,
    mode: 'near_field' | 'headset' | 'standard' = 'near_field',
    calibratedFloor: number = 0
  ) {
    this.filterBackgroundNoise = filterBackground;
    this.noiseFloorMargin = Math.max(8, Math.min(30, margin));
    this.microphoneMode = mode;
    if (calibratedFloor > 0) {
      this.calibratedFloor = calibratedFloor;
      this.adaptiveNoiseFloor = Math.max(this.adaptiveNoiseFloor, calibratedFloor);
    }
  }

  public setVoiceProfileSettings(
    enabled: boolean = true,
    profile: UserVoiceProfile | null = null,
    threshold: number = 65
  ) {
    this.voiceProfileEnabled = enabled;
    this.voiceProfile = profile;
    this.voiceMatchThreshold = Math.max(40, Math.min(90, threshold));
  }

  public setCallbacks(
    onSpeech: (volume: number) => void,
    onLevelUpdate: (
      micLevel: number,
      threshold: number,
      peerLevel: number,
      noiseFloor: number,
      isSpeech: boolean,
      voiceMatchScore?: number,
      isSpeakerMatch?: boolean,
      detectedPitchHz?: number | null
    ) => void
  ) {
    this.onSpeechCallback = onSpeech;
    this.onLevelUpdateCallback = onLevelUpdate;
  }

  /**
   * Synthesize a playful cartoon glass coin drop & chime sound using Web Audio API oscillators.
   * Completely offline, zero asset files needed.
   */
  public playCoinSound() {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.audioCtx || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.soundVolume * 0.45, now);
      masterGain.connect(ctx.destination);

      // Primary bright metallic clink (High pitch chime)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(2150, now);
      osc1.frequency.exponentialRampToValueAtTime(1400, now + 0.12);

      gain1.gain.setValueAtTime(0.8, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc1.connect(gain1);
      gain1.connect(masterGain);

      // Secondary coin resonance chime (Two-tone glass ping)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(2880, now + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(1920, now + 0.25);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.9, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc2.connect(gain2);
      gain2.connect(masterGain);

      // Glass jar resonance body (warm cartoon low-mid harmonic)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(740, now);
      osc3.frequency.exponentialRampToValueAtTime(420, now + 0.18);

      gain3.gain.setValueAtTime(0.5, now);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc3.connect(gain3);
      gain3.connect(masterGain);

      osc1.start(now);
      osc1.stop(now + 0.3);

      osc2.start(now + 0.04);
      osc2.stop(now + 0.48);

      osc3.start(now);
      osc3.stop(now + 0.25);
    } catch (e) {
      console.warn('Audio synthesis warning:', e);
    }
  }

  /**
   * Start listening to user microphone with real-time speech detection
   * Configures WebRTC constraints to reject ambient noise and disable excessive auto-gain.
   */
  public async startMicrophone(): Promise<boolean> {
    if (this.isRunning && this.micStream) return true;

    try {
      this.audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      // CRITICAL FOR RADIO REJECTION:
      // Turn echo cancellation and noise suppression ON.
      // AutoGainControl is set to false to prevent browser AGC from artificially boosting
      // distant background radio voices during quiet pauses.
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      const micSource = this.audioCtx.createMediaStreamSource(this.micStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.25;
      micSource.connect(this.analyser);

      this.isRunning = true;
      this.startAnalysisLoop();
      return true;
    } catch (err) {
      console.error('Failed to access microphone:', err);
      return false;
    }
  }

  /**
   * One-click 2-second calibration:
   * Samples current ambient sound (radio playing, fan, room noise)
   * to accurately establish the exact background baseline floor.
   */
  public calibrateBackground(
    durationMs: number = 2000,
    onProgress?: (percent: number) => void
  ): Promise<{ averageFloor: number; peakFloor: number }> {
    return new Promise((resolve) => {
      if (!this.analyser || !this.isRunning) {
        resolve({ averageFloor: 12, peakFloor: 18 });
        return;
      }

      const startTime = Date.now();
      const samples: number[] = [];
      const interval = 50; // sample every 50ms

      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const percent = Math.min(100, Math.round((elapsed / durationMs) * 100));
        if (onProgress) onProgress(percent);

        if (this.analyser) {
          const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
          this.analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          let count = 0;
          for (let i = 3; i < 38; i++) {
            sum += dataArray[i];
            count++;
          }
          const level = count > 0 ? (sum / count / 255) * 100 : 0;
          samples.push(level);
        }

        if (elapsed >= durationMs) {
          clearInterval(timer);
          if (samples.length === 0) {
            resolve({ averageFloor: 15, peakFloor: 22 });
            return;
          }

          const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
          const peak = Math.round(Math.max(...samples));

          this.calibratedFloor = Math.max(avg, peak * 0.9);
          this.adaptiveNoiseFloor = this.calibratedFloor;

          resolve({ averageFloor: avg, peakFloor: peak });
        }
      }, interval);
    });
  }

  /**
   * One-click 3.5-second Voice Pattern Calibration:
   * Captures the user's personal fundamental pitch (F0) and 16-band vocal tract formant resonances
   * to train an acoustic fingerprint that isolates their speech from all background talkers/radios.
   */
  public calibrateVoiceProfile(
    durationMs: number = 3500,
    onProgress?: (percent: number) => void
  ): Promise<UserVoiceProfile> {
    return new Promise((resolve) => {
      const sampleRate = this.audioCtx ? this.audioCtx.sampleRate : 44100;
      if (!this.analyser || !this.isRunning) {
        const fallback: UserVoiceProfile = {
          medianPitchHz: 140,
          pitchRangeHz: [110, 185],
          spectralFingerprint: new Array(16).fill(1 / Math.sqrt(16)),
          calibratedAt: Date.now(),
          sampleCount: 1,
        };
        this.voiceProfile = fallback;
        resolve(fallback);
        return;
      }

      const startTime = Date.now();
      const spectralVectors: number[][] = [];
      const pitchSamples: number[] = [];
      const interval = 50;

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      const timeArray = new Float32Array(this.analyser.fftSize);

      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const percent = Math.min(100, Math.round((elapsed / durationMs) * 100));
        if (onProgress) onProgress(percent);

        if (this.analyser) {
          this.analyser.getByteFrequencyData(dataArray);

          if (this.analyser.getFloatTimeDomainData) {
            this.analyser.getFloatTimeDomainData(timeArray);
          } else {
            const byteData = new Uint8Array(this.analyser.fftSize);
            this.analyser.getByteTimeDomainData(byteData);
            for (let i = 0; i < byteData.length; i++) {
              timeArray[i] = (byteData[i] - 128) / 128;
            }
          }

          let sum = 0;
          for (let i = 3; i < 38; i++) sum += dataArray[i];
          const level = (sum / 35 / 255) * 100;

          // Only sample when voice energy exceeds ambient floor
          if (level > (this.adaptiveNoiseFloor + 3)) {
            const vec = extractSpectralVector(dataArray, sampleRate);
            spectralVectors.push(vec);

            const pitch = detectPitchHz(timeArray, sampleRate);
            if (pitch && pitch >= 75 && pitch <= 360) {
              pitchSamples.push(pitch);
            }
          }
        }

        if (elapsed >= durationMs) {
          clearInterval(timer);

          // Average collected spectral vectors
          const averagedVector: number[] = new Array(16).fill(0);
          if (spectralVectors.length > 0) {
            for (let v = 0; v < spectralVectors.length; v++) {
              for (let b = 0; b < 16; b++) {
                averagedVector[b] += spectralVectors[v][b];
              }
            }
            let normSq = 0;
            for (let b = 0; b < 16; b++) {
              averagedVector[b] /= spectralVectors.length;
              normSq += averagedVector[b] * averagedVector[b];
            }
            const norm = Math.sqrt(normSq);
            if (norm > 0.0001) {
              for (let b = 0; b < 16; b++) {
                averagedVector[b] /= norm;
              }
            }
          } else {
            for (let b = 0; b < 16; b++) averagedVector[b] = 1 / Math.sqrt(16);
          }

          // Pitch analysis
          let medianPitch = 140;
          let minPitch = 110;
          let maxPitch = 180;
          if (pitchSamples.length > 0) {
            pitchSamples.sort((a, b) => a - b);
            medianPitch = pitchSamples[Math.floor(pitchSamples.length / 2)];
            minPitch = pitchSamples[Math.floor(pitchSamples.length * 0.15)] || medianPitch * 0.8;
            maxPitch = pitchSamples[Math.floor(pitchSamples.length * 0.85)] || medianPitch * 1.25;
          }

          const profile: UserVoiceProfile = {
            medianPitchHz: Math.round(medianPitch),
            pitchRangeHz: [Math.round(minPitch), Math.round(maxPitch)],
            spectralFingerprint: averagedVector,
            calibratedAt: Date.now(),
            sampleCount: spectralVectors.length,
          };

          this.voiceProfile = profile;
          resolve(profile);
        }
      }, interval);
    });
  }

  /**
   * Optional: Connect meeting audio (Tab or System Audio) via getDisplayMedia
   */
  public async connectMeetingAudio(): Promise<boolean> {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        stream.getTracks().forEach((t) => t.stop());
        return false;
      }

      this.meetingStream = stream;
      const meetingSource = this.audioCtx.createMediaStreamSource(stream);
      this.meetingAnalyser = this.audioCtx.createAnalyser();
      this.meetingAnalyser.fftSize = 512;
      meetingSource.connect(this.meetingAnalyser);

      audioTracks[0].onended = () => {
        this.disconnectMeetingAudio();
      };

      return true;
    } catch (err) {
      console.warn('Meeting audio capture cancelled or unavailable:', err);
      return false;
    }
  }

  public disconnectMeetingAudio() {
    if (this.meetingStream) {
      this.meetingStream.getTracks().forEach((t) => t.stop());
      this.meetingStream = null;
      this.meetingAnalyser = null;
    }
  }

  public hasMeetingAudioConnected(): boolean {
    return !!this.meetingStream && this.meetingStream.active;
  }

  public stopAll() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }

    this.disconnectMeetingAudio();

    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }

  private startAnalysisLoop() {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const meetingDataArray = new Uint8Array(512);
    const timeDomainArray = new Float32Array(this.analyser.fftSize);

    const checkAudio = () => {
      if (!this.isRunning || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);

      // 1. Calculate human vocal band RMS (bins 3 to 38 represent ~280Hz - 3500Hz)
      let sum = 0;
      let vocalBinsCount = 0;
      const startBin = 3;
      const endBin = Math.min(38, dataArray.length);

      for (let i = startBin; i < endBin; i++) {
        sum += dataArray[i];
        vocalBinsCount++;
      }

      const vocalAverage = vocalBinsCount > 0 ? sum / vocalBinsCount : 0;
      const micNormalizedLevel = Math.min(100, Math.round((vocalAverage / 255) * 100));

      // 2. Track historical levels for speech onset acceleration detection
      this.previousLevels.push(micNormalizedLevel);
      if (this.previousLevels.length > this.HISTORY_SIZE) {
        this.previousLevels.shift();
      }

      // 3. ADAPTIVE BACKGROUND NOISE FLOOR TRACKER
      // If sound is lower than current floor, drop floor relatively quickly
      // If sound is steady or slowly drifting (like radio/HVAC), creep upward slowly
      if (micNormalizedLevel < this.adaptiveNoiseFloor) {
        this.adaptiveNoiseFloor = this.adaptiveNoiseFloor * 0.94 + micNormalizedLevel * 0.06;
      } else {
        // Leaky integration: steady background sounds (radio) raise the floor, but brief speech bursts do not
        this.adaptiveNoiseFloor = this.adaptiveNoiseFloor * 0.997 + micNormalizedLevel * 0.003;
      }

      // Ensure adaptive floor respects any user calibration
      const effectiveFloor = Math.max(
        Math.round(this.adaptiveNoiseFloor),
        Math.round(this.calibratedFloor)
      );

      // 4. Meeting Audio Level Check (if screen/tab shared)
      let peerNormalizedLevel = 0;
      if (this.meetingAnalyser) {
        this.meetingAnalyser.getByteFrequencyData(meetingDataArray);
        let peerSum = 0;
        for (let i = 2; i < 40; i++) {
          peerSum += meetingDataArray[i] || 0;
        }
        peerNormalizedLevel = Math.min(100, Math.round((peerSum / 38 / 255) * 100));
      }

      // 5. COMPUTE DYNAMIC SPEECH THRESHOLD
      // Static baseline from sensitivity slider: Level 1 = 46%, Level 5 = 26%, Level 10 = 12%
      const baseThreshold = Math.round(50 - this.sensitivity * 3.8);

      // Effective threshold accounts for ambient background noise:
      // Must be at least (effectiveFloor + noiseFloorMargin) so background noise stays safely below!
      let effectiveThreshold = baseThreshold;
      if (this.filterBackgroundNoise) {
        effectiveThreshold = Math.max(
          baseThreshold,
          Math.min(92, effectiveFloor + this.noiseFloorMargin)
        );
      }

      // Adjust for microphone proximity profile
      if (this.microphoneMode === 'headset') {
        effectiveThreshold = Math.max(effectiveThreshold, effectiveFloor + 18);
      } else if (this.microphoneMode === 'near_field') {
        effectiveThreshold = Math.max(effectiveThreshold, effectiveFloor + 14);
      }

      // 6. ONSET / CREST FACTOR CHECK
      // Real speech right in front of the mic has a sharp onset burst (plosives: p, t, b, k, ch)
      // Diffuse background radio has low onset variance and high reverberation.
      const oldestLevel = this.previousLevels[0] || micNormalizedLevel;
      const onsetBurst = micNormalizedLevel - oldestLevel;
      const hasSpeechBurstDynamics =
        this.microphoneMode === 'standard' || onsetBurst >= 5 || micNormalizedLevel > effectiveThreshold + 10;

      // 6.5. SPEAKER VOICEPRINT & VOICE MATCH VERIFICATION
      let voiceMatchScore = 100;
      let isSpeakerMatch = true;
      let detectedPitch: number | null = null;

      if (this.voiceProfile && this.voiceProfileEnabled && this.audioCtx) {
        if (micNormalizedLevel > (effectiveFloor + 2)) {
          const sampleRate = this.audioCtx.sampleRate || 44100;
          const currentVec = extractSpectralVector(dataArray, sampleRate);

          if (this.analyser.getFloatTimeDomainData) {
            this.analyser.getFloatTimeDomainData(timeDomainArray);
          } else {
            const byteData = new Uint8Array(this.analyser.fftSize);
            this.analyser.getByteTimeDomainData(byteData);
            for (let i = 0; i < byteData.length; i++) {
              timeDomainArray[i] = (byteData[i] - 128) / 128;
            }
          }

          detectedPitch = detectPitchHz(timeDomainArray, sampleRate);

          const rawScore = computeVoiceMatchScore(
            currentVec,
            this.voiceProfile.spectralFingerprint,
            detectedPitch,
            this.voiceProfile.medianPitchHz,
            this.voiceProfile.pitchRangeHz
          );

          this.smoothedVoiceMatch = Math.round(this.smoothedVoiceMatch * 0.7 + rawScore * 0.3);
          voiceMatchScore = this.smoothedVoiceMatch;
          isSpeakerMatch = voiceMatchScore >= this.voiceMatchThreshold;
        } else {
          voiceMatchScore = this.smoothedVoiceMatch;
        }
      }

      // Check if voice is active:
      // - Must exceed the dynamic background-adjusted threshold
      // - Must have speech onset dynamics (rejecting flat radio drone)
      // - Must be significantly louder than remote peer audio (echo prevention)
      // - Must match the user's voiceprint profile (rejecting background talkers and radio voices)
      const isAboveThreshold = micNormalizedLevel >= effectiveThreshold;
      const isVoiceActive =
        isAboveThreshold &&
        hasSpeechBurstDynamics &&
        (!this.meetingAnalyser || micNormalizedLevel > peerNormalizedLevel * 0.7) &&
        (!this.voiceProfile || !this.voiceProfileEnabled || isSpeakerMatch);

      // 7. Notify visualizer
      if (this.onLevelUpdateCallback) {
        this.onLevelUpdateCallback(
          micNormalizedLevel,
          effectiveThreshold,
          peerNormalizedLevel,
          effectiveFloor,
          isVoiceActive,
          voiceMatchScore,
          isSpeakerMatch,
          detectedPitch
        );
      }

      // 8. Trigger Speech Event after sustained frames
      const now = Date.now();
      if (isVoiceActive) {
        this.consecutiveVoiceFrames++;
        if (this.consecutiveVoiceFrames >= this.requiredConsecutiveFrames) {
          if (now - this.lastSpeechTriggerTime > this.cooldownMs) {
            this.lastSpeechTriggerTime = now;
            this.consecutiveVoiceFrames = 0;

            if (this.onSpeechCallback) {
              this.onSpeechCallback(micNormalizedLevel);
            }
          }
        }
      } else {
        if (this.consecutiveVoiceFrames > 0) {
          this.consecutiveVoiceFrames--;
        }
      }

      this.animationFrameId = requestAnimationFrame(checkAudio);
    };

    this.animationFrameId = requestAnimationFrame(checkAudio);
  }
}

export const audioEngine = new AudioEngine();
