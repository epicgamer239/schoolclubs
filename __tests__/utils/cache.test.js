import { 
  setCache, 
  getCache, 
  removeCache, 
  clearCache, 
  setCacheWithExpiry,
  getCacheWithExpiry,
  cacheTags,
  getCachedTags,
  clearTagCache
} from '../../utils/cache'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

describe('Cache Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear any existing cache
    clearCache()
  })

  describe('setCache', () => {
    test('sets cache value', () => {
      const key = 'test-key'
      const value = { data: 'test-data' }

      setCache(key, value)

      expect(localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(value))
    })

    test('handles string values', () => {
      const key = 'test-key'
      const value = 'test-string'

      setCache(key, value)

      expect(localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(value))
    })

    test('handles number values', () => {
      const key = 'test-key'
      const value = 123

      setCache(key, value)

      expect(localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(value))
    })

    test('handles boolean values', () => {
      const key = 'test-key'
      const value = true

      setCache(key, value)

      expect(localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(value))
    })

    test('handles null and undefined', () => {
      setCache('null-key', null)
      setCache('undefined-key', undefined)

      expect(localStorage.setItem).toHaveBeenCalledWith('null-key', JSON.stringify(null))
      expect(localStorage.setItem).toHaveBeenCalledWith('undefined-key', JSON.stringify(undefined))
    })
  })

  describe('getCache', () => {
    test('retrieves cached value', () => {
      const key = 'test-key'
      const value = { data: 'test-data' }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(value))

      const result = getCache(key)

      expect(localStorage.getItem).toHaveBeenCalledWith(key)
      expect(result).toEqual(value)
    })

    test('returns null for non-existent key', () => {
      const key = 'non-existent-key'
      localStorageMock.getItem.mockReturnValue(null)

      const result = getCache(key)

      expect(result).toBeNull()
    })

    test('handles invalid JSON', () => {
      const key = 'invalid-json-key'
      localStorageMock.getItem.mockReturnValue('invalid-json')

      const result = getCache(key)

      expect(result).toBeNull()
    })

    test('handles empty string', () => {
      const key = 'empty-key'
      localStorageMock.getItem.mockReturnValue('')

      const result = getCache(key)

      expect(result).toBeNull()
    })
  })

  describe('removeCache', () => {
    test('removes cached value', () => {
      const key = 'test-key'

      removeCache(key)

      expect(localStorage.removeItem).toHaveBeenCalledWith(key)
    })
  })

  describe('clearCache', () => {
    test('clears all cache', () => {
      clearCache()

      expect(localStorage.clear).toHaveBeenCalled()
    })
  })

  describe('setCacheWithExpiry', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('sets cache with expiry', () => {
      const key = 'test-key'
      const value = { data: 'test-data' }
      const expiryMinutes = 5
      const now = new Date('2023-01-01T00:00:00Z')
      jest.setSystemTime(now)

      setCacheWithExpiry(key, value, expiryMinutes)

      const expectedExpiry = new Date(now.getTime() + expiryMinutes * 60 * 1000)
      const expectedData = {
        value,
        expiry: expectedExpiry.getTime()
      }

      expect(localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(expectedData))
    })

    test('handles default expiry time', () => {
      const key = 'test-key'
      const value = { data: 'test-data' }
      const now = new Date('2023-01-01T00:00:00Z')
      jest.setSystemTime(now)

      setCacheWithExpiry(key, value)

      const expectedExpiry = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour default
      const expectedData = {
        value,
        expiry: expectedExpiry.getTime()
      }

      expect(localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(expectedData))
    })
  })

  describe('getCacheWithExpiry', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('retrieves valid cached value', () => {
      const key = 'test-key'
      const value = { data: 'test-data' }
      const now = new Date('2023-01-01T00:00:00Z')
      const expiry = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
      
      const cachedData = {
        value,
        expiry: expiry.getTime()
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData))
      jest.setSystemTime(now)

      const result = getCacheWithExpiry(key)

      expect(result).toEqual(value)
    })

    test('returns null for expired cache', () => {
      const key = 'test-key'
      const value = { data: 'test-data' }
      const now = new Date('2023-01-01T00:00:00Z')
      const expiry = new Date(now.getTime() - 60 * 60 * 1000) // 1 hour ago
      
      const cachedData = {
        value,
        expiry: expiry.getTime()
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData))
      jest.setSystemTime(now)

      const result = getCacheWithExpiry(key)

      expect(result).toBeNull()
      expect(localStorage.removeItem).toHaveBeenCalledWith(key)
    })

    test('returns null for non-existent key', () => {
      const key = 'non-existent-key'
      localStorageMock.getItem.mockReturnValue(null)

      const result = getCacheWithExpiry(key)

      expect(result).toBeNull()
    })

    test('handles invalid JSON', () => {
      const key = 'invalid-json-key'
      localStorageMock.getItem.mockReturnValue('invalid-json')

      const result = getCacheWithExpiry(key)

      expect(result).toBeNull()
    })

    test('handles missing expiry field', () => {
      const key = 'missing-expiry-key'
      const cachedData = { value: { data: 'test-data' } }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData))

      const result = getCacheWithExpiry(key)

      expect(result).toBeNull()
    })
  })

  describe('cacheTags', () => {
    test('caches tags for school', () => {
      const schoolId = 'school123'
      const tags = [
        { id: 'tag1', name: 'Tag 1', color: '#FF5733' },
        { id: 'tag2', name: 'Tag 2', color: '#33FF57' },
      ]

      cacheTags(schoolId, tags)

      expect(localStorage.setItem).toHaveBeenCalledWith(
        `tags_${schoolId}`,
        JSON.stringify(tags)
      )
    })

    test('handles empty tags array', () => {
      const schoolId = 'school123'
      const tags = []

      cacheTags(schoolId, tags)

      expect(localStorage.setItem).toHaveBeenCalledWith(
        `tags_${schoolId}`,
        JSON.stringify(tags)
      )
    })

    test('handles null and undefined tags', () => {
      const schoolId = 'school123'

      cacheTags(schoolId, null)
      cacheTags(schoolId, undefined)

      expect(localStorage.setItem).toHaveBeenCalledWith(
        `tags_${schoolId}`,
        JSON.stringify(null)
      )
      expect(localStorage.setItem).toHaveBeenCalledWith(
        `tags_${schoolId}`,
        JSON.stringify(undefined)
      )
    })
  })

  describe('getCachedTags', () => {
    test('retrieves cached tags for school', () => {
      const schoolId = 'school123'
      const tags = [
        { id: 'tag1', name: 'Tag 1', color: '#FF5733' },
        { id: 'tag2', name: 'Tag 2', color: '#33FF57' },
      ]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(tags))

      const result = getCachedTags(schoolId)

      expect(localStorage.getItem).toHaveBeenCalledWith(`tags_${schoolId}`)
      expect(result).toEqual(tags)
    })

    test('returns null for non-existent school tags', () => {
      const schoolId = 'school123'
      localStorageMock.getItem.mockReturnValue(null)

      const result = getCachedTags(schoolId)

      expect(result).toBeNull()
    })

    test('handles invalid JSON', () => {
      const schoolId = 'school123'
      localStorageMock.getItem.mockReturnValue('invalid-json')

      const result = getCachedTags(schoolId)

      expect(result).toBeNull()
    })
  })

  describe('clearTagCache', () => {
    test('clears tag cache for specific school', () => {
      const schoolId = 'school123'

      clearTagCache(schoolId)

      expect(localStorage.removeItem).toHaveBeenCalledWith(`tags_${schoolId}`)
    })

    test('clears all tag caches when no schoolId provided', () => {
      // Mock getAllKeys to return tag keys
      const mockKeys = ['tags_school1', 'tags_school2', 'other_key']
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('tags_')) {
          localStorage.removeItem(key)
        }
      })

      clearTagCache()

      // Should have called removeItem for each tag key
      expect(localStorage.removeItem).toHaveBeenCalledWith('tags_school1')
      expect(localStorage.removeItem).toHaveBeenCalledWith('tags_school2')
    })
  })

  describe('Cache integration tests', () => {
    test('full cache lifecycle', () => {
      const key = 'lifecycle-test'
      const value = { data: 'test-data' }

      // Set cache
      setCache(key, value)
      expect(localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(value))

      // Get cache
      localStorageMock.getItem.mockReturnValue(JSON.stringify(value))
      const result = getCache(key)
      expect(result).toEqual(value)

      // Remove cache
      removeCache(key)
      expect(localStorage.removeItem).toHaveBeenCalledWith(key)
    })

    test('cache with expiry lifecycle', () => {
      jest.useFakeTimers()
      const key = 'expiry-test'
      const value = { data: 'test-data' }
      const now = new Date('2023-01-01T00:00:00Z')
      jest.setSystemTime(now)

      // Set cache with expiry
      setCacheWithExpiry(key, value, 5)
      const expectedExpiry = new Date(now.getTime() + 5 * 60 * 1000)
      const expectedData = {
        value,
        expiry: expectedExpiry.getTime()
      }
      expect(localStorage.setItem).toHaveBeenCalledWith(key, JSON.stringify(expectedData))

      // Get valid cache
      localStorageMock.getItem.mockReturnValue(JSON.stringify(expectedData))
      const result = getCacheWithExpiry(key)
      expect(result).toEqual(value)

      // Test expired cache
      const expiredData = {
        value,
        expiry: new Date(now.getTime() - 60 * 60 * 1000).getTime() // 1 hour ago
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredData))
      const expiredResult = getCacheWithExpiry(key)
      expect(expiredResult).toBeNull()

      jest.useRealTimers()
    })

    test('tag cache lifecycle', () => {
      const schoolId = 'school123'
      const tags = [
        { id: 'tag1', name: 'Tag 1', color: '#FF5733' },
        { id: 'tag2', name: 'Tag 2', color: '#33FF57' },
      ]

      // Cache tags
      cacheTags(schoolId, tags)
      expect(localStorage.setItem).toHaveBeenCalledWith(
        `tags_${schoolId}`,
        JSON.stringify(tags)
      )

      // Get cached tags
      localStorageMock.getItem.mockReturnValue(JSON.stringify(tags))
      const result = getCachedTags(schoolId)
      expect(result).toEqual(tags)

      // Clear tag cache
      clearTagCache(schoolId)
      expect(localStorage.removeItem).toHaveBeenCalledWith(`tags_${schoolId}`)
    })
  })
}) 