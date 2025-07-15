// Caching utilities for both client and server-side caching

// In-memory cache for server-side operations
const memoryCache = new Map();
const cacheTTL = new Map();

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_TTL: 300, // 5 minutes
  MAX_SIZE: 1000, // Maximum cache entries
  CLEANUP_INTERVAL: 60000 // 1 minute cleanup interval
};

// Cache class for managing cached data
class Cache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
    this.setupCleanup();
  }

  // Set cache entry with TTL
  set(key, value, ttl = CACHE_CONFIG.DEFAULT_TTL) {
    // Clean up old entries if cache is full
    if (this.cache.size >= CACHE_CONFIG.MAX_SIZE) {
      this.cleanup();
    }

    const expiry = Date.now() + (ttl * 1000);
    this.cache.set(key, value);
    this.ttl.set(key, expiry);
  }

  // Get cache entry
  get(key) {
    const value = this.cache.get(key);
    const expiry = this.ttl.get(key);

    if (!value || !expiry) {
      return null;
    }

    // Check if expired
    if (Date.now() > expiry) {
      this.delete(key);
      return null;
    }

    return value;
  }

  // Delete cache entry
  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  // Cleanup expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.ttl.entries()) {
      if (now > expiry) {
        this.delete(key);
      }
    }
  }

  // Setup automatic cleanup
  setupCleanup() {
    setInterval(() => {
      this.cleanup();
    }, CACHE_CONFIG.CLEANUP_INTERVAL);
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      maxSize: CACHE_CONFIG.MAX_SIZE,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
const globalCache = new Cache();

// Cache middleware for API routes
export const cacheMiddleware = (ttl = CACHE_CONFIG.DEFAULT_TTL) => {
  return async (req, res, next) => {
    const cacheKey = `api:${req.method}:${req.url}:${JSON.stringify(req.query)}`;
    const cachedResponse = globalCache.get(cacheKey);

    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    // Store original send method
    const originalSend = res.json;
    
    // Override send method to cache response
    res.json = (body) => {
      globalCache.set(cacheKey, body, ttl);
      originalSend.call(res, body);
    };

    next();
  };
};

// Cache utilities for common operations
export const cacheUtils = {
  // Cache clubs for a school
  cacheClubs: (schoolId, clubs) => {
    globalCache.set(`clubs:${schoolId}`, clubs, 300); // 5 minutes
  },

  // Get cached clubs
  getCachedClubs: (schoolId) => {
    return globalCache.get(`clubs:${schoolId}`);
  },

  // Cache events for a club
  cacheEvents: (clubId, events) => {
    globalCache.set(`events:${clubId}`, events, 180); // 3 minutes
  },

  // Get cached events
  getCachedEvents: (clubId) => {
    return globalCache.get(`events:${clubId}`);
  },

  // Cache user data
  cacheUser: (userId, userData) => {
    globalCache.set(`user:${userId}`, userData, 600); // 10 minutes
  },

  // Get cached user
  getCachedUser: (userId) => {
    return globalCache.get(`user:${userId}`);
  },

  // Cache school data
  cacheSchool: (schoolId, schoolData) => {
    globalCache.set(`school:${schoolId}`, schoolData, 900); // 15 minutes
  },

  // Get cached school
  getCachedSchool: (schoolId) => {
    return globalCache.get(`school:${schoolId}`);
  },

  // Invalidate cache for specific patterns
  invalidateCache: (pattern) => {
    const keys = Array.from(globalCache.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        globalCache.delete(key);
      }
    });
  },

  // Clear all cache
  clearAll: () => {
    globalCache.clear();
  },

  // Get cache statistics
  getStats: () => {
    return globalCache.getStats();
  }
};

// Client-side cache using localStorage
export const clientCache = {
  // Set cache entry
  set: (key, value, ttl = 300) => {
    if (typeof window === 'undefined') return;
    
    const entry = {
      value,
      expiry: Date.now() + (ttl * 1000)
    };
    
    try {
      localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Cache storage failed:', error);
    }
  },

  // Get cache entry
  get: (key) => {
    if (typeof window === 'undefined') return null;
    
    try {
      const entry = localStorage.getItem(`cache:${key}`);
      if (!entry) return null;
      
      const data = JSON.parse(entry);
      if (Date.now() > data.expiry) {
        localStorage.removeItem(`cache:${key}`);
        return null;
      }
      
      return data.value;
    } catch (error) {
      console.warn('Cache retrieval failed:', error);
      return null;
    }
  },

  // Delete cache entry
  delete: (key) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(`cache:${key}`);
    } catch (error) {
      console.warn('Cache deletion failed:', error);
    }
  },

  // Clear all cache
  clear: () => {
    if (typeof window === 'undefined') return;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache:')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cache clear failed:', error);
    }
  },

  // Cleanup expired entries
  cleanup: () => {
    if (typeof window === 'undefined') return;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache:')) {
          const entry = localStorage.getItem(key);
          if (entry) {
            const data = JSON.parse(entry);
            if (Date.now() > data.expiry) {
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }
};

// React Query configuration for client-side caching
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    },
    mutations: {
      retry: 1,
      retryDelay: 1000
    }
  }
};

// Cache keys for consistent naming
export const cacheKeys = {
  clubs: (schoolId) => `clubs:${schoolId}`,
  club: (clubId) => `club:${clubId}`,
  events: (clubId) => `events:${clubId}`,
  event: (eventId) => `event:${eventId}`,
  user: (userId) => `user:${userId}`,
  school: (schoolId) => `school:${schoolId}`,
  joinRequests: (clubId) => `joinRequests:${clubId}`,
  schoolJoinRequests: (schoolId) => `schoolJoinRequests:${schoolId}`
};

export default globalCache; 