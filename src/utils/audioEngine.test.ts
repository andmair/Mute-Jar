import { describe, it, expect } from 'vitest';
import { extractSpectralVector, detectPitchHz, computeVoiceMatchScore } from './audioEngine';

describe('Voiceprint DSP & Speaker Matching', () => {
  it('extracts a normalized 16-band unit vector from FFT frequency data', () => {
    const fftData = new Uint8Array(1024);
    // Simulate vocal formant energy around 500Hz - 1500Hz
    // At 44.1kHz, 1024 FFT bins means each bin is ~21.5 Hz
    for (let i = 20; i < 70; i++) {
      fftData[i] = 180;
    }

    const vector = extractSpectralVector(fftData, 44100);
    expect(vector).toHaveLength(16);

    // Vector should be normalized to unit length (L2 norm ≈ 1.0)
    let sumSq = 0;
    for (const val of vector) {
      sumSq += val * val;
    }
    expect(Math.sqrt(sumSq)).toBeCloseTo(1.0, 2);
  });

  it('computes 100% cosine similarity for identical spectral vectors', () => {
    const vector = [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25];
    // Normalize to unit length
    const norm = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0));
    const unitVec = vector.map(v => v / norm);

    const score = computeVoiceMatchScore(unitVec, unitVec, 150, 150, [130, 170]);
    expect(score).toBeGreaterThanOrEqual(95);
  });

  it('penalizes voice match score when pitch and spectral shape diverge significantly (e.g. background radio/talker)', () => {
    // Vector A: High energy in lower bands (e.g. deep male speaker around 110 Hz)
    const vecA = new Array(16).fill(0.05);
    vecA[0] = 0.8;
    vecA[1] = 0.7;
    const normA = Math.sqrt(vecA.reduce((acc, v) => acc + v * v, 0));
    const unitA = vecA.map(v => v / normA);

    // Vector B: High energy in high bands (e.g. higher-pitched radio talker around 260 Hz)
    const vecB = new Array(16).fill(0.05);
    vecB[8] = 0.8;
    vecB[9] = 0.7;
    const normB = Math.sqrt(vecB.reduce((acc, v) => acc + v * v, 0));
    const unitB = vecB.map(v => v / normB);

    const score = computeVoiceMatchScore(unitB, unitA, 270, 115, [95, 135]);
    // Should be low (<50%), well below the 65% trigger threshold
    expect(score).toBeLessThan(50);
  });

  it('detects fundamental pitch (F0) from a synthetic sine wave via autocorrelation', () => {
    const sampleRate = 44100;
    const targetFreq = 150; // 150 Hz voice fundamental
    const buffer = new Float32Array(2048);

    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = 0.5 * Math.sin((2 * Math.PI * targetFreq * i) / sampleRate);
    }

    const detectedPitch = detectPitchHz(buffer, sampleRate);
    expect(detectedPitch).not.toBeNull();
    // Allow slight tolerance within 5 Hz
    expect(Math.abs((detectedPitch || 0) - targetFreq)).toBeLessThanOrEqual(5);
  });

  it('returns null pitch for low-energy background room silence', () => {
    const sampleRate = 44100;
    const silenceBuffer = new Float32Array(2048); // All zeros
    const detectedPitch = detectPitchHz(silenceBuffer, sampleRate);
    expect(detectedPitch).toBeNull();
  });
});
