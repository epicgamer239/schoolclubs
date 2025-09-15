/**
 * Advanced Cache Invalidation System
 * Prevents stale data issues across the application
 */

import { UserCache, MathLabCache, CacheManager } from './cache';

// Cache invalidation strategies
export class CacheInvalidationManager {
  constructor() {
    this.invalidationListeners = new Map();
    this.setupGlobalInvalidation();
  }

  // Setup global invalidation listeners
  setupGlobalInvalidation() {
    // Listen for storage events (cross-tab cache invalidation)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent.bind(this));
    }
  }

  // Handle storage events for cross-tab cache invalidation
  handleStorageEvent(event) {
    if (event.key && event.key.startsWith('brhs_cache_')) {
      const cacheKey = event.key.replace('brhs_cache_', '');
      
      // Notify listeners about cache invalidation
      if (this.invalidationListeners.has(cacheKey)) {
        const listeners = this.invalidationListeners.get(cacheKey);
        listeners.forEach(listener => listener());
      }
    }
  }

  // Register invalidation listener
  onInvalidation(cacheKey, callback) {
    if (!this.invalidationListeners.has(cacheKey)) {
      this.invalidationListeners.set(cacheKey, new Set());
    }
    this.invalidationListeners.get(cacheKey).add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.invalidationListeners.get(cacheKey);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.invalidationListeners.delete(cacheKey);
        }
      }
    };
  }

  // Invalidate specific cache with notification
  invalidateCache(cacheKey, reason = 'manual') {
    // Clear the cache
    CacheManager.remove(cacheKey);
    
    // Notify listeners
    if (this.invalidationListeners.has(cacheKey)) {
      const listeners = this.invalidationListeners.get(cacheKey);
      listeners.forEach(listener => listener());
    }
  }

  // Invalidate user-related caches
  invalidateUserCaches(reason = 'user_update') {
    this.invalidateCache('user_data', reason);
    this.invalidateCache('user_preferences', reason);
    this.invalidateCache('mathlab_requests', reason);
    this.invalidateCache('mathlab_sessions', reason);
  }

  // Invalidate MathLab-related caches
  invalidateMathLabCaches(reason = 'mathlab_update') {
    this.invalidateCache('mathlab_requests', reason);
    this.invalidateCache('mathlab_sessions', reason);
  }

  // Invalidate all caches
  invalidateAllCaches(reason = 'full_refresh') {
    CacheManager.clearAll();
  }

  // Smart invalidation based on data changes
  invalidateOnDataChange(dataType, changeType) {
    switch (dataType) {
      case 'user_profile':
        this.invalidateCache('user_data', `profile_${changeType}`);
        break;
      case 'user_preferences':
        this.invalidateCache('user_preferences', `preferences_${changeType}`);
        break;
      case 'mathlab_role':
        this.invalidateUserCaches(`role_${changeType}`);
        break;
      case 'tutoring_request':
        this.invalidateMathLabCaches(`request_${changeType}`);
        break;
      case 'tutoring_session':
        this.invalidateMathLabCaches(`session_${changeType}`);
        break;
      default:
        this.invalidateUserCaches(`unknown_${changeType}`);
    }
  }

  // Check for stale data and invalidate if necessary
  checkAndInvalidateStaleData() {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    // Check user data staleness
    const userData = UserCache.getUserData();
    if (userData && userData.timestamp) {
      const age = now - userData.timestamp;
      if (age > staleThreshold) {
        this.invalidateCache('user_data', 'stale_data');
      }
    }

    // Check MathLab requests staleness
    const requests = MathLabCache.getRequests();
    if (requests && requests.timestamp) {
      const age = now - requests.timestamp;
      if (age > staleThreshold) {
        this.invalidateCache('mathlab_requests', 'stale_data');
      }
    }
  }

  // Periodic stale data cleanup
  startStaleDataCleanup(intervalMs = 60000) { // 1 minute default
    return setInterval(() => {
      this.checkAndInvalidateStaleData();
    }, intervalMs);
  }
}

// Create global instance
export const cacheInvalidation = new CacheInvalidationManager();

// Export convenience functions
export const invalidateUserCaches = (reason) => cacheInvalidation.invalidateUserCaches(reason);
export const invalidateMathLabCaches = (reason) => cacheInvalidation.invalidateMathLabCaches(reason);
export const invalidateAllCaches = (reason) => cacheInvalidation.invalidateAllCaches(reason);
export const invalidateOnDataChange = (dataType, changeType) => 
  cacheInvalidation.invalidateOnDataChange(dataType, changeType);

// Export the manager instance
export default cacheInvalidation;
