"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useAuth } from "../../../components/AuthContext";
import DashboardTopBar from "../../../components/DashboardTopBar";
import { cacheMonitor, CACHE_CONFIG } from "../../../utils/cache";

export default function CacheMonitorPage() {
  const [cacheStats, setCacheStats] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [cacheByType, setCacheByType] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { userData } = useAuth();

  useEffect(() => {
    const fetchCacheStats = () => {
      try {
        const stats = cacheMonitor.getDetailedStats();
        const metrics = cacheMonitor.getPerformanceMetrics();
        const byType = cacheMonitor.getSizeByType();
        
        setCacheStats(stats);
        setPerformanceMetrics(metrics);
        setCacheByType(byType);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching cache stats:", error);
        setLoading(false);
      }
    };

    // Update stats every 5 seconds
    fetchCacheStats();
    const interval = setInterval(fetchCacheStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    if (confirm("Are you sure you want to clear the entire cache? This will temporarily slow down the application.")) {
      cacheMonitor.clearCache();
      // Refresh stats after clearing
      setTimeout(() => {
        const stats = cacheMonitor.getDetailedStats();
        const metrics = cacheMonitor.getPerformanceMetrics();
        const byType = cacheMonitor.getSizeByType();
        
        setCacheStats(stats);
        setPerformanceMetrics(metrics);
        setCacheByType(byType);
      }, 100);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-background">
          <DashboardTopBar title="Cache Monitor" />
          <div className="container">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background">
        <DashboardTopBar title="Cache Monitor" />
        
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Cache Performance Monitor</h1>
            <p className="text-muted-foreground mt-2">Monitor cache performance and manage cache settings</p>
          </div>

          {/* Cache Configuration */}
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Cache Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-semibold text-muted-foreground">Max Entries:</span>
                <p className="text-foreground font-medium">{CACHE_CONFIG.MAX_SIZE.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-muted-foreground">Memory Limit:</span>
                <p className="text-foreground font-medium">{CACHE_CONFIG.MEMORY_LIMIT / 1024 / 1024}MB</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-muted-foreground">Cleanup Interval:</span>
                <p className="text-foreground font-medium">{CACHE_CONFIG.CLEANUP_INTERVAL / 1000}s</p>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-2">Cache Utilization</h3>
              <p className="text-2xl font-bold text-primary">{performanceMetrics?.utilization || '0%'}</p>
              <p className="text-sm text-muted-foreground">
                {cacheStats?.size || 0} / {cacheStats?.maxSize || 0} entries
              </p>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-2">Memory Usage</h3>
              <p className="text-2xl font-bold text-secondary">{performanceMetrics?.memoryUsage || '0MB'}</p>
              <p className="text-sm text-muted-foreground">
                Limit: {performanceMetrics?.memoryLimit || '0MB'}
              </p>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-2">Hit Rate</h3>
              <p className="text-2xl font-bold text-success">{performanceMetrics?.hitRate || '0%'}</p>
              <p className="text-sm text-muted-foreground">
                Cache efficiency
              </p>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-2">Status</h3>
              <p className="text-2xl font-bold text-info">{performanceMetrics?.efficiency || 'Empty'}</p>
              <p className="text-sm text-muted-foreground">
                Cache health
              </p>
            </div>
          </div>

          {/* Cache by Type */}
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Cache by Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(cacheByType).map(([type, count]) => (
                <div key={type} className="text-center">
                  <p className="text-lg font-semibold text-foreground">{type}</p>
                  <p className="text-2xl font-bold text-primary">{count}</p>
                  <p className="text-sm text-muted-foreground">entries</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cache Actions */}
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Cache Management</h2>
            <div className="flex gap-4">
              <button
                onClick={handleClearCache}
                className="btn-danger"
              >
                Clear All Cache
              </button>
              <button
                onClick={() => {
                  const stats = cacheMonitor.getDetailedStats();
                  console.log('Cache Stats:', stats);
                  alert('Cache stats logged to console');
                }}
                className="btn-outline"
              >
                Export Stats
              </button>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Detailed Statistics</h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-semibold text-muted-foreground">Total Entries:</span>
                <p className="text-foreground font-medium">{cacheStats?.size || 0}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-muted-foreground">Expired Entries:</span>
                <p className="text-foreground font-medium">{cacheStats?.expiredEntries || 0}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-muted-foreground">Memory Usage:</span>
                <p className="text-foreground font-medium">{cacheStats?.memoryUsage || '0MB'}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-muted-foreground">Sample Keys:</span>
                <div className="mt-2 space-y-1">
                  {cacheStats?.keys?.slice(0, 5).map((key, index) => (
                    <p key={index} className="text-sm text-muted-foreground font-mono">
                      {key}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 