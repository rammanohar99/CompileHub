/**
 * Lightweight in-memory TTL cache.
 *
 * Usage:
 *   cache.set("key", value, 300)    // TTL in seconds
 *   cache.get("key")                // returns value or null if expired/missing
 *   cache.del("key")                // manual invalidation
 *   cache.delByPrefix("problems:")  // bust all keys matching a prefix
 */

const store = new Map(); // key -> { value, expiresAt }

const get = (key) => {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
};

const set = (key, value, ttlSeconds = 300) => {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
};

const del = (key) => store.delete(key);

const delByPrefix = (prefix) => {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
};

module.exports = { get, set, del, delByPrefix };
