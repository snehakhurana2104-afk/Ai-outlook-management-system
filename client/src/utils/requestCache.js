/**
 * Enterprise Memory Cache
 */

const cache = new Map();

export const DEFAULT_TTL = 5 * 60 * 1000; // 5 Minutes

export function getCache(key) {
  const item = cache.get(key);

  if (!item) return null;

  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

export function setCache(
  key,
  data,
  ttl = DEFAULT_TTL
) {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl,
  });
}

export function removeCache(key) {
  cache.delete(key);
}

export function clearCache() {
  cache.clear();
}

export function hasCache(key) {
  return cache.has(key);
}