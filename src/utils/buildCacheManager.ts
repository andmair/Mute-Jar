/**
 * Build & Local Cache Lifecycle Manager
 * Ensures all local storage, session storage, and cache storage
 * are automatically purged whenever a new application build is deployed.
 */

declare const __APP_BUILD_ID__: string;

const BUILD_STORAGE_KEY = 'mutejar_app_build_id';
const PURGE_TIMESTAMP_KEY = 'mutejar_last_purge_time';

export interface BuildSyncResult {
  wasPurged: boolean;
  buildId: string;
  previousBuildId: string | null;
  purgeTimestamp: number;
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    // Storage access blocked or unavailable
  }
  return null;
}

function getSessionStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage;
    }
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage;
    }
  } catch {
    // Storage access blocked or unavailable
  }
  return null;
}

/**
 * Returns the current compile-time build ID or fallback
 */
export function getCurrentBuildId(): string {
  try {
    if (typeof __APP_BUILD_ID__ !== 'undefined' && __APP_BUILD_ID__) {
      return __APP_BUILD_ID__;
    }
  } catch {
    // In environments where __APP_BUILD_ID__ is not injected
  }
  return 'build-dev-latest';
}

/**
 * Synchronously checks if the current application build differs from the
 * previously stored build in the user's browser.
 * CRITICAL USER DATA GUARANTEE: User settings, profile data, mutes, and pledges
 * are NEVER wiped on app restart or build upgrade. They remain persistent until
 * the user explicitly clicks "Delete User Profile & Wipe All Data" in the danger zone.
 * Only non-essential temporary caches (service worker CacheStorage / sessionStorage)
 * are refreshed during build upgrades.
 */
export function syncBuildAndPurgeCache(): BuildSyncResult {
  const currentBuildId = getCurrentBuildId();
  const localStore = getLocalStorage();
  const sessionStore = getSessionStorage();
  let previousBuildId: string | null = null;

  if (!localStore) {
    return {
      wasPurged: false,
      buildId: currentBuildId,
      previousBuildId: null,
      purgeTimestamp: Date.now(),
    };
  }

  try {
    previousBuildId = localStore.getItem(BUILD_STORAGE_KEY);

    // If there is a recorded previous build and it does NOT match the current build:
    if (previousBuildId && previousBuildId !== currentBuildId) {
      console.info(
        `%c[Mute Jar]%c New build detected (${previousBuildId} -> ${currentBuildId}). Refreshing web caches while preserving user profile & settings...`,
        'color: #f59e0b; font-weight: bold;',
        'color: inherit;'
      );

      // 1. Wipe temporary browser sessionStorage
      if (sessionStore) {
        sessionStore.clear();
      }

      // 2. Purge Service Worker / Web CacheStorage if available to load latest assets
      if (typeof window !== 'undefined' && 'caches' in window) {
        caches.keys().then((keys) => {
          return Promise.all(keys.map((key) => caches.delete(key)));
        }).catch((err) => {
          console.warn('[Mute Jar] Could not purge CacheStorage:', err);
        });
      }

      // 3. Record new build ID and sync timestamp without touching user data!
      const now = Date.now();
      localStore.setItem(BUILD_STORAGE_KEY, currentBuildId);
      localStore.setItem(PURGE_TIMESTAMP_KEY, now.toString());

      return {
        wasPurged: false,
        buildId: currentBuildId,
        previousBuildId,
        purgeTimestamp: now,
      };
    }

    // If it's the first time running
    if (!previousBuildId) {
      localStore.setItem(BUILD_STORAGE_KEY, currentBuildId);
      localStore.setItem(PURGE_TIMESTAMP_KEY, Date.now().toString());
    }

    return {
      wasPurged: false,
      buildId: currentBuildId,
      previousBuildId,
      purgeTimestamp: Date.now(),
    };
  } catch (err) {
    console.warn('[Mute Jar] Error during build cache check:', err);
    return {
      wasPurged: false,
      buildId: currentBuildId,
      previousBuildId,
      purgeTimestamp: Date.now(),
    };
  }
}

/**
 * Clears temporary browser asset cache (CacheStorage & sessionStorage)
 * without destroying the user's saved profile, mute history, or pledges.
 */
export function purgeAllLocalCacheNow(): void {
  try {
    const currentBuildId = getCurrentBuildId();
    const localStore = getLocalStorage();
    const sessionStore = getSessionStorage();

    // Clear temporary session data
    if (sessionStore) {
      sessionStore.clear();
    }

    // Clear service worker caches to fetch latest assets
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      }).catch(() => {});
    }

    if (localStore) {
      localStore.setItem(BUILD_STORAGE_KEY, currentBuildId);
      localStore.setItem(PURGE_TIMESTAMP_KEY, Date.now().toString());
    }

    // Reload page to refresh in-memory state
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  } catch (err) {
    console.warn('[Mute Jar] Error refreshing cache:', err);
  }
}
