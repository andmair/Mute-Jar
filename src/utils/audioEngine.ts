/**
 * Mute Jar Web Audio Engine
 * Handles in-memory Voice Activity Detection (VAD) with Adaptive Background Noise & Radio Rejection.
 * Strictly ephemeral: no audio is ever recorded, stored, or transcribed.
 */

export interface AudioEngineCallbacks {
  onSpeech: (volume: number) => void;
  onLevelUpdate: (
    micLevel: number,
    threshold: number,
    peerLevel: number,
    noiseFloor: number,
    isSpeech: boolean
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

  // Speech dynamics & onset tracking
  private previousLevels: number[] = [];
  private readonly HISTORY_SIZE = 5;

  private onSpeechCallback: ((volume: number) => void) | null = null;
  private onLevelUpdateCallback: (
    (micLevel: number, threshold: number, peerLevel: number, noiseFloor: number, isSpeech: boolean) => void
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

  public setCallbacks(
    onSpeech: (volume: number) => void,
    onLevelUpdate: (micLevel: number, threshold: number, peerLevel: number, noiseFloor: number, isSpeech: boolean) => void
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

      // Check if voice is active:
      // - Must exceed the dynamic background-adjusted threshold
      // - Must have speech onset dynamics (rejecting flat radio drone)
      // - Must be significantly louder than remote peer audio (echo prevention)
      const isAboveThreshold = micNormalizedLevel >= effectiveThreshold;
      const isVoiceActive =
        isAboveThreshold &&
        hasSpeechBurstDynamics &&
        (!this.meetingAnalyser || micNormalizedLevel > peerNormalizedLevel * 0.7);

      // 7. Notify visualizer
      if (this.onLevelUpdateCallback) {
        this.onLevelUpdateCallback(
          micNormalizedLevel,
          effectiveThreshold,
          peerNormalizedLevel,
          effectiveFloor,
          isVoiceActive
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
