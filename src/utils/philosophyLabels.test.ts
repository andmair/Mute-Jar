import { describe, it, expect } from 'vitest';
import {
  PHILOSOPHY_CONFIGS,
  getPhilosophyDisplayTitle,
  getPhilosophyCombinedLabel,
} from './philosophyLabels';
import { CHARITY_AGGREGATORS, getCharityById } from './charities';
import { sanitizeUrl, sanitizeText } from './security';

describe('Philosophy Labels & Metadata', () => {
  it('provides clean action-focused philosophy titles', () => {
    expect(getPhilosophyDisplayTitle('pragmatist')).toBe('The Habit Builder');
    expect(getPhilosophyDisplayTitle('roastmaster')).toBe('The Forfeit Master');
    expect(getPhilosophyDisplayTitle('saint')).toBe('The Saint');
  });

  it('provides accurate target units and nouns for all personas', () => {
    expect(PHILOSOPHY_CONFIGS.saint.targetUnitLabel).toBe('Mutecoins');
    expect(PHILOSOPHY_CONFIGS.saint.targetNoun).toBe('Donation Threshold');

    expect(PHILOSOPHY_CONFIGS.pragmatist.targetUnitLabel).toBe('Mutecoins');
    expect(PHILOSOPHY_CONFIGS.pragmatist.targetNoun).toBe('Habit Milestone Target');

    expect(PHILOSOPHY_CONFIGS.roastmaster.targetUnitLabel).toBe('Mutecoins');
    expect(PHILOSOPHY_CONFIGS.roastmaster.targetNoun).toBe('Forfeit Trigger Target');
  });

  it('provides combined labels without classic persona names', () => {
    const habitInfo = getPhilosophyCombinedLabel('pragmatist');
    expect(habitInfo.title).toBe('The Habit Builder');
    expect(habitInfo.subtitle).toBe('Productivity & Growth');
    expect(habitInfo.subtitle).not.toContain('Pragmatist');

    const forfeitInfo = getPhilosophyCombinedLabel('roastmaster');
    expect(forfeitInfo.title).toBe('The Forfeit Master');
    expect(forfeitInfo.subtitle).toBe('Team Treats & Dares');
    expect(forfeitInfo.subtitle).not.toContain('Roast Master');
  });
});

describe('Charity Aggregator Lookup', () => {
  it('finds globalgiving aggregator by id', () => {
    const found = getCharityById('globalgiving');
    expect(found).toBeDefined();
    expect(found?.name).toBe('GlobalGiving');
    expect(found?.region).toBe('global');
  });

  it('returns undefined for non-existent charity id', () => {
    expect(getCharityById('unknown-cause')).toBeUndefined();
  });

  it('includes multiple global and regional aggregators', () => {
    expect(CHARITY_AGGREGATORS.length).toBeGreaterThanOrEqual(6);
    const regions = CHARITY_AGGREGATORS.map((c) => c.region);
    expect(regions).toContain('global');
    expect(regions).toContain('uk');
    expect(regions).toContain('au');
  });
});

describe('Security & Sanitization', () => {
  it('sanitizes safe https URLs and blocks javascript/data URIs', () => {
    expect(sanitizeUrl('https://globalgiving.org')).toBe('https://globalgiving.org/');
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeUrl('data:text/html,<script>')).toBe('');
  });

  it('sanitizes text input, strips control characters, and enforces length bounds', () => {
    const raw = 'Hello \x00World\x1F';
    expect(sanitizeText(raw, 50)).toBe('Hello World');
    expect(sanitizeText('A'.repeat(100), 10)).toBe('AAAAAAAAAA');
  });
});

describe('Audio Engine Background Noise Rejection', () => {
  it('accepts filter settings and bounds margin within valid range', async () => {
    const { audioEngine } = await import('./audioEngine');
    expect(() => audioEngine.setFilterSettings(true, 18, 'near_field', 22)).not.toThrow();
    expect(() => audioEngine.setFilterSettings(false, 5, 'headset', 0)).not.toThrow();
  });
});

