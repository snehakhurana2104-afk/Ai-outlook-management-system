/******************************************************************************
 * replyCache.js
 * Part 1
 * Enterprise AI Reply Cache
 *
 * Prevents duplicate AI requests
 * Supports TTL
 * Supports cache cleanup
 * Supports pending request management
 ******************************************************************************/

/* ==========================================================================
   Configuration
========================================================================== */

export const DEFAULT_TTL =
  1000 * 60 * 10; // 10 Minutes

export const CLEANUP_INTERVAL =
  1000 * 60 * 5; // 5 Minutes

export const MAX_CACHE_SIZE = 500;

/* ==========================================================================
   Cache Store
========================================================================== */

/*
Map Structure

key
↓

{
    value,
    createdAt,
    expiresAt
}
*/

const cache = new Map();

/* ==========================================================================
   Pending Request Store
========================================================================== */

/*
Avoids duplicate OpenAI requests.

Example:

User clicks Generate 5 times.

Only one request goes to backend.
*/

const pendingRequests = new Map();

/* ==========================================================================
   Cache Statistics
========================================================================== */

const stats = {

  hits: 0,

  misses: 0,

  writes: 0,

  deletes: 0,

  expired: 0,

};

/******************************************************************************
 * End Part 1
 ******************************************************************************/
/******************************************************************************
 * replyCache.js
 * Part 2
 * Enterprise Cache Operations
 ******************************************************************************/

/* ==========================================================================
   Set Cache
========================================================================== */

export const setCache = (
  key,
  value,
  ttl = DEFAULT_TTL
) => {

  if (!key) return;

  /* --------------------------------------------------------
     Prevent Unlimited Growth
  -------------------------------------------------------- */

  if (cache.size >= MAX_CACHE_SIZE) {

    const oldestKey =
      cache.keys().next().value;

    cache.delete(oldestKey);

  }

  cache.set(key, {

    value,

    createdAt: Date.now(),

    expiresAt: Date.now() + ttl,

  });

  stats.writes++;

};

/* ==========================================================================
   Get Cache
========================================================================== */

export const getCache = (key) => {

  const item = cache.get(key);

  if (!item) {

    stats.misses++;

    return null;

  }

  /* --------------------------------------------------------
     Expired
  -------------------------------------------------------- */

  if (Date.now() > item.expiresAt) {

    cache.delete(key);

    stats.expired++;

    stats.misses++;

    return null;

  }

  stats.hits++;

  return item.value;

};

/* ==========================================================================
   Has Cache
========================================================================== */

export const hasCache = (key) => {

  return getCache(key) !== null;

};

/* ==========================================================================
   Remove Cache
========================================================================== */

export const removeCache = (key) => {

  if (!cache.has(key)) return;

  cache.delete(key);

  stats.deletes++;

};

/* ==========================================================================
   Clear Cache
========================================================================== */

export const clearCache = () => {

  cache.clear();

  pendingRequests.clear();

};

/* ==========================================================================
   Cache Size
========================================================================== */

export const getCacheSize = () => {

  return cache.size;

};

/* ==========================================================================
   Cache Keys
========================================================================== */

export const getCacheKeys = () => {

  return [...cache.keys()];

};

/******************************************************************************
 * End Part 2
 ******************************************************************************/
/******************************************************************************
 * replyCache.js
 * Part 3
 * Pending Request Manager
 *
 * Prevent duplicate AI API calls.
 ******************************************************************************/

/* ==========================================================================
   Get Pending Request
========================================================================== */

export const getPendingRequest = (key) => {

  return pendingRequests.get(key) || null;

};

/* ==========================================================================
   Has Pending Request
========================================================================== */

export const hasPendingRequest = (key) => {

  return pendingRequests.has(key);

};

/* ==========================================================================
   Add Pending Request
========================================================================== */

export const addPendingRequest = (
  key,
  promise
) => {

  if (!key || !promise) return;

  pendingRequests.set(key, promise);

};

/* ==========================================================================
   Remove Pending Request
========================================================================== */

export const removePendingRequest = (
  key
) => {

  pendingRequests.delete(key);

};

/* ==========================================================================
   Execute Request Once
========================================================================== */

/*
This prevents multiple API calls.

Example

5 clicks

↓

Only one OpenAI request

↓

Remaining callers wait
for same Promise.
*/

export const executeRequest = async (
  key,
  requestFn,
  ttl = DEFAULT_TTL
) => {

  /* --------------------------------------------------------
     Cache Hit
  -------------------------------------------------------- */

  const cached = getCache(key);

  if (cached) {

    return cached;

  }

  /* --------------------------------------------------------
     Pending Request Exists
  -------------------------------------------------------- */

  if (hasPendingRequest(key)) {

    return getPendingRequest(key);

  }

  /* --------------------------------------------------------
     Create New Request
  -------------------------------------------------------- */

  const promise = (async () => {

    try {

      const response =
        await requestFn();

      setCache(
        key,
        response,
        ttl
      );

      return response;

    } finally {

      removePendingRequest(key);

    }

  })();

  addPendingRequest(
    key,
    promise
  );

  return promise;

};

/* ==========================================================================
   Pending Count
========================================================================== */

export const getPendingCount = () => {

  return pendingRequests.size;

};

/******************************************************************************
 * End Part 3
 ******************************************************************************/
/******************************************************************************
 * replyCache.js
 * Part 4
 * Enterprise Cleanup + Statistics + Export
 ******************************************************************************/

/* ==========================================================================
   Remove Expired Cache Entries
========================================================================== */

export const cleanupExpiredCache = () => {

  const now = Date.now();

  let removed = 0;

  for (const [key, item] of cache.entries()) {

    if (item.expiresAt <= now) {

      cache.delete(key);

      removed++;

      stats.expired++;

    }

  }

  return removed;

};

/* ==========================================================================
   Start Automatic Cleanup
========================================================================== */

let cleanupTimer = null;

export const startCacheCleanup = () => {

  if (cleanupTimer) return cleanupTimer;

  cleanupTimer = setInterval(() => {

    cleanupExpiredCache();

  }, CLEANUP_INTERVAL);

  return cleanupTimer;

};

/* ==========================================================================
   Stop Automatic Cleanup
========================================================================== */

export const stopCacheCleanup = () => {

  if (!cleanupTimer) return;

  clearInterval(cleanupTimer);

  cleanupTimer = null;

};

/* ==========================================================================
   Cache Statistics
========================================================================== */

export const getCacheStats = () => {

  return {

    ...stats,

    cacheSize: cache.size,

    pendingRequests: pendingRequests.size,

    maxCacheSize: MAX_CACHE_SIZE,

    defaultTTL: DEFAULT_TTL,

  };

};

/* ==========================================================================
   Reset Statistics
========================================================================== */

export const resetCacheStats = () => {

  stats.hits = 0;
  stats.misses = 0;
  stats.writes = 0;
  stats.deletes = 0;
  stats.expired = 0;

};

/* ==========================================================================
   Reset Entire Cache
========================================================================== */

export const resetReplyCache = () => {

  clearCache();

  resetCacheStats();

};

/* ==========================================================================
   Enterprise Service
========================================================================== */

const ReplyCache = {

  DEFAULT_TTL,

  CLEANUP_INTERVAL,

  MAX_CACHE_SIZE,

  setCache,

  getCache,

  hasCache,

  removeCache,

  clearCache,

  getCacheSize,

  getCacheKeys,

  getPendingRequest,

  hasPendingRequest,

  addPendingRequest,

  removePendingRequest,

  executeRequest,

  getPendingCount,

  cleanupExpiredCache,

  startCacheCleanup,

  stopCacheCleanup,

  getCacheStats,

  resetCacheStats,

  resetReplyCache,

};

export default ReplyCache;

/******************************************************************************
 * End replyCache.js
 ******************************************************************************/