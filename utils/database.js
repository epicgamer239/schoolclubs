import { firestore } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  writeBatch,
  runTransaction,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { cacheUtils, cacheKeys } from './cache';
import { logSecurityEvent, validateField, sanitizeInput } from './security';

// Database configuration
const DB_CONFIG = {
  MAX_BATCH_SIZE: 500,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  CACHE_TTL: 300, // 5 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  // Optimized cache durations
  CACHE_DURATIONS: {
    USER: 1800,        // 30 minutes
    SCHOOL: 3600,      // 1 hour  
    CLUBS: 900,        // 15 minutes
    EVENTS: 300,       // 5 minutes
    TAGS: 1800,        // 30 minutes
    JOIN_REQUESTS: 120, // 2 minutes
    DASHBOARD: 300     // 5 minutes
  }
};

// Database security and validation utilities
class DatabaseManager {
  constructor() {
    this.batch = null;
    this.transaction = null;
  }

  // Validate and sanitize data before database operations
  validateData(data, schema) {
    const validated = {};
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      if (rules.required && !value) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        // Sanitize string values
        if (typeof value === 'string') {
          validated[field] = sanitizeInput(value);
        } else {
          validated[field] = value;
        }

        // Validate field
        if (rules.validator && !rules.validator(validated[field])) {
          errors.push(`${field} validation failed`);
        }
      }
  }

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }

    return validated;
  }

  // Retry mechanism for database operations
  async withRetry(operation, maxAttempts = DB_CONFIG.RETRY_ATTEMPTS) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on validation errors
        if (error.message.includes('Validation errors')) {
          throw error;
        }
        
        // Log retry attempt
        logSecurityEvent('DB_RETRY_ATTEMPT', {
          attempt,
          maxAttempts,
          error: error.message,
          operation: operation.name || 'unknown'
        });
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, DB_CONFIG.RETRY_DELAY * attempt));
        }
      }
    }
    
    throw lastError;
  }

  // Get document with caching
  async getDocument(collectionName, docId, useCache = true) {
    const cacheKey = cacheKeys[collectionName]?.(docId) || `${collectionName}:${docId}`;
    
    if (useCache) {
      // Use appropriate cache function based on collection
      let cached;
      switch (collectionName) {
        case 'users':
          cached = cacheUtils.getCachedUser(docId);
          break;
        case 'schools':
          cached = cacheUtils.getCachedSchool(docId);
          break;
        default:
          cached = globalCache.get(cacheKey);
      }
      if (cached) return cached;
    }

    return this.withRetry(async () => {
      const docRef = doc(firestore, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }
      
      const data = { id: docSnap.id, ...docSnap.data() };
      
      // Cache the result with appropriate duration
      if (useCache) {
        const cacheDuration = DB_CONFIG.CACHE_DURATIONS[collectionName.toUpperCase()] || DB_CONFIG.CACHE_TTL;
        switch (collectionName) {
          case 'users':
            cacheUtils.cacheUser(docId, data);
            break;
          case 'schools':
            cacheUtils.cacheSchool(docId, data);
            break;
          default:
            globalCache.set(cacheKey, data, cacheDuration);
        }
      }
      
      return data;
    });
  }

  // Get documents with pagination and caching
  async getDocuments(collectionName, options = {}) {
    const {
      whereClauses = [],
      orderByField = 'createdAt',
      orderDirection = 'desc',
      limitCount = DB_CONFIG.DEFAULT_LIMIT,
      startAfterDoc = null,
      useCache = true
    } = options;

    // Validate limit
    if (limitCount > DB_CONFIG.MAX_LIMIT) {
      limitCount = DB_CONFIG.MAX_LIMIT;
    }

    const cacheKey = `${collectionName}:${JSON.stringify(options)}`;
    
    if (useCache) {
      const cached = cacheUtils.getCachedClubs(collectionName);
      if (cached) return cached;
    }

    return this.withRetry(async () => {
      let q = collection(firestore, collectionName);
      
      // Apply where clauses
      whereClauses.forEach(({ field, operator, value }) => {
        q = query(q, where(field, operator, value));
      });
      
      // Apply ordering
      q = query(q, orderBy(orderByField, orderDirection));
      
      // Apply pagination
      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }
      
      q = query(q, limit(limitCount));
      
      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Cache the result
      if (useCache) {
        cacheUtils.cacheClubs(collectionName, documents);
      }
      
      return {
        documents,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
        hasMore: querySnapshot.docs.length === limitCount
      };
    });
  }

  // Add document with validation
  async addDocument(collectionName, data, schema = {}) {
    // Validate data
    const validatedData = this.validateData(data, schema);
    
    // Add timestamps
    validatedData.createdAt = serverTimestamp();
    validatedData.updatedAt = serverTimestamp();
    
    return this.withRetry(async () => {
      const docRef = await addDoc(collection(firestore, collectionName), validatedData);
      
      // Invalidate cache
      cacheUtils.invalidateCache(collectionName);
      
      logSecurityEvent('DOCUMENT_CREATED', {
        collection: collectionName,
        docId: docRef.id,
        data: validatedData
      });
      
      return { id: docRef.id, ...validatedData };
    });
  }

  // Update document with validation
  async updateDocument(collectionName, docId, data, schema = {}) {
    // Validate data
    const validatedData = this.validateData(data, schema);
    
    // Add update timestamp
    validatedData.updatedAt = serverTimestamp();
    
    return this.withRetry(async () => {
      const docRef = doc(firestore, collectionName, docId);
      await updateDoc(docRef, validatedData);
      
      // Invalidate cache
      cacheUtils.invalidateCache(collectionName);
      cacheUtils.invalidateCache(docId);
      
      logSecurityEvent('DOCUMENT_UPDATED', {
        collection: collectionName,
        docId,
        data: validatedData
      });
      
      return { id: docId, ...validatedData };
    });
  }

  // Delete document
  async deleteDocument(collectionName, docId) {
    return this.withRetry(async () => {
      const docRef = doc(firestore, collectionName, docId);
      await deleteDoc(docRef);
      
      // Invalidate cache
      cacheUtils.invalidateCache(collectionName);
      cacheUtils.invalidateCache(docId);
      
      logSecurityEvent('DOCUMENT_DELETED', {
        collection: collectionName,
        docId
      });
      
      return { success: true };
    });
  }

  // Batch operations
  async batchOperation(operations) {
    if (operations.length > DB_CONFIG.MAX_BATCH_SIZE) {
      throw new Error(`Batch size exceeds limit of ${DB_CONFIG.MAX_BATCH_SIZE}`);
    }
    
    return this.withRetry(async () => {
      const batch = writeBatch(firestore);
      
      operations.forEach(({ type, collectionName, docId, data }) => {
        const docRef = doc(firestore, collectionName, docId);
        
        switch (type) {
          case 'set':
            batch.set(docRef, data);
            break;
          case 'update':
            batch.update(docRef, data);
            break;
          case 'delete':
            batch.delete(docRef);
            break;
          default:
            throw new Error(`Invalid operation type: ${type}`);
        }
      });
      
      await batch.commit();
      
      // Invalidate cache for all affected collections
      const collections = [...new Set(operations.map(op => op.collectionName))];
      collections.forEach(col => cacheUtils.invalidateCache(col));
      
      logSecurityEvent('BATCH_OPERATION', {
        operations: operations.length,
        collections
      });
      
      return { success: true };
    });
  }

  // Transaction operations
  async transactionOperation(updateFunction) {
    return this.withRetry(async () => {
      const result = await runTransaction(firestore, updateFunction);
      
      logSecurityEvent('TRANSACTION_COMPLETED', {
        result: typeof result
      });
      
      return result;
    });
  }

  // Real-time listeners with error handling
  subscribeToDocument(collectionName, docId, callback) {
    const docRef = doc(firestore, collectionName, docId);
    
    return onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          const data = { id: doc.id, ...doc.data() };
          callback(null, data);
        } else {
          callback(new Error('Document not found'), null);
        }
      },
      (error) => {
        logSecurityEvent('REALTIME_ERROR', {
          collection: collectionName,
          docId,
          error: error.message
        });
        callback(error, null);
      }
    );
  }

  // Subscribe to collection with query
  subscribeToCollection(collectionName, options = {}, callback) {
    const {
      whereClauses = [],
      orderByField = 'createdAt',
      orderDirection = 'desc',
      limitCount = DB_CONFIG.DEFAULT_LIMIT
    } = options;

    let q = collection(firestore, collectionName);
    
    whereClauses.forEach(({ field, operator, value }) => {
      q = query(q, where(field, operator, value));
    });
    
    q = query(q, orderBy(orderByField, orderDirection), limit(limitCount));
    
    return onSnapshot(q,
      (querySnapshot) => {
        const documents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(null, documents);
      },
      (error) => {
        logSecurityEvent('REALTIME_ERROR', {
          collection: collectionName,
          error: error.message
        });
        callback(error, null);
      }
    );
  }
}

// Schema definitions for validation
export const schemas = {
  user: {
    name: { required: true, validator: (value) => validateField('name', value) },
    email: { required: true, validator: (value) => validateField('email', value) },
    role: { required: true, validator: (value) => ['student', 'teacher', 'admin'].includes(value) },
    schoolId: { required: false },
    createdAt: { required: false },
    updatedAt: { required: false }
  },
  
  club: {
    name: { required: true, validator: (value) => validateField('clubName', value) },
    description: { required: true, validator: (value) => validateField('description', value) },
    teacherId: { required: true },
    schoolId: { required: true },
    joinCode: { required: true, validator: (value) => validateField('joinCode', value) },
    capacity: { required: false, validator: (value) => !value || (value > 0 && value <= 1000) },
    createdAt: { required: false },
    updatedAt: { required: false }
  },
  
  event: {
    title: { required: true, validator: (value) => value && value.length >= 2 && value.length <= 100 },
    description: { required: true, validator: (value) => validateField('description', value) },
    date: { required: true, validator: (value) => validateField('date', value) },
    time: { required: false, validator: (value) => validateField('time', value) },
    clubId: { required: true },
    location: { required: false },
    capacity: { required: false, validator: (value) => !value || (value > 0 && value <= 1000) },
    createdAt: { required: false },
    updatedAt: { required: false }
  },
  
  school: {
    name: { required: true, validator: (value) => validateField('clubName', value) },
    address: { required: false },
    adminId: { required: true },
    joinCode: { required: true, validator: (value) => validateField('joinCode', value) },
    createdAt: { required: false },
    updatedAt: { required: false }
  }
};

// Create and export database manager instance
const db = new DatabaseManager();
export default db; 

// Attendance utilities
export async function setAttendance(eventId, userId, status, markedBy) {
  const attendanceRef = doc(firestore, 'events', eventId, 'attendance', userId);
  await updateDoc(attendanceRef, {
    status,
    markedBy,
    timestamp: serverTimestamp(),
  });
}

export async function getAttendance(eventId) {
  const attendanceCol = collection(firestore, 'events', eventId, 'attendance');
  const snap = await getDocs(attendanceCol);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

 

// Announcement utilities
export async function createAnnouncement(clubId, data) {
  const announcementData = {
    ...data,
    clubId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(firestore, 'announcements'), announcementData);
  return { id: docRef.id, ...announcementData };
}

export async function getAnnouncements(clubId) {
  const announcementsQuery = query(
    collection(firestore, 'announcements'),
    where('clubId', '==', clubId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(announcementsQuery);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateAnnouncement(announcementId, data) {
  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  
  await updateDoc(doc(firestore, 'announcements', announcementId), updateData);
  return { id: announcementId, ...updateData };
}

export async function deleteAnnouncement(announcementId) {
  await deleteDoc(doc(firestore, 'announcements', announcementId));
}

export async function getAnnouncementsForUser(userId, clubIds) {
  if (!clubIds || clubIds.length === 0) return [];
  
  const announcementsQuery = query(
    collection(firestore, 'announcements'),
    where('clubId', 'in', clubIds),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snap = await getDocs(announcementsQuery);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
} 

// Enhanced RSVP utilities
export async function setEventRSVP(eventId, userId, status) {
  const rsvpRef = doc(firestore, 'events', eventId, 'rsvps', userId);
  await updateDoc(rsvpRef, {
    status, // 'yes', 'no', 'maybe'
    userId,
    timestamp: serverTimestamp(),
  });
}

export async function getEventRSVPs(eventId) {
  const rsvpCol = collection(firestore, 'events', eventId, 'rsvps');
  const snap = await getDocs(rsvpCol);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getEventRSVPSummary(eventId) {
  const rsvps = await getEventRSVPs(eventId);
  const summary = { yes: 0, no: 0, maybe: 0, total: rsvps.length };
  rsvps.forEach(rsvp => {
    if (summary[rsvp.status] !== undefined) summary[rsvp.status]++;
  });
  return summary;
}

export async function markEventAttendance(eventId, userId, status) {
  const attendanceRef = doc(firestore, 'events', eventId, 'attendance', userId);
  await updateDoc(attendanceRef, {
    status, // 'present', 'absent', 'late', 'excused'
    userId,
    timestamp: serverTimestamp(),
  });
}

export async function getEventAttendance(eventId) {
  const attendanceCol = collection(firestore, 'events', eventId, 'attendance');
  const snap = await getDocs(attendanceCol);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getEventAttendanceSummary(eventId) {
  const attendance = await getEventAttendance(eventId);
  const summary = { present: 0, absent: 0, late: 0, excused: 0, total: attendance.length };
  attendance.forEach(a => {
    if (summary[a.status] !== undefined) summary[a.status]++;
  });
  return summary;
} 