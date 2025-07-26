// Caching utilities for both client and server-side caching

// In-memory cache for server-side operations
const memoryCache = new Map();
const cacheTTL = new Map();

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_TTL: 300, // 5 minutes
  MAX_SIZE: 10000, // Increased from 1000 to 10000 for scale
  CLEANUP_INTERVAL: 60000, // 1 minute cleanup interval
  // Memory management
  MEMORY_LIMIT: 100 * 1024 * 1024, // 100MB memory limit
  // Cache eviction strategy
  EVICTION_STRATEGY: 'LRU', // Least Recently Used
  // Performance monitoring
  ENABLE_STATS: true
};

// Cache class for managing cached data
class Cache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
    this.accessOrder = new Map(); // For LRU tracking
    this.accessCounter = 0;
    this.setupCleanup();
  }

  // Set cache entry with TTL
  set(key, value, ttl = CACHE_CONFIG.DEFAULT_TTL) {
    // Check memory usage and evict if needed
    if (this.cache.size >= CACHE_CONFIG.MAX_SIZE) {
      this.evictOldest();
    }

    const expiry = Date.now() + (ttl * 1000);
    this.cache.set(key, value);
    this.ttl.set(key, expiry);
    this.accessOrder.set(key, ++this.accessCounter);
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

    // Update access order for LRU
    this.accessOrder.set(key, ++this.accessCounter);
    return value;
  }

  // Delete cache entry
  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
    this.accessOrder.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.ttl.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  // Evict oldest entries (LRU strategy)
  evictOldest() {
    if (this.cache.size === 0) return;

    // Find the oldest accessed entry
    let oldestKey = null;
    let oldestAccess = Infinity;

    for (const [key, accessTime] of this.accessOrder.entries()) {
      if (accessTime < oldestAccess) {
        oldestAccess = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  // Cleanup expired entries
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, expiry] of this.ttl.entries()) {
      if (now > expiry) {
        this.delete(key);
        cleanedCount++;
      }
    }

    // Log cleanup stats if enabled
    if (CACHE_CONFIG.ENABLE_STATS && cleanedCount > 0) {
      console.log(`Cache cleanup: removed ${cleanedCount} expired entries`);
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
    const now = Date.now();
    let expiredCount = 0;
    let totalSize = 0;

    // Calculate memory usage and expired entries
    for (const [key, value] of this.cache.entries()) {
      const expiry = this.ttl.get(key);
      if (expiry && now > expiry) {
        expiredCount++;
      }
      
      // Estimate memory usage (rough calculation)
      if (typeof value === 'string') {
        totalSize += value.length * 2; // UTF-16 characters
      } else if (typeof value === 'object') {
        totalSize += JSON.stringify(value).length * 2;
      }
    }

    return {
      size: this.cache.size,
      maxSize: CACHE_CONFIG.MAX_SIZE,
      memoryUsage: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
      memoryLimit: `${(CACHE_CONFIG.MEMORY_LIMIT / 1024 / 1024).toFixed(2)}MB`,
      expiredEntries: expiredCount,
      hitRate: this.calculateHitRate(),
      keys: Array.from(this.cache.keys()).slice(0, 10) // Show first 10 keys
    };
  }

  // Calculate cache hit rate (simplified)
  calculateHitRate() {
    // This is a simplified calculation - in production you'd track hits/misses
    const totalEntries = this.cache.size;
    const expiredEntries = Array.from(this.ttl.entries())
      .filter(([_, expiry]) => Date.now() > expiry).length;
    
    return totalEntries > 0 ? ((totalEntries - expiredEntries) / totalEntries * 100).toFixed(1) : '0.0';
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

  // NEW: Cache join requests
  cacheJoinRequests: (clubId, requests) => {
    globalCache.set(`joinRequests:${clubId}`, requests, 120); // 2 minutes
  },

  // NEW: Get cached join requests
  getCachedJoinRequests: (clubId) => {
    return globalCache.get(`joinRequests:${clubId}`);
  },

  // NEW: Cache school join requests
  cacheSchoolJoinRequests: (schoolId, requests) => {
    globalCache.set(`schoolJoinRequests:${schoolId}`, requests, 120); // 2 minutes
  },

  // NEW: Get cached school join requests
  getCachedSchoolJoinRequests: (schoolId) => {
    return globalCache.get(`schoolJoinRequests:${schoolId}`);
  },

  // NEW: Cache tags
  cacheTags: (tagIds, tags) => {
    globalCache.set(`tags:${tagIds.join(',')}`, tags, 1800); // 30 minutes
  },

  // NEW: Get cached tags
  getCachedTags: (tagIds) => {
    return globalCache.get(`tags:${tagIds.join(',')}`);
  },

  // NEW: Cache dashboard stats
  cacheDashboardStats: (schoolId, stats) => {
    globalCache.set(`dashboardStats:${schoolId}`, stats, 300); // 5 minutes
  },

  // NEW: Get cached dashboard stats
  getCachedDashboardStats: (schoolId) => {
    return globalCache.get(`dashboardStats:${schoolId}`);
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

// Cache monitoring utilities
export const cacheMonitor = {
  // Get detailed cache stats
  getDetailedStats: () => {
    return globalCache.getStats();
  },

  // Get cache performance metrics
  getPerformanceMetrics: () => {
    const stats = globalCache.getStats();
    return {
      utilization: `${((stats.size / stats.maxSize) * 100).toFixed(1)}%`,
      memoryUsage: stats.memoryUsage,
      hitRate: stats.hitRate,
      efficiency: stats.size > 0 ? 'Good' : 'Empty'
    };
  },

  // Clear cache manually
  clearCache: () => {
    globalCache.clear();
    console.log('Cache cleared manually');
  },

  // Get cache keys by pattern
  getKeysByPattern: (pattern) => {
    const keys = Array.from(globalCache.cache.keys());
    return keys.filter(key => key.includes(pattern));
  },

  // Get cache size by type
  getSizeByType: () => {
    const keys = Array.from(globalCache.cache.keys());
    const typeCounts = {};
    
    keys.forEach(key => {
      const type = key.split(':')[0];
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    return typeCounts;
  }
};

// Export cache configuration for external access
export { CACHE_CONFIG };

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
  schoolJoinRequests: (schoolId) => `schoolJoinRequests:${schoolId}`,
  tags: (tagIds) => `tags:${tagIds.join(',')}`,
  dashboardStats: (schoolId) => `dashboardStats:${schoolId}`,
  // Optimized cache durations
  userData: (userId) => `user:${userId}:1800`, // 30 minutes
  schoolData: (schoolId) => `school:${schoolId}:3600`, // 1 hour
  clubsData: (schoolId) => `clubs:${schoolId}:900`, // 15 minutes
  eventsData: (clubId) => `events:${clubId}:300` // 5 minutes
};

export default globalCache; 