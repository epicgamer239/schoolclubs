// Secure logging utility
const isDevelopment = process.env.NODE_ENV === 'development';

// Secure console logging - only in development
export const secureLog = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const secureError = (...args) => {
  if (isDevelopment) {
    console.error(...args);
  } else {
    // In production, log to external service or file
    // This prevents information disclosure
  }
};

export const secureWarn = (...args) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

// Debug logging - only in development
export const debug = (message, data = null) => {
  if (isDevelopment) {
    console.log(`[DEBUG] ${message}`, data);
  }
};

// Security event logging - always logged but sanitized
export const logSecurityEvent = (event, details = {}) => {
  const sanitizedDetails = {
    ...details,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  };
  
  // Remove sensitive information
  delete sanitizedDetails.password;
  delete sanitizedDetails.token;
  delete sanitizedDetails.apiKey;
  
  if (isDevelopment) {
    console.log(`[SECURITY] ${event}:`, sanitizedDetails);
  } else {
    // In production, send to security monitoring service
    // Example: securityMonitoringService.log(event, sanitizedDetails);
  }
};

// Performance logging
export const logPerformance = (operation, duration) => {
  if (isDevelopment) {
    console.log(`[PERF] ${operation}: ${duration}ms`);
  } else {
    // In production, send to performance monitoring
    // Example: performanceMonitoringService.track(operation, duration);
  }
}; 