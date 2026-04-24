/**
 * Utility for managing local storage caching and synchronization.
 */

const CACHE_KEYS = {
  PRODUCTS: "ght_cache_products",
  PACKAGES: "ght_cache_packages",
  LAST_SYNC: "ght_cache_last_sync",
  METADATA: "ght_cache_metadata",
  VERSION: "ght_cache_version"
};

export const CacheService = {
  /**
   * Checks if the cache version has changed and clears if necessary
   */
  checkVersion: (currentVersion: string) => {
    try {
      const storedVersion = localStorage.getItem(CACHE_KEYS.VERSION);
      if (storedVersion !== currentVersion) {
        console.log(`Cache Version Mismatch: ${storedVersion} -> ${currentVersion}. Clearing cache...`);
        
        // Clear all ght_ cache keys
        Object.values(CACHE_KEYS).forEach(key => {
          localStorage.removeItem(key);
        });
        
        // Set new version
        localStorage.setItem(CACHE_KEYS.VERSION, currentVersion);
        return true; // Cache was cleared
      }
      return false; // Cache version is current
    } catch (e) {
      console.error("Cache Version Check Error:", e);
      return false;
    }
  },

  /**
   * Saves data to local storage with a timestamp
   */
  save: (key: string, data: any) => {
    try {
      const payload = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.error("Cache Save Error:", e);
    }
  },

  /**
   * Retrieves data from local storage
   */
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      const payload = JSON.parse(item);
      return payload.data;
    } catch (e) {
      console.error("Cache Get Error:", e);
      return null;
    }
  },

  /**
   * Checks if the local cache is valid by comparing with remote metadata
   */
  isCacheValid: async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/sync-check");
      if (!res.ok) return false;
      
      const remoteMetadata = await res.json();
      const localMetadataStr = localStorage.getItem(CACHE_KEYS.METADATA);
      
      if (!localMetadataStr) {
        // No local metadata, cache is invalid
        localStorage.setItem(CACHE_KEYS.METADATA, JSON.stringify(remoteMetadata));
        return false;
      }

      const localMetadata = JSON.parse(localMetadataStr);
      
      // Compare timestamps
      if (remoteMetadata.last_updated !== localMetadata.last_updated) {
        // Remote is newer, update local metadata and return false
        localStorage.setItem(CACHE_KEYS.METADATA, JSON.stringify(remoteMetadata));
        return false;
      }

      return true;
    } catch (e) {
      console.error("Sync Check Error:", e);
      // If check fails, return false to force fresh fetch and ensure data integrity
      // especially important after a remix where metadata might be inconsistent
      return false;
    }
  },

  KEYS: CACHE_KEYS
};
