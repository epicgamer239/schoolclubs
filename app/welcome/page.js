"use client";
import { useAuth } from "../../components/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import DashboardTopBar from "../../components/DashboardTopBar";
import { AppCardSkeleton } from "../../components/SkeletonLoader";
import { UserCache, CachePerformance } from "@/utils/cache";

export default function Welcome() {
  const { userData, isEmailVerified } = useAuth();
  const router = useRouter();
  const [cachedUser, setCachedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Optimized caching with performance monitoring
  useEffect(() => {
    const timing = CachePerformance.startTiming('loadWelcomeCachedUser');
    
    const cached = UserCache.getUserData();
    if (cached) {
      setCachedUser(cached);
    }
    setIsLoading(false);
    
    CachePerformance.endTiming(timing);
  }, []);

  // Optimized cache update with stale data detection
  useEffect(() => {
    if (userData) {
      const timing = CachePerformance.startTiming('updateWelcomeCache');
      
      // Check if cached data is stale
      const cached = UserCache.getUserData();
      const isStale = !cached || cached.uid !== userData.uid || 
                     (cached.updatedAt && userData.updatedAt && 
                      new Date(cached.updatedAt) < new Date(userData.updatedAt));
      
      if (isStale) {
        UserCache.setUserData(userData);
        setCachedUser(userData);
      }
      
      setIsLoading(false);
      
      CachePerformance.endTiming(timing);
    } else {
      // Clear cached user when userData is null (user signed out)
      setCachedUser(null);
      setIsLoading(false);
    }
  }, [userData]);

  // Check email verification status and redirect if needed
  useEffect(() => {
    if (userData && !isEmailVerified) {
      // User is signed in but email is not verified, redirect to verification page
      router.push('/verify-email?email=' + encodeURIComponent(userData.email));
    }
  }, [userData, isEmailVerified, router]);

  // Listen for email verification completion from popup/verification page
  useEffect(() => {
    const handleMessage = (event) => {
      // Verify the origin for security
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'EMAIL_VERIFIED' && event.data.action === 'redirect_and_signin') {
        // Force refresh the authentication state
        window.location.reload();
      }
    };

    // Listen for messages from the verification page
    window.addEventListener('message', handleMessage);
    
    // Also check localStorage for email verification status
    const checkEmailVerification = () => {
      const verificationStatus = localStorage.getItem('emailVerificationStatus');
      if (verificationStatus === 'verified') {
        localStorage.removeItem('emailVerificationStatus');
        // Force refresh the authentication state
        window.location.reload();
      }
    };

    // Check immediately and set up interval
    checkEmailVerification();
    const interval = setInterval(checkEmailVerification, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, []);

  const handleMathLabClick = useCallback(() => {
    if (userData || cachedUser) {
      router.push('/mathlab');
    } else {
      router.push('/login');
    }
  }, [userData, cachedUser, router]);

  // Prioritize fresh userData over cached data for accuracy
  const displayUser = userData || cachedUser;
  

  // Apps data with Math Lab as the first item - memoized for performance
  const allApps = useMemo(() => [
    { 
      name: "BRHS Math Lab", 
      description: "Math Lab Scheduling System", 
      isActive: true,
      onClick: handleMathLabClick
    },
    { name: "Coming Soon", description: "More features coming soon", isActive: false },
    { name: "Coming Soon", description: "More features coming soon", isActive: false },
    { name: "Coming Soon", description: "More features coming soon", isActive: false },
    { name: "Coming Soon", description: "More features coming soon", isActive: false },
    { name: "Coming Soon", description: "More features coming soon", isActive: false },
    { name: "Coming Soon", description: "More features coming soon", isActive: false },
    { name: "Coming Soon", description: "More features coming soon", isActive: false }
  ], [handleMathLabClick]);

  // Filter apps based on search query - memoized for performance
  const filteredApps = useMemo(() => 
    allApps.filter(app => 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase())
    ), [allApps, searchQuery]
  );

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardTopBar 
          title="BRHS Utilities" 
          showNavLinks={false}
        />
        <div className="flex-1 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <AppCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Use the reusable DashboardTopBar component */}
      <DashboardTopBar 
        title="BRHS Utilities" 
        showNavLinks={false} // Don't show navigation links on welcome page
      />

      {/* Header with Welcome and Available Apps */}
      <div className="px-6 py-2">
        <div className="flex items-center justify-between">
          <div>
            {displayUser && (
              <>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Welcome back, {displayUser.displayName || displayUser.email}!
                </h2>
                <p className="text-muted-foreground">
                  Choose an app to get started
                </p>
              </>
            )}
          </div>
          
          {/* Centered Available Apps Title */}
          <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-1">Available Apps</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? `Found ${filteredApps.length} app${filteredApps.length !== 1 ? 's' : ''}` : "Choose an app to get started"}
            </p>
            <div id="search-description" className="sr-only">
              Search through available applications by name or description
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="w-72">
            <div className="relative">
              <input
                type="text"
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2.5 pl-10 pr-10 text-sm text-foreground bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200 placeholder:text-muted-foreground"
                aria-label="Search applications"
                aria-describedby="search-description"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded"
                  aria-label="Clear search"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-4">
        <div className="max-w-7xl mx-auto">

          {/* Apps Grid */}
          <div className="mb-8">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredApps.map((app, index) => (
                <div 
                  key={index} 
                  className={`group card-elevated relative h-[180px] flex flex-col items-center justify-center rounded-xl transition-all duration-300 hover:transform hover:scale-105 hover:shadow-lg ${
                    app.isActive 
                      ? 'opacity-100' 
                      : 'opacity-70 hover:opacity-90'
                  }`}
                  onClick={app.onClick}
                >
                  <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                    app.isActive 
                      ? 'bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/15 group-hover:to-primary/10' 
                      : 'bg-gradient-to-br from-muted/30 to-muted/10 group-hover:from-muted/40 group-hover:to-muted/20'
                  }`}></div>
                  <div className="relative z-10 text-center px-4">
                    <div className={`text-xl font-bold mb-2 transition-colors duration-300 ${
                      app.isActive 
                        ? 'text-foreground group-hover:text-primary' 
                        : 'text-foreground group-hover:text-primary'
                    }`}>{app.name}</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{app.description}</div>
                  </div>
                  <div className={`absolute top-3 right-3 w-2 h-2 rounded-full transition-opacity duration-300 ${
                    app.isActive 
                      ? 'bg-primary opacity-60 group-hover:opacity-100' 
                      : 'bg-muted-foreground opacity-40 group-hover:opacity-60'
                  }`}></div>
                </div>
              ))}
            </div>

            {/* No results message */}
            {searchQuery && filteredApps.length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground text-lg mb-2">No apps found</div>
                <div className="text-sm text-muted-foreground">Try searching with different keywords</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
