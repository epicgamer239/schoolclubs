# Cache Improvements & Management Guide

## Overview
This document explains the cache system improvements, where cache is stored, and how to manage cache limits for scale.

## 🔧 Cache Storage & Location

### **Where Cache is Stored:**

#### **1. Server-Side Memory Cache**
- **Location**: `utils/cache.js` - `globalCache` instance
- **Storage**: In-memory JavaScript Map objects
- **Scope**: Per server instance (resets on server restart)
- **Type**: `Map<string, any>` for fast key-value access

#### **2. Client-Side Cache**
- **Location**: `utils/cache.js` - `clientCache` object
- **Storage**: Browser localStorage
- **Scope**: Per browser (persists across sessions)
- **Type**: JSON strings in localStorage

#### **3. React Query Cache**
- **Location**: Built into React Query
- **Storage**: In-memory React state
- **Scope**: Per browser tab
- **Type**: React Query's internal cache

## 📊 Cache Limit Improvements

### **Previous Limits:**
```javascript
const CACHE_CONFIG = {
  MAX_SIZE: 1000, // Only 1,000 entries
  // ... other config
};
```

### **New Enhanced Limits:**
```javascript
const CACHE_CONFIG = {
  MAX_SIZE: 10000, // Increased to 10,000 entries
  MEMORY_LIMIT: 100 * 1024 * 1024, // 100MB memory limit
  EVICTION_STRATEGY: 'LRU', // Least Recently Used
  ENABLE_STATS: true // Performance monitoring
};
```

## 🚀 New Cache Features

### **1. LRU (Least Recently Used) Eviction**
```javascript
// Automatically removes least recently accessed entries
evictOldest() {
  // Finds and removes the oldest accessed entry
  // Prevents memory overflow
}
```

### **2. Memory Management**
```javascript
// Tracks memory usage and prevents overflow
MEMORY_LIMIT: 100 * 1024 * 1024, // 100MB limit
```

### **3. Enhanced Statistics**
```javascript
getStats() {
  return {
    size: this.cache.size,
    maxSize: CACHE_CONFIG.MAX_SIZE,
    memoryUsage: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
    memoryLimit: `${(CACHE_CONFIG.MEMORY_LIMIT / 1024 / 1024).toFixed(2)}MB`,
    expiredEntries: expiredCount,
    hitRate: this.calculateHitRate(),
    keys: Array.from(this.cache.keys()).slice(0, 10)
  };
}
```

### **4. Cache Monitoring Tools**
```javascript
export const cacheMonitor = {
  getDetailedStats: () => { /* ... */ },
  getPerformanceMetrics: () => { /* ... */ },
  clearCache: () => { /* ... */ },
  getKeysByPattern: (pattern) => { /* ... */ },
  getSizeByType: () => { /* ... */ }
};
```

## 📈 How to Increase Cache Limits

### **Option 1: Increase Entry Limit**
```javascript
// In utils/cache.js
const CACHE_CONFIG = {
  MAX_SIZE: 50000, // Increase to 50,000 entries
  // ... other config
};
```

### **Option 2: Increase Memory Limit**
```javascript
// In utils/cache.js
const CACHE_CONFIG = {
  MEMORY_LIMIT: 500 * 1024 * 1024, // Increase to 500MB
  // ... other config
};
```

### **Option 3: Add Redis for Distributed Caching**
```javascript
// For production scale
import Redis from 'redis';

const redis = Redis.createClient({
  url: process.env.REDIS_URL,
  maxMemory: '1gb',
  maxKeys: 100000
});
```

## 🎯 Cache Performance Monitoring

### **Access Cache Monitor:**
Navigate to `/admin/cache-monitor` to see:
- **Cache utilization** percentage
- **Memory usage** in MB
- **Hit rate** efficiency
- **Cache by type** breakdown
- **Detailed statistics**

### **Programmatic Access:**
```javascript
import { cacheMonitor } from '../utils/cache';

// Get detailed stats
const stats = cacheMonitor.getDetailedStats();

// Get performance metrics
const metrics = cacheMonitor.getPerformanceMetrics();

// Clear cache manually
cacheMonitor.clearCache();
```

## 📊 Cache Performance at Scale

### **Current Capacity:**
- **Entries**: 10,000 (up from 1,000)
- **Memory**: 100MB limit
- **Eviction**: LRU strategy
- **Monitoring**: Real-time stats

### **Scale Recommendations:**

#### **For 1k-5k Users:**
```javascript
MAX_SIZE: 10000, // Current setting - sufficient
MEMORY_LIMIT: 100 * 1024 * 1024, // 100MB - sufficient
```

#### **For 5k-10k Users:**
```javascript
MAX_SIZE: 25000, // Increase to 25,000
MEMORY_LIMIT: 250 * 1024 * 1024, // 250MB
```

#### **For 10k+ Users:**
```javascript
MAX_SIZE: 50000, // Increase to 50,000
MEMORY_LIMIT: 500 * 1024 * 1024, // 500MB
// Consider adding Redis
```

## 🔍 Cache Key Patterns

### **Current Cache Keys:**
```javascript
// User data
`user:${userId}` // 30 minutes

// School data  
`school:${schoolId}` // 1 hour

// Clubs data
`clubs:${schoolId}` // 15 minutes

// Events data
`events:${clubId}` // 5 minutes

// Tags data
`tags:${tagIds.join(',')}` // 30 minutes

// Dashboard stats
`dashboardStats:${schoolId}` // 5 minutes

// Teacher clubs
`teacherClubs:${userId}` // 5 minutes

// Club details
`clubDetails:${clubId}` // 5 minutes
```

## 🚨 Cache Management Best Practices

### **1. Monitor Cache Usage**
- Check `/admin/cache-monitor` regularly
- Watch memory usage vs. limit
- Monitor hit rates for efficiency

### **2. Clear Cache When Needed**
```javascript
// Clear all cache
cacheMonitor.clearCache();

// Clear specific patterns
cacheUtils.invalidateCache('clubs');
```

### **3. Optimize Cache Durations**
```javascript
// Adjust based on data change frequency
USER: 1800,        // 30 minutes - rarely changes
SCHOOL: 3600,      // 1 hour - very stable
CLUBS: 900,        // 15 minutes - moderate changes
EVENTS: 300,       // 5 minutes - frequent updates
```

### **4. Scale Cache with Users**
- **1k users**: Current settings (10k entries, 100MB)
- **5k users**: 25k entries, 250MB
- **10k+ users**: 50k entries, 500MB + Redis

## 💡 Performance Tips

### **1. Cache Warming**
```javascript
// Pre-load frequently accessed data
const warmSchoolCache = async (schoolId) => {
  await Promise.all([
    db.getDocuments("clubs", { schoolId }),
    db.getDocuments("users", { schoolId })
  ]);
};
```

### **2. Pattern-Based Invalidation**
```javascript
// Clear related cache when data changes
cacheUtils.invalidateCache('clubs'); // Clears all club-related cache
cacheUtils.invalidateCache('user');  // Clears all user-related cache
```

### **3. Memory Monitoring**
```javascript
// Check memory usage
const stats = cacheMonitor.getDetailedStats();
if (parseFloat(stats.memoryUsage) > 80) {
  // Cache is using >80% of memory limit
  cacheMonitor.clearCache();
}
```

## 🎯 Summary

### **Cache Improvements Made:**
- ✅ **Increased limit**: 1,000 → 10,000 entries
- ✅ **Added memory management**: 100MB limit
- ✅ **Implemented LRU eviction**: Prevents memory overflow
- ✅ **Enhanced monitoring**: Real-time stats and metrics
- ✅ **Added cache monitor page**: `/admin/cache-monitor`
- ✅ **Better performance tracking**: Hit rates and utilization

### **Where Cache is Stored:**
- **Server-side**: In-memory Map objects (resets on restart)
- **Client-side**: Browser localStorage (persists)
- **React Query**: In-memory React state (per tab)

### **How to Increase Limits:**
1. **Edit `utils/cache.js`** - Change `MAX_SIZE` and `MEMORY_LIMIT`
2. **Monitor usage** - Use `/admin/cache-monitor`
3. **Scale gradually** - Increase limits as needed
4. **Consider Redis** - For 10k+ users

The cache system is now much more robust and can handle significant scale while providing excellent monitoring and management tools! 