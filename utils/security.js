// Security utilities for input validation, sanitization, and security checks

// Input sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags and dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Password strength validation
export const validatePassword = (password) => {
  if (!password || password.length < 8) return false;
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};

// File validation
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif']
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large' };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: 'File extension not allowed' };
  }

  return { valid: true };
};

// Rate limiting helper
export const createRateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  const requests = new Map();
  
  return (identifier) => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, timestamp] of requests.entries()) {
      if (timestamp < windowStart) {
        requests.delete(key);
      }
    }
    
    // Check current requests
    const userRequests = requests.get(identifier) || [];
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    // Add current request
    recentRequests.push(now);
    requests.set(identifier, recentRequests);
    
    return true; // Request allowed
  };
};

// XSS Protection
export const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// CSRF Token generation
export const generateCSRFToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Validate CSRF Token
export const validateCSRFToken = (token, storedToken) => {
  return token === storedToken;
};

// SQL Injection prevention (for any SQL-like queries)
export const sanitizeQuery = (query) => {
  // Remove dangerous characters and patterns
  return query
    .replace(/['";]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/union\s+select/gi, '')
    .replace(/drop\s+table/gi, '')
    .replace(/delete\s+from/gi, '');
};

// Session validation
export const validateSession = (session) => {
  if (!session || !session.user) return false;
  
  // Check if session is expired (24 hours)
  const sessionAge = Date.now() - session.createdAt;
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  return sessionAge < maxAge;
};

// Permission checking
export const checkPermission = (user, resource, action) => {
  if (!user) return false;
  
  const permissions = {
    admin: ['read', 'write', 'delete', 'create'],
    teacher: ['read', 'write', 'create'],
    student: ['read']
  };
  
  const userPermissions = permissions[user.role] || [];
  return userPermissions.includes(action);
};

// Audit logging
export const logSecurityEvent = (event, details) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    ip: 'client-ip-would-be-here'
  };
  
  console.log('SECURITY EVENT:', logEntry);
  // In production, send to logging service
};

// Input validation for common fields
export const validateField = (field, value, options = {}) => {
  const validators = {
    email: () => validateEmail(value),
    password: () => validatePassword(value),
    name: () => value && value.length >= 2 && value.length <= 50,
    clubName: () => value && value.length >= 2 && value.length <= 50,
    description: () => value && value.length >= 10 && value.length <= 500,
    joinCode: () => value && value.length >= 4 && value.length <= 10,
    date: () => {
      const date = new Date(value);
      return !isNaN(date.getTime()) && date >= new Date();
    },
    time: () => {
      if (!value) return true; // Time is optional
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      return timeRegex.test(value);
    }
  };
  
  const validator = validators[field];
  return validator ? validator() : true;
}; 