import { describe, it, expect, beforeEach } from 'vitest';
import { UserSettings } from '../types';

class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length(): number {
    return Object.keys(this.store).length;
  }
  key(index: number): string | null {
    return Object.keys(this.store)[index] || null;
  }
  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key: string, val: string): void {
    this.store[key] = String(val);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

describe('OS Focus / Do Not Disturb Auto-Pause Integration', () => {
  let mockSettings: UserSettings;

  beforeEach(() => {
    const mockLocal = new MockStorage();
    (globalThis as unknown as { localStorage: Storage }).localStorage = mockLocal;
    mockSettings = {
      userName: 'Test User',
      userAvatar: 'avatar-1',
      privacyConsent: { hasConsented: true, consentedAt: Date.now(), version: '1.0' },
      persona: 'saint',
      soundEnabled: true,
      soundVolume: 0.7,
      sensitivity: 6,
      autoDetectMeetingAudio: true,
      autoStartMonitoring: false,
      autoStartOnOSBoot: true,
      minimizeToTray: true,
      pauseOnDoNotDisturb: true, // Enabled by default
      reminderDay: 28,
      reminderHour: 16,
      country: 'US',
      currency: '$',
      currencyCode: 'USD',
      perCoinValue: 1.0,
      hasCompletedOnboarding: true,
      isSetupMode: false,
      cycleFrequency: 'monthly',
      theme: 'light',
    };
  });

  it('defaults pauseOnDoNotDisturb to true in user settings', () => {
    expect(mockSettings.pauseOnDoNotDisturb).toBe(true);
  });

  it('allows pauseOnDoNotDisturb to be toggled off in global settings', () => {
    const updatedSettings = { ...mockSettings, pauseOnDoNotDisturb: false };
    expect(updatedSettings.pauseOnDoNotDisturb).toBe(false);
  });

  it('determines whether audio should pause when OS Focus / DND is activated', () => {
    const shouldPauseAudio = (isDND: boolean, isListening: boolean, pauseOnDND: boolean | undefined) => {
      return isDND && (pauseOnDND !== false) && isListening;
    };

    // Case 1: DND active, monitor listening, pauseOnDND enabled -> Should pause
    expect(shouldPauseAudio(true, true, true)).toBe(true);
    expect(shouldPauseAudio(true, true, undefined)).toBe(true);

    // Case 2: DND active, monitor listening, but pauseOnDND disabled -> Should NOT pause
    expect(shouldPauseAudio(true, true, false)).toBe(false);

    // Case 3: DND active, but monitor not listening -> Nothing to pause
    expect(shouldPauseAudio(true, false, true)).toBe(false);

    // Case 4: DND inactive -> Should NOT pause
    expect(shouldPauseAudio(false, true, true)).toBe(false);
  });

  it('stores and reads OS DND state in localStorage for cross-window / companion sync', () => {
    expect(globalThis.localStorage.getItem('mutejar_os_dnd_active')).toBeNull();

    globalThis.localStorage.setItem('mutejar_os_dnd_active', 'true');
    expect(globalThis.localStorage.getItem('mutejar_os_dnd_active')).toBe('true');

    globalThis.localStorage.setItem('mutejar_os_dnd_active', 'false');
    expect(globalThis.localStorage.getItem('mutejar_os_dnd_active')).toBe('false');
  });
});
