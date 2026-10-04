// Lightweight high-performance in-memory cache for API responses and Auth
const cache = new Map();

const DEFAULT_TTL_MS = 25000; // 25 seconds for read operations

const get = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
};

const set = (key, data, ttlMs = DEFAULT_TTL_MS) => {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
};

const del = (key) => {
  cache.delete(key);
};

const invalidateBranch = (branchId) => {
  const branchKeyPrefix = `branch_${branchId || 1}_`;
  for (const k of cache.keys()) {
    if (k.startsWith(branchKeyPrefix) || k.startsWith("branch_all_")) {
      cache.delete(k);
    }
  }
};

const invalidateUser = (userId) => {
  cache.delete(`auth_user_${userId}`);
};

const clearAll = () => {
  cache.clear();
};

module.exports = {
  get,
  set,
  del,
  invalidateBranch,
  invalidateUser,
  clearAll,
};
