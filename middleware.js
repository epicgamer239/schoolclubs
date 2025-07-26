import { NextResponse } from 'next/server';
import { createRateLimiter, sanitizeInput, logSecurityEvent } from './utils/security';

// Environment check for development vs production
const isDevelopment = process.env.NODE_ENV === 'development';

// Rate limiting configuration
const rateLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
);

// Security headers - more restrictive for production
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // More restrictive CSP for production
  'Content-Security-Policy': isDevelopment 
    ? "default-src 'self' https: data: blob:; script-src 'self' 'unsafe-eval' 'unsafe-inline' https: data: blob:; style-src 'self' 'unsafe-inline' https: data: blob:; font-src 'self' https: data: blob:; img-src 'self' data: blob: https:; connect-src 'self' https: data: blob:; frame-src 'self' https: data: blob:; object-src 'none';"
    : "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://www.googleapis.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://apis.google.com; frame-src 'self' https://accounts.google.com https://apis.google.com; object-src 'none';",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// CORS configuration - more restrictive for production
const corsHeaders = isDevelopment ? {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Firebase-Storage-Version',
  'Access-Control-Allow-Credentials': 'true'
} : {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://yourdomain.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true'
};

// Request size limits
const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get client IP for rate limiting
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';

  // Rate limiting check - enabled for production
  if (!isDevelopment && !rateLimiter(clientIP)) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: clientIP,
      path: pathname,
      userAgent: request.headers.get('user-agent')
    });

    return new NextResponse(
      JSON.stringify({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: 60
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          ...securityHeaders
        }
      }
    );
  }

  // Check request size for API routes
  if (pathname.startsWith('/api/')) {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      logSecurityEvent('REQUEST_TOO_LARGE', {
        ip: clientIP,
        path: pathname,
        size: contentLength
      });

      return new NextResponse(
        JSON.stringify({ error: 'Request too large' }),
        {
          status: 413,
          headers: {
            'Content-Type': 'application/json',
            ...securityHeaders
          }
        }
      );
    }

    // Validate and sanitize request body for POST/PUT requests - enabled for production
    if (!isDevelopment && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      return validateRequestBody(request);
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

// Validate and sanitize request body
async function validateRequestBody(request) {
  try {
    const contentType = request.headers.get('content-type');
    
    // Only validate JSON requests
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.next();
    }

    // Clone request to read body
    const clonedRequest = request.clone();
    const body = await clonedRequest.json();

    // Sanitize body recursively
    const sanitizedBody = sanitizeObject(body);

    // Create new request with sanitized body
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(sanitizedBody)
    });

    return NextResponse.next({
      request: newRequest
    });

  } catch (error) {
    logSecurityEvent('REQUEST_VALIDATION_ERROR', {
      error: error.message,
      path: request.nextUrl.pathname
    });

    return new NextResponse(
      JSON.stringify({ error: 'Invalid request body' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...securityHeaders
        }
      }
    );
  }
}

// Recursively sanitize object properties
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeInput(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }

  return sanitized;
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 