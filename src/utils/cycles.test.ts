import { describe, it, expect } from 'vitest';
import {
  getCurrentCycleInfo,
  getISOWeekNumber,
  isTimestampInCycle,
  getCycleNoun,
  CycleFrequency,
} from './cycles';

describe('Cycle calculation utilities', () => {
  it('correctly calculates ISO week numbers', () => {
    // 2026-11-04 is a Wednesday in Week 45
    const date = new Date('2026-11-04T12:00:00Z');
    const { year, week } = getISOWeekNumber(date);
    expect(year).toBe(2026);
    expect(week).toBe(45);
  });

  it('generates weekly cycle info with Monday start and Sunday end', () => {
    const fixedDate = new Date('2026-11-04T12:00:00Z'); // Wednesday
    const cycle = getCurrentCycleInfo('weekly', fixedDate);

    expect(cycle.frequency).toBe('weekly');
    expect(cycle.key).toBe('2026-W45');
    expect(cycle.label).toContain('Week 45');
    expect(cycle.startTimestamp).toBeLessThan(fixedDate.getTime());
    expect(cycle.endTimestamp).toBeGreaterThan(fixedDate.getTime());
    expect(isTimestampInCycle(fixedDate.getTime(), cycle)).toBe(true);
  });

  it('generates fortnightly cycle info for 14-day sprint intervals', () => {
    const fixedDate = new Date('2026-11-04T12:00:00Z'); // Week 45 -> Fortnight 23
    const cycle = getCurrentCycleInfo('fortnightly', fixedDate);

    expect(cycle.frequency).toBe('fortnightly');
    expect(cycle.key).toBe('2026-FN23');
    expect(cycle.label).toContain('Fortnight 23');
    expect(isTimestampInCycle(fixedDate.getTime(), cycle)).toBe(true);
  });

  it('generates monthly cycle info for calendar month intervals', () => {
    const fixedDate = new Date('2026-11-04T12:00:00Z');
    const cycle = getCurrentCycleInfo('monthly', fixedDate);

    expect(cycle.frequency).toBe('monthly');
    expect(cycle.key).toBe('2026-11');
    expect(cycle.label).toContain('November 2026');
    expect(isTimestampInCycle(fixedDate.getTime(), cycle)).toBe(true);
  });

  it('identifies timestamps outside of the cycle window', () => {
    const fixedDate = new Date('2026-11-04T12:00:00Z');
    const cycle = getCurrentCycleInfo('weekly', fixedDate);

    // 2 weeks ago
    const pastTimestamp = fixedDate.getTime() - 14 * 86400000;
    expect(isTimestampInCycle(pastTimestamp, cycle)).toBe(false);

    // 2 weeks in future
    const futureTimestamp = fixedDate.getTime() + 14 * 86400000;
    expect(isTimestampInCycle(futureTimestamp, cycle)).toBe(false);
  });

  it('returns proper singular nouns for each cycle frequency', () => {
    expect(getCycleNoun('weekly')).toBe('Week');
    expect(getCycleNoun('fortnightly')).toBe('Fortnight');
    expect(getCycleNoun('monthly')).toBe('Month');
  });
});
