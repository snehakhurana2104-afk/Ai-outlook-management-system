// ============================================================
// services/cacheService.js
// Enterprise Cache Service
// Memory Cache (Redis Ready)
// ============================================================

class CacheService {
  constructor() {
    this.cache = new Map();

    this.defaultTTL = 60 * 1000; // 60 Seconds

    this.startCleanup();
  }

  // ==========================================================
  // GET
  // ==========================================================

  async get(key) {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expireAt) {
      this.cache.delete(key);

      return null;
    }

    return item.value;
  }

  // ==========================================================
  // SET
  // ==========================================================

  async set(
    key,
    value,
    ttl = this.defaultTTL
  ) {
    this.cache.set(key, {
      value,

      expireAt: Date.now() + ttl,
    });

    return true;
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  async delete(key) {
    return this.cache.delete(key);
  }

  // ==========================================================
  // CLEAR
  // ==========================================================

  async clear() {
    this.cache.clear();

    return true;
  }

  // ==========================================================
  // HAS
  // ==========================================================

  async has(key) {
    const item = this.cache.get(key);

    if (!item) {
      return false;
    }

    if (Date.now() > item.expireAt) {
      this.cache.delete(key);

      return false;
    }

    return true;
  }

  // ==========================================================
  // KEYS
  // ==========================================================

  async keys() {
    return [...this.cache.keys()];
  }

  // ==========================================================
  // SIZE
  // ==========================================================

  async size() {
    return this.cache.size;
  }

  // ==========================================================
  // CACHE STATS
  // ==========================================================

  async stats() {
    return {
      provider: "memory",

      entries: this.cache.size,

      defaultTTL: this.defaultTTL,

      uptime: Math.floor(
        process.uptime()
      ),
    };
  }

  // ==========================================================
  // CLEANUP
  // ==========================================================

  cleanup() {
    const now = Date.now();

    for (const [
      key,
      value,
    ] of this.cache.entries()) {
      if (now > value.expireAt) {
        this.cache.delete(key);
      }
    }
  }

  // ==========================================================
  // AUTO CLEANUP
  // ==========================================================

  startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

module.exports = new CacheService();