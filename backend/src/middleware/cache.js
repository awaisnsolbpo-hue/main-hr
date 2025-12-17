/**
 * Simple in-memory cache middleware for faster responses
 * Cache duration: 30 seconds for GET requests
 */

const cache = new Map();
const CACHE_DURATION = 30 * 1000; // 30 seconds

export const cacheMiddleware = (duration = CACHE_DURATION) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from URL and user ID
    const userId = req.user?.id || 'anonymous';
    const cacheKey = `${req.originalUrl}:${userId}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < duration) {
      return res.json(cached.data);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function (data) {
      cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
      return originalJson(data);
    };

    next();
  };
};

/**
 * Clear cache for a specific user or all cache
 */
export const clearCache = (userId = null) => {
  if (userId) {
    // Clear all cache entries for this user
    for (const [key] of cache.entries()) {
      if (key.includes(`:${userId}`)) {
        cache.delete(key);
      }
    }
  } else {
    // Clear all cache
    cache.clear();
  }
};

/**
 * Clean up expired cache entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION * 2) {
      cache.delete(key);
    }
  }
}, 60000); // Run every minute

