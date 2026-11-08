import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncBuildAndPurgeCache, getCurrentBuildId } from './buildCacheManager';

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

describe('buildCacheManager', () => {
  beforeEach(() => {
    const mockLocal = new MockStorage();
    const mockSession = new MockStorage();
    (globalThis as unknown as { localStorage: Storage }).localStorage = mockLocal;
    (globalThis as unknown as { sessionStorage: Storage }).sessionStorage = mockSession;
    vi.restoreAllMocks();
  });

  it('records build ID on first launch without error', () => {
    const result = syncBuildAndPurgeCache();
    expect(result.wasPurged).toBe(false);
    expect(globalThis.localStorage.getItem('mutejar_app_build_id')).toBeTruthy();
  });

  it('detects when the stored build ID matches current build and preserves cache', () => {
    const currentId = getCurrentBuildId();
    globalThis.localStorage.setItem('mutejar_app_build_id', currentId);
    globalThis.localStorage.setItem('mutejar_settings_v1', JSON.stringify({ test: 123 }));

    const result = syncBuildAndPurgeCache();
    expect(result.wasPurged).toBe(false);
    expect(globalThis.localStorage.getItem('mutejar_settings_v1')).toBeTruthy();
  });

  it('preserves user settings, mutes, and profile data when a new build ID is detected', () => {
    // Simulate data from old build
    globalThis.localStorage.setItem('mutejar_app_build_id', 'old-build-v1.0.0');
    globalThis.localStorage.setItem('mutejar_settings_v1', JSON.stringify({ userName: 'Alex', persona: 'saint' }));
    globalThis.localStorage.setItem('mutejar_mutes_v1', JSON.stringify([{ id: 'm1', meetingTitle: 'Sprint Retro' }]));
    globalThis.sessionStorage.setItem('temp_session_data', '12345');

    const result = syncBuildAndPurgeCache();
    expect(result.wasPurged).toBe(false);
    expect(result.previousBuildId).toBe('old-build-v1.0.0');

    // User settings and mute history must persist!
    expect(globalThis.localStorage.getItem('mutejar_settings_v1')).toBeTruthy();
    expect(globalThis.localStorage.getItem('mutejar_mutes_v1')).toBeTruthy();
    const savedSettings = JSON.parse(globalThis.localStorage.getItem('mutejar_settings_v1') || '{}');
    expect(savedSettings.userName).toBe('Alex');

    // Temporary session data should be cleared
    expect(globalThis.sessionStorage.getItem('temp_session_data')).toBeNull();

    // The new build ID must now be registered
    expect(globalThis.localStorage.getItem('mutejar_app_build_id')).toBe(getCurrentBuildId());
  });
});
