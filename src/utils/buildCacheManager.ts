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
 * previously stored build in the user's browser. If a new build is detected,
 * it immediately wipes all localStorage, sessionStorage, and CacheStorage
 * before any component or context reads stale data.
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

    // If there is a recorded previous build and it does NOT match the current build,
    // or if this is the very first build check, clear out stale caches.
    if (previousBuildId && previousBuildId !== currentBuildId) {
      console.info(
        `%c[Mute Jar]%c New build detected (${previousBuildId} -> ${currentBuildId}). Purging all local caches...`,
        'color: #f59e0b; font-weight: bold;',
        'color: inherit;'
      );

      // 1. Wipe all browser localStorage
      localStore.clear();

      // 2. Wipe browser sessionStorage
      if (sessionStore) {
        sessionStore.clear();
      }

      // 3. Purge Service Worker / Web CacheStorage if available
      if (typeof window !== 'undefined' && 'caches' in window) {
        caches.keys().then((keys) => {
          return Promise.all(keys.map((key) => caches.delete(key)));
        }).catch((err) => {
          console.warn('[Mute Jar] Could not purge CacheStorage:', err);
        });
      }

      // 4. Record new build ID and purge timestamp
      const now = Date.now();
      localStore.setItem(BUILD_STORAGE_KEY, currentBuildId);
      localStore.setItem(PURGE_TIMESTAMP_KEY, now.toString());

      return {
        wasPurged: true,
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
 * Allows the user or developer to manually flush all local cache immediately.
 */
export function purgeAllLocalCacheNow(): void {
  try {
    const currentBuildId = getCurrentBuildId();
    const localStore = getLocalStorage();
    const sessionStore = getSessionStorage();

    if (localStore) {
      localStore.clear();
    }
    if (sessionStore) {
      sessionStore.clear();
    }

    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      }).catch(() => {});
    }

    if (localStore) {
      localStore.setItem(BUILD_STORAGE_KEY, currentBuildId);
      localStore.setItem(PURGE_TIMESTAMP_KEY, Date.now().toString());
    }

    // Reload page to reset all in-memory states
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  } catch (err) {
    console.warn('[Mute Jar] Error manually purging cache:', err);
  }
}
