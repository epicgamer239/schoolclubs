import { 
  sanitizeInput, 
  validateInput, 
  escapeHtml, 
  validateUrl, 
  sanitizeEmail,
  validateRole,
  validateSchoolId,
  sanitizeClubData,
  validateClubData
} from '../../utils/security'

describe('Security Utils', () => {
  describe('sanitizeInput', () => {
    test('removes HTML tags from input', () => {
      const input = '<script>alert("xss")</script>Hello World'
      const result = sanitizeInput(input)
      expect(result).toBe('Hello World')
    })

    test('removes multiple HTML tags', () => {
      const input = '<div><p>Hello</p><span>World</span></div>'
      const result = sanitizeInput(input)
      expect(result).toBe('HelloWorld')
    })

    test('handles empty string', () => {
      const result = sanitizeInput('')
      expect(result).toBe('')
    })

    test('handles null and undefined', () => {
      expect(sanitizeInput(null)).toBe('')
      expect(sanitizeInput(undefined)).toBe('')
    })

    test('handles special characters', () => {
      const input = '<>&"\''
      const result = sanitizeInput(input)
      expect(result).toBe('')
    })

    test('preserves valid text content', () => {
      const input = 'Hello World 123 !@#$%^&*()'
      const result = sanitizeInput(input)
      expect(result).toBe('Hello World 123 !@#$%^&*()')
    })

    test('handles mixed content', () => {
      const input = 'Hello<script>alert("xss")</script>World'
      const result = sanitizeInput(input)
      expect(result).toBe('HelloWorld')
    })
  })

  describe('validateInput', () => {
    test('validates required fields', () => {
      const result = validateInput('test', { required: true, minLength: 3 })
      expect(result.isValid).toBe(true)
    })

    test('fails validation for empty required field', () => {
      const result = validateInput('', { required: true })
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('This field is required')
    })

    test('validates minimum length', () => {
      const result = validateInput('ab', { minLength: 3 })
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Minimum length is 3 characters')
    })

    test('validates maximum length', () => {
      const result = validateInput('abcdefghijklmnop', { maxLength: 10 })
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Maximum length is 10 characters')
    })

    test('validates pattern', () => {
      const result = validateInput('test123', { pattern: /^[a-zA-Z]+$/, patternMessage: 'Only letters allowed' })
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Only letters allowed')
    })

    test('handles multiple validations', () => {
      const result = validateInput('test', { 
        required: true, 
        minLength: 3, 
        maxLength: 10,
        pattern: /^[a-zA-Z]+$/
      })
      expect(result.isValid).toBe(true)
    })

    test('handles null and undefined', () => {
      expect(validateInput(null, { required: true }).isValid).toBe(false)
      expect(validateInput(undefined, { required: true }).isValid).toBe(false)
    })
  })

  describe('escapeHtml', () => {
    test('escapes HTML special characters', () => {
      const input = '<>&"\''
      const result = escapeHtml(input)
      expect(result).toBe('&lt;&gt;&amp;&quot;&#39;')
    })

    test('handles empty string', () => {
      const result = escapeHtml('')
      expect(result).toBe('')
    })

    test('handles null and undefined', () => {
      expect(escapeHtml(null)).toBe('')
      expect(escapeHtml(undefined)).toBe('')
    })

    test('preserves safe text', () => {
      const input = 'Hello World 123'
      const result = escapeHtml(input)
      expect(result).toBe('Hello World 123')
    })

    test('escapes script tags', () => {
      const input = '<script>alert("xss")</script>'
      const result = escapeHtml(input)
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
    })
  })

  describe('validateUrl', () => {
    test('validates correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com',
        'https://example.com/path',
        'https://example.com/path?param=value',
        'https://example.com/path#fragment',
      ]

      validUrls.forEach(url => {
        expect(validateUrl(url)).toBe(true)
      })
    })

    test('rejects invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'file:///etc/passwd',
        '',
        'https://',
        'http://',
      ]

      invalidUrls.forEach(url => {
        expect(validateUrl(url)).toBe(false)
      })
    })

    test('handles null and undefined', () => {
      expect(validateUrl(null)).toBe(false)
      expect(validateUrl(undefined)).toBe(false)
    })
  })

  describe('sanitizeEmail', () => {
    test('sanitizes email addresses', () => {
      const input = 'test<script>alert("xss")</script>@example.com'
      const result = sanitizeEmail(input)
      expect(result).toBe('test@example.com')
    })

    test('handles empty email', () => {
      const result = sanitizeEmail('')
      expect(result).toBe('')
    })

    test('handles null and undefined', () => {
      expect(sanitizeEmail(null)).toBe('')
      expect(sanitizeEmail(undefined)).toBe('')
    })

    test('preserves valid email', () => {
      const input = 'test@example.com'
      const result = sanitizeEmail(input)
      expect(result).toBe('test@example.com')
    })

    test('removes whitespace', () => {
      const input = ' test@example.com '
      const result = sanitizeEmail(input)
      expect(result).toBe('test@example.com')
    })
  })

  describe('validateRole', () => {
    test('validates correct roles', () => {
      const validRoles = ['admin', 'teacher', 'student']
      
      validRoles.forEach(role => {
        expect(validateRole(role)).toBe(true)
      })
    })

    test('rejects invalid roles', () => {
      const invalidRoles = [
        'invalid',
        'ADMIN',
        'Admin',
        'teacher123',
        '',
        null,
        undefined,
        'admin<script>alert("xss")</script>',
      ]

      invalidRoles.forEach(role => {
        expect(validateRole(role)).toBe(false)
      })
    })
  })

  describe('validateSchoolId', () => {
    test('validates correct school IDs', () => {
      const validSchoolIds = [
        'school123',
        'SCHOOL456',
        'school_789',
        'school-abc',
        'school123abc',
      ]

      validSchoolIds.forEach(schoolId => {
        expect(validateSchoolId(schoolId)).toBe(true)
      })
    })

    test('rejects invalid school IDs', () => {
      const invalidSchoolIds = [
        '',
        'school<script>alert("xss")</script>',
        'school@123',
        'school#123',
        'school$123',
        'school%123',
        'school^123',
        'school&123',
        'school*123',
        'school(123',
        'school)123',
        'school+123',
        'school=123',
        'school[123',
        'school]123',
        'school{123',
        'school}123',
        'school|123',
        'school\\123',
        'school:123',
        'school;123',
        'school"123',
        'school\'123',
        'school<123',
        'school>123',
        'school,123',
        'school.123',
        'school?123',
        'school/123',
        null,
        undefined,
      ]

      invalidSchoolIds.forEach(schoolId => {
        expect(validateSchoolId(schoolId)).toBe(false)
      })
    })
  })

  describe('sanitizeClubData', () => {
    test('sanitizes club data', () => {
      const clubData = {
        name: '<script>alert("xss")</script>Test Club',
        description: 'Test<script>alert("xss")</script>Description',
        tags: ['tag1<script>alert("xss")</script>', 'tag2'],
        schoolId: 'school123<script>alert("xss")</script>',
      }

      const result = sanitizeClubData(clubData)

      expect(result.name).toBe('Test Club')
      expect(result.description).toBe('TestDescription')
      expect(result.tags).toEqual(['tag1', 'tag2'])
      expect(result.schoolId).toBe('school123')
    })

    test('handles missing fields', () => {
      const clubData = {
        name: 'Test Club',
        // missing description and tags
      }

      const result = sanitizeClubData(clubData)

      expect(result.name).toBe('Test Club')
      expect(result.description).toBe('')
      expect(result.tags).toEqual([])
    })

    test('handles null and undefined', () => {
      expect(sanitizeClubData(null)).toEqual({
        name: '',
        description: '',
        tags: [],
        schoolId: '',
      })
      expect(sanitizeClubData(undefined)).toEqual({
        name: '',
        description: '',
        tags: [],
        schoolId: '',
      })
    })

    test('sanitizes nested objects', () => {
      const clubData = {
        name: 'Test Club',
        metadata: {
          creator: '<script>alert("xss")</script>John Doe',
          notes: 'Test<script>alert("xss")</script>Notes',
        },
      }

      const result = sanitizeClubData(clubData)

      expect(result.name).toBe('Test Club')
      expect(result.metadata.creator).toBe('John Doe')
      expect(result.metadata.notes).toBe('TestNotes')
    })
  })

  describe('validateClubData', () => {
    test('validates correct club data', () => {
      const clubData = {
        name: 'Test Club',
        description: 'Test Description',
        tags: ['tag1', 'tag2'],
        schoolId: 'school123',
      }

      const result = validateClubData(clubData)

      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    test('fails validation for missing required fields', () => {
      const clubData = {
        description: 'Test Description',
        // missing name and schoolId
      }

      const result = validateClubData(clubData)

      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBe('Club name is required')
      expect(result.errors.schoolId).toBe('School ID is required')
    })

    test('fails validation for invalid name length', () => {
      const clubData = {
        name: 'A', // too short
        description: 'Test Description',
        schoolId: 'school123',
      }

      const result = validateClubData(clubData)

      expect(result.isValid).toBe(false)
      expect(result.errors.name).toBe('Club name must be between 2 and 100 characters')
    })

    test('fails validation for invalid description length', () => {
      const clubData = {
        name: 'Test Club',
        description: 'A'.repeat(1001), // too long
        schoolId: 'school123',
      }

      const result = validateClubData(clubData)

      expect(result.isValid).toBe(false)
      expect(result.errors.description).toBe('Description must be less than 1000 characters')
    })

    test('fails validation for invalid tags', () => {
      const clubData = {
        name: 'Test Club',
        description: 'Test Description',
        tags: ['tag1<script>alert("xss")</script>', 'tag2'],
        schoolId: 'school123',
      }

      const result = validateClubData(clubData)

      expect(result.isValid).toBe(false)
      expect(result.errors.tags).toBe('Tags contain invalid characters')
    })

    test('fails validation for invalid school ID', () => {
      const clubData = {
        name: 'Test Club',
        description: 'Test Description',
        tags: ['tag1', 'tag2'],
        schoolId: 'school<script>alert("xss")</script>123',
      }

      const result = validateClubData(clubData)

      expect(result.isValid).toBe(false)
      expect(result.errors.schoolId).toBe('Invalid school ID format')
    })

    test('handles null and undefined', () => {
      expect(validateClubData(null).isValid).toBe(false)
      expect(validateClubData(undefined).isValid).toBe(false)
    })
  })
}) 