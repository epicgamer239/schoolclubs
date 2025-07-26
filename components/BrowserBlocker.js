"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function BrowserBlocker({ children }) {
  const [blocked, setBlocked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent;
      const mobile = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|BlackBerry/i.test(ua);
      setIsMobile(mobile);
      
      // Block mobile devices from accessing protected routes
      if (mobile && !isPublicRoute(pathname)) {
        setBlocked(true);
      }
    }
  }, [pathname]);
  
  // Check if current route is public (homepage/welcome)
  const isPublicRoute = (path) => {
    const publicRoutes = ['/', '/welcome', '/login', '/signup'];
    return publicRoutes.includes(path);
  };
  
  if (blocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-8">
        <div className="max-w-md w-full card p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Mobile Access Limited</h1>
          <p className="mb-4">This application is optimized for desktop use.</p>
          <p className="text-muted-foreground mb-4">You can browse the homepage to learn about our platform, but full functionality requires a desktop computer.</p>
          <button 
            onClick={() => window.history.back()}
            className="btn btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return children;
} 