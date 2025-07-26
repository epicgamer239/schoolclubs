import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '../../app/api/tags/route'

// Mock Firebase
const mockAddDoc = jest.fn()
const mockGetDocs = jest.fn()
const mockUpdateDoc = jest.fn()
const mockDeleteDoc = jest.fn()
const mockCollection = jest.fn()
const mockDoc = jest.fn()
const mockQuery = jest.fn()
const mockWhere = jest.fn()

jest.mock('../../firebase', () => ({
  firestore: {
    addDoc: mockAddDoc,
    getDocs: mockGetDocs,
    updateDoc: mockUpdateDoc,
    deleteDoc: mockDeleteDoc,
    collection: mockCollection,
    doc: mockDoc,
    query: mockQuery,
    where: mockWhere,
  },
}))

describe('Tags API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/tags', () => {
    test('returns all tags for a school', async () => {
      const mockTags = [
        { id: 'tag1', name: 'Tag 1', description: 'Description 1', color: '#FF5733', usageCount: 2 },
        { id: 'tag2', name: 'Tag 2', description: 'Description 2', color: '#33FF57', usageCount: 1 },
      ]

      const mockQuerySnap = {
        docs: mockTags.map(tag => ({
          id: tag.id,
          data: () => tag
        })),
        empty: false,
        size: 2
      }

      mockGetDocs.mockResolvedValue(mockQuerySnap)
      mockQuery.mockReturnValue({})
      mockWhere.mockReturnValue({})

      const request = new NextRequest('http://localhost:3000/api/tags?schoolId=school123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockTags)
    })

    test('returns empty array when no tags exist', async () => {
      const mockQuerySnap = {
        docs: [],
        empty: true,
        size: 0
      }

      mockGetDocs.mockResolvedValue(mockQuerySnap)
      mockQuery.mockReturnValue({})
      mockWhere.mockReturnValue({})

      const request = new NextRequest('http://localhost:3000/api/tags?schoolId=school123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    test('returns 400 when schoolId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/tags')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('School ID is required')
    })

    test('handles database errors gracefully', async () => {
      mockGetDocs.mockRejectedValue(new Error('Database error'))
      mockQuery.mockReturnValue({})
      mockWhere.mockReturnValue({})

      const request = new NextRequest('http://localhost:3000/api/tags?schoolId=school123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch tags')
    })
  })

  describe('POST /api/tags', () => {
    test('creates a new tag', async () => {
      const tagData = {
        name: 'New Tag',
        description: 'New Tag Description',
        color: '#FF5733',
        schoolId: 'school123'
      }

      const mockDocRef = { id: 'new-tag-id' }
      mockAddDoc.mockResolvedValue(mockDocRef)

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify(tagData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual({
        id: 'new-tag-id',
        ...tagData,
        usageCount: 0,
        createdAt: expect.any(String)
      })
    })

    test('returns 400 when required fields are missing', async () => {
      const tagData = {
        description: 'New Tag Description',
        color: '#FF5733',
        schoolId: 'school123'
        // missing name
      }

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify(tagData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Name is required')
    })

    test('returns 400 when name is too short', async () => {
      const tagData = {
        name: 'A', // too short
        description: 'New Tag Description',
        color: '#FF5733',
        schoolId: 'school123'
      }

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify(tagData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Name must be between 2 and 50 characters')
    })

    test('returns 400 when name is too long', async () => {
      const tagData = {
        name: 'A'.repeat(51), // too long
        description: 'New Tag Description',
        color: '#FF5733',
        schoolId: 'school123'
      }

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify(tagData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Name must be between 2 and 50 characters')
    })

    test('returns 400 when color is invalid', async () => {
      const tagData = {
        name: 'New Tag',
        description: 'New Tag Description',
        color: 'invalid-color',
        schoolId: 'school123'
      }

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify(tagData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid color format')
    })

    test('handles database errors gracefully', async () => {
      const tagData = {
        name: 'New Tag',
        description: 'New Tag Description',
        color: '#FF5733',
        schoolId: 'school123'
      }

      mockAddDoc.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify(tagData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create tag')
    })
  })

  describe('PUT /api/tags', () => {
    test('updates an existing tag', async () => {
      const tagId = 'tag123'
      const updateData = {
        name: 'Updated Tag',
        description: 'Updated Description',
        color: '#33FF57'
      }

      mockUpdateDoc.mockResolvedValue()

      const request = new NextRequest(`http://localhost:3000/api/tags?id=${tagId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        id: tagId,
        ...updateData
      })
    })

    test('returns 400 when tag ID is missing', async () => {
      const updateData = {
        name: 'Updated Tag',
        description: 'Updated Description',
        color: '#33FF57'
      }

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Tag ID is required')
    })

    test('returns 400 when name is invalid', async () => {
      const tagId = 'tag123'
      const updateData = {
        name: 'A', // too short
        description: 'Updated Description',
        color: '#33FF57'
      }

      const request = new NextRequest(`http://localhost:3000/api/tags?id=${tagId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Name must be between 2 and 50 characters')
    })

    test('returns 400 when color is invalid', async () => {
      const tagId = 'tag123'
      const updateData = {
        name: 'Updated Tag',
        description: 'Updated Description',
        color: 'invalid-color'
      }

      const request = new NextRequest(`http://localhost:3000/api/tags?id=${tagId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid color format')
    })

    test('handles database errors gracefully', async () => {
      const tagId = 'tag123'
      const updateData = {
        name: 'Updated Tag',
        description: 'Updated Description',
        color: '#33FF57'
      }

      mockUpdateDoc.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest(`http://localhost:3000/api/tags?id=${tagId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update tag')
    })
  })

  describe('DELETE /api/tags', () => {
    test('deletes an existing tag', async () => {
      const tagId = 'tag123'

      mockDeleteDoc.mockResolvedValue()

      const request = new NextRequest(`http://localhost:3000/api/tags?id=${tagId}`, {
        method: 'DELETE'
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({ message: 'Tag deleted successfully' })
    })

    test('returns 400 when tag ID is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'DELETE'
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Tag ID is required')
    })

    test('handles database errors gracefully', async () => {
      const tagId = 'tag123'

      mockDeleteDoc.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest(`http://localhost:3000/api/tags?id=${tagId}`, {
        method: 'DELETE'
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to delete tag')
    })
  })

  describe('Input validation', () => {
    test('validates color format', () => {
      const validColors = ['#FF5733', '#33FF57', '#3357FF', '#F0F0F0']
      const invalidColors = ['invalid', 'FF5733', '#GG5733', '#FF573', '#FF57333']

      validColors.forEach(color => {
        expect(/^#[0-9A-F]{6}$/i.test(color)).toBe(true)
      })

      invalidColors.forEach(color => {
        expect(/^#[0-9A-F]{6}$/i.test(color)).toBe(false)
      })
    })

    test('validates name length', () => {
      const validNames = ['A', 'AB', 'Valid Name', 'A'.repeat(50)]
      const invalidNames = ['', 'A'.repeat(51)]

      validNames.forEach(name => {
        expect(name.length >= 2 && name.length <= 50).toBe(true)
      })

      invalidNames.forEach(name => {
        expect(name.length >= 2 && name.length <= 50).toBe(false)
      })
    })
  })
}) 